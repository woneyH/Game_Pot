package pbl_game_pot.game_pot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor // RestTemplate과 ObjectMapper를 주입받기 위해
@Slf4j // 로그를 남기기 위해
public class SteamApiService {

    // application.properties의 키 (현재 이 검색 API에서는 사용되지 않음)
    @Value("${STEAM_API_KEY}")
    private String steamApiKey;

    // HTTP 요청을 보내기 위함 (AppConfig.java에서 등록됨)
    private final RestTemplate restTemplate;
    // JSON을 파싱하기 위함 (Spring Boot가 자동으로 등록해 줌)
    private final ObjectMapper objectMapper;

    // 컨트롤러에 반환할 DTO (record)
    public record SteamGameInfo(Long steamAppId, String name) {
    }

    /**
     * Steam 상점 검색 API를 호출하여 게임 정보를 가져오는 메서드 (실제 동작)
     *
     * @param gameName 사용자가 입력한 검색어
     * @return Steam 게임 정보 (AppId와 이름) / 못 찾으면 null
     */
    public SteamGameInfo findGameOnSteam(String gameName) {

        // Steam 상점 검색 API (한국어, 한국 지역 우선)
        // 이 API는 별도 키가 필요 없습니다.
        String apiUrl = "https://store.steampowered.com/api/storesearch/?term={gameName}&l=korean&cc=kr";

        try {
            // 1. API 호출 (gameName 변수를 apiUrl의 {gameName}에 삽입)
            String jsonResponse = restTemplate.getForObject(apiUrl, String.class, gameName);

            if (jsonResponse == null || jsonResponse.isEmpty()) {
                log.warn("Steam API response was null or empty. (gameName: {})", gameName);
                return null;
            }

            // 2. JSON 파싱
            JsonNode root = objectMapper.readTree(jsonResponse);

            // 3. "items" 배열의 첫 번째 요소(가장 정확도 높은 결과)에 접근
            JsonNode itemsNode = root.path("items");
            if (itemsNode.isMissingNode() || !itemsNode.isArray() || itemsNode.size() == 0) {
                log.info("Steam API found no results. (gameName: {})", gameName);
                return null; // 검색 결과가 없음
            }

            JsonNode firstItem = itemsNode.get(0);
            long steamAppId = firstItem.path("id").asLong();
            String foundName = firstItem.path("name").asText();

            // ID가 0이거나 이름이 없으면 유효하지 않은 결과로 간주
            if (steamAppId == 0 || foundName.isEmpty()) {
                log.warn("Steam API returned invalid item. (gameName: {})", gameName);
                return null;
            }

            log.info("Steam API Success: {} -> [{}]{}", gameName, steamAppId, foundName);
            return new SteamGameInfo(steamAppId, foundName);

        } catch (HttpClientErrorException e) {
            log.error("Steam API Client Error: {} (gameName: {})", e.getStatusCode(), gameName, e);
            return null; // 4xx, 5xx 에러
        } catch (Exception e) {
            log.error("Steam API General Error: (gameName: {})", gameName, e);
            return null; // 그 외 모든 에러 (JSON 파싱 실패 등)
        }
    }
}