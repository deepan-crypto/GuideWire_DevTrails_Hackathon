package com.dev_trails.hackathon;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
@Entity
public class Policy {
@Id
@GeneratedValue(strategy=GenerationType.IDENTITY)
public Long id;
@Column(unique=true)
public String policyNumber;
public Long riderId;
public String riderName;
public String plan;
public String zone;
public String premium;
public Integer riskScore;
public String status;
public String startDate;
public String email;
public String phone;
public String address;
public String birthdate;
public String customerSince;
public String accountTier;
public String delinquencyStatus;
}
