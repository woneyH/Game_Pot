package pbl_game_pot.game_pot.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginPageController {
    @GetMapping("/login/success")
    public String success() {
        return "forward:/login/success/index.html";
    }

}
