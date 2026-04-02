-- ============================================================
-- RiskWire Demo Data — Run this ONCE in Render PostgreSQL shell
-- ============================================================
-- Connect via Render Dashboard → PostgreSQL → "PSQL Command"
-- Paste and run this entire script
-- ============================================================

-- Safety: clear existing data first (in case of partial runs)
TRUNCATE TABLE billing_transaction RESTART IDENTITY CASCADE;
TRUNCATE TABLE claim RESTART IDENTITY CASCADE;
TRUNCATE TABLE insurance_policy RESTART IDENTITY CASCADE;
TRUNCATE TABLE payout_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE rider RESTART IDENTITY CASCADE;

-- ─── RIDERS ──────────────────────────────────────────────────
INSERT INTO rider (name, phone, city, zone, platform, age, wallet_balance, is_policy_active, policy_tier) VALUES
('Arjun Mehta',   '+91 98765 43210', 'Delhi',     'MZ-DEL-04', 'Swiggy', 28, 500.0, true,  'PRO'),
('Priya Sharma',  '+91 87654 32109', 'Mumbai',    'MZ-MUM-12', 'Zomato', 31, 500.0, true,  'PRO'),
('Rahul Verma',   '+91 76543 21098', 'Bangalore', 'MZ-BLR-07', 'Swiggy', 25, 500.0, true,  'PRO'),
('Sneha Patel',   '+91 65432 10987', 'Delhi',     'MZ-DEL-09', 'Zepto',  29, 500.0, true,  'PRO'),
('Vikram Singh',  '+91 54321 09876', 'Hyderabad', 'MZ-HYD-03', 'Swiggy', 26, 500.0, true,  'PRO'),
('Anita Desai',   '+91 43210 98765', 'Chennai',   'MZ-CHN-05', 'Zomato', 30, 500.0, true,  'PRO'),
('Karan Kapoor',  '+91 32109 87654', 'Pune',      'MZ-PUN-02', 'Swiggy', 27, 500.0, true,  'PRO'),
('Meera Joshi',   '+91 21098 76543', 'Delhi',     'MZ-DEL-04', 'Dunzo',  32, 500.0, true,  'PRO'),
('Deepak Reddy',  '+91 10987 65432', 'Hyderabad', 'MZ-HYD-08', 'Swiggy', 24, 500.0, true,  'PRO'),
('Lakshmi Iyer',  '+91 09876 54321', 'Chennai',   'MZ-CHN-11', 'Zomato', 33, 500.0, true,  'PRO');

-- ─── POLICIES ────────────────────────────────────────────────
INSERT INTO insurance_policy (policy_number, rider_id, rider_name, zone, plan, premium, risk_score, start_date, phone, email, address, birthdate, customer_since, account_tier, delinquency_status, status) VALUES
('POL-GW-2026-001', 1,  'Arjun Mehta',  'MZ-DEL-04 (Connaught Place)',  'Heat Shield Pro',   '₹187/day', 82, '2026-01-15', '+91 98765 43210', 'arjun.mehta@gmail.com',    '42 Janpath Road, Connaught Place, New Delhi 110001',              '1995-08-12', '2025-11-20', 'Gold',     'NO',  'Active'),
('POL-GW-2026-002', 2,  'Priya Sharma', 'MZ-MUM-12 (Andheri West)',     'Rain Guard Plus',   '₹143/day', 71, '2026-02-03', '+91 87654 32109', 'priya.sharma@outlook.com', '18/B Versova Link Road, Andheri West, Mumbai 400053',             '1992-03-25', '2025-12-15', 'Silver',   'NO',  'Active'),
('POL-GW-2026-003', 3,  'Rahul Verma',  'MZ-BLR-07 (Koramangala)',      'Heat Shield Basic', '₹129/day', 65, '2026-02-20', '+91 76543 21098', 'rahul.verma@yahoo.com',    '5th Cross, Koramangala 4th Block, Bangalore 560034',              '1998-11-07', '2026-01-10', 'Bronze',   'NO',  'Active'),
('POL-GW-2026-004', 4,  'Sneha Patel',  'MZ-DEL-09 (Karol Bagh)',       'Heat Shield Pro',   '₹218/day', 91, '2026-01-28', '+91 65432 10987', 'sneha.patel@gmail.com',    '12 Pusa Road, Karol Bagh, New Delhi 110005',                      '1994-06-18', '2025-10-05', 'Gold',     'YES', 'Active'),
('POL-GW-2026-005', 5,  'Vikram Singh', 'MZ-HYD-03 (HITEC City)',       'Multi-Peril Cover', '₹112/day', 58, '2026-03-01', '+91 54321 09876', 'vikram.singh@hotmail.com', '301 Cyber Towers, HITEC City, Hyderabad 500081',                  '1997-01-30', '2026-02-01', 'Bronze',   'NO',  'Active'),
('POL-GW-2026-006', 6,  'Anita Desai',  'MZ-CHN-05 (T. Nagar)',         'Rain Guard Plus',   '₹168/day', 76, '2026-03-10', '+91 43210 98765', 'anita.desai@gmail.com',    '78 Usman Road, T. Nagar, Chennai 600017',                         '1993-09-14', '2026-01-22', 'Silver',   'NO',  'Active'),
('POL-GW-2026-007', 7,  'Karan Kapoor', 'MZ-PUN-02 (Hinjewadi)',        'Heat Shield Basic', '₹95/day',  44, '2026-02-14', '+91 32109 87654', 'karan.kapoor@gmail.com',   'Blue Ridge Township, Hinjewadi Phase 1, Pune 411057',             '1996-12-03', '2026-01-05', 'Bronze',   'NO',  'Active'),
('POL-GW-2026-008', 8,  'Meera Joshi',  'MZ-DEL-04 (Connaught Place)',  'Heat Shield Pro',   '₹201/day', 88, '2026-01-05', '+91 21098 76543', 'meera.joshi@outlook.com',  '15 Barakhamba Road, Connaught Place, New Delhi 110001',           '1991-04-22', '2025-09-18', 'Platinum', 'NO',  'Active'),
('POL-GW-2026-009', 9,  'Deepak Reddy', 'MZ-HYD-08 (Gachibowli)',       'Multi-Peril Cover', '₹125/day', 63, '2026-03-18', '+91 10987 65432', 'deepak.reddy@yahoo.com',   'ISB Road, Gachibowli, Hyderabad 500032',                          '1999-07-09', '2026-02-28', 'Bronze',   'NO',  'Active'),
('POL-GW-2026-010', 10, 'Lakshmi Iyer', 'MZ-CHN-11 (Adyar)',            'Rain Guard Plus',   '₹139/day', 70, '2026-02-28', '+91 09876 54321', 'lakshmi.iyer@gmail.com',   '22 Gandhi Nagar, Adyar, Chennai 600020',                          '1990-02-16', '2026-01-15', 'Silver',   'YES', 'Active');


-- ─── CLAIMS ──────────────────────────────────────────────────
INSERT INTO claim (claim_number, policy_ref, rider_id, rider_name, product, fraud_risk, date_of_loss, status, trigger_type, amount, zone, approved_at) VALUES
('CLM-000212', 'POL-GW-2026-001', 1,  'Arjun Mehta',  'Heat Shield Pro',   'NO',  '2026-03-24', 'Open',          'HEAT', 350.0, 'MZ-DEL-04', NULL),
('CLM-000198', 'POL-GW-2026-001', 1,  'Arjun Mehta',  'Heat Shield Pro',   'NO',  '2026-03-18', 'Closed',        'HEAT', 350.0, 'MZ-DEL-04', '2026-03-18 14:22:16'),
('CLM-000210', 'POL-GW-2026-004', 4,  'Sneha Patel',  'Heat Shield Pro',   'YES', '2026-03-24', 'Open',          'HEAT', 350.0, 'MZ-DEL-09', NULL),
('CLM-000209', 'POL-GW-2026-002', 2,  'Priya Sharma', 'Rain Guard Plus',   'NO',  '2026-03-24', 'Open',          'RAIN', 280.0, 'MZ-MUM-12', NULL),
('CLM-000211', 'POL-GW-2026-006', 6,  'Anita Desai',  'Rain Guard Plus',   'NO',  '2026-03-24', 'Open',          'RAIN', 280.0, 'MZ-CHN-05', NULL),
('CLM-000207', 'POL-GW-2026-010', 10, 'Lakshmi Iyer', 'Rain Guard Plus',   'NO',  '2026-03-23', 'Open',          'RAIN', 280.0, 'MZ-CHN-11', NULL),
('CLM-000213', 'POL-GW-2026-008', 8,  'Meera Joshi',  'Heat Shield Pro',   'NO',  '2026-03-24', 'AUTO-APPROVED', 'HEAT', 350.0, 'MZ-DEL-04', '2026-03-24 20:42:16'),
('CLM-000287', 'POL-GW-2026-005', 5,  'Vikram Singh', 'Multi-Peril Cover', 'NO',  '2026-03-22', 'AUTO-APPROVED', 'HEAT', 350.0, 'MZ-HYD-03', '2026-03-24 20:41:11'),
('CLM-000288', 'POL-GW-2026-007', 7,  'Karan Kapoor', 'Heat Shield Basic', 'NO',  '2026-03-20', 'AUTO-APPROVED', 'RAIN', 280.0, 'MZ-PUN-02', '2026-03-24 20:40:05'),
('CLM-000201', 'POL-GW-2026-003', 3,  'Rahul Verma',  'Heat Shield Basic', 'NO',  '2026-03-20', 'Closed',        'HEAT', 350.0, 'MZ-BLR-07', '2026-03-20 10:15:00');

-- ─── BILLING TRANSACTIONS ─────────────────────────────────────
INSERT INTO billing_transaction (txn_id, type, rider_name, amount, date, description, policy_ref) VALUES
('TXN-44021', 'PAYOUT',  'Arjun Mehta',  -350.0, '2026-03-24', 'Parametric Claim CLM-9281 — Heat Trigger',  'POL-GW-2026-001'),
('TXN-44020', 'PREMIUM', 'Deepak Reddy',  125.0, '2026-03-24', 'Daily Premium — Multi-Peril Cover',          'POL-GW-2026-009'),
('TXN-44019', 'PAYOUT',  'Priya Sharma', -280.0, '2026-03-24', 'Parametric Claim CLM-9284 — Rain Trigger',  'POL-GW-2026-002'),
('TXN-44018', 'PREMIUM', 'Vikram Singh',  112.0, '2026-03-24', 'Daily Premium — Multi-Peril Cover',          'POL-GW-2026-005'),
('TXN-44017', 'PAYOUT',  'Sneha Patel',  -350.0, '2026-03-24', 'Parametric Claim CLM-9282 — Heat Trigger',  'POL-GW-2026-004'),
('TXN-44016', 'PREMIUM', 'Arjun Mehta',   187.0, '2026-03-24', 'Daily Premium — Heat Shield Pro',            'POL-GW-2026-001'),
('TXN-44015', 'PAYOUT',  'Anita Desai',  -280.0, '2026-03-24', 'Parametric Claim CLM-9285 — Rain Trigger',  'POL-GW-2026-006'),
('TXN-44014', 'PREMIUM', 'Sneha Patel',   218.0, '2026-03-24', 'Daily Premium — Heat Shield Pro',            'POL-GW-2026-004'),
('TXN-44013', 'PREMIUM', 'Meera Joshi',   201.0, '2026-03-23', 'Daily Premium — Heat Shield Pro',            'POL-GW-2026-008'),
('TXN-44012', 'PREMIUM', 'Lakshmi Iyer',  139.0, '2026-03-23', 'Daily Premium — Rain Guard Plus',            'POL-GW-2026-010'),
('TXN-44011', 'PREMIUM', 'Karan Kapoor',   95.0, '2026-03-23', 'Daily Premium — Heat Shield Basic',          'POL-GW-2026-007'),
('TXN-44010', 'PREMIUM', 'Rahul Verma',   129.0, '2026-03-23', 'Daily Premium — Heat Shield Basic',          'POL-GW-2026-003');

-- ─── VERIFY ──────────────────────────────────────────────────
SELECT 'riders' AS table_name, COUNT(*) FROM rider
UNION ALL SELECT 'policies', COUNT(*) FROM insurance_policy
UNION ALL SELECT 'claims',   COUNT(*) FROM claim
UNION ALL SELECT 'billing',  COUNT(*) FROM billing_transaction;
