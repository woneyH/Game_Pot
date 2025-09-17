package gnu_pbl.game_pot.api_test;

// 이 클래스도 별도의 dto 패키지에 만드는 것을 추천합니다.
public class GamePlayerData {
    private String gameName;
    private int playerCount;

    public GamePlayerData(String gameName, int playerCount) {
        this.gameName = gameName;
        this.playerCount = playerCount;
    }

    // Getters and Setters
    public String getGameName() { return gameName; }
    public void setGameName(String gameName) { this.gameName = gameName; }
    public int getPlayerCount() { return playerCount; }
    public void setPlayerCount(int playerCount) { this.playerCount = playerCount; }
}
