package pbl_game_pot.game_pot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class SteamApiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public record SteamGameInfo(Long steamAppId, String name) {}

    public SteamGameInfo findGameOnSteam(String gameName) {

        // UriComponentsBuilder를 사용해 한글 인코딩을 완벽하게 처리
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://store.steampowered.com/api/storesearch/")
                .queryParam("term", gameName)
                .queryParam("l", "korean")
                .queryParam("cc", "kr")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        log.info("Calling Steam API: {}", uri);

        try {
            String jsonResponse = restTemplate.getForObject(uri, String.class);

            if (jsonResponse == null || jsonResponse.isEmpty()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode itemsNode = root.path("items");

            if (itemsNode.isMissingNode() || !itemsNode.isArray() || itemsNode.size() == 0) {
                log.info("Steam API found no results for: {}", gameName);
                return null;
            }

            JsonNode firstItem = itemsNode.get(0);
            long steamAppId = firstItem.path("id").asLong();
            String foundName = firstItem.path("name").asText();

            if (steamAppId == 0 || foundName.isEmpty()) return null;

            log.info("Steam API Success: {} -> [{}]{}", gameName, steamAppId, foundName);
            return new SteamGameInfo(steamAppId, foundName);

        } catch (HttpClientErrorException e) {
            log.error("Steam API Client Error: {}", e.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("Steam API General Error", e);
            return null;
        }
    }
}