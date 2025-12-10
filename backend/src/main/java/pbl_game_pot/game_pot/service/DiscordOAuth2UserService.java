package pbl_game_pot.game_pot.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import pbl_game_pot.game_pot.db.UserRepository;
import pbl_game_pot.game_pot.db.UserTable;

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
        String avatarHash = (String) a.get("avatar");
        String avatarUrl = null;

        if(avatarHash!=null) {
            // 디스코드 프로필 사진 URL 형식: https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png
            avatarUrl = String.format("https://cdn.discordapp.com/avatars/%s/%s.png",discordId, avatarHash);
        }
        String finalAvatarUrl = avatarUrl;

        userRepository.findByDiscordId(discordId)
                .map(u -> {
                    u.setUsername(username);
                    u.setDisplayName(displayName);
                    u.setEmail(email);
                    u.setAvatarUrl(finalAvatarUrl); // URL 업데이트
                    return userRepository.save(u);
                })
                .orElseGet(() -> userRepository.save(UserTable.builder()
                        .discordId(discordId)
                        .username(username)
                        .displayName(displayName)
                        .email(email)
                        .avatarUrl(finalAvatarUrl) // URL 저장
                        .build()));

        return user;
    }
}