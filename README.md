# ⚡ RiskWire: AI-Powered Parametric Income Protection for India’s Gig Economy

**Submission for Guidewire DEVTrails 2026 – Phase 1 (Seed)**

admin panerl : https://guide-wire-dev-trails-hackathon.vercel.app/

riders apk : https://github.com/deepan-crypto/GuideWire_DevTrails_Hackathon/releases

📖 Table of Contents
--------------------

1.  The Problem Statement
    
2.  The Solution: RiskWire
    
3.  Target Persona: Quick-Commerce
    
4.  The Guidewire Advantage (Why GWCP?)
    
5.  🔥 The Innovation Edge (Our USPs)
    
6.  🚨 Crisis Management: The Market Crash Protocol
    
7.  🛡️ Adversarial Defense: Zero-Trust Anti-Spoofing
    
8.  GWCP Solution Architecture & Tech Stack
    
9.  Phase 1 to 3 Execution Roadmap


    

1\. The Problem Statement
-------------------------

Gig workers form the backbone of quick-commerce, yet they are the most financially vulnerable. During extreme conditions (heatwaves, floods, pollution), they face a tough decision: work in unsafe conditions OR lose their daily income.



Traditional insurance fails them because:

This leads to extreme income instability and severe safety risks.



2\. The Solution: RiskWire
--------------------------

RiskWire is an AI-powered, parametric micro-insurance product built natively on the Guidewire Cloud Platform (GWCP) designed for instant support. We are replacing the outdated, manual P&C claims process with an autonomous safety net that protects a rider's earning capacity and pays out instantly when they are forced offline. No paperwork, no delays, no manual intervention. Automatically triggers payouts without manual claims.




3\. Target Persona
----------------------------------

Our primary focus is on hyper-local delivery partners (Platforms: Swiggy, Zomato...) They are highly sensitive to local disruptions. Highly vulnerable to localized disruptions (waterlogging, sudden traffic jams, curfews, platform shutdowns).
No protection today when storms, pollution alerts, or local shutdowns force them offline.





**Why this segment?**
Real-time operational data is available, giving clear visibility of work stoppage, which is ideal for precise and fair insurance triggers.

Lost income is easy to quantify (orders per hour, hourly wage).
Disruptions are hyper‑local and instantly visible in platform logs.
This makes parametric triggers and AI‑based risk profiling very clean and demo‑friendly.




4\. The Guidewire Advantage (Why GWCP?)
---------------------------------------

Traditional insurance cannot scale to the gig economy because of high monthly premiums and slow manual claims. We chose to build RiskWire on GWCP because it provides the exact enterprise primitives needed to solve this:


*   **Dynamic Micro-Premiums:** Using GWCP, we offer SaaS-style weekly coverage tiers (Basic, Standard, Pro) that fit a gig worker's weekly cash flow.
    

*   **Scalable Frontend:** We require an accessible, mobile-first experience for riders operating in high-motion environments.
    



5\. 🔥 The Innovation Edge (Our USPs)
-------------------------------------

### A. Dynamic 3-Tier Business Model

RiskWire follows a flexible 3-tier subscription model (e.g., Basic Plan, Standard Plan, Pro Plan). Premiums are adjusted using an AI-based Risk Multiplier. Higher risk zones result in a slightly higher premium, making it affordable, scalable, and user-controlled.


### B. AI Voice-First Multilingual Assistant

Powered by an In-Context RAG Assistant (Gemini), Vani AI feeds policy Q&A directly to the user. It provides:

    

### C. Income-Aware Dual Validation Triggers

To prevent misuse and ensures fair, need-based payout, we use a dual-layer check:


*   **External Disruption:** Extreme weather, AQI spike, or curfew. Clear thresholds include Rain > 50mm/hr, Heat > 42°C, and AQI > 400.+1
    
*   **Platform Status (Aggregator API):** Verifies if order volume has dropped or the zone is offline.+1
    

### D. Growth & Security Ecosystem

*   **Growth:** A referral system for network expansion. Designed for mass adoption in the gig economy.+4
    
*   **Security:** Strong authentication & identity validation, coupled with spam call detection & avoidance.


    

6\. 🚨 Crisis Management: The Market Crash Protocol on server side
---------------------------------------------------

Standard parametric insurance only looks at the weather. RiskWire looks at the economy. If our Python ML Oracle detects a catastrophic macro-drop in aggregator order volumes (e.g., >70% drop across Swiggy/Zepto APIs), it triggers the **Dynamic Solvency Protocol** inside Guidewire.

*   **Macro-API Monitoring:** We do not rely on individual behavioral tracking. We monitor the macro health of the platforms. If the platform itself crashes, the disruption is verified system-wide.
    
*   **Pro-Tier Lock & Liquidity Shift:** To prevent the insurer from going bankrupt during a mass-market crash, GWCP temporarily locks the purchase of new 'Pro' and 'Standard' tier policies. All active liquidity is dynamically shifted to subsidize the 'Basic' survival tier.
    
*   **The Zero-Delay Guarantee:** While other systems implement "circuit breakers" that delay 40% of a worker's payout during a crisis, RiskWire guarantees 100% instant execution of the Basic tier. This ensures the absolute maximum number of vulnerable workers receive a baseline, minimum-wage survival payout immediately, without breaking the insurer's reserve pool.



7\. 🚨 Crisis Management: The Market Crash Protocol on Client Side
-----------------------------------------------------

_The Crisis: Coordinated 500-device syndicates using Fake GPS + VPNs to trigger fake payouts from their bedrooms._

Standard GPS (Lat, Lon) is mathematically compromised. RiskWire protects Guidewire ClaimCenter using a **Multi-Layered Spatial ML & Hardware Verification Framework**.

### A. Hardware-Backed Verification (Google Play Integrity API)

*   **Device & App Integrity:** Before a claim is even evaluated by ClaimCenter, RiskWire calls the **Google Play Integrity API** (the modern, hardware-backed replacement for SafetyNet). This provides cryptographic proof that our Jutro-based mobile app is running on a genuine, unmodified Android device. It instantly blocks any claims originating from Android emulators, rooted devices, or modified app versions used by fraud syndicates.
    

### B. Defeating the Geo-Location Spoofer

Fraudsters use developer settings to inject fake coordinates. We catch them at the Operating System layer:

*   **OS-Level Mock Detection:** When our app requests location, we interrogate the OS metadata (Location.isMock()). If this API returns true, it is undeniable proof the coordinates were injected by third-party software, and the claim is instantly rejected.
    
*   **"Dead Metadata" Traps:** Fake GPS apps lazily inject Lat/Lon but leave metadata blank. If a claim packet arrives with a speed of exactly 0.0000 and an altitude of exactly 0.0, the system flags it as synthetic (real-world physical GPS data is never mathematically perfect).
    

### C. Defeating the VPN Proxy & Fraud Rings

If a user spoofs their GPS to Chennai, they will use a VPN to spoof their IP address to Chennai. We defeat this using Network Physics:

*   **The ASN Check (Telecom vs. Datacenter):** A genuine rider uses a mobile telecom network. VPNs route traffic through commercial server farms. We check the Autonomous System Number (ASN). If the IP belongs to a datacenter (e.g., AWS, NordVPN) instead of a local telecom provider (e.g., Jio, Airtel), it is an instant proxy flag.
    
*   **The Speed of Light (RTT Latency):** A VPN adds a massive physical detour to a data packet. If the GPS claims the user is 2 kilometers from our server, but the network Round-Trip Time (RTT) is 250+ milliseconds (typical of a VPN bounce), the temporal mismatch is blocked.
    
*   **BSSID Clustering:** We extract the connected Wi-Fi MAC Address. If 50 claims originate from different "GPS locations" but the exact same physical Wi-Fi router hardware, the syndicate is exposed



8\. ⚙️ System Blueprint & API Contracts (Integration Gateway)

These are the core microservice endpoints hosted on our external **Python FastAPI Oracle**:

**1\. The Actuarial Pricing Endpoint (Called by PolicyCenter)**

*   POST /api/v1/oracle/quote-multiplier
    
*   **Payload:** { "zone\_id": "Z-401", "rider\_id": "R-992", "tier": "PRO" }
    
*   **Function:** PolicyCenter pings this before generating a weekly quote. The Python Oracle runs the Gradient Boosting model against the 5-day weather forecast and returns the dynamic price multiplier (e.g., 1.4x).
    


**2\. The Anti-Spoofing Fraud Endpoint (Called by ClaimCenter)**

*   POST /api/v1/oracle/verify-claim
    
*   **Payload:** { "claim\_id": "C-102", "gps\_lat": 13.08, "is\_mock\_flag": false, "network\_rtt\_ms": 45 }
    
*   **Function:** Before Autopilot executes a payout, it sends the device telemetry here. The Isolation Forest ML model evaluates the spatial-network data and returns a confidence\_score and a fraud\_flag (True/False).
    

**3\. The Market Crash Monitor (Called by GWCP Cron Job)**

*   GET /api/v1/oracle/market-health/chennai
    
*   **Function:** A scheduled task checks this endpoint hourly. It aggregates data from Swiggy/Zepto mock APIs. If order volumes drop >70%, it triggers the Market Crash Protocol inside Guidewire.
    

**4\. AI Voice Assistant (Called by Jutro Frontend)**

*   POST /api/v1/vani/ask
    
*   **Payload:** { "user\_audio\_blob": "", "language": "ta-IN" }
    
*   **Function:** Processes the rider's voice query through Gemini 1.5 Flash (RAG) and returns a strictly scoped, localized audio response regarding their policy.





9\. GWCP Solution Architecture & Tech Stack
-------------------------------------------

RiskWire is a fully decoupled, scalable, real-time system.

A. Core Insurance Systems (GWCP Engine)

*   **Jutro (Frontend):** Powers the Rider App (onboarding, 3-tier plans) + Admin Dashboard.
    
*   **Advanced Product Designer (APD):** Defines insurance product (coverage, rules, exclusions).
    
*   **Policy Center:** Handles policy lifecycle: quoting, pricing, issuance.
    
*   **Claim Center + Autopilot:** Executes zero-touch, instant payouts via parametric triggers.
    

B. Actuarial & Risking Oracle (Python FastAPI)

Integrated with a Python ML Oracle for pricing & fraud detection.

*   **AI Risk Pricing:** A Gradient Boosting model uses 5-day weather data and outputs a dynamic Risk Multiplier for premiums.
    
*   **Fraud Detection Engine:** Isolation Forest model detects spoofing & anomalies.
    

### C. Data & Middleware

*   **Integration Gateway:** Acts as a secure middleware layer that connects PolicyCenter & ClaimCenter to the Python ML Oracle, Weather APIs (OpenWeather), and Aggregator APIs (platform data).
    
*   **Zonal Data ETL Pipeline (PySpark):** Processes aggregated Zonal Metrics and Insured vs. Uninsured Density data.
    

💻 System Architecture & UI Flow Deep Dive
------------------------------------------

RiskWire operates on a decoupled architecture. We utilize the **Guidewire Cloud Platform (GWCP)** for secure financial orchestration and policy management, while offloading heavy actuarial computation to our **Python ML Oracle**.

### 1\. The Frontend: Jutro Digital Platform (UI Flow)

We leverage Guidewire’s Jutro framework to build accessible, React-based interfaces tailored for two distinct users:

**A. The Rider Mobile App (Gig Worker Flow)**

*   **Step 1: Frictionless Onboarding & KYC:** The rider logs in using their mobile number. The system integrates with government APIs (e.g., DigiLocker/Aadhaar) for instant identity verification, preventing "ghost rider" accounts. The rider selects their specific Q-commerce micro-zone (2-3km radius).
    
*   **Step 2: Dynamic Subscription (The 3-Tier Model):** The UI displays the Basic, Standard, and Pro weekly plans. _Crucially, these prices are not static._ The Jutro app fetches the AI-adjusted premium in real-time.
    
*   **Step 3: AI Voice Hub:** A persistent, highly visible microphone button exists on the dashboard. Riders can tap and ask, _"If it rains tomorrow, how much will I get paid?"_ in Tamil or Hindi, receiving an instant voice reply.
    
*   **Step 4: Zero-Touch Claim Tracker:** When a disruption occurs, the UI updates automatically showing a visual pipeline: Monitoring Weather -> Trigger Met -> Validating Shift Status -> Payout Sent.
    

**B. The Admin / Insurer Web Dashboard**

*   **Risk Heatmaps:** Built using Jutro components and Recharts, fed by our Pandas ETL pipeline to show real-time "Insured vs. Uninsured" density maps across city zones.
    
*   **Fraud Audit Log:** Displays real-time blocked transactions flagged by our Anti-Spoofing AI, detailing the exact reason (e.g., "VPN Datacenter IP Detected" or "Mock Location Flagged").
    

### 2\. The Backend: GWCP Orchestration

Guidewire is the ultimate system of record. Here is how it orchestrates the product:

*   **Advanced Product Designer (APD):** Defines the structural rules, exclusions, and coverage limits of the "Gig Income Protection" product.
    
*   **Guidewire Integration Gateway:** The secure API middleware that bridges Guidewire's Java ecosystem with external APIs (OpenWeather, Swiggy mock data) and our Python ML Oracle.
    
*   **PolicyCenter:** Manages the lifecycle. When a rider opens the Jutro app to buy a policy, PolicyCenter pings the Integration Gateway to ask the ML Oracle for today's price multiplier, generates the quote, and issues the weekly policy.
    
*   **ClaimCenter + Autopilot:** Runs hourly scheduled checks against the weather and platform APIs. If the dual-triggers are met, Autopilot executes straight-through processing—bypassing human adjusters to approve and dispatch the wallet payout instantly.
    

### 3\. The Actuarial & Risking Oracle (How the AI Works)

_Why a separate Oracle?_ Java is excellent for financial ledgers, but Python is the industry standard for Machine Learning. To ensure PolicyCenter remains fast and stable, we offloaded all heavy AI computation to a standalone **Python FastAPI microservice**.

The Oracle houses three distinct AI engines:

#### Engine A: Dynamic Premium Pricing (Gradient Boosting Regressor)

Standard linear regression fails in insurance because environmental risks compound non-linearly (e.g., high heat + high humidity is exponentially more dangerous than just high heat).

*   **The Input:** The Oracle ingests a 5-day hyper-local weather forecast (Max Temp, Rainfall, Humidity, Wind Speed) for the rider's specific zone.
    
*   **The Processing:** We utilize a **Gradient Boosting Regressor** (scikit-learn). It builds sequential decision trees, where each new tree corrects the mathematical errors of the previous one, allowing it to predict complex weather risk spikes accurately.
    
*   **The Output:** It returns a Risk Multiplier (e.g., 1.3x). PolicyCenter multiplies the base premium by 1.3 to protect the insurer's liquidity pool _before_ the storm hits.
    

#### Engine B: Zero-Trust Fraud Defense (Isolation Forest)

To defeat 500-device GPS-spoofing syndicates, we cannot rely on simple rules. We treat fraud as an anomaly detection problem.

*   **The Input:** When ClaimCenter initiates a payout, it sends the device telemetry (OS Mock Location flags, Network RTT latency, BSSID Wi-Fi MAC addresses, and kinematic movement history) to the Oracle.
    
*   **The Processing:** We use an **Isolation Forest** unsupervised learning model. Genuine riders caught in a storm share a dense, chaotic, but unified spatial-network footprint. Fraudsters using VPNs and emulators look mathematically isolated in high-dimensional space (e.g., their GPS says Chennai, but their ping latency says Europe). The Isolation Forest easily isolates and "cuts" these anomalies out of the dataset.
    
*   **The Output:** Returns a Confidence Score. High confidence triggers ClaimCenter Autopilot. Low confidence pauses the smart contract.
    

#### Engine C: AI (In-Context RAG via Gemini 1.5 Flash)

We prevent LLM hallucinations by using a Retrieval-Augmented Generation (RAG) architecture.

*   **The Input:** The rider speaks into the Jutro app in their native language.
    
*   **The Processing:** The audio is transcribed. The Oracle retrieves the specific, hard-coded policy rules from PolicyCenter. We inject both the user's question and the strict policy rules into the context window of **Google Gemini 1.5 Flash**. We prompt Gemini to _only_ answer based on the provided rules.
    
*   **The Output:** Gemini generates an accurate, translated text response, which is converted back to speech and played to the rider, ensuring zero-latency, hands-free support.


### 🧠 Deep Dive: The AI Actuarial Pricing Engine

Traditional insurance uses static actuarial tables and linear regression. This completely fails for parametric weather insurance because environmental threats compound non-linearly (e.g., high heat combined with high humidity is exponentially more likely to force a rider offline than just high heat alone).

To solve this, RiskWire calculates a hyper-localized, dynamic weekly premium using a **Gradient Boosting Regressor (GBR)** hosted on our external Python FastAPI ML Oracle.

Here is exactly how the pricing pipeline works before a rider even opens the Jutro app:

#### 1\. The Data Ingestion Layer (The Inputs)

Every 24 hours, our Pandas ETL pipeline aggregates data for specific Q-commerce micro-zones (2-3 km radiuses). The model ingests a high-dimensional feature matrix:

*   **Meteorological Forecast (5-Day):** Expected rainfall intensity (mm/hr), max/min temperatures, AQI levels, and wind speed pulled via OpenWeather APIs.
    
*   **Spatial Risk History:** Historical disruption frequency for that specific zone (e.g., "Zone A floods easily due to poor drainage").
    
*   **Rider Shift Exposure:** The specific hours the rider plans to work (e.g., a rider working the 12 PM - 4 PM shift carries a higher heatwave risk penalty than a 7 PM - 11 PM rider).
    

#### 2\. The Algorithm: Gradient Boosting Regressor (scikit-learn)

We selected a Gradient Boosting Regressor because of its ability to handle complex, non-linear environmental data.

*   Instead of building one massive, complex equation, GBR builds an ensemble of sequential, shallow decision trees.
    
*   **Error Correction:** Each new tree is specifically trained to predict the _residual errors_ (the mistakes) made by the previous trees.
    
*   If Tree 1 underestimates the risk of urban waterlogging, Tree 2 mathematically corrects that specific blind spot. By the time the ensemble finishes, it produces a highly resilient prediction of the likelihood of an income-loss event occurring in that zone during that week.
    

#### 3\. The Output: The Dynamic Risk Multiplier

The ML model does not spit out a flat currency amount. It outputs a **Risk Multiplier** (e.g., 0.9x for clear weather, or 2.4x for an incoming monsoon).

#### 4\. The Guidewire PolicyCenter Integration

This is where the ML Oracle bridges with the enterprise ledger.

1.  The rider opens the Jutro app and selects the 'Standard' weekly tier for Zone A.
    
2.  Jutro pings the Guidewire Integration Gateway.
    
3.  PolicyCenter holds the "Base Premium" (e.g., ₹50).
    
4.  PolicyCenter fetches the current Risk Multiplier from the Python Oracle (e.g., 1.5x).
    
5.  The final quoted price shown to the rider is seamlessly calculated as **₹75 for that specific week**.
    

**The Business Value:** By dynamically adjusting the premium _before_ the policy is locked in for the week, the AI actively protects the insurer's liquidity pool against predictable mass-payout events, making micro-insurance mathematically viable at scale.

10\. Phase 1 to 3 Execution Roadmap
----------------------------------

*   **\[x\] Phase 1: Ideation & Foundation (Seed)  Theme: Ideate & Know Your Delivery Worker**
    
    *   _Completed:_ Finalized GWCP architecture, Jutro frontend strategy, Voice AI inclusion, Market Crash protocol, and the Multi-Layered Anti-Spoofing defense.
        
*   **\[ \] Phase 2: Automation & Protection (Soar) Theme: Protect Your  Worker**
    
    *   _Next Steps:_ Scaffold Jutro application. Configure APD and PolicyCenter for weekly terms. Build the Python FastAPI Oracle and link it via the Guidewire Integration Gateway.
        
*   **\[ \] Phase 3: Scale & Optimise (Scale) Theme: Perfect For Your Worker**
    
    *   _Upcoming:_ Implement ClaimCenter Autopilot logic. Refine the Voice-to-Voice UX. Record the end-to-end zero-touch claim demo demonstrating GWCP's power.
        

\*\*\* Built by Team INNOVEX (Deepan G, Saravanakarthiek S, Sairam D, Anumitha V) for the Guidewire DEVTrails 2026 Hackathon. The protection gap has been identified. Now, we build.
