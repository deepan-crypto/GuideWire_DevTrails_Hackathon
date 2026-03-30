package com.dev_trails.hackathon;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
@Entity
public class PayoutLog
 {

@Id
@GeneratedValue(strategy=GenerationType.IDENTITY)

public Long id;
public Long riderId;
public Double amount;
public LocalDateTime timestamp;
public String triggerType;
public String zone;
public String claimNumber;

}
