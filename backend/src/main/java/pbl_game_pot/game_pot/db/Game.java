package pbl_game_pot.game_pot.db;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "games", indexes = @Index(name = "idx_games_steamappid", columnList = "steamAppId", unique = true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long steamAppId; // Steam 고유 앱 ID

    @Column(nullable = false)
    private String name;       // 게임 이름
}
