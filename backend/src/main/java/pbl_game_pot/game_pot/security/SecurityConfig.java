package pbl_game_pot.game_pot.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import pbl_game_pot.game_pot.service.DiscordOAuth2UserService;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler successHandler;
    private final DiscordOAuth2UserService discordOAuth2UserService;

    @Value("${app.frontend.origins:http://127.0.0.1:5500,http://localhost:5500}")
    private String frontendOrigins;

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
                    conf.setAllowedOrigins(List.of(frontendOrigins.split(",")));
                    conf.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
                    conf.setAllowedHeaders(List.of("*"));
                    conf.setAllowCredentials(true);

                    // 👇 'export default' 라인을 완전히 삭제했습니다.
                    return conf;
                }))
                .authorizeHttpRequests(auth -> auth
                        // ... (이하 동일) ...
                        .requestMatchers("/", "/index.html", "/favicon.*", "/manifest.*",
                                "/assets/**", "/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/me").authenticated()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(u -> u.userService(discordOAuth2UserService))
                        .successHandler(successHandler)
                )
                .logout(l -> l.logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200)));
        return http.build();
    }
}