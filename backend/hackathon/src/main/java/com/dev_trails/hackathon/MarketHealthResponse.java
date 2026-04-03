package com.dev_trails.hackathon;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MarketHealthResponse {
    public String city;
    public Double overall_order_volume_drop_pct;
    public Boolean crash_detected;
    public Boolean solvency_protocol_triggered;
    public String action;
    public String recommendation;
    public List<PlatformStatus> platforms;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PlatformStatus {
        public String platform;
        public Integer baseline_orders_per_hour;
        public Integer current_orders_per_hour;
        public Double drop_percentage;
        public String status;
        public Integer active_zones;
    }
}
