package pbl_game_pot.game_pot.controller;

import lombok.RequiredArgsConstructor;
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
public class MatchingController {

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final MatchingQueueRepository matchingQueueRepository;
    private final SteamApiService steamApiService;

    // 프론트에서 받을 DTO
    public record MatchRequestDto(String gameName) {}

    // 프론트에 보낼 DTO
    public record MatchResponseDto(Long gameId, String gameName, String status) {}

    // 매칭 상태 응답 DTO (Discord ID 제거, Email 추가)
    public record MatchUserDto(String username, String displayName, String email) {}


    /**
     * 특정 게임에 대한 매칭을 시작합니다.
     */
    @PostMapping("/start")
    @Transactional
    public ResponseEntity<?> startMatching(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody MatchRequestDto request) {

        // 1. 로그인한 유저 확인
        if (principal == null) return ResponseEntity.status(401).build();
        String discordId = String.valueOf(principal.getAttributes().get("id"));
        UserTable user = userRepository.findByDiscordId(discordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found in DB"));

        // 2. Steam API (실제)에서 게임 정보 검색
        SteamApiService.SteamGameInfo gameInfo = steamApiService.findGameOnSteam(request.gameName());
        if (gameInfo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Game not found on Steam"));
        }

        // 3. DB에서 게임 정보 찾기 (없으면 새로 저장)
        Game game = gameRepository.findBySteamAppId(gameInfo.steamAppId())
                .orElseGet(() -> {
                    Game newGame = Game.builder()
                            .steamAppId(gameInfo.steamAppId())
                            .name(gameInfo.name())
                            .build();
                    return gameRepository.save(newGame);
                });

        // 4. 유저가 다른 게임에 이미 매칭 중인지 확인 및 기존 매칭 취소
        matchingQueueRepository.deleteByUser(user);

        // 5. 새 매칭 대기열(MatchingQueue)에 유저 추가
        MatchingQueue newMatch = MatchingQueue.builder()
                .user(user)
                .game(game)
                .build();
        matchingQueueRepository.save(newMatch);

        return ResponseEntity.ok(new MatchResponseDto(game.getId(), game.getName(), "Matching started"));
    }

    /**
     * 특정 게임의 현재 매칭 대기열 상태를 조회합니다.
     */
    @GetMapping("/status/{gameId}")
    public ResponseEntity<?> getMatchingStatus(@PathVariable Long gameId) {

        List<MatchingQueue> queue = matchingQueueRepository.findByGameId(gameId);

        // DTO 매핑 로직 변경 (username, displayName, email 순서)
        List<MatchUserDto> usersInQueue = queue.stream()
                .map(mq -> mq.getUser())
                .map(u -> new MatchUserDto(
                        u.getUsername(),    // username (디스코드 사용자명)
                        u.getDisplayName(), // displayName (닉네임)
                        u.getEmail()        // email (이메일)
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