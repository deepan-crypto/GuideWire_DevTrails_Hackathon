package com.dev_trails.hackathon;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FraudCheckResponse {
    public String claim_id;
    public Boolean fraud_flag;
    public Double confidence_score;
    public Double fraud_score;
    public String ml_prediction;
    public List<String> fraud_reasons;
    public String timestamp;
}
