package com.dev_trails.hackathon;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {
    private final PolicyRepository policyRepo;
    private final ClaimRepository claimRepo;
    private final BillingTransactionRepository billingRepo;
    private final PayoutLogRepository payoutLogRepo;
    private final RiderRepository riderRepo;
    private final FraudLogRepository fraudLogRepo;
    private final RestTemplate restTemplate;

    @Value("${oracle.base-url}")
    private String oracleBaseUrl;

    public AdminService(PolicyRepository policyRepo, ClaimRepository claimRepo,
                        BillingTransactionRepository billingRepo, PayoutLogRepository payoutLogRepo,
                        RiderRepository riderRepo, FraudLogRepository fraudLogRepo,
                        RestTemplate restTemplate) {
        this.policyRepo = policyRepo;
        this.claimRepo = claimRepo;
        this.billingRepo = billingRepo;
        this.payoutLogRepo = payoutLogRepo;
        this.riderRepo = riderRepo;
        this.fraudLogRepo = fraudLogRepo;
        this.restTemplate = restTemplate;
    }

    public List<Rider> getAllRiders() {
        return riderRepo.findAll();
    }

    public List<Policy> getAllPolicies() {
        return policyRepo.findAll();
    }

    public List<Policy> getActivePolicies() {
        return policyRepo.findByStatus("Active");
    }

    public Policy getPolicyByNumber(String policyNumber) {
        return policyRepo.findByPolicyNumber(policyNumber)
            .orElseThrow(() -> new RuntimeException("Policy not found: " + policyNumber));
    }

    public Map<String, Object> getPolicyDetail(String policyNumber) {
        Policy policy = getPolicyByNumber(policyNumber);
        List<Claim> claims = claimRepo.findByPolicyRef(policyNumber);
        List<BillingTransaction> transactions = billingRepo.findByPolicyRef(policyNumber);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("policy", policy);
        result.put("claims", claims);
        result.put("transactions", transactions);
        return result;
    }

    public List<Claim> getAllClaims() {
        return claimRepo.findAllByOrderByDateOfLossDesc();
    }

    public List<Claim> getAutoApprovalLog() {
        return claimRepo.findByStatusOrderByApprovedAtDesc("AUTO-APPROVED");
    }

    public List<Map<String, Object>> getTriggerZones() {
        List<Policy> activePolicies = policyRepo.findByStatus("Active");
        Map<String, List<Policy>> zoneMap = activePolicies.stream()
            .collect(Collectors.groupingBy(p -> p.zone.split(" ")[0]));

        List<Map<String, Object>> zones = new ArrayList<>();
        Map<String, double[]> fallbackWeather = new LinkedHashMap<>();
        fallbackWeather.put("MZ-DEL-04", new double[]{47.2, 0, 45, 80});
        fallbackWeather.put("MZ-DEL-09", new double[]{46.1, 0, 45, 80});
        fallbackWeather.put("MZ-MUM-12", new double[]{34.5, 112, 42, 80});
        fallbackWeather.put("MZ-BLR-07", new double[]{31.2, 22, 40, 80});
        fallbackWeather.put("MZ-HYD-03", new double[]{38.9, 5, 43, 80});
        fallbackWeather.put("MZ-CHN-05", new double[]{36.7, 95, 42, 80});
        fallbackWeather.put("MZ-PUN-02", new double[]{29.4, 8, 41, 80});
        fallbackWeather.put("MZ-HYD-08", new double[]{39.5, 3, 43, 80});
        fallbackWeather.put("MZ-CHN-11", new double[]{35.9, 88, 42, 80});

        Map<String, String> zoneNames = new LinkedHashMap<>();
        zoneNames.put("MZ-DEL-04", "Connaught Place, Delhi");
        zoneNames.put("MZ-DEL-09", "Karol Bagh, Delhi");
        zoneNames.put("MZ-MUM-12", "Andheri West, Mumbai");
        zoneNames.put("MZ-BLR-07", "Koramangala, Bangalore");
        zoneNames.put("MZ-HYD-03", "HITEC City, Hyderabad");
        zoneNames.put("MZ-CHN-05", "T. Nagar, Chennai");
        zoneNames.put("MZ-PUN-02", "Hinjewadi, Pune");
        zoneNames.put("MZ-HYD-08", "Gachibowli, Hyderabad");
        zoneNames.put("MZ-CHN-11", "Adyar, Chennai");

        for (Map.Entry<String, double[]> entry : fallbackWeather.entrySet()) {
            String zoneId = entry.getKey();
            double[] fb = entry.getValue();
            
            double realTemp = fb[0];
            double realRain = fb[1];
            double heatThreshold = fb[2];
            double rainThreshold = fb[3];
            boolean triggered = false;
            String triggerType = null;
            
            try {
                OracleLiveResponse live = restTemplate.getForObject(
                    oracleBaseUrl + "/api/v1/pricing/quote?zone=" + zoneId,
                    OracleLiveResponse.class);
                if (live != null) {
                    if (live.live_temp != null) realTemp = Math.round(live.live_temp * 10.0) / 10.0;
                    if (live.live_rain != null) realRain = Math.round(live.live_rain * 10.0) / 10.0;
                    if (Boolean.TRUE.equals(live.payout_triggered)) {
                        triggered = true;
                        triggerType = live.trigger_type != null ? live.trigger_type.toUpperCase() : "WEATHER";
                    }
                }
            } catch (Exception e) {
                // Fallback to static values
            }
            
            if (!triggered) {
                boolean heatTriggered = realTemp >= heatThreshold;
                boolean rainTriggered = realRain >= rainThreshold;
                triggered = heatTriggered || rainTriggered;
                if (heatTriggered) triggerType = "HEAT";
                else if (rainTriggered) triggerType = "RAIN";
            }

            List<Policy> ridersInZone = zoneMap.getOrDefault(zoneId, Collections.emptyList());
            long pendingClaims = claimRepo.findByPolicyRef(zoneId).stream()
                .filter(c -> "Open".equals(c.status)).count();

            Map<String, Object> zone = new LinkedHashMap<>();
            zone.put("id", zoneId);
            zone.put("name", zoneNames.getOrDefault(zoneId, zoneId));
            zone.put("temp", realTemp);
            zone.put("rain", realRain);
            zone.put("heatThreshold", heatThreshold);
            zone.put("rainThreshold", rainThreshold);
            zone.put("triggered", triggered);
            zone.put("triggerType", triggerType);
            zone.put("riders", ridersInZone.size());
            zone.put("pendingClaims", pendingClaims);
            zones.add(zone);
        }
        return zones;
    }

    public Map<String, Object> getBillingSummary() {
        Double totalPremiums = billingRepo.sumAmountByType("PREMIUM");
        Double totalPayouts = billingRepo.sumAmountByType("PAYOUT");
        if (totalPremiums == null) totalPremiums = 0.0;
        if (totalPayouts == null) totalPayouts = 0.0;
        totalPayouts = Math.abs(totalPayouts);
        long activePolicies = policyRepo.findByStatus("Active").size();
        long claimsPaid = claimRepo.findByStatusOrderByApprovedAtDesc("AUTO-APPROVED").size();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalPremiums", totalPremiums);
        summary.put("totalPayouts", totalPayouts);
        summary.put("netRevenue", totalPremiums - totalPayouts);
        summary.put("lossRatio", totalPremiums > 0 ? Math.round(totalPayouts / totalPremiums * 1000.0) / 10.0 : 0);
        summary.put("activePolicies", activePolicies);
        summary.put("claimsPaid", claimsPaid);
        summary.put("avgClaimSize", claimsPaid > 0 ? Math.round(totalPayouts / claimsPaid) : 0);
        summary.put("autoApprovalRate", 97.3);
        return summary;
    }

    public List<Map<String, Object>> getMonthlyTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        int[][] data = {
            {142000, 28000}, {158000, 31000}, {175000, 22000},
            {198000, 58000}, {224000, 72000}, {267000, 118000}
        };
        String[] months = {"Oct", "Nov", "Dec", "Jan", "Feb", "Mar"};
        for (int i = 0; i < months.length; i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", months[i]);
            m.put("premiums", data[i][0]);
            m.put("payouts", data[i][1]);
            trend.add(m);
        }
        return trend;
    }

    public List<BillingTransaction> getRecentTransactions() {
        return billingRepo.findAllByOrderByIdDesc();
    }

    // ── Fraud Audit Log ─────────────────────────────────────────────────

    public List<FraudLog> getAllFraudLogs() {
        List<FraudLog> logs = fraudLogRepo.findAllByOrderByIdDesc();
        if (logs.isEmpty()) {
            // Seed demo fraud logs if none exist
            seedDemoFraudLogs();
            logs = fraudLogRepo.findAllByOrderByIdDesc();
        }
        return logs;
    }

    public List<FraudLog> getBlockedFraudLogs() {
        return fraudLogRepo.findByFraudFlagTrueOrderByIdDesc();
    }

    private void seedDemoFraudLogs() {
        Object[][] demoData = {
            {"CLM-DEMO-001", 1L, "Arjun Mehta", false, 0.92, 0.08, "NORMAL", "", "MZ-DEL-04", 28.62, 77.22, 32.0, "PASSED"},
            {"CLM-DEMO-002", 2L, "Priya Sharma", false, 0.88, 0.12, "NORMAL", "", "MZ-MUM-12", 19.12, 72.89, 28.0, "PASSED"},
            {"CLM-DEMO-003", 99L, "Fake User Alpha", true, 0.15, 0.85, "ANOMALY", "MOCK_LOCATION_DETECTED,VPN_DATACENTER_IP_DETECTED,RTT_LATENCY_VPN_BOUNCE", "MZ-DEL-04", 28.63, 77.21, 285.0, "BLOCKED"},
            {"CLM-DEMO-004", 3L, "Rahul Verma", false, 0.95, 0.05, "NORMAL", "", "MZ-BLR-07", 12.97, 77.59, 25.0, "PASSED"},
            {"CLM-DEMO-005", 98L, "Syndicate Bot B", true, 0.08, 0.92, "ANOMALY", "DEAD_METADATA_SYNTHETIC_GPS,MOCK_LOCATION_DETECTED,ML_ISOLATION_FOREST_ANOMALY", "MZ-CHN-05", 13.04, 80.23, 310.0, "BLOCKED"},
            {"CLM-DEMO-006", 4L, "Sneha Patel", false, 0.91, 0.09, "NORMAL", "", "MZ-DEL-09", 28.64, 77.19, 38.0, "PASSED"},
            {"CLM-DEMO-007", 97L, "Ghost Rider X", true, 0.05, 0.95, "ANOMALY", "VPN_DATACENTER_IP_DETECTED,BSSID_CLUSTER_SYNDICATE_DETECTED,RTT_LATENCY_VPN_BOUNCE,ML_ISOLATION_FOREST_ANOMALY", "MZ-HYD-03", 17.44, 78.35, 420.0, "BLOCKED"},
            {"CLM-DEMO-008", 5L, "Vikram Singh", false, 0.87, 0.13, "NORMAL", "", "MZ-HYD-03", 17.45, 78.38, 41.0, "PASSED"},
            {"CLM-DEMO-009", 6L, "Anita Desai", false, 0.93, 0.07, "NORMAL", "", "MZ-CHN-05", 13.05, 80.24, 22.0, "PASSED"},
            {"CLM-DEMO-010", 96L, "Emulator Farm Z", true, 0.02, 0.98, "ANOMALY", "MOCK_LOCATION_DETECTED,DEAD_METADATA_SYNTHETIC_GPS,VPN_DATACENTER_IP_DETECTED,BSSID_CLUSTER_SYNDICATE_DETECTED", "MZ-MUM-12", 19.10, 72.88, 500.0, "BLOCKED"},
        };
        for (Object[] d : demoData) {
            FraudLog f = new FraudLog();
            f.claimId = (String) d[0]; f.riderId = (Long) d[1]; f.riderName = (String) d[2];
            f.fraudFlag = (Boolean) d[3]; f.confidenceScore = (Double) d[4]; f.fraudScore = (Double) d[5];
            f.mlPrediction = (String) d[6]; f.fraudReasons = (String) d[7]; f.zone = (String) d[8];
            f.gpsLat = (Double) d[9]; f.gpsLon = (Double) d[10]; f.networkRttMs = (Double) d[11];
            f.timestamp = "2026-03-24T" + (10 + (int)(Math.random() * 12)) + ":00:00";
            f.verdict = (String) d[12];
            fraudLogRepo.save(f);
        }
    }

    // ── Risk Heatmap ────────────────────────────────────────────────────

    public List<Map<String, Object>> getRiskHeatmap() {
        List<Map<String, Object>> heatmap = new ArrayList<>();
        Map<String, String> zoneNames = new LinkedHashMap<>();
        zoneNames.put("MZ-DEL-04", "Connaught Place, Delhi");
        zoneNames.put("MZ-DEL-09", "Karol Bagh, Delhi");
        zoneNames.put("MZ-MUM-12", "Andheri West, Mumbai");
        zoneNames.put("MZ-BLR-07", "Koramangala, Bangalore");
        zoneNames.put("MZ-HYD-03", "HITEC City, Hyderabad");
        zoneNames.put("MZ-CHN-05", "T. Nagar, Chennai");
        zoneNames.put("MZ-PUN-02", "Hinjewadi, Pune");
        zoneNames.put("MZ-HYD-08", "Gachibowli, Hyderabad");
        zoneNames.put("MZ-CHN-11", "Adyar, Chennai");

        // Risk scores and density data per zone
        Object[][] data = {
            {"MZ-DEL-04", 82, 156, 42, "HIGH",    47.2, 0.0},
            {"MZ-DEL-09", 91, 89,  23, "CRITICAL", 46.1, 0.0},
            {"MZ-MUM-12", 71, 234, 78, "HIGH",    34.5, 112.0},
            {"MZ-BLR-07", 45, 312, 89, "MEDIUM",  31.2, 22.0},
            {"MZ-HYD-03", 58, 178, 56, "MEDIUM",  38.9, 5.0},
            {"MZ-CHN-05", 76, 145, 38, "HIGH",    36.7, 95.0},
            {"MZ-PUN-02", 34, 267, 102,"LOW",     29.4, 8.0},
            {"MZ-HYD-08", 63, 198, 67, "MEDIUM",  39.5, 3.0},
            {"MZ-CHN-11", 70, 123, 31, "HIGH",    35.9, 88.0},
        };

        for (Object[] d : data) {
            String zoneId = (String) d[0];
            Map<String, Object> zone = new LinkedHashMap<>();
            zone.put("zone_id", zoneId);
            zone.put("zone_name", zoneNames.getOrDefault(zoneId, zoneId));
            zone.put("risk_score", d[1]);
            zone.put("total_riders", d[2]);
            zone.put("insured_riders", d[3]);
            zone.put("uninsured_riders", (int) d[2] - (int) d[3]);
            zone.put("insurance_penetration", Math.round(((int) d[3] * 100.0) / (int) d[2]));
            zone.put("risk_level", d[4]);
            zone.put("current_temp", d[5]);
            zone.put("current_rain", d[6]);
            heatmap.add(zone);
        }
        return heatmap;
    }

    // ── Market Status for Admin ─────────────────────────────────────────

    public Map<String, Object> getMarketStatusForAdmin() {
        Map<String, Object> status = new LinkedHashMap<>();
        try {
            MarketHealthResponse health = restTemplate.getForObject(
                oracleBaseUrl + "/api/v1/oracle/market-health/chennai",
                MarketHealthResponse.class);
            if (health != null) {
                status.put("crash_detected", health.crash_detected);
                status.put("order_volume_drop_pct", health.overall_order_volume_drop_pct);
                status.put("solvency_protocol_active", health.solvency_protocol_triggered);
                status.put("action", health.action);
                status.put("recommendation", health.recommendation);
                status.put("platforms", health.platforms);
            }
        } catch (Exception e) {
            status.put("crash_detected", false);
            status.put("order_volume_drop_pct", 0);
            status.put("solvency_protocol_active", false);
            status.put("error", "Oracle unreachable");
        }
        return status;
    }
}
