package com.dev_trails.hackathon;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FraudCheckResponse {
    public String claim_id;
    public Boolean fraud_flag;
    public Double confidence_score;
    public Double fraud_score;
    public String recommended_status;
    public List<String> reason_codes;
    public String model_version;
}
