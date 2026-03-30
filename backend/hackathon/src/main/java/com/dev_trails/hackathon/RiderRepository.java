package com.dev_trails.hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;


public interface RiderRepository extends JpaRepository<Rider, Long>
{
List<Rider> findByZoneAndIsPolicyActiveTrue(String zone);

@Query("SELECT DISTINCT r.zone FROM Rider r WHERE r.isPolicyActive = true")

List<String> findDistinctActiveZones();
}
