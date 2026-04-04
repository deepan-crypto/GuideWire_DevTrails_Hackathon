package com.dev_trails.hackathon;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/policy", "/api/v1/policy"})
public class PolicyController {
    private final RestTemplate restTemplate;

    @Value("${oracle.base-url}")
    private String oracleBaseUrl;

    public PolicyController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/quote")
    public Map<String, Object> quote(@RequestParam String zoneId, @RequestParam String tier) {
        String normalizedTier = tier == null ? "STANDARD" : tier.toUpperCase();
        double basePremium = switch (normalizedTier) {
            case "PRO" -> 100.0;
            case "STANDARD" -> 50.0;
            default -> 25.0;
        };

        double multiplier = 1.0;
        String reason = "Oracle unavailable";

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("zoneId", zoneId);
            payload.put("tier", normalizedTier);

            QuoteMultiplierResponse res = restTemplate.postForObject(
                oracleBaseUrl + "/api/v1/oracle/quote-multiplier",
                payload,
                QuoteMultiplierResponse.class
            );
            if (res != null && res.multiplier != null) {
                multiplier = res.multiplier;
                reason = res.reason != null ? res.reason : "AI risk adjustment";
            }
        } catch (Exception e) {
            // Fallback to base premium
        }

        double premium = Math.round(basePremium * multiplier * 100.0) / 100.0;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("zoneId", zoneId);
        response.put("tier", normalizedTier);
        response.put("basePremium", basePremium);
        response.put("multiplier", multiplier);
        response.put("premium", premium);
        response.put("reason", reason);
        return response;
    }
}
