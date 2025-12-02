package pbl_game_pot.game_pot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException; // [추가] 에러 처리용
import org.springframework.web.client.HttpServerErrorException; // [추가] 에러 처리용
import org.springframework.web.client.ResourceAccessException;   // [추가] 에러 처리용
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

    // 봇 서버 주소
    private static final String BOT_API_URL = "https://game-pot.onrender.com/api/create-party";

    public record MatchRequestDto(String gameName) {}
    public record MatchResponseDto(Long gameId, String gameName, String status) {}
    public record MatchUserDto(String username, String displayName, String email) {}
    public record PartyRequestDto(Long gameId) {}


    @PostMapping("/start")
    @Transactional
    public ResponseEntity<?> startMatching(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody MatchRequestDto request) {

        try {
            if (principal == null) return ResponseEntity.status(401).build();
            String discordId = String.valueOf(principal.getAttributes().get("id"));
            UserTable user = userRepository.findByDiscordId(discordId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            String inputGameName = request.gameName();
            if (inputGameName == null || inputGameName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "게임 이름을 입력해주세요."));
            }

            SteamApiService.SteamGameInfo gameInfo = steamApiService.findGameOnSteam(inputGameName);

            if (gameInfo == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "'" + inputGameName + "' 게임을 찾을 수 없습니다. (스팀 공식 영문명으로 시도해보세요)"));
            }

            Game game = gameRepository.findBySteamAppId(gameInfo.steamAppId())
                    .orElseGet(() -> {
                        Game newGame = Game.builder()
                                .steamAppId(gameInfo.steamAppId())
                                .name(gameInfo.name())
                                .build();
                        return gameRepository.save(newGame);
                    });

            matchingQueueRepository.deleteByUser(user);

            MatchingQueue newMatch = MatchingQueue.builder()
                    .user(user)
                    .game(game)
                    .build();
            matchingQueueRepository.save(newMatch);

            return ResponseEntity.ok(new MatchResponseDto(game.getId(), game.getName(), "Matching started"));

        } catch (Exception e) {
            log.error("매칭 시작 중 서버 오류 발생", e);
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
                        u.getEmail()
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

        // 1. 매칭 대기열 조회
        List<MatchingQueue> queue = matchingQueueRepository.findByGameId(request.gameId());

        if (queue.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "매칭 중인 유저가 없습니다."));
        }

        // 2. 실제 유저들의 Discord ID 추출 (가짜 ID 없음)
        List<String> memberIds = queue.stream()
                .map(mq -> mq.getUser().getDiscordId())
                .collect(Collectors.toList());

        log.info("봇 서버로 요청 전송 시작. URL: {}, IDs: {}", BOT_API_URL, memberIds);

        try {
            // 3. 데이터 포장 ({ "memberIds": [...] })
            Map<String, Object> botRequest = Map.of("memberIds", memberIds);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(botRequest, headers);

            // 4. 전송
            ResponseEntity<Map> response = restTemplate.postForEntity(BOT_API_URL, entity, Map.class);

            return ResponseEntity.ok(response.getBody());

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            // 봇 서버가 "거절"한 경우 (400, 404, 500 등)
            // 봇 서버가 보낸 "진짜 에러 메시지"를 로그에 찍고 프론트엔드에 전달합니다.
            log.error("봇 서버 응답 에러. 상태코드: {}, 내용: {}", e.getStatusCode(), e.getResponseBodyAsString());

            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", "봇 서버 거절 (" + e.getStatusCode() + "): " + e.getResponseBodyAsString()));

        } catch (ResourceAccessException e) {
            // 아예 "연결"이 안 된 경우 (서버 꺼짐, 주소 틀림)
            log.error("봇 서버 접속 불가", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "봇 서버에 접속할 수 없습니다. (서버가 자고 있거나 주소가 틀림)"));

        } catch (Exception e) {
            // 그 외 알 수 없는 에러
            log.error("알 수 없는 에러 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "알 수 없는 에러: " + e.getMessage()));
        }
    }
}