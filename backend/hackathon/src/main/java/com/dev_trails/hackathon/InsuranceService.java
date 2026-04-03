package com.dev_trails.hackathon;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class InsuranceService {
    private final RiderRepository riderRepo;
    private final PayoutLogRepository payoutLogRepo;
    private final PolicyRepository policyRepo;
    private final ClaimRepository claimRepo;
    private final FraudLogRepository fraudLogRepo;
    private final ReferralRepository referralRepo;
    private final RestTemplate restTemplate;

    @Value("${oracle.base-url}")
    private String oracleBaseUrl;

    // Market crash state — volatile for thread safety
    private volatile boolean marketCrashActive = false;
    private volatile String marketCrashAction = "NONE";

    public InsuranceService(RiderRepository riderRepo, PayoutLogRepository payoutLogRepo,
                            PolicyRepository policyRepo, ClaimRepository claimRepo,
                            FraudLogRepository fraudLogRepo, ReferralRepository referralRepo,
                            RestTemplate restTemplate) {
        this.riderRepo = riderRepo;
        this.payoutLogRepo = payoutLogRepo;
        this.policyRepo = policyRepo;
        this.claimRepo = claimRepo;
        this.fraudLogRepo = fraudLogRepo;
        this.referralRepo = referralRepo;
        this.restTemplate = restTemplate;
    }

    // ── Rider Registration ──────────────────────────────────────────────────

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
        r.registeredAt = LocalDate.now().toString();
        // Generate unique referral code
        r.referralCode = "RW-" + phone.substring(Math.max(0, phone.length() - 4)) + "-" + System.currentTimeMillis() % 10000;
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

    // ── Quote & Policy Purchase ─────────────────────────────────────────────

    public Map<String, OracleForecastResponse.PlanDetail> getQuote(Long riderId) {
        Rider r = getRider(riderId);
        try {
            OracleForecastResponse res = restTemplate.getForObject(
                oracleBaseUrl + "/api/v1/pricing/forecast-quote?zone=" + r.zone,
                OracleForecastResponse.class);
            return res.plans;
        } catch (Exception e) {
            // Fallback pricing if Oracle is unreachable
            Map<String, OracleForecastResponse.PlanDetail> fallback = new LinkedHashMap<>();
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

        // ── Dynamic Solvency Protocol: Block Pro/Standard during market crash ──
        if (marketCrashActive && ("PRO".equalsIgnoreCase(tier) || "STANDARD".equalsIgnoreCase(tier))) {
            throw new RuntimeException("MARKET_CRASH_PROTOCOL: " + tier.toUpperCase() +
                    " tier is temporarily locked. Only Basic tier is available during market crisis.");
        }

        double premium = 0;
        String planName = "";
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
        planName = switch (tier.toUpperCase()) {
            case "PRO" -> "Heat Shield Pro";
            case "STANDARD" -> "Rain Guard Plus";
            default -> "Heat Shield Basic";
        };
        r.walletBalance -= premium;
        r.isPolicyActive = true;
        r.policyTier = tier.toUpperCase();
        Rider saved = riderRepo.save(r);

        // Create a Policy record so the admin PolicyCenter can see this user
        Policy p = new Policy();
        p.policyNumber = "POL-GW-" + LocalDate.now().getYear() + "-" + String.format("%03d", saved.id);
        p.riderId = saved.id;
        p.riderName = saved.name;
        p.zone = saved.zone + " (" + saved.city + ")";
        p.plan = planName;
        p.premium = "\u20B9" + (int) premium + "/day";
        p.riskScore = 50;
        p.status = "Active";
        p.startDate = LocalDate.now().toString();
        p.phone = saved.phone;
        p.email = saved.name.toLowerCase().replaceAll("\\s+", ".") + "@gmail.com";
        p.address = saved.city;
        p.birthdate = "2000-01-01";
        p.customerSince = LocalDate.now().toString();
        p.accountTier = tier.toUpperCase().equals("PRO") ? "Gold" : (tier.toUpperCase().equals("STANDARD") ? "Silver" : "Bronze");
        p.delinquencyStatus = "NO";
        policyRepo.save(p);

        return saved;
    }

    // ── Actuarial Engine with Dual Validation + Fraud Check ──────────────

    @Scheduled(cron = "0 0 * * * *")
    public void runActuarialEngine() {
        List<String> zones = riderRepo.findDistinctActiveZones();
        for (String zone : zones) {
            try {
                // ── Layer 1: External Weather Disruption Check ──
                OracleLiveResponse live = restTemplate.getForObject(
                    oracleBaseUrl + "/api/v1/pricing/quote?zone=" + zone,
                    OracleLiveResponse.class);
                if (live == null || !Boolean.TRUE.equals(live.payout_triggered)) continue;

                // ── Layer 2: Platform Status (Dual Validation) ──
                // Verify platform order volume has actually dropped
                boolean platformDisrupted = true;
                try {
                    Map platformStatus = restTemplate.getForObject(
                        oracleBaseUrl + "/api/v1/oracle/platform-status/" + zone,
                        Map.class);
                    if (platformStatus != null) {
                        Object confirmed = platformStatus.get("disruption_confirmed");
                        platformDisrupted = Boolean.TRUE.equals(confirmed);
                    }
                } catch (Exception e) {
                    // If platform check fails, rely on weather trigger alone
                    platformDisrupted = true;
                }

                if (!platformDisrupted) continue;  // Dual validation failed

                List<Rider> activeRiders = riderRepo.findByZoneAndIsPolicyActiveTrue(zone);
                for (Rider rider : activeRiders) {
                    // ── Layer 3: Fraud Verification ──
                    boolean isFraud = false;
                    try {
                        Map<String, Object> fraudPayload = new HashMap<>();
                        fraudPayload.put("claim_id", "CLM-AUTO-" + rider.id + "-" + System.currentTimeMillis());
                        fraudPayload.put("gps_lat", 13.08);
                        fraudPayload.put("gps_lon", 80.27);
                        fraudPayload.put("is_mock_flag", false);
                        fraudPayload.put("network_rtt_ms", 35.0);
                        fraudPayload.put("device_speed", 5.0);
                        fraudPayload.put("altitude", 15.0);
                        fraudPayload.put("asn_type", "mobile");

                        FraudCheckResponse fraudCheck = restTemplate.postForObject(
                            oracleBaseUrl + "/api/v1/oracle/verify-claim",
                            fraudPayload, FraudCheckResponse.class);

                        if (fraudCheck != null) {
                            isFraud = Boolean.TRUE.equals(fraudCheck.fraud_flag);

                            // Log fraud check result
                            FraudLog log = new FraudLog();
                            log.claimId = fraudCheck.claim_id;
                            log.riderId = rider.id;
                            log.riderName = rider.name;
                            log.fraudFlag = fraudCheck.fraud_flag;
                            log.confidenceScore = fraudCheck.confidence_score;
                            log.fraudScore = fraudCheck.fraud_score;
                            log.mlPrediction = fraudCheck.ml_prediction;
                            log.fraudReasons = fraudCheck.fraud_reasons != null ?
                                String.join(",", fraudCheck.fraud_reasons) : "";
                            log.zone = zone;
                            log.gpsLat = 13.08;
                            log.gpsLon = 80.27;
                            log.networkRttMs = 35.0;
                            log.timestamp = LocalDateTime.now().toString();
                            log.verdict = isFraud ? "BLOCKED" : "PASSED";
                            fraudLogRepo.save(log);
                        }
                    } catch (Exception e) {
                        // If fraud check fails, proceed with payout (fail-open for rider safety)
                    }

                    if (isFraud) continue;  // Skip payout for fraudulent claims

                    // ── Execute Payout ──
                    double amount = switch (rider.policyTier) {
                        case "STANDARD" -> 500.0;
                        case "PRO" -> 1000.0;
                        default -> 300.0;
                    };

                    // During market crash, ensure Basic tier always pays out (Zero-Delay Guarantee)
                    if (marketCrashActive && !"BASIC".equals(rider.policyTier)) {
                        amount = 300.0;  // Reduce to basic payout during crash
                    }

                    rider.walletBalance += amount;
                    rider.isPolicyActive = false;
                    riderRepo.save(rider);

                    PayoutLog payoutLog = new PayoutLog();
                    payoutLog.riderId = rider.id;
                    payoutLog.amount = amount;
                    payoutLog.timestamp = LocalDateTime.now();
                    payoutLog.triggerType = "WEATHER_PARAMETRIC";
                    payoutLog.zone = zone;
                    payoutLog.claimNumber = "CLM-" + System.currentTimeMillis() + "-" + rider.id;
                    payoutLogRepo.save(payoutLog);

                    // Create claim record
                    Claim claim = new Claim();
                    claim.claimNumber = payoutLog.claimNumber;
                    claim.policyRef = "POL-GW-" + LocalDate.now().getYear() + "-" + String.format("%03d", rider.id);
                    claim.riderId = rider.id;
                    claim.riderName = rider.name;
                    claim.product = rider.policyTier;
                    claim.fraudRisk = "NO";
                    claim.dateOfLoss = LocalDate.now().toString();
                    claim.status = "AUTO-APPROVED";
                    claim.triggerType = "WEATHER";
                    claim.amount = amount;
                    claim.zone = zone;
                    claim.approvedAt = LocalDateTime.now().toString();
                    claimRepo.save(claim);
                }
            } catch (Exception e) {
                // Zone processing failed, continue to next zone
            }
        }
    }

    // ── Market Crash Monitor (Dynamic Solvency Protocol) ────────────────

    @Scheduled(cron = "0 30 * * * *")  // Every 30 minutes
    public void runMarketCrashMonitor() {
        String[] cities = {"chennai", "delhi", "mumbai", "bangalore", "hyderabad"};
        for (String city : cities) {
            try {
                MarketHealthResponse health = restTemplate.getForObject(
                    oracleBaseUrl + "/api/v1/oracle/market-health/" + city,
                    MarketHealthResponse.class);
                if (health != null && Boolean.TRUE.equals(health.crash_detected)) {
                    marketCrashActive = true;
                    marketCrashAction = "LOCK_PRO_STANDARD_TIERS";
                    return;  // One crash triggers protocol globally
                }
            } catch (Exception e) {
                // Continue checking other cities
            }
        }
        // If no crash detected, clear protocol
        marketCrashActive = false;
        marketCrashAction = "NONE";
    }

    // ── Claim Tracker (Zero-Touch Pipeline Status) ──────────────────────

    public Map<String, Object> getClaimTracker(Long riderId) {
        Rider r = getRider(riderId);
        Map<String, Object> tracker = new LinkedHashMap<>();

        // Determine pipeline stage
        String stage = "MONITORING";
        boolean triggered = false;
        boolean validated = false;
        boolean paid = false;

        // Check if there's a recent weather trigger for this zone
        try {
            OracleLiveResponse live = restTemplate.getForObject(
                oracleBaseUrl + "/api/v1/pricing/quote?zone=" + r.zone,
                OracleLiveResponse.class);
            if (live != null && Boolean.TRUE.equals(live.payout_triggered)) {
                triggered = true;
                stage = "TRIGGER_MET";
                tracker.put("trigger_type", live.trigger_type != null ? live.trigger_type : "WEATHER");
                tracker.put("weather", Map.of(
                    "temp", live.live_temp != null ? live.live_temp : 30.0,
                    "rain", live.live_rain != null ? live.live_rain : 0.0
                ));
            }
        } catch (Exception e) {
            // Oracle unreachable
        }

        // Check recent payouts
        List<PayoutLog> payouts = payoutLogRepo.findByRiderIdOrderByTimestampDesc(riderId);
        if (!payouts.isEmpty()) {
            PayoutLog latest = payouts.get(0);
            // If payout was within last 24 hours, show completed pipeline
            if (latest.timestamp != null && latest.timestamp.isAfter(LocalDateTime.now().minusHours(24))) {
                paid = true;
                validated = true;
                triggered = true;
                stage = "PAYOUT_SENT";
                tracker.put("payout_amount", latest.amount);
                tracker.put("payout_time", latest.timestamp.toString());
                tracker.put("claim_number", latest.claimNumber);
            }
        }

        // Check validating status (claim exists but not yet approved)
        List<Claim> pendingClaims = claimRepo.findByRiderId(riderId);
        for (Claim c : pendingClaims) {
            if ("Open".equals(c.status)) {
                validated = false;
                triggered = true;
                stage = "VALIDATING_SHIFT";
            }
        }

        tracker.put("rider_id", riderId);
        tracker.put("zone", r.zone);
        tracker.put("policy_active", r.isPolicyActive);
        tracker.put("current_stage", stage);
        tracker.put("pipeline", Map.of(
            "monitoring_weather", true,
            "trigger_met", triggered,
            "validating_shift", validated || (triggered && stage.equals("VALIDATING_SHIFT")),
            "payout_sent", paid
        ));

        return tracker;
    }

    // ── Market Status ────────────────────────────────────────────────────

    public Map<String, Object> getMarketStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("crash_active", marketCrashActive);
        status.put("action", marketCrashAction);
        status.put("pro_tier_locked", marketCrashActive);
        status.put("standard_tier_locked", marketCrashActive);
        status.put("basic_tier_available", true);
        status.put("timestamp", LocalDateTime.now().toString());
        return status;
    }

    // ── Referral System ─────────────────────────────────────────────────

    public Map<String, Object> generateReferralCode(Long riderId) {
        Rider r = getRider(riderId);
        // Check if rider already has a referral record
        Optional<ReferralCode> existing = referralRepo.findByOwnerRiderId(riderId);
        if (existing.isPresent()) {
            ReferralCode ref = existing.get();
            return Map.of(
                "code", ref.code,
                "times_used", ref.timesUsed,
                "reward_earned", ref.rewardEarned,
                "share_message", "Join RiskWire with my code " + ref.code + " and get ₹50 bonus! Download: https://riskwire.app"
            );
        }
        // Generate new referral
        String code = r.referralCode != null ? r.referralCode : "RW-" + riderId + "-" + System.currentTimeMillis() % 10000;
        ReferralCode ref = new ReferralCode();
        ref.code = code;
        ref.ownerRiderId = riderId;
        ref.ownerName = r.name;
        ref.timesUsed = 0;
        ref.rewardEarned = 0.0;
        ref.createdAt = LocalDate.now().toString();
        referralRepo.save(ref);

        return Map.of(
            "code", code,
            "times_used", 0,
            "reward_earned", 0.0,
            "share_message", "Join RiskWire with my code " + code + " and get ₹50 bonus! Download: https://riskwire.app"
        );
    }

    public Map<String, Object> redeemReferral(Long riderId, String code) {
        Optional<ReferralCode> refOpt = referralRepo.findByCode(code);
        if (refOpt.isEmpty()) {
            throw new RuntimeException("Invalid referral code: " + code);
        }
        ReferralCode ref = refOpt.get();
        if (ref.ownerRiderId.equals(riderId)) {
            throw new RuntimeException("Cannot use your own referral code");
        }

        // Reward both parties
        Rider newUser = getRider(riderId);
        newUser.walletBalance += 50.0;  // ₹50 bonus for new user
        newUser.referredBy = code;
        riderRepo.save(newUser);

        Rider owner = getRider(ref.ownerRiderId);
        owner.walletBalance += 25.0;  // ₹25 for referrer
        riderRepo.save(owner);

        ref.timesUsed += 1;
        ref.rewardEarned += 25.0;
        referralRepo.save(ref);

        return Map.of(
            "success", true,
            "new_user_bonus", 50.0,
            "referrer_bonus", 25.0,
            "message", "₹50 added to your wallet!"
        );
    }
}
