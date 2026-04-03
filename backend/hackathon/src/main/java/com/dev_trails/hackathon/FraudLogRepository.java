package com.dev_trails.hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FraudLogRepository extends JpaRepository<FraudLog, Long> {
    List<FraudLog> findAllByOrderByIdDesc();
    List<FraudLog> findByFraudFlagTrueOrderByIdDesc();
    List<FraudLog> findByRiderId(Long riderId);
}
