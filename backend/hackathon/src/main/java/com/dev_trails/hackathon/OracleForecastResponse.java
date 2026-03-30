package com.dev_trails.hackathon;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown=true)

public class OracleForecastResponse
{

public String zone;
public Double risk_multiplier;
public Map<String, PlanDetail> plans;

@JsonIgnoreProperties(ignoreUnknown=true)

public static class PlanDetail 
{
public Double premium;
public Double daily_payout;
}
}
