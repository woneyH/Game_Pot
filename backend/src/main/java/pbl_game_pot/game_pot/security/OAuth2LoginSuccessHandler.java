package pbl_game_pot.game_pot.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 로그인 성공 시 팝업/HTML 없이 프론트 페이지로 리다이렉트만 수행.
 * 프론트는 페이지 로드 시 /api/auth/me 를 호출해 사용자 정보를 표시한다.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    /**
     * application.properties 에서 주입.
     * 기본값은 VS Code Live Server 페이지.
     */
    @Value("${app.frontend.success-redirect:http://127.0.0.1:5500/index.html}")
    private String successRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
                                        HttpServletResponse res,
                                        Authentication authentication) throws IOException {
        // 세션은 이미 생성/인증됨. 프론트 페이지로 이동시키면
        // 프론트가 /api/auth/me 를 credentials: include 로 호출해 정보를 얻는다.
        res.sendRedirect(successRedirectUrl);
    }
}