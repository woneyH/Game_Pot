package pbl_game_pot.game_pot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GamePotApplication {

	public static void main(String[] args) {
		SpringApplication.run(GamePotApplication.class, args);
	}

}
