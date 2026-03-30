package com.dev_trails.hackathon;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class InsuranceService {
private final RiderRepository riderRepo;
private final PayoutLogRepository payoutLogRepo;
private final RestTemplate restTemplate;

@Value("${oracle.base-url}")
private String oracleBaseUrl;

public InsuranceService(RiderRepository riderRepo, PayoutLogRepository payoutLogRepo, RestTemplate restTemplate) {
this.riderRepo = riderRepo;
this.payoutLogRepo = payoutLogRepo;
this.restTemplate = restTemplate;
}

public Rider registerRider(String name, String phone, String city, String zone, String platform, Integer age) {
Rider r = new Rider();
r.name = name;
r.phone = phone;
r.city = city;
r.zone = zone;
r.platform = platform;
r.age = age;
r.walletBalance = 500.0;
r.isPolicyActive = false;
r.policyTier = null;
return riderRepo.save(r);
}

public Rider getRider(Long riderId) {
return riderRepo.findById(riderId).orElseThrow(() -> new RuntimeException("Rider not found: " + riderId));
}

public Rider updateRider(Long riderId, Rider updates) {
Rider r = getRider(riderId);
if (updates.name != null) r.name = updates.name;
if (updates.phone != null) r.phone = updates.phone;
if (updates.city != null) r.city = updates.city;
if (updates.platform != null) r.platform = updates.platform;
if (updates.age != null) r.age = updates.age;
return riderRepo.save(r);
}

public List<PayoutLog> getPayouts(Long riderId) {
return payoutLogRepo.findByRiderIdOrderByTimestampDesc(riderId);
}

public Map<String, OracleForecastResponse.PlanDetail> getQuote(Long riderId) {
Rider r = getRider(riderId);
try {
OracleForecastResponse res = restTemplate.getForObject(
oracleBaseUrl + "/api/v1/pricing/forecast-quote?zone=" + r.zone,
OracleForecastResponse.class);
return res.plans;
} catch (Exception e) {
Map<String, OracleForecastResponse.PlanDetail> fallback = new java.util.LinkedHashMap<>();
OracleForecastResponse.PlanDetail basic = new OracleForecastResponse.PlanDetail();
basic.premium = 95.0; basic.daily_payout = 300.0;
OracleForecastResponse.PlanDetail standard = new OracleForecastResponse.PlanDetail();
standard.premium = 143.0; standard.daily_payout = 500.0;
OracleForecastResponse.PlanDetail pro = new OracleForecastResponse.PlanDetail();
pro.premium = 218.0; pro.daily_payout = 1000.0;
fallback.put("basic", basic);
fallback.put("standard", standard);
fallback.put("pro", pro);
return fallback;
}
}

public Rider buyPolicy(Long riderId, String tier) {
Rider r = getRider(riderId);
double premium = 0;
try {
OracleForecastResponse res = restTemplate.getForObject(
oracleBaseUrl + "/api/v1/pricing/forecast-quote?zone=" + r.zone,
OracleForecastResponse.class);
OracleForecastResponse.PlanDetail plan = res.plans.get(tier.toLowerCase());
if (plan != null) premium = plan.premium;
} catch (Exception e) {
premium = switch (tier.toUpperCase()) {
case "PRO" -> 218.0;
case "STANDARD" -> 143.0;
default -> 95.0;
};
}
r.walletBalance -= premium;
r.isPolicyActive = true;
r.policyTier = tier.toUpperCase();
return riderRepo.save(r);
}

@Scheduled(cron = "0 0 * * * *")
public void runActuarialEngine() {
List<String> zones = riderRepo.findDistinctActiveZones();
for (String zone : zones) {
OracleLiveResponse live = restTemplate.getForObject(
oracleBaseUrl + "/api/v1/pricing/quote?zone=" + zone,
OracleLiveResponse.class);
if (live != null && Boolean.TRUE.equals(live.payout_triggered)) {
List<Rider> activeRiders = riderRepo.findByZoneAndIsPolicyActiveTrue(zone);
for (Rider rider : activeRiders) {
double amount = switch (rider.policyTier) {
case "STANDARD" -> 500.0;
case "PRO" -> 1000.0;
default -> 300.0;
};
rider.walletBalance += amount;
rider.isPolicyActive = false;
riderRepo.save(rider);
PayoutLog log = new PayoutLog();
log.riderId = rider.id;
log.amount = amount;
log.timestamp = LocalDateTime.now();
payoutLogRepo.save(log);
}
}
}
}
}
