package pbl_game_pot.game_pot.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest req,
                                        HttpServletResponse res,
                                        AuthenticationException ex) throws IOException {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType("application/json; charset=UTF-8");
        String msg = ex.getMessage() == null ? "Authentication failed" : ex.getMessage().replace("\"","\\\"");
        res.getWriter().write("{\"authenticated\":false,\"error\":\"" +
                ex.getClass().getSimpleName() + "\",\"message\":\"" + msg + "\"}");
    }
}