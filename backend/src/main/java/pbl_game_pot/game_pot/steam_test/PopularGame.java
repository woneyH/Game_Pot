package pbl_game_pot.game_pot.steam_test;

public enum PopularGame {
    COUNTER_STRIKE_2("Counter-Strike 2", 730),
    DOTA_2("Dota 2", 570),
    PUBG_BATTLEGROUNDS("PUBG: BATTLEGROUNDS", 578080),
    APEX_LEGENDS("Apex Legends", 1172470),
    BALDURS_GATE_3("Baldur's Gate 3", 1086940),
    GRAND_THEFT_AUTO_V("Grand Theft Auto V", 271590),
    RUST("Rust", 252490),
    CALL_OF_DUTY("Call of Duty®", 1938090),
    ELDEN_RING("ELDEN RING", 1245620),
    DESTINY_2("Destiny 2", 1085660),
    WARFRAME("Warframe", 230410),
    THE_FINALS("THE FINALS", 207340),
    LETHAL_COMPANY("Lethal Company", 1966720),
    HELLDIVERS_2("HELLDIVERS™ 2", 553850),
    NARAKA_BLADEPOINT("NARAKA: BLADEPOINT", 1203220);

    private final String gameName;
    private final long appId;

    PopularGame(String gameName, long appId) {
        this.gameName = gameName;
        this.appId = appId;
    }

    public String getGameName() { return gameName; }
    public long getAppId() { return appId; }
}