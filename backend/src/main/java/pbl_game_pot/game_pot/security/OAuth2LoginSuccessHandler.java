package pbl_game_pot.game_pot.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * 팝업 창이 이 HTML을 받아 실행:
 *  - window.opener.postMessage({ type:'DISCORD_LOGIN_SUCCESS', payload:{ user } }, '<프론트-오리진>');
 *  - window.close();
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final ObjectMapper om = new ObjectMapper();

    // !! 여기에 "프론트 오리진"을 정확하게 넣어주세요 (보안상 * 사용 금지)
    //    예: https://gamepot.app  또는 http://localhost:5173 (개발용)
    private static final String FRONT_ORIGIN = "https://<프론트-도메인>";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res, Authentication authentication)
            throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        var a = oAuth2User.getAttributes();

        var user = Map.of(
                "id", a.get("id"),
                "username", a.getOrDefault("username", a.get("global_name")),
                "global_name", a.get("global_name"),
                "email", a.get("email"),
                "avatar", a.get("avatar")
        );

        String json = om.writeValueAsString(Map.of(
                "type", "DISCORD_LOGIN_SUCCESS",
                "payload", Map.of("user", user)
        ));

        String html = """
      <!doctype html><meta charset="utf-8">
      <script>
      (function(){
        try{
          var msg=%s;
          if(window.opener && !window.opener.closed){
            window.opener.postMessage(msg, %s);
          }
        }catch(e){console.error(e)}
        window.close();
      })();
      </script>
    """.formatted(esc(json), esc(FRONT_ORIGIN));

        res.setContentType("text/html;charset=UTF-8");
        res.getWriter().write(html);
    }

    private String esc(String s){
        return "\"" + s.replace("\\","\\\\").replace("\"","\\\"") + "\"";
    }
}
