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

    // === 별명 사전  ===
    private static final Map<String, String> ALIAS_MAP = new HashMap<>();
    static {
        // [배그 관련]
        ALIAS_MAP.put("배그", "PUBG: BATTLEGROUNDS");
        ALIAS_MAP.put("pubg", "PUBG: BATTLEGROUNDS");
        ALIAS_MAP.put("펍지", "PUBG: BATTLEGROUNDS");

        // [피파/FC 관련]
        ALIAS_MAP.put("피파", "EA SPORTS FC");
        ALIAS_MAP.put("피파4", "EA SPORTS FC");
        ALIAS_MAP.put("fc24", "EA SPORTS FC 24");
        ALIAS_MAP.put("fc25", "EA SPORTS FC 25");
        ALIAS_MAP.put("ea sports fc", "EA SPORTS FC");

        // [GTA 관련]
        ALIAS_MAP.put("gta", "Grand Theft Auto V");
        ALIAS_MAP.put("gta5", "Grand Theft Auto V");
        ALIAS_MAP.put("gta 5", "Grand Theft Auto V");

        // [기타 인기 게임]
        ALIAS_MAP.put("롤", "League of Legends"); // 스팀엔 없지만 예시
        ALIAS_MAP.put("철권", "TEKKEN 8");
        ALIAS_MAP.put("철권8", "TEKKEN 8");
        ALIAS_MAP.put("철권 8", "TEKKEN 8");
        ALIAS_MAP.put("팰월드", "Palworld");
        ALIAS_MAP.put("리썰", "Lethal Company");
        ALIAS_MAP.put("리썰컴퍼니", "Lethal Company");
        ALIAS_MAP.put("스듀", "Stardew Valley");
    }

    public SteamGameInfo findGameOnSteam(String userInput) {
        // 1. 사용자 입력값(예: "배그")을 소문자로 변환 및 공백 제거 후 별명 사전에서 찾기
        String cleanInput = userInput.toLowerCase().trim();

        // 사전에 있으면 그 값(공식명칭)을 쓰고, 없으면 입력값 그대로 씀
        String searchTerm = ALIAS_MAP.getOrDefault(cleanInput, userInput);

        // 사전에 없어도 부분 일치 처리 (로깅용)
        if (ALIAS_MAP.containsKey(cleanInput)) {
            log.info("별명 감지! 사용자입력: '{}' -> 변환된검색어: '{}'", userInput, searchTerm);
        }

        // 2. URL 생성 (한글 깨짐 방지 인코딩)
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://store.steampowered.com/api/storesearch/")
                .queryParam("term", searchTerm)
                .queryParam("l", "korean")
                .queryParam("cc", "kr")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        log.info("Steam API 호출 URL: {}", uri);

        try {
            // 3.  봇 차단 방지 헤더 추가 (GTA5 오류 해결의 핵심)
            HttpHeaders headers = new HttpHeaders();
            headers.add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
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

            // 첫 번째 결과 가져오기
            JsonNode firstItem = itemsNode.get(0);
            long steamAppId = firstItem.path("id").asLong();
            String foundName = firstItem.path("name").asText();

            if (steamAppId == 0 || foundName.isEmpty()) return null;

            log.info("스팀 API 성공: '{}' -> [ID:{}] {}", searchTerm, steamAppId, foundName);
            return new SteamGameInfo(steamAppId, foundName);

        } catch (HttpClientErrorException e) {
            log.error("스팀 API 클라이언트 오류 ({}): {}", e.getStatusCode(), e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("스팀 API 통신 중 알 수 없는 오류", e);
            return null;
        }
    }
}