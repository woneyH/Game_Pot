package pbl_game_pot.game_pot.db;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserTable, Long> {
    Optional<UserTable> findByDiscordId(String discordId);
}