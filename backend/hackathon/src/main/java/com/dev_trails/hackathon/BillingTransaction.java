package com.dev_trails.hackathon;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
@Entity
public class BillingTransaction {
@Id
@GeneratedValue(strategy=GenerationType.IDENTITY)
public Long id;
@Column(unique=true)
public String txnId;
public String type;
public String riderName;
public Double amount;
public String date;
public String description;
public String policyRef;
}
