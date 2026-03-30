package com.dev_trails.hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface BillingTransactionRepository extends JpaRepository<BillingTransaction, Long> {
List<BillingTransaction> findAllByOrderByIdDesc();
List<BillingTransaction> findByPolicyRef(String policyRef);
List<BillingTransaction> findByType(String type);
@Query("SELECT SUM(b.amount) FROM BillingTransaction b WHERE b.type = ?1")
Double sumAmountByType(String type);
}
