package com.dev_trails.hackathon;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;

@Entity
public class ReferralCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(unique = true)
    public String code;
    public Long ownerRiderId;
    public String ownerName;
    public Integer timesUsed;
    public Double rewardEarned;
    public String createdAt;
}
