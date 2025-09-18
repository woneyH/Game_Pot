package pbl_game_pot.game_pot.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TestController {
    @GetMapping("/side")
    public String call(){
        return "call";
    }
}
