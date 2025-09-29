// src/main/java/pbl_game_pot/game_pot/security/OAuth2LoginSuccessHandler.java
package pbl_game_pot.game_pot.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 로그인 성공 시 HTML/팝업 없이 프론트 페이지로만 리다이렉트.
 * 프론트는 /api/auth/me 를 호출해 같은 페이지에 사용자 정보를 출력한다.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    // application.properties 에서 주입. 기본값은 Live Server 페이지.
    @Value("${app.frontend.success-redirect:http://127.0.0.1:5500/index.html}")
    private String successRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
                                        HttpServletResponse res,
                                        Authentication authentication) throws IOException {
        res.sendRedirect(successRedirectUrl);
    }
}
