package gnu_pbl.game_pot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration // @Configuration 어노테이션을 추가하는 것이 좋습니다.
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 정적 리소스, 헬스체크 등 예외
                        .requestMatchers(
                                "/", "/index.html",
                                "/favicon.ico", "/assets/**", "/css/**", "/js/**",
                                "/actuator/health",
                                "/ws/**"            // WebSocket 핸드셋 엔드포인트
                        ).permitAll()
                        // 게시판 조회는 공개, 쓰기는 나중에 보호 가능
                        .requestMatchers("GET", "/posts/**").permitAll()
                        .anyRequest().permitAll() // 개발 단계: 전부 공개
                )
                .formLogin(form -> form.disable()) // HTML 로그인 폼 비활성화
                .httpBasic(httpBasic -> httpBasic.disable()) // HTTP Basic 인증 비활성화
                .build();
    }
}