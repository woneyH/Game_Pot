package pbl_game_pot.game_pot.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import pbl_game_pot.game_pot.service.DiscordOAuth2UserService;


@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final DiscordOAuth2UserService discordOAuth2UserService;
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 정적 리소스/첫 화면/성공 화면 허용
                        .requestMatchers("/", "/index.html", "/login/success", "/login/success.html",
                                "/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(u -> u.userService(discordOAuth2UserService))
                        // 같은 서버의 상대 경로로 리다이렉트
                        .defaultSuccessUrl("/login/success", true)
                )
                .logout(logout -> logout
                        .logoutUrl("/api/logout")
                        .logoutSuccessUrl("/") // 로그아웃 후 첫 화면
                );

        return http.build();
    }
}
