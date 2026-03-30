package com.dev_trails.hackathon;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rider")
public class RiderController {
private final InsuranceService service;

public RiderController(InsuranceService service) {
this.service = service;
}

@PostMapping("/register")
public Rider register(
@RequestParam String name,
@RequestParam String phone,
@RequestParam String city,
@RequestParam String zone,
@RequestParam String platform,
@RequestParam(defaultValue = "25") Integer age) {
return service.registerRider(name, phone, city, zone, platform, age);
}

@GetMapping("/{id}")
public Rider getProfile(@PathVariable Long id) {
return service.getRider(id);
}

@PutMapping("/{id}")
public Rider updateProfile(@PathVariable Long id, @RequestBody Rider updates) {
return service.updateRider(id, updates);
}

@GetMapping("/{id}/payouts")
public List<PayoutLog> getPayouts(@PathVariable Long id) {
return service.getPayouts(id);
}
}
