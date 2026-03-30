package com.dev_trails.hackathon;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
private final AdminService service;
public AdminController(AdminService service) {
this.service = service;
}
@GetMapping("/policies")
public List<Policy> getPolicies(@RequestParam(required=false) String status) {
if (status != null) return service.getActivePolicies();
return service.getAllPolicies();
}
@GetMapping("/policies/{policyNumber}")
public Map<String, Object> getPolicyDetail(@PathVariable String policyNumber) {
return service.getPolicyDetail(policyNumber);
}
@GetMapping("/claims")
public List<Claim> getClaims() {
return service.getAllClaims();
}
@GetMapping("/claims/triggers")
public List<Map<String, Object>> getTriggerZones() {
return service.getTriggerZones();
}
@GetMapping("/claims/approval-log")
public List<Claim> getAutoApprovalLog() {
return service.getAutoApprovalLog();
}
@GetMapping("/billing/summary")
public Map<String, Object> getBillingSummary() {
return service.getBillingSummary();
}
@GetMapping("/billing/transactions")
public List<BillingTransaction> getTransactions() {
return service.getRecentTransactions();
}
@GetMapping("/billing/monthly-trend")
public List<Map<String, Object>> getMonthlyTrend() {
return service.getMonthlyTrend();
}
}
