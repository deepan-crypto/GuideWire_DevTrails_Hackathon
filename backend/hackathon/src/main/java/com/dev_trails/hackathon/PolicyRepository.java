package com.dev_trails.hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface PolicyRepository extends JpaRepository<Policy, Long> {
List<Policy> findByStatus(String status);
Optional<Policy> findByPolicyNumber(String policyNumber);
List<Policy> findByRiderId(Long riderId);
}
