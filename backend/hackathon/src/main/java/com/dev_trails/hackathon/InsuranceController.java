package com.dev_trails.hackathon;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/insurance")

public class InsuranceController
 {
private final InsuranceService service;

public InsuranceController(InsuranceService service)
 {
this.service = service;
}

@GetMapping("/quote")
public Map<String, OracleForecastResponse.PlanDetail> quote(@RequestParam Long riderId) 
{
return service.getQuote(riderId);
}

@PostMapping("/buy")

public Rider buy(@RequestParam Long riderId, @RequestParam String tier) {
    
return service.buyPolicy(riderId, tier);
}
}
