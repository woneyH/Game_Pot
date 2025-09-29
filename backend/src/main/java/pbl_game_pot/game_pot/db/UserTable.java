package pbl_game_pot.game_pot.db;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users", indexes = @Index(name="idx_users_discord_id", columnList="discordId", unique=true))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserTable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                 // pk

    @Column(nullable=false, unique=true, length=32)
    private String discordId;        // 디스코드 고유 식별자

    @Column(nullable=false, length=100)
    private String username;         // 디스코드 username

    @Column(length=100)
    private String displayName;      // global_name

    @Column(length=255)
    private String email;            // 이메일(스코프 필요)
}


