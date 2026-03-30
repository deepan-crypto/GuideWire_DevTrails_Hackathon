import os
import requests
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import GradientBoostingRegressor
app=FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
OWM_KEY=os.getenv("OWM_API_KEY","YOUR_OPENWEATHER_KEY")
def train_and_save_model():
 X=np.array([[30,0,50,10,0.5],[45,0,20,10,0.1],[30,60,90,20,0.9],[25,20,80,70,0.6],[40,0,10,15,0.05],[42,0,40,12,0.2],[35,50,85,25,0.8]])
 y=np.array([30.0,60.0,70.0,80.0,65.0,75.0,60.0])
 model=GradientBoostingRegressor(n_estimators=100,learning_rate=0.1,max_depth=3).fit(X,y)
 joblib.dump(model,"omnidex_advanced_risk_model.pkl")
if not os.path.exists("omnidex_advanced_risk_model.pkl"):
 train_and_save_model()
risk_model=joblib.load("omnidex_advanced_risk_model.pkl")
@app.get("/api/v1/pricing/forecast-quote")
def get_forecast_quote(zone:str):
 url=f"http://api.openweathermap.org/data/2.5/forecast?q={zone}&appid={OWM_KEY}&units=metric"
 res=requests.get(url)
 max_t,max_r,max_h,max_w=30.0,0.0,50.0,10.0
 if res.status_code==200:
  data=res.json()
  for item in data.get('list',[]):
   t=item.get('main',{}).get('temp',30.0)
   r=item.get('rain',{}).get('3h',0.0)
   h=item.get('main',{}).get('humidity',50.0)
   w=item.get('wind',{}).get('speed',2.7)*3.6
   if t>max_t:max_t=t
   if r>max_r:max_r=r
   if h>max_h:max_h=h
   if w>max_w:max_w=w
 soil_m=0.8 if max_r>10 else(0.1 if max_t>40 else 0.4)
 raw_ml_score=risk_model.predict(np.array([[max_t,max_r,max_h,max_w,soil_m]]))[0]
 risk_multiplier=raw_ml_score/50.0
 if risk_multiplier<0.5:risk_multiplier=0.5
 if risk_multiplier>2.5:risk_multiplier=2.5
 return {"zone":zone,"risk_multiplier":round(risk_multiplier,2),"plans":{"basic":{"premium":round(25*risk_multiplier,2),"daily_payout":300},"standard":{"premium":round(50*risk_multiplier,2),"daily_payout":500},"pro":{"premium":round(100*risk_multiplier,2),"daily_payout":1000}}}
@app.get("/api/v1/pricing/quote")
def get_live_quote(zone:str):
 url=f"http://api.openweathermap.org/data/2.5/weather?q={zone}&appid={OWM_KEY}&units=metric"
 res=requests.get(url)
 t,r,h,w=30.0,0.0,50.0,10.0
 if res.status_code==200:
  data=res.json()
  t=data.get('main',{}).get('temp',30.0)
  r=data.get('rain',{}).get('1h',0.0)
  h=data.get('main',{}).get('humidity',50.0)
  w=data.get('wind',{}).get('speed',2.7)*3.6
 soil_m=0.8 if r>10 else (0.1 if t>40 else 0.4)
 trigger_payout=bool(t>=42.0 or r>=50.0 or h>=90.0 or w>=80.0 or soil_m<=0.1)
 return {"zone":zone,"live_temp":t,"live_rain":r,"payout_triggered":trigger_payout}