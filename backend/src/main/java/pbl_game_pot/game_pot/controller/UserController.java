package pbl_game_pot.game_pot.controller;


import org.springframework.ui.Model;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@Controller
public class UserController {
    @GetMapping("/user")
    public String getUser(Model model, @AuthenticationPrincipal OAuth2User oAuth2User){
        if (oAuth2User!=null){
            Map<String,Object> attributes = oAuth2User.getAttributes();
            model.addAttribute("username", attributes.get("username"));
            model.addAttribute("discriminator", attributes.get("discriminator"));
            model.addAttribute("avatar", "https://cdn.discordapp.com/avatars/" + attributes.get("id") + "/" + attributes.get("avatar") + ".png");
            model.addAttribute("email", attributes.get("email"));
        }
        return "user";
    }


    @GetMapping("/login")
    public String login(){
        return "login";
    }
}
