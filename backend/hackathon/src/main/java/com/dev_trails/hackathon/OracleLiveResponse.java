package com.dev_trails.hackathon;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OracleLiveResponse {
    public String zone;
    public Double live_temp;
    public Double live_rain;
    public Double live_humidity;
    public Double live_wind;
    public Boolean payout_triggered;
    public String trigger_type;
}
