package pbl_game_pot.game_pot.steam_test;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SteamApiService {

    private final RestTemplate restTemplate;

    @Value("${STEAM_API_KEY}")
    private String apiKey;

    private static final String STEAM_API_URL = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/";

    public SteamApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<GamePlayerData> getTop10PopularGames() {
        // PopularGame enum의 모든 게임을 병렬 스트림으로 처리하여 API 요청 속도 향상
        return Arrays.stream(PopularGame.values())
                .parallel()
                .map(this::fetchGamePlayerData)
                .filter(data -> data.getPlayerCount() > 0) // 유효한 데이터만 필터링
                .sorted(Comparator.comparingInt(GamePlayerData::getPlayerCount).reversed()) // 동접자 수로 내림차순 정렬
                .limit(10) // 상위 10개만 선택
                .collect(Collectors.toList());
    }

    private GamePlayerData fetchGamePlayerData(PopularGame game) {
        int playerCount = getNumberOfCurrentPlayers(game.getAppId());
        return new GamePlayerData(game.getGameName(), playerCount);
    }

    private int getNumberOfCurrentPlayers(long appId) {
        String url = STEAM_API_URL + "?key=" + apiKey + "&appid=" + appId;
        try {
            SteamPlayerCountResponse response = restTemplate.getForObject(url, SteamPlayerCountResponse.class);
            if (response != null && response.getResponse() != null && response.getResponse().getResult() == 1) {
                return response.getResponse().getPlayerCount();
            }
        } catch (Exception e) {
            System.err.println("API 요청 실패 AppID " + appId + ": " + e.getMessage());
        }
        return 0;
    }
}