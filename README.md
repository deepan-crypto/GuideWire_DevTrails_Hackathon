⚡ RiskWire: AI-Powered Parametric Income Protection for India’s Gig Economy


**Submission for Guidewire DEVTrails 2026 – Phase 1 (Seed)**

📖 Table of Contents
--------------------

1.  [The Problem Statement](https://www.google.com/search?q=#1-the-problem-statement)
    
2.  [The Solution: RiskWire](https://www.google.com/search?q=#2-the-solution-riskwire)
    
3.  [Target Persona: Quick-Commerce](https://www.google.com/search?q=#3-target-persona-quick-commerce)
    
4.  [The Guidewire Advantage (Why GWCP?)](https://www.google.com/search?q=#4-the-guidewire-advantage-why-gwcp)
    
5.  [🔥 The Innovation Edge (Our USPs)](https://www.google.com/search?q=#5--the-innovation-edge-our-usps)
    
6.  [🚨 Crisis Management: The Market Crash Protocol](https://www.google.com/search?q=#6--crisis-management-the-market-crash-protocol)
    
7.  [🛡️ Adversarial Defense: Zero-Trust Anti-Spoofing](https://www.google.com/search?q=#7-️-adversarial-defense-zero-trust-anti-spoofing)
    
8.  [GWCP Solution Architecture & Tech Stack](https://www.google.com/search?q=#8-gwcp-solution-architecture--tech-stack)
    
9.  [Phase 1 to 3 Execution Roadmap](https://www.google.com/search?q=#9-phase-1-to-3-execution-roadmap)
    

1\. The Problem Statement
-------------------------

Gig workers form the backbone of quick-commerce, yet they are the most financially vulnerable. During extreme conditions (heatwaves, floods, pollution), they face a tough decision: work in unsafe conditions OR lose their daily income.

+1

Traditional insurance fails them because:

This leads to extreme income instability and severe safety risks.

2\. The Solution: RiskWire
--------------------------

RiskWire is an AI-powered, parametric micro-insurance product built natively on the Guidewire Cloud Platform (GWCP) designed for instant support. We are replacing the outdated, manual P&C claims process with an autonomous safety net that protects a rider's earning capacity and pays out instantly when they are forced offline. No paperwork, no delays, no manual intervention. Automatically triggers payouts without manual claims.

+4

3\. Target Persona: Quick-Commerce
----------------------------------

Our primary focus is on hyper-local delivery partners (Platforms: Swiggy, Zomato...) who work within small delivery radiuses (2-3 km). They are highly sensitive to local disruptions.

+1

**Why this segment?**Real-time operational data is available, giving clear visibility of work stoppage, which is ideal for precise and fair insurance triggers.

4\. The Guidewire Advantage (Why GWCP?)
---------------------------------------

Traditional insurance cannot scale to the gig economy because of high monthly premiums and slow manual claims. We chose to build RiskWire on GWCP because it provides the exact enterprise primitives needed to solve this:

+1

*   **Dynamic Micro-Premiums:** Using GWCP, we offer SaaS-style weekly coverage tiers (Basic, Standard, Pro) that fit a gig worker's weekly cash flow.
    

*   **Scalable Frontend:** We require an accessible, mobile-first experience for riders operating in high-motion environments.
    

5\. 🔥 The Innovation Edge (Our USPs)
-------------------------------------

### A. Dynamic 3-Tier Business Model

RiskWire follows a flexible 3-tier subscription model (e.g., Basic Plan: ₹25/week, Standard Plan: ₹50/week, Pro Plan: ₹100/week). Premiums are adjusted using an AI-based Risk Multiplier. Higher risk zones result in a slightly higher premium, making it affordable, scalable, and user-controlled.

+3

### B. Vani AI: Voice-First Multilingual Assistant

Powered by an In-Context RAG Assistant (Gemini), Vani AI feeds policy Q&A directly to the user. It provides:

*   +1
    
*   +2
    

### C. Income-Aware Dual Validation Triggers

To prevent misuse and ensures fair, need-based payout, we use a dual-layer check:

+1

*   **External Disruption:** Extreme weather, AQI spike, or curfew. Clear thresholds include Rain > 50mm/hr, Heat > 42°C, and AQI > 400.+1
    
*   **Platform Status (Aggregator API):** Verifies if order volume has dropped or the zone is offline.+1
    

### D. Growth & Security Ecosystem

*   **Growth:** A referral system for network expansion. Designed for mass adoption in the gig economy.+4
    
*   **Security:** Strong authentication & identity validation, coupled with spam call detection & avoidance.
    

6\. 🚨 Crisis Management: The Market Crash Protocol
---------------------------------------------------

_The Crisis: A sudden macro-economic market crash wipes out gig platform order volumes, threatening rider livelihoods and straining insurer liquidity._

RiskWire shifts fraud control from passive validation to active verification under stress conditions. We rely on **Proof of Work, Not Proof of Location**.

*   **Behavioral DNA Layer:** Each rider gets a longitudinal profile mapping typical working windows, route styles, and order handling cadences. Fraud risk rises when we observe abrupt "personality shifts."
    
*   **Confidence-Based Payout Splitting:** To protect honest workers while limiting liquidity drain, payouts are tiered: High confidence gets 100% instant payout; Medium confidence gets 60% instant + 40% delayed; Low confidence triggers a small advance + investigation flow.
    
*   **Fraud-Resistant Liquidity Design (Circuit Breaker):** When detecting a market-crash fraud wave, the system temporarily reduces instant payout ratios and raises verification thresholds. This has a time-bounded activation (auto-reverting unless manually re-authorized), explicit revert criteria, and full auditability in the Admin dashboard.
    

7\. 🛡️ Adversarial Defense: Zero-Trust Anti-Spoofing
-----------------------------------------------------

The Crisis: Coordinated fraud using Fake GPS + VPNs involving 500-device syndicates triggering fake payouts. Standard GPS (Lat, Lon) is easily spoofed.

RiskWire utilizes Behavioral Risk Analysis & Adversarial Defense via an Anomaly Detection - Isolation Forest model.

### A. GPS Spoofing Defense

*   **OS-level mock detection:** Checking Location.isMock() rejects injected coordinates instantly.
    
*   **Dead Metadata Traps:** If Speed = 0.0000 and Altitude = 0.0, the system flags synthetic (non-realistic) data.
    

### B. VPN & Syndicate Detection

*   **ASN Check:** Detects datacenter IPs (e.g., AWS vs telecom like Jio).
    
*   **RTT (Latency) Check:** High latency vs local GPS = mismatch.
    
*   **BSSID Clustering:** Multiple users sharing same Wi-Fi indicates a fraud ring.
    

### C. Shelter-in-Place Exception (Time-Series Kinematic)

By performing time-series kinematic heartrate & noise analysis, we ensure an honest rider who takes shelter during a storm isn't penalized. If they were active right before the trigger, the Automated Contract approves the payout.

+2

8\. GWCP Solution Architecture & Tech Stack
-------------------------------------------

RiskWire is a fully decoupled, scalable, real-time system.

A. Core Insurance Systems (GWCP Engine)

*   **Jutro (Frontend):** Powers the Rider App (onboarding, 3-tier plans) + Admin Dashboard.
    
*   **Advanced Product Designer (APD):** Defines insurance product (coverage, rules, exclusions).
    
*   **Policy Center:** Handles policy lifecycle: quoting, pricing, issuance.
    
*   **Claim Center + Autopilot:** Executes zero-touch, instant payouts via parametric triggers.
    

B. Actuarial & Risking Oracle (Python FastAPI)

Integrated with a Python ML Oracle for pricing & fraud detection.

*   **AI Risk Pricing:** A Gradient Boosting model uses 5-day weather data and outputs a dynamic Risk Multiplier for premiums.+1
    
*   **Fraud Detection Engine:** Isolation Forest model detects spoofing & anomalies.
    

### C. Data & Middleware

*   **Integration Gateway:** Acts as a secure middleware layer that connects PolicyCenter & ClaimCenter to the Python ML Oracle, Weather APIs (OpenWeather), and Aggregator APIs (platform data).
    
*   **Zonal Data ETL Pipeline (Pandas):** Processes aggregated Zonal Metrics and Insured vs. Uninsured Density data.
    

9\. Phase 1 to 3 Execution Roadmap
----------------------------------

*   **\[x\] Phase 1: Ideation & Foundation (Seed)**
    
    *   _Completed:_ Finalized GWCP architecture, Jutro frontend strategy, Vani Voice AI inclusion, Market Crash protocol, and the Multi-Layered Anti-Spoofing defense.
        
*   **\[ \] Phase 2: Automation & Protection (Build)**
    
    *   _Next Steps:_ Scaffold Jutro application. Configure APD and PolicyCenter for weekly terms. Build the Python FastAPI Oracle and link it via the Guidewire Integration Gateway.
        
*   **\[ \] Phase 3: Scale & Optimise (Launch)**
    
    *   _Upcoming:_ Implement ClaimCenter Autopilot logic. Refine the Voice-to-Voice UX. Record the end-to-end zero-touch claim demo demonstrating GWCP's power.
        

\*\*\* Built by Team INNOVEX (Deepan G, Saravanakarthiek S, Sairam D, Anumitha V) for the Guidewire DEVTrails 2026 Hackathon. The protection gap has been identified. Now, we build.
