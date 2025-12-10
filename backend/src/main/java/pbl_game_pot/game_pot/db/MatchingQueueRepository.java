package pbl_game_pot.game_pot.db;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MatchingQueueRepository extends JpaRepository<MatchingQueue, Long> {

    // 특정 게임의 대기열에 있는 모든 매칭 상태 찾기 (매칭 현황판용)
    List<MatchingQueue> findByGameId(Long gameId);

    // 특정 유저 ID로 매칭 상태 찾기
    Optional<MatchingQueue> findByUserId(Long userId);

    // 특정 유저가 대기 중인 모든 매칭 상태 삭제 (매칭 시작 시 이전 매칭 취소용)
    @Transactional
    void deleteByUser(UserTable user);

    @Transactional
    int deleteByCreatedAtBefore(LocalDateTime timestamp);
}