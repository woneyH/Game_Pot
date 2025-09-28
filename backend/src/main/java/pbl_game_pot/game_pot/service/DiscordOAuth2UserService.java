// src/main/java/com/gp/auth/user/service/DiscordOAuth2UserService.java
package pbl_game_pot.game_pot.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import pbl_game_pot.game_pot.repository.UserRepository;
import pbl_game_pot.game_pot.tables.UserTable;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiscordOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest req) {
        OAuth2User user = super.loadUser(req);
        Map<String, Object> a = user.getAttributes();

        String discordId   = String.valueOf(a.get("id"));
        String username    = (String) a.getOrDefault("username", "");
        String displayName = (String) a.getOrDefault("global_name", "");
        String email       = (String) a.getOrDefault("email", null);

        userRepository.findByDiscordId(discordId)
                .map(u -> {
                    u.setUsername(username);
                    u.setDisplayName(displayName);
                    u.setEmail(email);
                    return userRepository.save(u);
                })
                .orElseGet(() -> userRepository.save(UserTable.builder()
                        .discordId(discordId)
                        .username(username)
                        .displayName(displayName)
                        .email(email)
                        .build()));

        return user; // SecurityContext에 보관 → 성공 핸들러에서 /login/success로 보냄
    }
}
