package pbl_game_pot.game_pot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SteamApiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public record SteamGameInfo(Long steamAppId, String name) {}

    // === 1. [비-스팀 게임] Steam에 없지만 인기 있는 게임들 (가짜 ID 부여) ===
    // 999로 시작하는 ID는 임의의 값
    private static final Map<String, SteamGameInfo> NON_STEAM_GAMES = new HashMap<>();
    static {
        NON_STEAM_GAMES.put("롤", new SteamGameInfo(999001L, "League of Legends"));
        NON_STEAM_GAMES.put("리그오브레전드", new SteamGameInfo(999001L, "League of Legends"));
        NON_STEAM_GAMES.put("league of legends", new SteamGameInfo(999001L, "League of Legends"));

        NON_STEAM_GAMES.put("발로란트", new SteamGameInfo(999002L, "VALORANT"));
        NON_STEAM_GAMES.put("발로", new SteamGameInfo(999002L, "VALORANT"));
        NON_STEAM_GAMES.put("valorant", new SteamGameInfo(999002L, "VALORANT"));

        NON_STEAM_GAMES.put("오버워치", new SteamGameInfo(999003L, "Overwatch 2"));
        NON_STEAM_GAMES.put("옵치", new SteamGameInfo(999003L, "Overwatch 2"));
        NON_STEAM_GAMES.put("overwatch", new SteamGameInfo(999003L, "Overwatch 2"));

        NON_STEAM_GAMES.put("마인크래프트", new SteamGameInfo(999004L, "Minecraft"));
        NON_STEAM_GAMES.put("마크", new SteamGameInfo(999004L, "Minecraft"));

        NON_STEAM_GAMES.put("피파4",new SteamGameInfo(9990005L,"FC 온라인4"));
        NON_STEAM_GAMES.put("fc4",new SteamGameInfo(9990005L,"FC 온라인4"));
        NON_STEAM_GAMES.put("fc온라인",new SteamGameInfo(9990005L,"FC 온라인4"));
    }

    // === 2. [스팀 게임 별명] 한글 줄임말 -> 스팀 공식 명칭 매핑 ===
    private static final Map<String, String> ALIAS_MAP = new HashMap<>();
    static {
        // [배그]
        ALIAS_MAP.put("배그", "PUBG: BATTLEGROUNDS");
        ALIAS_MAP.put("pubg", "PUBG: BATTLEGROUNDS");

        // [스포츠]
        ALIAS_MAP.put("피파", "EA SPORTS FC");
        ALIAS_MAP.put("fc24", "EA SPORTS FC 24");
        ALIAS_MAP.put("fc25", "EA SPORTS FC 25");

        // [액션/RPG]
        ALIAS_MAP.put("gta", "Grand Theft Auto V");
        ALIAS_MAP.put("gta5", "Grand Theft Auto V");
        ALIAS_MAP.put("엘든링", "ELDEN RING");
        ALIAS_MAP.put("몬헌", "Monster Hunter: World");
        ALIAS_MAP.put("몬스터헌터", "Monster Hunter: World");
        ALIAS_MAP.put("로아", "Lost Ark"); // 스팀판
        ALIAS_MAP.put("로스트아크", "Lost Ark");

        // [캐주얼/기타]
        ALIAS_MAP.put("철권", "TEKKEN 8");
        ALIAS_MAP.put("팰월드", "Palworld");
        ALIAS_MAP.put("리썰", "Lethal Company");
        ALIAS_MAP.put("리썰컴퍼니", "Lethal Company");
        ALIAS_MAP.put("스듀", "Stardew Valley");
        ALIAS_MAP.put("어몽어스", "Among Us");
        ALIAS_MAP.put("폴가이즈", "Fall Guys");
    }

    public SteamGameInfo findGameOnSteam(String userInput) {
        String cleanInput = userInput.toLowerCase().trim();

        // 1. [우선순위 1] 비-스팀 게임인지 먼저 확인 (롤, 발로란트 등)
        if (NON_STEAM_GAMES.containsKey(cleanInput)) {
            SteamGameInfo info = NON_STEAM_GAMES.get(cleanInput);
            log.info("비-스팀 게임 감지: {} -> {}", userInput, info.name());
            return info;
        }

        // 2. [우선순위 2] 별명 사전에서 검색어 변환
        String searchTerm = ALIAS_MAP.getOrDefault(cleanInput, userInput);
        if (ALIAS_MAP.containsKey(cleanInput)) {
            log.info("별명 감지: '{}' -> '{}'", userInput, searchTerm);
        }

        // 3. [우선순위 3] 스팀 API 호출
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://store.steampowered.com/api/storesearch/")
                .queryParam("term", searchTerm)
                .queryParam("l", "korean")
                .queryParam("cc", "kr")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        log.info("Steam API 호출: {}", uri);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, entity, String.class);

            String jsonResponse = response.getBody();
            if (jsonResponse == null || jsonResponse.isEmpty()) return null;

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode itemsNode = root.path("items");

            if (itemsNode.isMissingNode() || !itemsNode.isArray() || itemsNode.size() == 0) {
                log.warn("스팀 검색 결과 없음: {}", searchTerm);
                return null;
            }

            JsonNode firstItem = itemsNode.get(0);
            long steamAppId = firstItem.path("id").asLong();
            String foundName = firstItem.path("name").asText();

            if (steamAppId == 0 || foundName.isEmpty()) return null;

            log.info("스팀 API 성공: '{}' -> {}", searchTerm, foundName);
            return new SteamGameInfo(steamAppId, foundName);

        } catch (HttpClientErrorException e) {
            log.error("스팀 API 클라이언트 오류: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("스팀 API 통신 중 오류", e);
            return null;
        }
    }
}