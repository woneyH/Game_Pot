package pbl_game_pot.game_pot.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class AuthController {
    @GetMapping("/api/auth/me")
    public Map<String,Object> me(@AuthenticationPrincipal OAuth2User user){
        if (user == null) return Map.of("authenticated", false);
        var a = user.getAttributes();
        return Map.of(
                "authenticated", true,
                "user", Map.of(
                        "id", a.get("id"),
                        "username", a.getOrDefault("username", a.get("global_name")),
                        "global_name", a.get("global_name"),
                        "email", a.get("email"),
                        "avatar", a.get("avatar")
                )
        );
    }
}
