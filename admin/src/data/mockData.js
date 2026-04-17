// Simulated mock data for the Insurance Admin Dashboard

export const policies = [
  { id: 'POL-GW-2026-001', riderName: 'Arjun Mehta', zone: 'MZ-DEL-04 (Connaught Place)', riskScore: 82, premium: '₹187/day', status: 'Active', plan: 'Heat Shield Pro', startDate: '2026-01-15', phone: '+91 98765 43210', email: 'arjun.mehta@gmail.com', address: '42 Janpath Road, Connaught Place, New Delhi 110001', birthdate: '1995-08-12', customerSince: '2025-11-20', accountTier: 'Gold', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-002', riderName: 'Priya Sharma', zone: 'MZ-MUM-12 (Andheri West)', riskScore: 71, premium: '₹143/day', status: 'Active', plan: 'Rain Guard Plus', startDate: '2026-02-03', phone: '+91 87654 32109', email: 'priya.sharma@outlook.com', address: '18/B Versova Link Road, Andheri West, Mumbai 400053', birthdate: '1992-03-25', customerSince: '2025-12-15', accountTier: 'Silver', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-003', riderName: 'Rahul Verma', zone: 'MZ-BLR-07 (Koramangala)', riskScore: 65, premium: '₹129/day', status: 'Active', plan: 'Heat Shield Basic', startDate: '2026-02-20', phone: '+91 76543 21098', email: 'rahul.verma@yahoo.com', address: '5th Cross, Koramangala 4th Block, Bangalore 560034', birthdate: '1998-11-07', customerSince: '2026-01-10', accountTier: 'Bronze', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-004', riderName: 'Sneha Patel', zone: 'MZ-DEL-09 (Karol Bagh)', riskScore: 91, premium: '₹218/day', status: 'Active', plan: 'Heat Shield Pro', startDate: '2026-01-28', phone: '+91 65432 10987', email: 'sneha.patel@gmail.com', address: '12 Pusa Road, Karol Bagh, New Delhi 110005', birthdate: '1994-06-18', customerSince: '2025-10-05', accountTier: 'Gold', delinquencyStatus: 'YES' },
  { id: 'POL-GW-2026-005', riderName: 'Vikram Singh', zone: 'MZ-HYD-03 (HITEC City)', riskScore: 58, premium: '₹112/day', status: 'Active', plan: 'Multi-Peril Cover', startDate: '2026-03-01', phone: '+91 54321 09876', email: 'vikram.singh@hotmail.com', address: '301 Cyber Towers, HITEC City, Hyderabad 500081', birthdate: '1997-01-30', customerSince: '2026-02-01', accountTier: 'Bronze', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-006', riderName: 'Anita Desai', zone: 'MZ-CHN-05 (T. Nagar)', riskScore: 76, premium: '₹168/day', status: 'Active', plan: 'Rain Guard Plus', startDate: '2026-03-10', phone: '+91 43210 98765', email: 'anita.desai@gmail.com', address: '78 Usman Road, T. Nagar, Chennai 600017', birthdate: '1993-09-14', customerSince: '2026-01-22', accountTier: 'Silver', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-007', riderName: 'Karan Kapoor', zone: 'MZ-PUN-02 (Hinjewadi)', riskScore: 44, premium: '₹95/day', status: 'Active', plan: 'Heat Shield Basic', startDate: '2026-02-14', phone: '+91 32109 87654', email: 'karan.kapoor@gmail.com', address: 'Blue Ridge Township, Hinjewadi Phase 1, Pune 411057', birthdate: '1996-12-03', customerSince: '2026-01-05', accountTier: 'Bronze', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-008', riderName: 'Meera Joshi', zone: 'MZ-DEL-04 (Connaught Place)', riskScore: 88, premium: '₹201/day', status: 'Active', plan: 'Heat Shield Pro', startDate: '2026-01-05', phone: '+91 21098 76543', email: 'meera.joshi@outlook.com', address: '15 Barakhamba Road, Connaught Place, New Delhi 110001', birthdate: '1991-04-22', customerSince: '2025-09-18', accountTier: 'Platinum', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-009', riderName: 'Deepak Reddy', zone: 'MZ-HYD-08 (Gachibowli)', riskScore: 63, premium: '₹125/day', status: 'Active', plan: 'Multi-Peril Cover', startDate: '2026-03-18', phone: '+91 10987 65432', email: 'deepak.reddy@yahoo.com', address: 'ISB Road, Gachibowli, Hyderabad 500032', birthdate: '1999-07-09', customerSince: '2026-02-28', accountTier: 'Bronze', delinquencyStatus: 'NO' },
  { id: 'POL-GW-2026-010', riderName: 'Lakshmi Iyer', zone: 'MZ-CHN-11 (Adyar)', riskScore: 70, premium: '₹139/day', status: 'Active', plan: 'Rain Guard Plus', startDate: '2026-02-28', phone: '+91 09876 54321', email: 'lakshmi.iyer@gmail.com', address: '22 Gandhi Nagar, Adyar, Chennai 600020', birthdate: '1990-02-16', customerSince: '2026-01-15', accountTier: 'Silver', delinquencyStatus: 'YES' },
]

// Per-rider claims data keyed by policy ID
export const riderClaims = {
  'POL-GW-2026-001': [
    { claimId: 'CLM-000212', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-001', fraudRisk: 'NO', dateOfLoss: '2026-03-24', status: 'Open' },
    { claimId: 'CLM-000198', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-001', fraudRisk: 'NO', dateOfLoss: '2026-03-18', status: 'Closed' },
    { claimId: 'CLM-000154', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-001', fraudRisk: 'NO', dateOfLoss: '2026-02-22', status: 'Closed' },
  ],
  'POL-GW-2026-002': [
    { claimId: 'CLM-000209', product: 'Rain Guard Plus', policyRef: 'POL-GW-2026-002', fraudRisk: 'NO', dateOfLoss: '2026-03-24', status: 'Open' },
    { claimId: 'CLM-000187', product: 'Rain Guard Plus', policyRef: 'POL-GW-2026-002', fraudRisk: 'NO', dateOfLoss: '2026-03-12', status: 'Closed' },
  ],
  'POL-GW-2026-003': [
    { claimId: 'CLM-000201', product: 'Heat Shield Basic', policyRef: 'POL-GW-2026-003', fraudRisk: 'NO', dateOfLoss: '2026-03-20', status: 'Open' },
  ],
  'POL-GW-2026-004': [
    { claimId: 'CLM-000210', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-004', fraudRisk: 'YES', dateOfLoss: '2026-03-24', status: 'Open' },
    { claimId: 'CLM-000195', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-004', fraudRisk: 'NO', dateOfLoss: '2026-03-15', status: 'Open' },
    { claimId: 'CLM-000171', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-004', fraudRisk: 'NO', dateOfLoss: '2026-03-01', status: 'Closed' },
    { claimId: 'CLM-000142', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-004', fraudRisk: 'N/A', dateOfLoss: '2026-02-12', status: 'Closed' },
  ],
  'POL-GW-2026-005': [
    { claimId: 'CLM-000205', product: 'Multi-Peril Cover', policyRef: 'POL-GW-2026-005', fraudRisk: 'NO', dateOfLoss: '2026-03-22', status: 'Open' },
  ],
  'POL-GW-2026-006': [
    { claimId: 'CLM-000211', product: 'Rain Guard Plus', policyRef: 'POL-GW-2026-006', fraudRisk: 'NO', dateOfLoss: '2026-03-24', status: 'Open' },
    { claimId: 'CLM-000190', product: 'Rain Guard Plus', policyRef: 'POL-GW-2026-006', fraudRisk: 'NO', dateOfLoss: '2026-03-14', status: 'Closed' },
  ],
  'POL-GW-2026-007': [
    { claimId: 'CLM-000188', product: 'Heat Shield Basic', policyRef: 'POL-GW-2026-007', fraudRisk: 'NO', dateOfLoss: '2026-03-13', status: 'Closed' },
  ],
  'POL-GW-2026-008': [
    { claimId: 'CLM-000213', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-008', fraudRisk: 'NO', dateOfLoss: '2026-03-24', status: 'Open' },
    { claimId: 'CLM-000180', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-008', fraudRisk: 'NO', dateOfLoss: '2026-03-08', status: 'Closed' },
    { claimId: 'CLM-000160', product: 'Heat Shield Pro', policyRef: 'POL-GW-2026-008', fraudRisk: 'N/A', dateOfLoss: '2026-02-18', status: 'Closed' },
  ],
  'POL-GW-2026-009': [],
  'POL-GW-2026-010': [
    { claimId: 'CLM-000207', product: 'Rain Guard Plus', policyRef: 'POL-GW-2026-010', fraudRisk: 'NO', dateOfLoss: '2026-03-23', status: 'Open' },
    { claimId: 'CLM-000185', product: 'Rain Guard Plus', policyRef: 'POL-GW-2026-010', fraudRisk: 'NO', dateOfLoss: '2026-03-10', status: 'Closed' },
  ],
}

// Per-rider billing data keyed by policy ID
export const riderBilling = {
  'POL-GW-2026-001': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹187.00', totalDue: '₹187.00', method: 'Direct Debit', autoPay: 'YES', period: '6 Months', npAmount: '₹33,660' },
  'POL-GW-2026-002': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹143.00', totalDue: '₹143.00', method: 'Direct Debit', autoPay: 'YES', period: '6 Months', npAmount: '₹25,740' },
  'POL-GW-2026-003': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹129.00', totalDue: '₹129.00', method: 'UPI', autoPay: 'NO', period: '3 Months', npAmount: '₹11,610' },
  'POL-GW-2026-004': { paymentStatus: 'Delinquent', nextPayment: 'Mar 28, 2026', pastDue: '₹436.00', currentPayment: '₹218.00', totalDue: '₹654.00', method: 'Direct Debit', autoPay: 'YES', period: '6 Months', npAmount: '₹39,240' },
  'POL-GW-2026-005': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹112.00', totalDue: '₹112.00', method: 'UPI', autoPay: 'NO', period: '1 Month', npAmount: '₹3,360' },
  'POL-GW-2026-006': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹168.00', totalDue: '₹168.00', method: 'Direct Debit', autoPay: 'YES', period: '6 Months', npAmount: '₹30,240' },
  'POL-GW-2026-007': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹95.00', totalDue: '₹95.00', method: 'UPI', autoPay: 'NO', period: '3 Months', npAmount: '₹8,550' },
  'POL-GW-2026-008': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹201.00', totalDue: '₹201.00', method: 'Direct Debit', autoPay: 'YES', period: '1 Year', npAmount: '₹73,365' },
  'POL-GW-2026-009': { paymentStatus: 'In Good Standing', nextPayment: 'Apr 01, 2026', pastDue: '₹0.00', currentPayment: '₹125.00', totalDue: '₹125.00', method: 'UPI', autoPay: 'NO', period: '1 Month', npAmount: '₹3,750' },
  'POL-GW-2026-010': { paymentStatus: 'Delinquent', nextPayment: 'Mar 26, 2026', pastDue: '₹278.00', currentPayment: '₹139.00', totalDue: '₹417.00', method: 'Direct Debit', autoPay: 'YES', period: '6 Months', npAmount: '₹25,020' },
}

// Per-rider activity log keyed by policy ID
export const riderActivities = {
  'POL-GW-2026-001': {
    upcoming: [
      { type: 'task', title: 'Follow up on Claim CLM-000212', assignee: 'Claims Manager', date: 'Today', color: 'red' },
      { type: 'task', title: 'Review AI premium adjustment', assignee: 'Underwriting', date: 'Tomorrow', color: 'orange' },
    ],
    past: [
      { type: 'meeting', title: 'Risk Assessment Review', user: 'Arjun Mehta', date: '22-Mar', description: 'had an assessment' },
      { type: 'email', title: 'Policy Renewal Notice', user: 'System', date: '18-Mar', description: 'sent auto notification' },
      { type: 'call', title: 'Onboarding Call', user: 'Arjun Mehta', date: '20-Nov', description: 'completed onboarding' },
    ]
  },
  'POL-GW-2026-004': {
    upcoming: [
      { type: 'task', title: 'Fraud Review on CLM-000210', assignee: 'Claims Manager', date: 'Today', color: 'red' },
      { type: 'task', title: 'Delinquency Follow-up', assignee: 'Billing Dept', date: 'Today', color: 'red' },
      { type: 'task', title: 'Account Status Review', assignee: 'Underwriting', date: 'Mar 28', color: 'orange' },
    ],
    past: [
      { type: 'call', title: 'Payment Reminder', user: 'Sneha Patel', date: '20-Mar', description: 'left voicemail' },
      { type: 'email', title: 'Delinquency Warning', user: 'System', date: '15-Mar', description: 'sent auto notification' },
      { type: 'meeting', title: 'Claim Discussion', user: 'Sneha Patel', date: '01-Mar', description: 'discussed claim history' },
    ]
  },
}

// Default activities for riders without specific entries
export const defaultActivities = {
  upcoming: [
    { type: 'task', title: 'Quarterly Policy Review', assignee: 'Underwriting', date: 'Apr 01', color: 'blue' },
  ],
  past: [
    { type: 'email', title: 'Welcome & Onboarding', user: 'System', date: 'On Join', description: 'sent welcome packet' },
  ]
}

export const triggerZones = [
  { id: 'MZ-DEL-04', name: 'Connaught Place, Delhi', temp: 47.2, rain: 0, heatThreshold: 45, rainThreshold: 80, triggered: true, triggerType: 'HEAT', riders: 12, pendingClaims: 8 },
  { id: 'MZ-DEL-09', name: 'Karol Bagh, Delhi', temp: 46.1, rain: 0, heatThreshold: 45, rainThreshold: 80, triggered: true, triggerType: 'HEAT', riders: 9, pendingClaims: 6 },
  { id: 'MZ-MUM-12', name: 'Andheri West, Mumbai', temp: 34.5, rain: 112, heatThreshold: 42, rainThreshold: 80, triggered: true, triggerType: 'RAIN', riders: 15, pendingClaims: 11 },
  { id: 'MZ-BLR-07', name: 'Koramangala, Bangalore', temp: 31.2, rain: 22, heatThreshold: 40, rainThreshold: 80, triggered: false, triggerType: null, riders: 8, pendingClaims: 0 },
  { id: 'MZ-HYD-03', name: 'HITEC City, Hyderabad', temp: 38.9, rain: 5, heatThreshold: 43, rainThreshold: 80, triggered: false, triggerType: null, riders: 6, pendingClaims: 0 },
  { id: 'MZ-CHN-05', name: 'T. Nagar, Chennai', temp: 36.7, rain: 95, heatThreshold: 42, rainThreshold: 80, triggered: true, triggerType: 'RAIN', riders: 10, pendingClaims: 7 },
  { id: 'MZ-PUN-02', name: 'Hinjewadi, Pune', temp: 29.4, rain: 8, heatThreshold: 41, rainThreshold: 80, triggered: false, triggerType: null, riders: 5, pendingClaims: 0 },
  { id: 'MZ-HYD-08', name: 'Gachibowli, Hyderabad', temp: 39.5, rain: 3, heatThreshold: 43, rainThreshold: 80, triggered: false, triggerType: null, riders: 4, pendingClaims: 0 },
  { id: 'MZ-CHN-11', name: 'Adyar, Chennai', temp: 35.9, rain: 88, heatThreshold: 42, rainThreshold: 80, triggered: true, triggerType: 'RAIN', riders: 7, pendingClaims: 5 },
]

export const autoApprovalLog = [
  { id: 'CLM-9281', timestamp: '2026-03-24 20:42:11', rider: 'Arjun Mehta', zone: 'MZ-DEL-04', trigger: 'HEAT (47.2°C > 45°C)', amount: '₹350', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:42:14' },
  { id: 'CLM-9282', timestamp: '2026-03-24 20:42:11', rider: 'Sneha Patel', zone: 'MZ-DEL-09', trigger: 'HEAT (46.1°C > 45°C)', amount: '₹350', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:42:15' },
  { id: 'CLM-9283', timestamp: '2026-03-24 20:42:12', rider: 'Meera Joshi', zone: 'MZ-DEL-04', trigger: 'HEAT (47.2°C > 45°C)', amount: '₹350', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:42:16' },
  { id: 'CLM-9284', timestamp: '2026-03-24 20:42:12', rider: 'Priya Sharma', zone: 'MZ-MUM-12', trigger: 'RAIN (112mm > 80mm)', amount: '₹280', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:42:17' },
  { id: 'CLM-9285', timestamp: '2026-03-24 20:42:13', rider: 'Anita Desai', zone: 'MZ-CHN-05', trigger: 'RAIN (95mm > 80mm)', amount: '₹280', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:42:18' },
  { id: 'CLM-9286', timestamp: '2026-03-24 20:42:13', rider: 'Lakshmi Iyer', zone: 'MZ-CHN-11', trigger: 'RAIN (88mm > 80mm)', amount: '₹280', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:42:19' },
  { id: 'CLM-9287', timestamp: '2026-03-24 20:41:08', rider: 'Vikram Singh', zone: 'MZ-HYD-03', trigger: 'HEAT (44.8°C > 43°C)', amount: '₹350', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:41:11' },
  { id: 'CLM-9288', timestamp: '2026-03-24 20:40:02', rider: 'Karan Kapoor', zone: 'MZ-PUN-02', trigger: 'RAIN (92mm > 80mm)', amount: '₹280', status: 'AUTO-APPROVED', paidAt: '2026-03-24 20:40:05' },
]

export const billingData = {
  summary: {
    totalPremiums: 1847520,
    totalPayouts: 423180,
    netRevenue: 1424340,
    lossRatio: 22.9,
    activePolicies: 1247,
    claimsPaid: 892,
    avgClaimSize: 474,
    autoApprovalRate: 97.3,
  },
  monthlyTrend: [
    { month: 'Oct', premiums: 142000, payouts: 28000 },
    { month: 'Nov', premiums: 158000, payouts: 31000 },
    { month: 'Dec', premiums: 175000, payouts: 22000 },
    { month: 'Jan', premiums: 198000, payouts: 58000 },
    { month: 'Feb', premiums: 224000, payouts: 72000 },
    { month: 'Mar', premiums: 267000, payouts: 118000 },
  ],
  recentTransactions: [
    { id: 'TXN-44021', type: 'PAYOUT', rider: 'Arjun Mehta', amount: -350, date: '2026-03-24', description: 'Parametric Claim CLM-9281 — Heat Trigger' },
    { id: 'TXN-44020', type: 'PREMIUM', rider: 'Deepak Reddy', amount: 125, date: '2026-03-24', description: 'Daily Premium — Multi-Peril Cover' },
    { id: 'TXN-44019', type: 'PAYOUT', rider: 'Priya Sharma', amount: -280, date: '2026-03-24', description: 'Parametric Claim CLM-9284 — Rain Trigger' },
    { id: 'TXN-44018', type: 'PREMIUM', rider: 'Vikram Singh', amount: 112, date: '2026-03-24', description: 'Daily Premium — Multi-Peril Cover' },
    { id: 'TXN-44017', type: 'PAYOUT', rider: 'Sneha Patel', amount: -350, date: '2026-03-24', description: 'Parametric Claim CLM-9282 — Heat Trigger' },
    { id: 'TXN-44016', type: 'PREMIUM', rider: 'Arjun Mehta', amount: 187, date: '2026-03-24', description: 'Daily Premium — Heat Shield Pro' },
    { id: 'TXN-44015', type: 'PAYOUT', rider: 'Anita Desai', amount: -280, date: '2026-03-24', description: 'Parametric Claim CLM-9285 — Rain Trigger' },
    { id: 'TXN-44014', type: 'PREMIUM', rider: 'Sneha Patel', amount: 218, date: '2026-03-24', description: 'Daily Premium — Heat Shield Pro' },
  ]
}


