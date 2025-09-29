package pbl_game_pot.game_pot.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry r) {
        r.addViewController("/").setViewName("forward:/index.html");
        r.addViewController("/{x:[\\w\\-]+}").setViewName("forward:/index.html");
        r.addViewController("/{x:^(?!api$).*$}/{y:[\\w\\-]+}").setViewName("forward:/index.html");
    }
}
