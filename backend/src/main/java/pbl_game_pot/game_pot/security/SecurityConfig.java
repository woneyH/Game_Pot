package pbl_game_pot.game_pot.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Value("${app.frontend.origins}")
    private String frontendOriginsCsv;

    @Value("${app.frontend.success-redirect}")
    private String successRedirectUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // 정적 리소스 (단일 배포가 아니라면 없어도 무방)
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
                        // 팝업 없이: 로그인 성공 시 프론트 페이지로 전체 리다이렉트
                        .successHandler((req, res, auth) -> res.sendRedirect(successRedirectUrl))
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200))
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // application.properties 의 app.frontend.origins 읽어 등록
        List<String> origins = Arrays.stream(frontendOriginsCsv.split("\\s*,\\s*"))
                .filter(s -> !s.isBlank()).toList();

        return request -> {
            CorsConfiguration conf = new CorsConfiguration();
            conf.setAllowedOrigins(origins);
            conf.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            conf.setAllowedHeaders(List.of("*"));
            conf.setAllowCredentials(true); // 세션 쿠키 전달 허용
            return conf;
        };
    }
}
