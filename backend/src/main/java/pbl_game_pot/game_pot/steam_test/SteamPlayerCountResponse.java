package pbl_game_pot.game_pot.steam_test;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SteamPlayerCountResponse {

    @JsonProperty("response")
    private ResponseData response;

    public ResponseData getResponse() {
        return response;
    }

    public void setResponse(ResponseData response) {
        this.response = response;
    }

    public static class ResponseData {
        @JsonProperty("player_count")
        private int playerCount;

        @JsonProperty("result")
        private int result;

        public int getPlayerCount() {
            return playerCount;
        }

        public void setPlayerCount(int playerCount) {
            this.playerCount = playerCount;
        }

        public int getResult() {
            return result;
        }

        public void setResult(int result) {
            this.result = result;
        }
    }
}