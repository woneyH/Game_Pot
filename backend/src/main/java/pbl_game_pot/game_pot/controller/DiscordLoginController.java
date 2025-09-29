package pbl_game_pot.game_pot.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import pbl_game_pot.game_pot.db.UserRepository;
import pbl_game_pot.game_pot.db.UserTable;


@RestController
@RequiredArgsConstructor
public class DiscordLoginController {
    private final UserRepository userRepository;

    record MeDto(String username, String email, String id) {}

    @GetMapping("/api/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String discordId = String.valueOf(principal.getAttributes().get("id"));
        UserTable u = userRepository.findByDiscordId(discordId).orElse(null);
        if (u == null) return ResponseEntity.status(404).build();
        return ResponseEntity.ok(new MeDto(u.getUsername(), u.getEmail(), u.getDiscordId()));

    }


}
