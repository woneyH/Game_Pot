package pbl_game_pot.game_pot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
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
    private final RestTemplate restTemplate; // [추가] 외부 서버 통신용

    // 팀원이 만든 Render 봇 서버 주소
    private static final String BOT_API_URL = "https://game-pot.onrender.com/api/create-party";

    public record MatchRequestDto(String gameName) {
    }

    public record MatchResponseDto(Long gameId, String gameName, String status) {
    }

    public record MatchUserDto(String username, String displayName, String email) {
    }

    // [추가] 파티 생성 요청 DTO
    public record PartyRequestDto(Long gameId) {
    }


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
     * [신규 기능] 현재 매칭 중인 인원들을 데리고 디스코드 파티 채널 생성 요청
     */
    @PostMapping("/party")
    public ResponseEntity<?> createDiscordParty(@AuthenticationPrincipal OAuth2User principal,
                                                @RequestBody PartyRequestDto request) {

        // 1. 로그인 체크
        if (principal == null) return ResponseEntity.status(401).build();

        // 2. 현재 게임의 매칭 대기열 가져오기
        List<MatchingQueue> queue = matchingQueueRepository.findByGameId(request.gameId());

        if (queue.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "매칭 중인 유저가 없습니다."));
        }

        // 3. 유저들의 Discord ID만 뽑아서 리스트로 만들기
        List<String> memberIds = queue.stream()
                .map(mq -> mq.getUser().getDiscordId())
                .collect(Collectors.toList());

        log.info("파티 생성 요청: 게임ID={}, 인원={}명, IDs={}", request.gameId(), memberIds.size(), memberIds);

        try {
            // 4. Render 서버로 보낼 데이터 준비
            Map<String, Object> botRequest = Map.of("memberIds", memberIds);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(botRequest, headers);

            // 5. Render 서버로 전송 (Spring Boot -> Render)
            ResponseEntity<Map> response = restTemplate.postForEntity(BOT_API_URL, entity, Map.class);

            // 6. 결과 반환
            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            log.error("봇 서버 통신 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "디스코드 봇 서버와 통신 중 오류가 발생했습니다."));
        }
    }
}