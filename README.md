⚡ RiskWire: AI-Powered Parametric Income Protection (Aegis Architecture)
========================================================================

**Submission for Guidewire DEVTrails 2026**

**Team INNOVEX:** Deepan G, Saravanakarthiek S, Sairam D, Anumitha V

1\. The Pivot: What We Got Wrong (And How We Fixed It)
------------------------------------------------------

We didn't start from assumptions. We went to Zepto, Blinkit, and Swiggy Instamart dark stores and talked to the supervisors running them. What they told us completely changed our architecture.

**Our Initial Assumption:** Rain stops riders from working, causing income loss.

**The Reality:** Riders actually get _surge bonuses_ during rain. The ones who stay out earn more.

**The Real Problem:** The only time a rider truly loses income is when the platform marks their specific operating zone as **Unserviceable (HALTED)** due to extreme flooding, civic shutdowns, or safety hazards. When the zone halts, all dispatch stops. The surge disappears. The rider can do nothing about it, no matter how willing they are to work.

Traditional P&C insurance has no way to see this because there is no physical damage or hospital bill to file against. **RiskWire** bridges this exact gap using parametric smart contracts on the Guidewire Cloud Platform (GWCP).

2\. The Solution: RiskWire 2.0
------------------------------

RiskWire is an AI-powered, parametric micro-insurance product built natively on **Guidewire Cloud Platform (GWCP)**.

Instead of waiting weeks for manual claims, RiskWire uses an external Python ML Oracle to monitor hyper-local environmental data and simulated platform APIs. The moment an Uber H3 Micro-Zone breaches the HALTED threshold, **Guidewire ClaimCenter Autopilot** executes a straight-through payout to the rider's digital wallet instantly. Zero paperwork. Zero waiting.

3\. The Guidewire Advantage (GWCP Tech Stack)
---------------------------------------------

We decoupled our architecture to blend Guidewire's enterprise security with Python's AI processing power:

*   **Jutro Digital Platform (Frontend):** A mobile-first, React Native experience for riders featuring frictionless onboarding and the **Vani AI Voice Hub** (Powered by Gemini 1.5 RAG) for zero-hallucination policy support in regional languages.
    
*   **Guidewire Integration Gateway:** The secure middleware layer bridging the GWCP ledger with our external ML Oracle.
    
*   **PolicyCenter:** Handles the dynamic weekly quoting and policy issuance based on AI-adjusted risk multipliers.
    
*   **ClaimCenter + Autopilot:** Executes zero-touch payouts when the parametric macro-triggers are breached.
    

4\. 🧠 Actuarial Innovation: The Sachet Risk Value (SRV)
--------------------------------------------------------

Flat-rate premiums do not work in the gig economy. A ₹95/week premium is too expensive for a part-timer and pays out too little for a full-timer. We implemented a dynamic actuarial model to normalize premiums based on a rider's rolling 4-week earnings baseline ($E\_w$).

Every insurance premium is built on an actuarial identity:

$$Expected Loss = E\_w \\times L\_f$$

Our Python ML Oracle calculates the **Final Weekly Premium** using the Sachet Risk Value (SRV):

$$Pr\_{final} = SRV \\times L\_f \\times C\_t \\times (1+M)$$

**Where:**

*   **$SRV$ (Sachet Risk Value):** $E\_w \\times \\alpha$ (Where $\\alpha$ is the affordable risk fraction, set at 1.5% of weekly earnings, aligning with global micro-insurance benchmarks).
    
*   $$L\_f = 1 - \\prod\_{i=1}^{n}(1 - P\_i \\times S\_i)$$
    
*   **$C\_t$ (Coverage Tier):** Basic (0.4), Standard (0.6), or Pro (0.8).
    
*   **$M$ (Sustainability Margin):** Calibrated via Monte Carlo to keep the insurer's ruin probability below 1%.
    

5\. 📍 Spatial Precision: Uber H3 Hexagonal Indexing
----------------------------------------------------

Standard pincodes and wards are too coarse. A cloudburst that floods one street could trigger payouts for riders 4km away who were unaffected.

RiskWire uses **Uber H3 Spatial Indexing (Resolution 8)**.

*   **Area:** ~0.46 km² per cell (perfectly matching a rider's dark store operating cluster).
    
*   **Performance:** $O(1)$ GPS-to-zone lookup. No heavy database spatial joins required.
    
*   **Pricing:** Premiums are anchored to the historical disruption frequency of specific H3 cells, protecting riders in resilient zones from subsidizing payouts in vulnerable zones.
    

6\. 🛡️ Adversarial Defense: The 5-Signal Fraud Matrix
------------------------------------------------------

When a zone goes HALTED, what stops a 500-device fraud syndicate from using VPNs and fake GPS emulators to drain the insurer's liquidity pool?

RiskWire protects Guidewire ClaimCenter using a multi-layered spatial ML defense:

1.  **H3 Zone Presence History:** You cannot claim a payout in an H3 cell you have no verified history in. A fraud ring cannot retroactively manufacture weeks of delivery pings.
    
2.  **Hardware-Backed Integrity:** Google Play Integrity API cryptographically blocks Android emulators and rooted devices.
    
3.  **OS-Level Mock Detection:** We interrogate the Android OS metadata (Location.isMock()) to catch fake GPS injection.
    
4.  **Network Physics (RTT Latency):** If a device claims to be in Chennai, but network round-trip time is 250+ ms (a VPN bounce to a datacenter), the claim is blocked.
    
5.  **Isolation Forest ML:** Our Python Oracle evaluates the spatial-network data. Genuine riders in a storm share a dense, unified spatial footprint. Fraudsters look mathematically isolated in high-dimensional space. The AI cuts them out.
    

7\. ⚙️ System Blueprint (API Contracts)
---------------------------------------

Our external Python FastAPI Oracle exposes these microservices to the Guidewire Integration Gateway:

*   POST /api/v1/oracle/quote-multiplier
    
    *   **Called by:** PolicyCenter
        
    *   **Function:** Runs the Gradient Boosting model against the 5-day weather forecast and the H3 zone risk, returning the dynamic price multiplier.
        
*   POST /api/v1/oracle/verify-claim
    
    *   **Called by:** ClaimCenter
        
    *   **Function:** Before Autopilot executes, it evaluates device telemetry through the Isolation Forest model, returning a confidence\_score and fraud\_flag.
        
*   POST /api/v1/vani/ask
    
    *   **Called by:** Jutro Frontend
        
    *   **Function:** Processes audio via Gemini 1.5 RAG to provide strict, localized policy answers.
        

8\. Execution Roadmap
---------------------

*   \[x\] **Phase 1 (Seed):** Finalized GWCP architecture, Uber H3 spatial mapping, Actuarial SRV math, and the 5-Signal Anti-Spoofing defense.
    
*   \[x\] **Phase 2 (Soar):** Scaffolded Jutro React Native application, built Python FastAPI ML Oracle, and recorded the end-to-end parametric claim UI flow.
    
*   \[ \] **Phase 3 (Scale):** Implement ClaimCenter Autopilot logic, deploy full H3 zone heatmaps to the Insurer Admin Dashboard, and prepare final Guidewire presentation.
