package pbl_game_pot.game_pot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import pbl_game_pot.game_pot.db.*;
import pbl_game_pot.game_pot.service.SteamApiService;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
@Slf4j
public class MatchingController {

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final MatchingQueueRepository matchingQueueRepository;
    private final SteamApiService steamApiService;
    private final RestTemplate restTemplate;

    // 팀원이 만든 Render 봇 서버 주소
    private static final String BOT_API_URL = "https://game-pot.onrender.com/api/create-party";

    public record MatchRequestDto(String gameName) {}
    public record MatchResponseDto(Long gameId, String gameName, String status) {}
    public record MatchUserDto(String username, String displayName, String email, String avatarUrl) {}
    public record PartyRequestDto(Long gameId) {}


    @PostMapping("/start")
    @Transactional
    public ResponseEntity<?> startMatching(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody MatchRequestDto request) {

        try {
            // 1. 유저 인증 확인
            if (principal == null) return ResponseEntity.status(401).build();
            String discordId = String.valueOf(principal.getAttributes().get("id"));
            UserTable user = userRepository.findByDiscordId(discordId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            String inputGameName = request.gameName();
            if (inputGameName == null || inputGameName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "게임 이름을 입력해주세요."));
            }

            // 2. 게임 검색 (스팀 API + 비스팀 게임 사전)
            SteamApiService.SteamGameInfo gameInfo = steamApiService.findGameOnSteam(inputGameName);

            if (gameInfo == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "'" + inputGameName + "' 게임을 찾을 수 없습니다. (스팀 공식 영문명으로 시도해보세요)"));
            }

            // 3. DB 저장 또는 조회
            Game game = gameRepository.findBySteamAppId(gameInfo.steamAppId())
                    .orElseGet(() -> {
                        Game newGame = Game.builder()
                                .steamAppId(gameInfo.steamAppId())
                                .name(gameInfo.name())
                                .build();
                        return gameRepository.save(newGame);
                    });

            // 4. [핵심 수정] 기존 매칭 삭제 후 '즉시 반영(flush)' (500 에러 방지)
            matchingQueueRepository.deleteByUser(user);
            matchingQueueRepository.flush(); // <--- 이 줄이 500 에러를 막아줍니다!

            // 5. 새 매칭 등록
            MatchingQueue newMatch = MatchingQueue.builder()
                    .user(user)
                    .game(game)
                    .build();
            matchingQueueRepository.save(newMatch);

            return ResponseEntity.ok(new MatchResponseDto(game.getId(), game.getName(), "Matching started"));

        } catch (Exception e) {
            log.error("매칭 시작 중 서버 오류 발생", e);
            // 프론트엔드에 구체적인 에러 메시지 전달
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "서버 오류 발생: " + e.getMessage()));
        }
    }

    @GetMapping("/status/{gameId}")
    public ResponseEntity<?> getMatchingStatus(@PathVariable Long gameId) {
        List<MatchingQueue> queue = matchingQueueRepository.findByGameId(gameId);

        List<MatchUserDto> usersInQueue = queue.stream()
                .map(mq -> mq.getUser())
                .map(u -> new MatchUserDto(
                        u.getUsername(),
                        u.getDisplayName(),
                        u.getEmail(),
                        u.getAvatarUrl()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(usersInQueue);
    }

    @PostMapping("/stop")
    public ResponseEntity<?> stopMatching(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String discordId = String.valueOf(principal.getAttributes().get("id"));
        UserTable user = userRepository.findByDiscordId(discordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        matchingQueueRepository.deleteByUser(user);
        return ResponseEntity.ok(Map.of("status", "matching stopped"));
    }

    /**
     * 봇 서버와의 통신 에러를 상세하게 보고합니다.
     */
    @PostMapping("/party")
    public ResponseEntity<?> createDiscordParty(@AuthenticationPrincipal OAuth2User principal,
                                                @RequestBody PartyRequestDto request) {

        if (principal == null) return ResponseEntity.status(401).build();

        List<MatchingQueue> queue = matchingQueueRepository.findByGameId(request.gameId());

        if (queue.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "매칭 중인 유저가 없습니다."));
        }

        List<String> memberIds = queue.stream()
                .map(mq -> mq.getUser().getDiscordId())
                .collect(Collectors.toList());

        log.info("봇 서버로 요청 전송 시작. URL: {}, IDs: {}", BOT_API_URL, memberIds);

        try {
            Map<String, Object> botRequest = Map.of("memberIds", memberIds);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(botRequest, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(BOT_API_URL, entity, Map.class);

            return ResponseEntity.ok(response.getBody());

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("봇 서버 응답 에러. 상태코드: {}, 내용: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", "봇 서버 거절 (" + e.getStatusCode() + "): " + e.getResponseBodyAsString()));

        } catch (ResourceAccessException e) {
            log.error("봇 서버 접속 불가", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "봇 서버에 접속할 수 없습니다. (서버가 자고 있거나 주소가 틀림)"));

        } catch (Exception e) {
            log.error("알 수 없는 에러 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "알 수 없는 에러: " + e.getMessage()));
        }
    }
}