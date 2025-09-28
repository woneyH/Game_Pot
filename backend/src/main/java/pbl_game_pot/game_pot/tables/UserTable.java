package pbl_game_pot.game_pot.tables;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_discord_id", columnList = "discordId", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 디스코드 고유 식별자(문자열)
    @Column(nullable = false, unique = true, length = 32)
    private String discordId;

    // 디스코드 username
    @Column(nullable = false, length = 100)
    private String username;

    // 표시 이름(global_name)
    @Column(length = 100)
    private String displayName;

    // 이메일(스코프 email 필요)
    @Column(length = 255)
    private String email;
}
