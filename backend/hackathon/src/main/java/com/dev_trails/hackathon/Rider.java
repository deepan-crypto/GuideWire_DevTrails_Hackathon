package com.dev_trails.hackathon;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Rider {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String name;
    public String phone;
    public String city;
    public String zone;
    public String platform;
    public Integer age;
    public Double walletBalance;
    public Boolean isPolicyActive;
    public String policyTier;
    public String registeredAt;
    public String referralCode;
    public String referredBy;
}
