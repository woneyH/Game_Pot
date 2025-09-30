package pbl_game_pot.game_pot.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    // 👇 수정된 부분: '.success'를 제거하여 .properties 파일과 일치시킵니다.
    @Value("${app.frontend.success-redirect:http://127.0.0.1:5500/index.html}")
    private String successRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req,
                                        HttpServletResponse res,
                                        Authentication authentication) throws IOException {
        res.sendRedirect(successRedirectUrl);
    }
}