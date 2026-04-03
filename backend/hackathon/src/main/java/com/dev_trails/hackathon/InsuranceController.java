package com.dev_trails.hackathon;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/insurance")
public class InsuranceController {
    private final InsuranceService service;

    public InsuranceController(InsuranceService service) {
        this.service = service;
    }

    @GetMapping("/quote")
    public Map<String, OracleForecastResponse.PlanDetail> quote(@RequestParam Long riderId) {
        return service.getQuote(riderId);
    }

    @PostMapping("/buy")
    public Rider buy(@RequestParam Long riderId, @RequestParam String tier) {
        return service.buyPolicy(riderId, tier);
    }

    /** Zero-touch claim tracker: returns the live pipeline status for a rider */
    @GetMapping("/claim-tracker")
    public Map<String, Object> claimTracker(@RequestParam Long riderId) {
        return service.getClaimTracker(riderId);
    }

    /** Market crisis status: returns whether Dynamic Solvency Protocol is active */
    @GetMapping("/market-status")
    public Map<String, Object> marketStatus() {
        return service.getMarketStatus();
    }

    /** Generate a referral code for a rider */
    @PostMapping("/referral/generate")
    public Map<String, Object> generateReferral(@RequestParam Long riderId) {
        return service.generateReferralCode(riderId);
    }

    /** Redeem a referral code */
    @PostMapping("/referral/redeem")
    public Map<String, Object> redeemReferral(@RequestParam Long riderId, @RequestParam String code) {
        return service.redeemReferral(riderId, code);
    }
}
