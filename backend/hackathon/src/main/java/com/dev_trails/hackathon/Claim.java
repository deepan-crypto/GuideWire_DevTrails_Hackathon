package com.dev_trails.hackathon;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
@Entity
public class Claim {
@Id
@GeneratedValue(strategy=GenerationType.IDENTITY)
public Long id;
@Column(unique=true)
public String claimNumber;
public String policyRef;
public Long riderId;
public String riderName;
public String product;
public String fraudRisk;
public String dateOfLoss;
public String status;
public String triggerType;
public Double amount;
public String zone;
public String approvedAt;
}
