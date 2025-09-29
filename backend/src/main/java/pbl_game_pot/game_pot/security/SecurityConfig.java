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

    private final OAuth2LoginSuccessHandler successHandler;

    public SecurityConfig(OAuth2LoginSuccessHandler successHandler) {
        this.successHandler = successHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(c -> c.configurationSource(req -> {
                    var conf = new CorsConfiguration();
                    // 프론트가 별도 도메인이라면 여기에 정확한 Origin 추가
                    // conf.setAllowedOrigins(List.of("https://<프론트-도메인>"));
                    conf.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
                    conf.setAllowedHeaders(List.of("*"));
                    conf.setAllowCredentials(true);
                    return conf;
                }))
                .authorizeHttpRequests(auth -> auth
                        // 정적 파일(단일 배포가 아니면 없어도 됨)
                        .requestMatchers("/", "/index.html", "/assets/**", "/css/**", "/js/**", "/images/**", "/favicon.*", "/manifest.*").permitAll()
                        // OAuth 시작/콜백
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        // 공개 API
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        // 나머지 API 보호
                        .requestMatchers("/api/auth/me").authenticated()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                                .userInfoEndpoint(Customizer.withDefaults())
                                // 팝업 완료 후 JSON을 프론트에 postMessage로 보내는 핸들러
                                .successHandler(successHandler)
                        // (리다이렉트만 쓰려면 .defaultSuccessUrl("/", true))
                );
        return http.build();
    }
}
