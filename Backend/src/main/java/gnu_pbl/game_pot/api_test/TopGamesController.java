package gnu_pbl.game_pot.api_test;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TopGamesController {

    private final SteamApiService steamApiService;

    public TopGamesController(SteamApiService steamApiService) {
        this.steamApiService = steamApiService;
    }

    @GetMapping("/top10-games")
    public List<GamePlayerData> getTop10Games() {
        return steamApiService.getTop10PopularGames();
    }
}