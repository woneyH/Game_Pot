package pbl_game_pot.game_pot.db;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
// 한 유저가 한 게임에만 대기열을 걸 수 있도록 유니크 제약
@Table(name = "matching_queue", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "game_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingQueue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserTable user; // 매칭을 요청한 유저 (FK)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;       // 매칭하려는 게임 (FK)

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt; // 매칭 시작 시간
}