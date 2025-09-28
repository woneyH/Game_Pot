package pbl_game_pot.game_pot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pbl_game_pot.game_pot.tables.UserTable;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserTable,Long> {
    Optional<UserTable> findByDiscordId(String discordId);
}
