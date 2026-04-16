const { Rider, Policy, Claim, BillingTransaction } = require('../models');

async function seedData() {
  const policyCount = await Policy.count();
  if (policyCount > 0) {
    console.log('[Seeder] Data already exists, skipping seed.');
    return;
  }

  console.log('[Seeder] Seeding initial data...');

  // ── Seed Riders ──
  const riderData = [
    { name: 'Arjun Mehta', phone: '+91 98765 43210', city: 'Delhi', zone: 'MZ-DEL-04', platform: 'Swiggy', age: 28 },
    { name: 'Priya Sharma', phone: '+91 87654 32109', city: 'Mumbai', zone: 'MZ-MUM-12', platform: 'Zomato', age: 31 },
    { name: 'Rahul Verma', phone: '+91 76543 21098', city: 'Bangalore', zone: 'MZ-BLR-07', platform: 'Swiggy', age: 25 },
    { name: 'Sneha Patel', phone: '+91 65432 10987', city: 'Delhi', zone: 'MZ-DEL-09', platform: 'Zepto', age: 29 },
    { name: 'Vikram Singh', phone: '+91 54321 09876', city: 'Hyderabad', zone: 'MZ-HYD-03', platform: 'Swiggy', age: 26 },
    { name: 'Anita Desai', phone: '+91 43210 98765', city: 'Chennai', zone: 'MZ-CHN-05', platform: 'Zomato', age: 30 },
    { name: 'Karan Kapoor', phone: '+91 32109 87654', city: 'Pune', zone: 'MZ-PUN-02', platform: 'Swiggy', age: 27 },
    { name: 'Meera Joshi', phone: '+91 21098 76543', city: 'Delhi', zone: 'MZ-DEL-04', platform: 'Dunzo', age: 32 },
    { name: 'Deepak Reddy', phone: '+91 10987 65432', city: 'Hyderabad', zone: 'MZ-HYD-08', platform: 'Swiggy', age: 24 },
    { name: 'Lakshmi Iyer', phone: '+91 09876 54321', city: 'Chennai', zone: 'MZ-CHN-11', platform: 'Zomato', age: 33 },
  ];

  for (const d of riderData) {
    await Rider.create({
      ...d,
      wallet_balance: 500.0,
      is_policy_active: true,
      policy_tier: 'PRO',
    });
  }

  // ── Seed Policies ──
  const policyData = [
    { policy_number: 'POL-GW-2026-001', rider_name: 'Arjun Mehta', zone: 'MZ-DEL-04 (Connaught Place)', plan: 'Heat Shield Pro', premium: '₹187/day', risk_score: 82, start_date: '2026-01-15', phone: '+91 98765 43210', email: 'arjun.mehta@gmail.com', address: '42 Janpath Road, Connaught Place, New Delhi 110001', birthdate: '1995-08-12', customer_since: '2025-11-20', account_tier: 'Gold', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-002', rider_name: 'Priya Sharma', zone: 'MZ-MUM-12 (Andheri West)', plan: 'Rain Guard Plus', premium: '₹143/day', risk_score: 71, start_date: '2026-02-03', phone: '+91 87654 32109', email: 'priya.sharma@outlook.com', address: '18/B Versova Link Road, Andheri West, Mumbai 400053', birthdate: '1992-03-25', customer_since: '2025-12-15', account_tier: 'Silver', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-003', rider_name: 'Rahul Verma', zone: 'MZ-BLR-07 (Koramangala)', plan: 'Heat Shield Basic', premium: '₹129/day', risk_score: 65, start_date: '2026-02-20', phone: '+91 76543 21098', email: 'rahul.verma@yahoo.com', address: '5th Cross, Koramangala 4th Block, Bangalore 560034', birthdate: '1998-11-07', customer_since: '2026-01-10', account_tier: 'Bronze', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-004', rider_name: 'Sneha Patel', zone: 'MZ-DEL-09 (Karol Bagh)', plan: 'Heat Shield Pro', premium: '₹218/day', risk_score: 91, start_date: '2026-01-28', phone: '+91 65432 10987', email: 'sneha.patel@gmail.com', address: '12 Pusa Road, Karol Bagh, New Delhi 110005', birthdate: '1994-06-18', customer_since: '2025-10-05', account_tier: 'Gold', delinquency_status: 'YES' },
    { policy_number: 'POL-GW-2026-005', rider_name: 'Vikram Singh', zone: 'MZ-HYD-03 (HITEC City)', plan: 'Multi-Peril Cover', premium: '₹112/day', risk_score: 58, start_date: '2026-03-01', phone: '+91 54321 09876', email: 'vikram.singh@hotmail.com', address: '301 Cyber Towers, HITEC City, Hyderabad 500081', birthdate: '1997-01-30', customer_since: '2026-02-01', account_tier: 'Bronze', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-006', rider_name: 'Anita Desai', zone: 'MZ-CHN-05 (T. Nagar)', plan: 'Rain Guard Plus', premium: '₹168/day', risk_score: 76, start_date: '2026-03-10', phone: '+91 43210 98765', email: 'anita.desai@gmail.com', address: '78 Usman Road, T. Nagar, Chennai 600017', birthdate: '1993-09-14', customer_since: '2026-01-22', account_tier: 'Silver', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-007', rider_name: 'Karan Kapoor', zone: 'MZ-PUN-02 (Hinjewadi)', plan: 'Heat Shield Basic', premium: '₹95/day', risk_score: 44, start_date: '2026-02-14', phone: '+91 32109 87654', email: 'karan.kapoor@gmail.com', address: 'Blue Ridge Township, Hinjewadi Phase 1, Pune 411057', birthdate: '1996-12-03', customer_since: '2026-01-05', account_tier: 'Bronze', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-008', rider_name: 'Meera Joshi', zone: 'MZ-DEL-04 (Connaught Place)', plan: 'Heat Shield Pro', premium: '₹201/day', risk_score: 88, start_date: '2026-01-05', phone: '+91 21098 76543', email: 'meera.joshi@outlook.com', address: '15 Barakhamba Road, Connaught Place, New Delhi 110001', birthdate: '1991-04-22', customer_since: '2025-09-18', account_tier: 'Platinum', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-009', rider_name: 'Deepak Reddy', zone: 'MZ-HYD-08 (Gachibowli)', plan: 'Multi-Peril Cover', premium: '₹125/day', risk_score: 63, start_date: '2026-03-18', phone: '+91 10987 65432', email: 'deepak.reddy@yahoo.com', address: 'ISB Road, Gachibowli, Hyderabad 500032', birthdate: '1999-07-09', customer_since: '2026-02-28', account_tier: 'Bronze', delinquency_status: 'NO' },
    { policy_number: 'POL-GW-2026-010', rider_name: 'Lakshmi Iyer', zone: 'MZ-CHN-11 (Adyar)', plan: 'Rain Guard Plus', premium: '₹139/day', risk_score: 70, start_date: '2026-02-28', phone: '+91 09876 54321', email: 'lakshmi.iyer@gmail.com', address: '22 Gandhi Nagar, Adyar, Chennai 600020', birthdate: '1990-02-16', customer_since: '2026-01-15', account_tier: 'Silver', delinquency_status: 'YES' },
  ];

  for (let i = 0; i < policyData.length; i++) {
    await Policy.create({
      ...policyData[i],
      rider_id: i + 1,
      status: 'Active',
    });
  }

  // ── Seed Claims ──
  const claimData = [
    { claim_number: 'CLM-000212', policy_ref: 'POL-GW-2026-001', rider_id: 1, rider_name: 'Arjun Mehta', product: 'Heat Shield Pro', fraud_risk: 'NO', date_of_loss: '2026-03-24', status: 'Open', trigger_type: 'HEAT', amount: 350.0, zone: 'MZ-DEL-04', approved_at: null },
    { claim_number: 'CLM-000198', policy_ref: 'POL-GW-2026-001', rider_id: 1, rider_name: 'Arjun Mehta', product: 'Heat Shield Pro', fraud_risk: 'NO', date_of_loss: '2026-03-18', status: 'Closed', trigger_type: 'HEAT', amount: 350.0, zone: 'MZ-DEL-04', approved_at: '2026-03-18 14:22:16' },
    { claim_number: 'CLM-000210', policy_ref: 'POL-GW-2026-004', rider_id: 4, rider_name: 'Sneha Patel', product: 'Heat Shield Pro', fraud_risk: 'YES', date_of_loss: '2026-03-24', status: 'Open', trigger_type: 'HEAT', amount: 350.0, zone: 'MZ-DEL-09', approved_at: null },
    { claim_number: 'CLM-000209', policy_ref: 'POL-GW-2026-002', rider_id: 2, rider_name: 'Priya Sharma', product: 'Rain Guard Plus', fraud_risk: 'NO', date_of_loss: '2026-03-24', status: 'Open', trigger_type: 'RAIN', amount: 280.0, zone: 'MZ-MUM-12', approved_at: null },
    { claim_number: 'CLM-000211', policy_ref: 'POL-GW-2026-006', rider_id: 6, rider_name: 'Anita Desai', product: 'Rain Guard Plus', fraud_risk: 'NO', date_of_loss: '2026-03-24', status: 'Open', trigger_type: 'RAIN', amount: 280.0, zone: 'MZ-CHN-05', approved_at: null },
    { claim_number: 'CLM-000207', policy_ref: 'POL-GW-2026-010', rider_id: 10, rider_name: 'Lakshmi Iyer', product: 'Rain Guard Plus', fraud_risk: 'NO', date_of_loss: '2026-03-23', status: 'Open', trigger_type: 'RAIN', amount: 280.0, zone: 'MZ-CHN-11', approved_at: null },
    { claim_number: 'CLM-000213', policy_ref: 'POL-GW-2026-008', rider_id: 8, rider_name: 'Meera Joshi', product: 'Heat Shield Pro', fraud_risk: 'NO', date_of_loss: '2026-03-24', status: 'AUTO-APPROVED', trigger_type: 'HEAT', amount: 350.0, zone: 'MZ-DEL-04', approved_at: '2026-03-24 20:42:16' },
    { claim_number: 'CLM-000287', policy_ref: 'POL-GW-2026-005', rider_id: 5, rider_name: 'Vikram Singh', product: 'Multi-Peril Cover', fraud_risk: 'NO', date_of_loss: '2026-03-22', status: 'AUTO-APPROVED', trigger_type: 'HEAT', amount: 350.0, zone: 'MZ-HYD-03', approved_at: '2026-03-24 20:41:11' },
    { claim_number: 'CLM-000288', policy_ref: 'POL-GW-2026-007', rider_id: 7, rider_name: 'Karan Kapoor', product: 'Heat Shield Basic', fraud_risk: 'NO', date_of_loss: '2026-03-20', status: 'AUTO-APPROVED', trigger_type: 'RAIN', amount: 280.0, zone: 'MZ-PUN-02', approved_at: '2026-03-24 20:40:05' },
    { claim_number: 'CLM-000201', policy_ref: 'POL-GW-2026-003', rider_id: 3, rider_name: 'Rahul Verma', product: 'Heat Shield Basic', fraud_risk: 'NO', date_of_loss: '2026-03-20', status: 'Closed', trigger_type: 'HEAT', amount: 350.0, zone: 'MZ-BLR-07', approved_at: '2026-03-20 10:15:00' },
  ];

  for (const d of claimData) {
    await Claim.create(d);
  }

  // ── Seed Billing Transactions ──
  const txnData = [
    { txn_id: 'TXN-44021', type: 'PAYOUT', rider_name: 'Arjun Mehta', amount: -350.0, date: '2026-03-24', description: 'Parametric Claim CLM-9281 — Heat Trigger', policy_ref: 'POL-GW-2026-001' },
    { txn_id: 'TXN-44020', type: 'PREMIUM', rider_name: 'Deepak Reddy', amount: 125.0, date: '2026-03-24', description: 'Daily Premium — Multi-Peril Cover', policy_ref: 'POL-GW-2026-009' },
    { txn_id: 'TXN-44019', type: 'PAYOUT', rider_name: 'Priya Sharma', amount: -280.0, date: '2026-03-24', description: 'Parametric Claim CLM-9284 — Rain Trigger', policy_ref: 'POL-GW-2026-002' },
    { txn_id: 'TXN-44018', type: 'PREMIUM', rider_name: 'Vikram Singh', amount: 112.0, date: '2026-03-24', description: 'Daily Premium — Multi-Peril Cover', policy_ref: 'POL-GW-2026-005' },
    { txn_id: 'TXN-44017', type: 'PAYOUT', rider_name: 'Sneha Patel', amount: -350.0, date: '2026-03-24', description: 'Parametric Claim CLM-9282 — Heat Trigger', policy_ref: 'POL-GW-2026-004' },
    { txn_id: 'TXN-44016', type: 'PREMIUM', rider_name: 'Arjun Mehta', amount: 187.0, date: '2026-03-24', description: 'Daily Premium — Heat Shield Pro', policy_ref: 'POL-GW-2026-001' },
    { txn_id: 'TXN-44015', type: 'PAYOUT', rider_name: 'Anita Desai', amount: -280.0, date: '2026-03-24', description: 'Parametric Claim CLM-9285 — Rain Trigger', policy_ref: 'POL-GW-2026-006' },
    { txn_id: 'TXN-44014', type: 'PREMIUM', rider_name: 'Sneha Patel', amount: 218.0, date: '2026-03-24', description: 'Daily Premium — Heat Shield Pro', policy_ref: 'POL-GW-2026-004' },
    { txn_id: 'TXN-44013', type: 'PREMIUM', rider_name: 'Meera Joshi', amount: 201.0, date: '2026-03-23', description: 'Daily Premium — Heat Shield Pro', policy_ref: 'POL-GW-2026-008' },
    { txn_id: 'TXN-44012', type: 'PREMIUM', rider_name: 'Lakshmi Iyer', amount: 139.0, date: '2026-03-23', description: 'Daily Premium — Rain Guard Plus', policy_ref: 'POL-GW-2026-010' },
    { txn_id: 'TXN-44011', type: 'PREMIUM', rider_name: 'Karan Kapoor', amount: 95.0, date: '2026-03-23', description: 'Daily Premium — Heat Shield Basic', policy_ref: 'POL-GW-2026-007' },
    { txn_id: 'TXN-44010', type: 'PREMIUM', rider_name: 'Rahul Verma', amount: 129.0, date: '2026-03-23', description: 'Daily Premium — Heat Shield Basic', policy_ref: 'POL-GW-2026-003' },
  ];

  for (const d of txnData) {
    await BillingTransaction.create(d);
  }

  console.log('[Seeder] Data seeding completed successfully.');
}

module.exports = { seedData };
