package pbl_game_pot.game_pot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pbl_game_pot.game_pot.db.MatchingQueueRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingCleanupService {

    private final MatchingQueueRepository matchingQueueRepository;

    // 매시간 0분에 실행 (cron = "0 0 * * * *")
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupOldMatches() {
        log.info("Running scheduled cleanup of old matches...");
        // 2시간보다 오래된 매칭은 삭제
        LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);

        int count = matchingQueueRepository.deleteByCreatedAtBefore(twoHoursAgo);

        if (count > 0) {
            log.info("Cleaned up {} old matching entries.", count);
        }
    }
}