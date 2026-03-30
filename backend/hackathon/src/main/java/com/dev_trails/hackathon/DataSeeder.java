package com.dev_trails.hackathon;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
@Component
public class DataSeeder implements CommandLineRunner {
private final PolicyRepository policyRepo;
private final ClaimRepository claimRepo;
private final BillingTransactionRepository billingRepo;
private final RiderRepository riderRepo;
public DataSeeder(PolicyRepository policyRepo, ClaimRepository claimRepo, BillingTransactionRepository billingRepo, RiderRepository riderRepo) {
this.policyRepo = policyRepo;
this.claimRepo = claimRepo;
this.billingRepo = billingRepo;
this.riderRepo = riderRepo;
}
@Override
public void run(String... args) {
if (policyRepo.count() > 0) return;
seedRiders();
seedPolicies();
seedClaims();
seedTransactions();
}
private void seedRiders() {
String[][] data = {
{"Arjun Mehta","+91 98765 43210","Delhi","MZ-DEL-04","Swiggy","28"},
{"Priya Sharma","+91 87654 32109","Mumbai","MZ-MUM-12","Zomato","31"},
{"Rahul Verma","+91 76543 21098","Bangalore","MZ-BLR-07","Swiggy","25"},
{"Sneha Patel","+91 65432 10987","Delhi","MZ-DEL-09","Zepto","29"},
{"Vikram Singh","+91 54321 09876","Hyderabad","MZ-HYD-03","Swiggy","26"},
{"Anita Desai","+91 43210 98765","Chennai","MZ-CHN-05","Zomato","30"},
{"Karan Kapoor","+91 32109 87654","Pune","MZ-PUN-02","Swiggy","27"},
{"Meera Joshi","+91 21098 76543","Delhi","MZ-DEL-04","Dunzo","32"},
{"Deepak Reddy","+91 10987 65432","Hyderabad","MZ-HYD-08","Swiggy","24"},
{"Lakshmi Iyer","+91 09876 54321","Chennai","MZ-CHN-11","Zomato","33"},
};
for (String[] d : data) {
Rider r = new Rider();
r.name = d[0]; r.phone = d[1]; r.city = d[2]; r.zone = d[3]; r.platform = d[4]; r.age = Integer.parseInt(d[5]);
r.walletBalance = 500.0; r.isPolicyActive = true; r.policyTier = "PRO";
riderRepo.save(r);
}
}
private void seedPolicies() {
Object[][] data = {
{"POL-GW-2026-001","Arjun Mehta","MZ-DEL-04 (Connaught Place)","Heat Shield Pro","₹187/day",82,"2026-01-15","+91 98765 43210","arjun.mehta@gmail.com","42 Janpath Road, Connaught Place, New Delhi 110001","1995-08-12","2025-11-20","Gold","NO"},
{"POL-GW-2026-002","Priya Sharma","MZ-MUM-12 (Andheri West)","Rain Guard Plus","₹143/day",71,"2026-02-03","+91 87654 32109","priya.sharma@outlook.com","18/B Versova Link Road, Andheri West, Mumbai 400053","1992-03-25","2025-12-15","Silver","NO"},
{"POL-GW-2026-003","Rahul Verma","MZ-BLR-07 (Koramangala)","Heat Shield Basic","₹129/day",65,"2026-02-20","+91 76543 21098","rahul.verma@yahoo.com","5th Cross, Koramangala 4th Block, Bangalore 560034","1998-11-07","2026-01-10","Bronze","NO"},
{"POL-GW-2026-004","Sneha Patel","MZ-DEL-09 (Karol Bagh)","Heat Shield Pro","₹218/day",91,"2026-01-28","+91 65432 10987","sneha.patel@gmail.com","12 Pusa Road, Karol Bagh, New Delhi 110005","1994-06-18","2025-10-05","Gold","YES"},
{"POL-GW-2026-005","Vikram Singh","MZ-HYD-03 (HITEC City)","Multi-Peril Cover","₹112/day",58,"2026-03-01","+91 54321 09876","vikram.singh@hotmail.com","301 Cyber Towers, HITEC City, Hyderabad 500081","1997-01-30","2026-02-01","Bronze","NO"},
{"POL-GW-2026-006","Anita Desai","MZ-CHN-05 (T. Nagar)","Rain Guard Plus","₹168/day",76,"2026-03-10","+91 43210 98765","anita.desai@gmail.com","78 Usman Road, T. Nagar, Chennai 600017","1993-09-14","2026-01-22","Silver","NO"},
{"POL-GW-2026-007","Karan Kapoor","MZ-PUN-02 (Hinjewadi)","Heat Shield Basic","₹95/day",44,"2026-02-14","+91 32109 87654","karan.kapoor@gmail.com","Blue Ridge Township, Hinjewadi Phase 1, Pune 411057","1996-12-03","2026-01-05","Bronze","NO"},
{"POL-GW-2026-008","Meera Joshi","MZ-DEL-04 (Connaught Place)","Heat Shield Pro","₹201/day",88,"2026-01-05","+91 21098 76543","meera.joshi@outlook.com","15 Barakhamba Road, Connaught Place, New Delhi 110001","1991-04-22","2025-09-18","Platinum","NO"},
{"POL-GW-2026-009","Deepak Reddy","MZ-HYD-08 (Gachibowli)","Multi-Peril Cover","₹125/day",63,"2026-03-18","+91 10987 65432","deepak.reddy@yahoo.com","ISB Road, Gachibowli, Hyderabad 500032","1999-07-09","2026-02-28","Bronze","NO"},
{"POL-GW-2026-010","Lakshmi Iyer","MZ-CHN-11 (Adyar)","Rain Guard Plus","₹139/day",70,"2026-02-28","+91 09876 54321","lakshmi.iyer@gmail.com","22 Gandhi Nagar, Adyar, Chennai 600020","1990-02-16","2026-01-15","Silver","YES"},
};
for (int i = 0; i < data.length; i++) {
Object[] d = data[i];
Policy p = new Policy();
p.policyNumber = (String) d[0]; p.riderId = (long)(i+1); p.riderName = (String) d[1]; p.zone = (String) d[2]; p.plan = (String) d[3];
p.premium = (String) d[4]; p.riskScore = (Integer) d[5]; p.startDate = (String) d[6]; p.phone = (String) d[7]; p.email = (String) d[8];
p.address = (String) d[9]; p.birthdate = (String) d[10]; p.customerSince = (String) d[11]; p.accountTier = (String) d[12];
p.delinquencyStatus = (String) d[13]; p.status = "Active";
policyRepo.save(p);
}
}
private void seedClaims() {
Object[][] data = {
{"CLM-000212","POL-GW-2026-001",1L,"Arjun Mehta","Heat Shield Pro","NO","2026-03-24","Open","HEAT",350.0,"MZ-DEL-04",null},
{"CLM-000198","POL-GW-2026-001",1L,"Arjun Mehta","Heat Shield Pro","NO","2026-03-18","Closed","HEAT",350.0,"MZ-DEL-04","2026-03-18 14:22:16"},
{"CLM-000210","POL-GW-2026-004",4L,"Sneha Patel","Heat Shield Pro","YES","2026-03-24","Open","HEAT",350.0,"MZ-DEL-09",null},
{"CLM-000209","POL-GW-2026-002",2L,"Priya Sharma","Rain Guard Plus","NO","2026-03-24","Open","RAIN",280.0,"MZ-MUM-12",null},
{"CLM-000211","POL-GW-2026-006",6L,"Anita Desai","Rain Guard Plus","NO","2026-03-24","Open","RAIN",280.0,"MZ-CHN-05",null},
{"CLM-000207","POL-GW-2026-010",10L,"Lakshmi Iyer","Rain Guard Plus","NO","2026-03-23","Open","RAIN",280.0,"MZ-CHN-11",null},
{"CLM-000213","POL-GW-2026-008",8L,"Meera Joshi","Heat Shield Pro","NO","2026-03-24","AUTO-APPROVED","HEAT",350.0,"MZ-DEL-04","2026-03-24 20:42:16"},
{"CLM-000287","POL-GW-2026-005",5L,"Vikram Singh","Multi-Peril Cover","NO","2026-03-22","AUTO-APPROVED","HEAT",350.0,"MZ-HYD-03","2026-03-24 20:41:11"},
{"CLM-000288","POL-GW-2026-007",7L,"Karan Kapoor","Heat Shield Basic","NO","2026-03-20","AUTO-APPROVED","RAIN",280.0,"MZ-PUN-02","2026-03-24 20:40:05"},
{"CLM-000201","POL-GW-2026-003",3L,"Rahul Verma","Heat Shield Basic","NO","2026-03-20","Closed","HEAT",350.0,"MZ-BLR-07","2026-03-20 10:15:00"},
};
for (Object[] d : data) {
Claim c = new Claim();
c.claimNumber = (String) d[0]; c.policyRef = (String) d[1]; c.riderId = (Long) d[2]; c.riderName = (String) d[3];
c.product = (String) d[4]; c.fraudRisk = (String) d[5]; c.dateOfLoss = (String) d[6]; c.status = (String) d[7];
c.triggerType = (String) d[8]; c.amount = (Double) d[9]; c.zone = (String) d[10]; c.approvedAt = (String) d[11];
claimRepo.save(c);
}
}
private void seedTransactions() {
Object[][] data = {
{"TXN-44021","PAYOUT","Arjun Mehta",-350.0,"2026-03-24","Parametric Claim CLM-9281 — Heat Trigger","POL-GW-2026-001"},
{"TXN-44020","PREMIUM","Deepak Reddy",125.0,"2026-03-24","Daily Premium — Multi-Peril Cover","POL-GW-2026-009"},
{"TXN-44019","PAYOUT","Priya Sharma",-280.0,"2026-03-24","Parametric Claim CLM-9284 — Rain Trigger","POL-GW-2026-002"},
{"TXN-44018","PREMIUM","Vikram Singh",112.0,"2026-03-24","Daily Premium — Multi-Peril Cover","POL-GW-2026-005"},
{"TXN-44017","PAYOUT","Sneha Patel",-350.0,"2026-03-24","Parametric Claim CLM-9282 — Heat Trigger","POL-GW-2026-004"},
{"TXN-44016","PREMIUM","Arjun Mehta",187.0,"2026-03-24","Daily Premium — Heat Shield Pro","POL-GW-2026-001"},
{"TXN-44015","PAYOUT","Anita Desai",-280.0,"2026-03-24","Parametric Claim CLM-9285 — Rain Trigger","POL-GW-2026-006"},
{"TXN-44014","PREMIUM","Sneha Patel",218.0,"2026-03-24","Daily Premium — Heat Shield Pro","POL-GW-2026-004"},
{"TXN-44013","PREMIUM","Meera Joshi",201.0,"2026-03-23","Daily Premium — Heat Shield Pro","POL-GW-2026-008"},
{"TXN-44012","PREMIUM","Lakshmi Iyer",139.0,"2026-03-23","Daily Premium — Rain Guard Plus","POL-GW-2026-010"},
{"TXN-44011","PREMIUM","Karan Kapoor",95.0,"2026-03-23","Daily Premium — Heat Shield Basic","POL-GW-2026-007"},
{"TXN-44010","PREMIUM","Rahul Verma",129.0,"2026-03-23","Daily Premium — Heat Shield Basic","POL-GW-2026-003"},
};
for (Object[] d : data) {
BillingTransaction b = new BillingTransaction();
b.txnId = (String) d[0]; b.type = (String) d[1]; b.riderName = (String) d[2]; b.amount = (Double) d[3];
b.date = (String) d[4]; b.description = (String) d[5]; b.policyRef = (String) d[6];
billingRepo.save(b);
}
}
}
