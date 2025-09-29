package pbl_game_pot.game_pot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.net.URI;

@Controller
public class SafeRedirectController {

    @Value("${app.frontend.success-redirect:http://127.0.0.1:5500/index.html}")
    private String successRedirectUrl;

    @GetMapping({"/login/success", "/loginSuccess"})
    public ResponseEntity<Void> forceRedirect() {
        return ResponseEntity.status(302).location(URI.create(successRedirectUrl)).build();
    }
}
