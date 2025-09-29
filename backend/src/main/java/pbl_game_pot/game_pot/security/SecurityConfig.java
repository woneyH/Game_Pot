package pbl_game_pot.game_pot.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final pbl_game_pot.game_pot.security.OAuth2LoginSuccessHandler successHandler;

    public SecurityConfig(pbl_game_pot.game_pot.security.OAuth2LoginSuccessHandler successHandler) {
        this.successHandler = successHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(c -> c.configurationSource(req -> {
                    CorsConfiguration conf = new CorsConfiguration();
                    // Live Server 두 오리진 모두 허용
                    conf.setAllowedOrigins(List.of(
                            "http://127.0.0.1:5500",
                            "http://localhost:5500"
                    ));
                    conf.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
                    conf.setAllowedHeaders(List.of("*"));
                    conf.setAllowCredentials(true); // 세션 쿠키 전달
                    return conf;
                }))
                .authorizeHttpRequests(auth -> auth
                        // 정적(단일 배포가 아니어도 안전하게 허용)
                        .requestMatchers("/", "/index.html", "/favicon.*", "/manifest.*",
                                "/assets/**", "/css/**", "/js/**", "/images/**").permitAll()
                        // OAuth 시작/콜백
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        // 공개 API 예시
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        // 로그인 상태 조회 API
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        // 나머지는 보호
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(Customizer.withDefaults())
                        // ★ 팝업/HTML 없이: 성공 시 프론트 페이지로 리다이렉트
                        .successHandler(successHandler)
                )
                .logout(l -> l.logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200)));

        return http.build();
    }
}
