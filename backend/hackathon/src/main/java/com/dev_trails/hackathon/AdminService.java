package com.dev_trails.hackathon;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;
@Service
public class AdminService {
private final PolicyRepository policyRepo;
private final ClaimRepository claimRepo;
private final BillingTransactionRepository billingRepo;
private final PayoutLogRepository payoutLogRepo;
private final RiderRepository riderRepo;
public AdminService(PolicyRepository policyRepo, ClaimRepository claimRepo, BillingTransactionRepository billingRepo, PayoutLogRepository payoutLogRepo, RiderRepository riderRepo) {
this.policyRepo = policyRepo;
this.claimRepo = claimRepo;
this.billingRepo = billingRepo;
this.payoutLogRepo = payoutLogRepo;
this.riderRepo = riderRepo;
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
return policyRepo.findByPolicyNumber(policyNumber).orElseThrow(() -> new RuntimeException("Policy not found: " + policyNumber));
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
Map<String, List<Policy>> zoneMap = activePolicies.stream().collect(Collectors.groupingBy(p -> p.zone.split(" ")[0]));
List<Map<String, Object>> zones = new ArrayList<>();
Map<String, double[]> zoneWeather = new LinkedHashMap<>();
zoneWeather.put("MZ-DEL-04", new double[]{47.2, 0, 45, 80});
zoneWeather.put("MZ-DEL-09", new double[]{46.1, 0, 45, 80});
zoneWeather.put("MZ-MUM-12", new double[]{34.5, 112, 42, 80});
zoneWeather.put("MZ-BLR-07", new double[]{31.2, 22, 40, 80});
zoneWeather.put("MZ-HYD-03", new double[]{38.9, 5, 43, 80});
zoneWeather.put("MZ-CHN-05", new double[]{36.7, 95, 42, 80});
zoneWeather.put("MZ-PUN-02", new double[]{29.4, 8, 41, 80});
zoneWeather.put("MZ-HYD-08", new double[]{39.5, 3, 43, 80});
zoneWeather.put("MZ-CHN-11", new double[]{35.9, 88, 42, 80});
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
for (Map.Entry<String, double[]> entry : zoneWeather.entrySet()) {
String zoneId = entry.getKey();
double[] w = entry.getValue();
boolean heatTriggered = w[0] >= w[2];
boolean rainTriggered = w[1] >= w[3];
boolean triggered = heatTriggered || rainTriggered;
String triggerType = heatTriggered ? "HEAT" : (rainTriggered ? "RAIN" : null);
List<Policy> ridersInZone = zoneMap.getOrDefault(zoneId, Collections.emptyList());
long pendingClaims = claimRepo.findByPolicyRef(zoneId).stream().filter(c -> "Open".equals(c.status)).count();
Map<String, Object> zone = new LinkedHashMap<>();
zone.put("id", zoneId);
zone.put("name", zoneNames.getOrDefault(zoneId, zoneId));
zone.put("temp", w[0]);
zone.put("rain", w[1]);
zone.put("heatThreshold", w[2]);
zone.put("rainThreshold", w[3]);
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
int[][] data = {{142000,28000},{158000,31000},{175000,22000},{198000,58000},{224000,72000},{267000,118000}};
String[] months = {"Oct","Nov","Dec","Jan","Feb","Mar"};
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
}
