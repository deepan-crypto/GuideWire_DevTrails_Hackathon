package com.dev_trails.hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ClaimRepository extends JpaRepository<Claim, Long> {
List<Claim> findByPolicyRef(String policyRef);
List<Claim> findByStatus(String status);
List<Claim> findByRiderId(Long riderId);
List<Claim> findAllByOrderByDateOfLossDesc();
List<Claim> findByStatusOrderByApprovedAtDesc(String status);
}
