## RiskWire

1. Policy Microservice (The "Contract" Manager)
This is your Registry. It doesn't just store names; it stores the logic of the insurance.
Admin View: A dashboard to change the "Heatwave Threshold" (e.g., changing it from 45°C to 43°C across a whole city).
Microservice Task: It generates a unique Policy_ID for every rider and maps them to a Micro-zone.
Key Logic: "If Rider A is in Zone 5, their premium is $X based on the ML Oracle’s risk score."


2. Claims Microservice (The "Automated Adjuster")
This is the Heart of RiskWire. In traditional insurance, a human "Adjuster" looks at a claim. In your system, the Code is the Adjuster.
Admin View: A "Fraud Audit Log" and a "Live Trigger Map." Admins watch as the system automatically approves claims in real-time when a flood or heatwave hits.
Microservice Task: It constantly compares Weather Data (Input A) with Rider Status (Input B). If both match the policy rules, it creates an "Approved Claim" record.



3. Billing Microservice (The "Money" Handler)
This handles the Cash Flow. It ensures the system is financially sustainable.
Admin View: Financial reports showing "Total Premiums Collected" vs. "Total Claims Paid Out" (Loss Ratio).
Microservice Task:
Collection: Pulls the weekly subscription from the rider's digital wallet.
Disbursement: The moment the Claims Service says "Approved," this service pushes the payout.


1. In the PolicyCenter (The "Underwriter" View)
This is for the admin who manages the Risk and Pricing.

The AI Oracle Monitor: Show a "Sync Status" indicating when the ML model last updated the premiums for each zone.

Risk Distribution: A chart showing how many riders are in "High Risk" (Red) zones vs. "Safe" (Green) zones.

Policy Search: An admin should be able to search for a specific Rider ID and see their active Heat Shield or Rain Guard plan.




2. In the ClaimCenter (The "Claims Manager" View)
This is the most important part of your project. Since you are building Parametric Insurance, there are no manual claims to file.

The Live Trigger Map: An admin view showing real-time weather data (e.g., "Zone Delhi-04: 46°C - TRIGGER MET").

Auto-Approval Log: A scrolling list of claims that were instantly approved by the system without a human touching them.

Fraud Flags: A section showing claims blocked by your Anti-Spoofing AI (e.g., "Claim blocked: Rider GPS was not in the heatwave zone").



3. In the BillingCenter (The "Financial Officer" View)
This is for the admin who tracks the Money.
The Payout Ledger: A real-time feed showing money moving from the "Risk Pool" to "Rider Wallets."

Loss Ratio Gauge: A big dial showing if the premiums collected are enough to cover the payouts. (If payouts are higher than premiums, the admin knows they need to increase prices in PolicyCenter).
Payment Gateway Health: Status of your Integration Gateway connection to Stripe/Paytm/Bank APIs.
