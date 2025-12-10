package pbl_game_pot.game_pot.db;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 *
 */
public interface GameRepository extends JpaRepository<Game, Long> {
    // SteamAppId로 게임을 찾는 기능
    Optional<Game> findBySteamAppId(Long steamAppId);
}