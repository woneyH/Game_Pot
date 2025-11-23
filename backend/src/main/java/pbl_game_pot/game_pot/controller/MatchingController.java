package pbl_game_pot.game_pot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
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

    public record MatchRequestDto(String gameName) {}
    public record MatchResponseDto(Long gameId, String gameName, String status) {}
    // [수정됨] DTO: Discord ID 제거, Email 추가
    public record MatchUserDto(String username, String displayName, String email) {}


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

            // 2. 스팀 API 검색 (별명 처리 포함)
            SteamApiService.SteamGameInfo gameInfo = steamApiService.findGameOnSteam(inputGameName);

            if (gameInfo == null) {
                // 검색 실패 시
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

            // 4. 기존 매칭 취소 후 새 매칭 등록
            matchingQueueRepository.deleteByUser(user);

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
}