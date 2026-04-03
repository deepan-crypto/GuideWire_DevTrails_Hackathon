package com.dev_trails.hackathon;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;

@Entity
public class FraudLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public String claimId;
    public Long riderId;
    public String riderName;
    public Boolean fraudFlag;
    public Double confidenceScore;
    public Double fraudScore;
    public String mlPrediction;
    @Column(length = 1000)
    public String fraudReasons;  // comma-separated reasons
    public String zone;
    public Double gpsLat;
    public Double gpsLon;
    public Double networkRttMs;
    public String timestamp;
    public String verdict;  // BLOCKED | PASSED | FLAGGED
}
