package com.dev_trails.hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ReferralRepository extends JpaRepository<ReferralCode, Long> {
    Optional<ReferralCode> findByCode(String code);
    Optional<ReferralCode> findByOwnerRiderId(Long ownerRiderId);
    List<ReferralCode> findAllByOrderByTimesUsedDesc();
}
