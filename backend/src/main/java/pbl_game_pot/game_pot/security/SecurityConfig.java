// src/main/java/pbl_game_pot/game_pot/config/SecurityConfig.java
package pbl_game_pot.game_pot.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import pbl_game_pot.game_pot.security.OAuth2LoginSuccessHandler;
import pbl_game_pot.game_pot.service.DiscordOAuth2UserService; // 네가 올린 서비스

import java.util.List;

@Configuration
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler successHandler;
    private final DiscordOAuth2UserService discordOAuth2UserService;

    public SecurityConfig(OAuth2LoginSuccessHandler successHandler,
                          DiscordOAuth2UserService discordOAuth2UserService) {
        this.successHandler = successHandler;
        this.discordOAuth2UserService = discordOAuth2UserService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(c -> c.configurationSource(req -> {
                    var conf = new CorsConfiguration();
                    conf.setAllowedOrigins(List.of(
                            "http://127.0.0.1:5500",
                            "http://localhost:5500"
                    ));
                    conf.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
                    conf.setAllowedHeaders(List.of("*"));
                    conf.setAllowCredentials(true); // 세션 쿠키 전달 허용
                    return conf;
                }))
                .authorizeHttpRequests(auth -> auth
                        // 정적(있어도 무방)
                        .requestMatchers("/", "/index.html", "/favicon.*", "/manifest.*",
                                "/assets/**", "/css/**", "/js/**", "/images/**").permitAll()
                        // OAuth 시작/콜백
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        // 공개 API
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        // 로그인 상태 조회 API
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        // 나머지는 보호
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(u -> u.userService(discordOAuth2UserService))
                        // ★ 성공 시 “항상 프론트로” 리다이렉트 ( /login/success 절대 사용 X )
                        .successHandler(successHandler)
                )
                .logout(l -> l.logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200)));
        return http.build();
    }
}
