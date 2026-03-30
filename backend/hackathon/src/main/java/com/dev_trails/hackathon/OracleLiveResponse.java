package com.dev_trails.hackathon;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
@JsonIgnoreProperties(ignoreUnknown=true)
public class OracleLiveResponse
 {
public String zone;
public Boolean payout_triggered;
}
