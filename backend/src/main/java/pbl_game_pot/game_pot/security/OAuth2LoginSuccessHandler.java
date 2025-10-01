package pbl_game_pot.game_pot.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import pbl_game_pot.game_pot.db.UserRepository;
import pbl_game_pot.game_pot.db.UserTable;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;

    @Value("${app.frontend.success-redirect}")
    private String successRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
                                        HttpServletResponse res,
                                        Authentication authentication) throws IOException {

        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String discordId = String.valueOf(principal.getAttributes().get("id"));

        UserTable user = userRepository.findByDiscordId(discordId)
                .orElseThrow(() -> new IllegalStateException("OAuth2 로그인 후 DB에서 사용자를 찾을 수 없습니다."));

        String targetUrl = UriComponentsBuilder.fromUriString(successRedirectUrl)
                .queryParam("id", user.getId())
                .queryParam("discordId", user.getDiscordId())
                .queryParam("username", user.getUsername())
                .queryParam("displayName", user.getDisplayName() != null ? user.getDisplayName() : "")
                .queryParam("email", user.getEmail() != null ? user.getEmail() : "")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();

        res.sendRedirect(targetUrl);
    }
}