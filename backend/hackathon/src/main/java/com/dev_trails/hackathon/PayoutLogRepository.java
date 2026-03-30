package com.dev_trails.hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PayoutLogRepository extends JpaRepository<PayoutLog, Long> {
List<PayoutLog> findByRiderIdOrderByTimestampDesc(Long riderId);
}