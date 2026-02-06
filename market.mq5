//+------------------------------------------------------------------+
//|                    MarketStructure_Professional.mq5               |
//|                   Professional Labels & Clean Design              |
//|                                                   tadingz2026      |
//+------------------------------------------------------------------+
#property copyright "tadingz2026"
#property link      "https://www.mql5.com"
#property version   "3.21"
#property description "Professional Market Structure - Smart Compact Labels"
#property indicator_chart_window
#property indicator_buffers 2
#property indicator_plots   0  // No arrows displayed

//+------------------------------------------------------------------+
//| Input Parameters                                                  |
//+------------------------------------------------------------------+
input group "══════════ SIGNAL SETTINGS ══════════"
input int      InpSwingStrength = 5;          // Swing Detection (3-15)
input bool     InpShowStructure = true;       // Show Structure Labels
input int      InpMinScore = 4;               // Minimum Score (0-10)
input bool     InpUseEMA = true;              // Use EMA Filter
input int      InpEMAPeriod = 200;            // EMA Period

input group "══════════ ORDER BLOCKS ══════════"
input bool     InpShowOB = true;              // Show Order Blocks
input bool     InpShowOBLabels = true;        // Show OB Labels
input color    InpOBBullColor = C'30,80,150'; // Bull OB Color
input color    InpOBBearColor = C'150,50,30'; // Bear OB Color
input int      InpOBFontSize = 8;             // OB Label Font Size (REDUCED)
input color    InpOBTextColor = clrWhite;     // OB Text Color

input group "══════════ DEMAND/SUPPLY ZONES ══════════"
input bool     InpShowDemandSupply = true;    // Show Demand/Supply Zones
input int      InpZoneStrength = 3;           // Zone Touch Strength
input bool     InpDetectBreakouts = true;     // Detect Zone Breakouts
input double   InpBreakoutBuffer = 0.0001;    // Breakout Buffer (pips)
input color    InpDemandColor = C'30,100,50'; // Demand Zone Color
input color    InpSupplyColor = C'100,30,50'; // Supply Zone Color
input color    InpBreakoutColor = clrYellow;  // Breakout Color
input int      InpZoneFontSize = 7;           // Zone Label Font Size (REDUCED)

input group "══════════ MARKET SWEEPS ══════════"
input bool     InpDetectSweeps = true;        // Detect Market Sweeps
input int      InpSweepLookback = 20;         // Sweep Lookback Bars
input double   InpSweepBuffer = 0.0003;       // Sweep Buffer (pips)
input bool     InpShowSweepLabels = true;     // Show Sweep Labels
input color    InpSweepBullColor = C'0,255,150'; // Bullish Sweep Color
input color    InpSweepBearColor = C'255,100,100'; // Bearish Sweep Color
input int      InpSweepFontSize = 8;          // Sweep Label Font Size (REDUCED)
input int      InpSweepLineWidth = 2;         // Sweep Line Width

input group "══════════ RISK MANAGEMENT ══════════"
input double   InpRiskPercent = 1.0;          // Risk % Per Trade
input double   InpAccountBalance = 10000;     // Account Balance
input double   InpTP1_RR = 1.0;               // Take Profit 1 (R:R)
input double   InpTP2_RR = 2.0;               // Take Profit 2 (R:R)
input double   InpTP3_RR = 3.0;               // Take Profit 3 (R:R)
input bool     InpShow1to3Only = false;       // Show 1:3 R:R Only
input int      InpATRPeriod = 14;             // ATR Period
input int      InpMinRiskPips = 10;           // Minimum Risk in Pips
input int      InpMaxRiskPips = 100;          // Maximum Risk in Pips

input group "══════════ VISUAL DISPLAY ══════════"
input bool     InpShowDashboard = true;       // Show Dashboard
input bool     InpShowLevels = true;          // Show Trade Levels
input bool     InpShowRiskBox = true;         // Show Risk Info Box
input bool     InpShowRRLabels = true;        // Show R:R Labels
input int      InpMaxVisibleObjects = 50;     // Max Visible Objects
input color    InpGood1to3Color = C'0,255,100'; // 1:3 Signal Color

input group "══════════ ALERTS ══════════"
input bool     InpEnableAlerts = true;        // Enable Alerts
input bool     InpAlertOnBreakout = true;     // Alert on Breakouts
input bool     InpAlertOnSweep = true;        // Alert on Market Sweeps
input bool     InpAlert1to3Only = false;      // Alert Only 1:3 R:R
input bool     InpEnableSound = true;         // Sound Alert
input string   InpAlertSound = "alert.wav";   // Sound File

//+------------------------------------------------------------------+
//| Buffers - Hidden (no plots)                                      |
//+------------------------------------------------------------------+
double ScoreBuy[];
double ScoreSell[];

//+------------------------------------------------------------------+
//| Global Variables                                                  |
//+------------------------------------------------------------------+
int emaHandle = INVALID_HANDLE;
int atrHandle = INVALID_HANDLE;
double emaBuffer[], atrBuffer[];

datetime lastSignalTime = 0;
datetime lastUpdateTime = 0;
datetime lastBreakoutTime = 0;
datetime lastSweepTime = 0;

int totalSignals = 0;
int strongSignals = 0;
int signals1to3 = 0;
int totalBreakouts = 0;
int totalSweeps = 0;

// Cached symbol properties
double g_tickValue = 0;
double g_tickSize = 0;
double g_minLot = 0;
double g_maxLot = 0;
double g_lotStep = 0;
int g_digits = 0;

//+------------------------------------------------------------------+
//| Structures                                                        |
//+------------------------------------------------------------------+
struct SwingPoint {
   datetime time;
   double price;
   string type;
   
   void Reset() {
      time = 0;
      price = 0;
      type = "";
   }
};

SwingPoint lastHigh, lastLow;
SwingPoint prevHigh, prevLow;

struct Zone {
   datetime time;
   double high, low;
   bool isBull;
   int touches;
   bool broken;
   datetime breakTime;
   
   void Reset() {
      time = 0;
      high = 0;
      low = 0;
      isBull = false;
      touches = 0;
      broken = false;
      breakTime = 0;
   }
};

Zone zones[];
int zoneCount = 0;
const int MAX_ZONES = 20;

struct DemandSupplyZone {
   datetime startTime;
   datetime endTime;
   double high;
   double low;
   bool isDemand;
   int touches;
   bool isBroken;
   datetime breakTime;
   bool isValid;
   
   void Reset() {
      startTime = 0;
      endTime = 0;
      high = 0;
      low = 0;
      isDemand = false;
      touches = 0;
      isBroken = false;
      breakTime = 0;
      isValid = false;
   }
};

DemandSupplyZone dsZones[];
int dsZoneCount = 0;
const int MAX_DS_ZONES = 30;

struct MarketSweep {
   datetime time;
   double price;
   bool isBullish;
   double sweptPrice;
   string type;
   
   void Reset() {
      time = 0;
      price = 0;
      isBullish = false;
      sweptPrice = 0;
      type = "";
   }
};

MarketSweep lastSweep;

struct RiskInfo {
   double riskPips;
   double riskAmount;
   double lotSize;
   double tp1Pips;
   double tp2Pips;
   double tp3Pips;
   double tp1Amount;
   double tp2Amount;
   double tp3Amount;
   bool is1to3Valid;
};

//+------------------------------------------------------------------+
//| Initialization                                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   SetIndexBuffer(0, ScoreBuy, INDICATOR_CALCULATIONS);
   SetIndexBuffer(1, ScoreSell, INDICATOR_CALCULATIONS);
   
   ArraySetAsSeries(ScoreBuy, true);
   ArraySetAsSeries(ScoreSell, true);
   ArraySetAsSeries(emaBuffer, true);
   ArraySetAsSeries(atrBuffer, true);
   
   // Cache symbol properties
   g_tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   g_tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   g_minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   g_maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   g_lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   g_digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   
   if(InpUseEMA)
   {
      emaHandle = iMA(_Symbol, _Period, InpEMAPeriod, 0, MODE_EMA, PRICE_CLOSE);
      if(emaHandle == INVALID_HANDLE)
      {
         Print("❌ EMA creation failed");
         return INIT_FAILED;
      }
      ChartIndicatorAdd(0, 0, emaHandle);
   }
   
   atrHandle = iATR(_Symbol, _Period, InpATRPeriod);
   if(atrHandle == INVALID_HANDLE)
   {
      Print("❌ ATR creation failed");
      return INIT_FAILED;
   }
   
   ArrayResize(zones, MAX_ZONES);
   ArrayResize(dsZones, MAX_DS_ZONES);
   
   lastHigh.Reset();
   lastLow.Reset();
   prevHigh.Reset();
   prevLow.Reset();
   lastSweep.Reset();
   
   zoneCount = 0;
   dsZoneCount = 0;
   
   IndicatorSetString(INDICATOR_SHORTNAME, "⚡ MS Pro v3.21");
   
   if(InpShowDashboard)
      CreateDashboard();
   
   Print("══════════════════════════════════════");
   Print("✅ Market Structure Professional v3.21");
   Print("🎨 Smart Compact Design");
   Print("📊 Optimized Labels (OB, DZ, SZ)");
   Print("══════════════════════════════════════");
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Deinitialization                                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(emaHandle != INVALID_HANDLE) IndicatorRelease(emaHandle);
   if(atrHandle != INVALID_HANDLE) IndicatorRelease(atrHandle);
   
   DeleteAllObjects();
   Comment("");
}

void DeleteAllObjects()
{
   string prefixes[] = {"MS_", "DASH_", "RISK_", "DS_", "BRK_", "SWP_", "OB_"};
   
   for(int p = 0; p < ArraySize(prefixes); p++)
   {
      ObjectsDeleteAll(0, prefixes[p]);
   }
}

//+------------------------------------------------------------------+
//| Main Calculation                                                 |
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   ArraySetAsSeries(time, true);
   ArraySetAsSeries(open, true);
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   ArraySetAsSeries(close, true);
   
   int minBars = InpSwingStrength * 2 + (InpUseEMA ? InpEMAPeriod : 50);
   if(rates_total < minBars) return 0;
   
   if(InpUseEMA && CopyBuffer(emaHandle, 0, 0, 50, emaBuffer) <= 0) return 0;
   if(CopyBuffer(atrHandle, 0, 0, 50, atrBuffer) <= 0) return 0;
   
   int limit = prev_calculated == 0 ? MathMin(100, rates_total - minBars) : 1;
   
   for(int i = 0; i < limit; i++)
   {
      if(i >= rates_total - InpSwingStrength) continue;
      
      ScoreBuy[i] = 0;
      ScoreSell[i] = 0;
      
      DetectSwings(i, high, low, time);
      
      if(InpShowOB && i % 2 == 0)
         DetectZones(i, open, high, low, close, time);
      
      if(InpShowDemandSupply)
         DetectDemandSupplyZones(i, open, high, low, close, time);
      
      if(i == 0)
      {
         if(InpDetectBreakouts)
            CheckBreakouts(high, low, close, time);
         
         if(InpDetectSweeps)
            CheckMarketSweeps(i, high, low, close, time);
         
         CheckBuySignal(i, close, high, low, time, tick_volume);
         CheckSellSignal(i, close, high, low, time, tick_volume);
      }
   }
   
   if(InpShowDemandSupply)
      DrawDemandSupplyZones();
   
   if(InpShowDashboard && TimeCurrent() - lastUpdateTime > 2)
   {
      UpdateDashboard();
      lastUpdateTime = TimeCurrent();
   }
   
   static datetime lastCleanTime = 0;
   if(TimeCurrent() - lastCleanTime > 300)
   {
      CleanOldObjects();
      lastCleanTime = TimeCurrent();
   }
   
   return rates_total;
}

//+------------------------------------------------------------------+
//| Clean Old Objects                                                |
//+------------------------------------------------------------------+
void CleanOldObjects()
{
   datetime cutoffTime = TimeCurrent() - PeriodSeconds(_Period) * InpMaxVisibleObjects;
   int total = ObjectsTotal(0);
   
   for(int i = total - 1; i >= 0; i--)
   {
      string name = ObjectName(0, i);
      
      if(StringFind(name, "MS_T_") == 0 || 
         StringFind(name, "BRK_") == 0 || 
         StringFind(name, "SWP_") == 0 ||
         StringFind(name, "OB_") == 0)
      {
         datetime objTime = (datetime)ObjectGetInteger(0, name, OBJPROP_TIME);
         if(objTime < cutoffTime)
         {
            ObjectDelete(0, name);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Detect Demand and Supply Zones                                   |
//+------------------------------------------------------------------+
void DetectDemandSupplyZones(int idx, const double &open[], const double &high[], 
                             const double &low[], const double &close[], const datetime &time[])
{
   if(idx < 5 || dsZoneCount >= MAX_DS_ZONES) return;
   
   if(IsDemandZone(idx, open, high, low, close))
   {
      dsZones[dsZoneCount].startTime = time[idx+2];
      dsZones[dsZoneCount].endTime = time[idx];
      dsZones[dsZoneCount].high = high[idx+1];
      dsZones[dsZoneCount].low = low[idx+1];
      dsZones[dsZoneCount].isDemand = true;
      dsZones[dsZoneCount].touches = 0;
      dsZones[dsZoneCount].isBroken = false;
      dsZones[dsZoneCount].isValid = true;
      dsZoneCount++;
   }
   
   if(IsSupplyZone(idx, open, high, low, close))
   {
      dsZones[dsZoneCount].startTime = time[idx+2];
      dsZones[dsZoneCount].endTime = time[idx];
      dsZones[dsZoneCount].high = high[idx+1];
      dsZones[dsZoneCount].low = low[idx+1];
      dsZones[dsZoneCount].isDemand = false;
      dsZones[dsZoneCount].touches = 0;
      dsZones[dsZoneCount].isBroken = false;
      dsZones[dsZoneCount].isValid = true;
      dsZoneCount++;
   }
}

bool IsDemandZone(int idx, const double &open[], const double &high[], 
                  const double &low[], const double &close[])
{
   double baseRange = high[idx+1] - low[idx+1];
   double moveRange = high[idx] - low[idx];
   double prevRange = high[idx+2] - low[idx+2];
   
   return (baseRange < prevRange * 0.8) && 
          (moveRange > baseRange * 1.5) && 
          (close[idx] > open[idx]);
}

bool IsSupplyZone(int idx, const double &open[], const double &high[], 
                  const double &low[], const double &close[])
{
   double baseRange = high[idx+1] - low[idx+1];
   double moveRange = high[idx] - low[idx];
   double prevRange = high[idx+2] - low[idx+2];
   
   return (baseRange < prevRange * 0.8) && 
          (moveRange > baseRange * 1.5) && 
          (close[idx] < open[idx]);
}

//+------------------------------------------------------------------+
//| Draw Demand Supply Zones with COMPACT Labels                     |
//+------------------------------------------------------------------+
void DrawDemandSupplyZones()
{
   datetime currentTime = TimeCurrent();
   datetime cutoffTime = currentTime - PeriodSeconds(_Period) * InpMaxVisibleObjects;
   
   for(int i = 0; i < dsZoneCount; i++)
   {
      if(!dsZones[i].isValid || dsZones[i].isBroken) continue;
      if(dsZones[i].startTime < cutoffTime) continue;
      
      string name = "DS_Z_" + TimeToString(dsZones[i].startTime);
      
      if(ObjectFind(0, name) < 0)
      {
         color zoneColor = dsZones[i].isDemand ? InpDemandColor : InpSupplyColor;
         datetime endTime = currentTime + PeriodSeconds(_Period) * 20;
         
         // Draw zone rectangle
         ObjectCreate(0, name, OBJ_RECTANGLE, 0, dsZones[i].startTime, dsZones[i].high, 
                      endTime, dsZones[i].low);
         ObjectSetInteger(0, name, OBJPROP_COLOR, zoneColor);
         ObjectSetInteger(0, name, OBJPROP_WIDTH, 2);
         ObjectSetInteger(0, name, OBJPROP_BACK, true);
         ObjectSetInteger(0, name, OBJPROP_FILL, true);
         ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_SOLID);
         
         // COMPACT LABEL - Shortened text
         string labelName = name + "_Label";
         ObjectCreate(0, labelName, OBJ_TEXT, 0, dsZones[i].startTime, 
                      dsZones[i].isDemand ? dsZones[i].low : dsZones[i].high);
         
         string labelText = dsZones[i].isDemand ? "  DZ" : "  SZ";  // SHORTENED!
         ObjectSetString(0, labelName, OBJPROP_TEXT, labelText);
         ObjectSetInteger(0, labelName, OBJPROP_COLOR, clrWhite);
         ObjectSetInteger(0, labelName, OBJPROP_FONTSIZE, InpZoneFontSize);
         ObjectSetString(0, labelName, OBJPROP_FONT, "Arial Bold");
         ObjectSetInteger(0, labelName, OBJPROP_ANCHOR, 
                         dsZones[i].isDemand ? ANCHOR_TOP : ANCHOR_BOTTOM);
      }
   }
}

//+------------------------------------------------------------------+
//| Check for Zone Breakouts                                         |
//+------------------------------------------------------------------+
void CheckBreakouts(const double &high[], const double &low[], 
                   const double &close[], const datetime &time[])
{
   double currentPrice = close[0];
   double buffer = InpBreakoutBuffer;
   
   for(int i = 0; i < dsZoneCount; i++)
   {
      if(dsZones[i].isBroken || !dsZones[i].isValid) continue;
      
      if(!dsZones[i].isDemand && currentPrice > dsZones[i].high + buffer)
      {
         if(time[0] != lastBreakoutTime)
         {
            dsZones[i].isBroken = true;
            dsZones[i].breakTime = time[0];
            totalBreakouts++;
            lastBreakoutTime = time[0];
            
            DrawBreakout(time[0], dsZones[i].high, true, "SZ");  // SHORTENED!
            
            if(InpAlertOnBreakout && InpEnableAlerts)
            {
               SendBreakoutAlert(true, currentPrice, dsZones[i].low, dsZones[i].high);
            }
         }
      }
      
      if(dsZones[i].isDemand && currentPrice < dsZones[i].low - buffer)
      {
         if(time[0] != lastBreakoutTime)
         {
            dsZones[i].isBroken = true;
            dsZones[i].breakTime = time[0];
            totalBreakouts++;
            lastBreakoutTime = time[0];
            
            DrawBreakout(time[0], dsZones[i].low, false, "DZ");  // SHORTENED!
            
            if(InpAlertOnBreakout && InpEnableAlerts)
            {
               SendBreakoutAlert(false, currentPrice, dsZones[i].low, dsZones[i].high);
            }
         }
      }
   }
}

void SendBreakoutAlert(bool isBullish, double price, double zoneLow, double zoneHigh)
{
   string msg = StringFormat("💥 BREAKOUT - %s Zone Broken!\n%s | Price: %.5f\nZone: %.5f - %.5f",
                           isBullish ? "Supply" : "Demand",
                           _Symbol, price, zoneLow, zoneHigh);
   Alert(msg);
   if(InpEnableSound) PlaySound(InpAlertSound);
}

//+------------------------------------------------------------------+
//| Draw Breakout with COMPACT Label                                 |
//+------------------------------------------------------------------+
void DrawBreakout(datetime time, double price, bool isBullish, string zoneType)
{
   string name = "BRK_" + TimeToString(time);
   if(ObjectFind(0, name) >= 0) return;
   
   datetime endTime = time + PeriodSeconds(_Period) * 30;
   
   // Draw breakout line
   ObjectCreate(0, name, OBJ_TREND, 0, time, price, endTime, price);
   ObjectSetInteger(0, name, OBJPROP_COLOR, InpBreakoutColor);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, 2);
   ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_DASHDOTDOT);
   ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, false);
   
   // COMPACT LABEL - Shortened breakout text
   string labelName = name + "_Label";
   ObjectCreate(0, labelName, OBJ_TEXT, 0, time, price);
   ObjectSetString(0, labelName, OBJPROP_TEXT, 
                  StringFormat("  %s BRK %s", zoneType, isBullish ? "↑" : "↓"));  // SHORTENED!
   ObjectSetInteger(0, labelName, OBJPROP_COLOR, InpBreakoutColor);
   ObjectSetInteger(0, labelName, OBJPROP_FONTSIZE, InpZoneFontSize);
   ObjectSetString(0, labelName, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, labelName, OBJPROP_ANCHOR, isBullish ? ANCHOR_BOTTOM : ANCHOR_TOP);
}

//+------------------------------------------------------------------+
//| Detect Market Sweeps                                             |
//+------------------------------------------------------------------+
void CheckMarketSweeps(int idx, const double &high[], const double &low[], 
                      const double &close[], const datetime &time[])
{
   if(idx >= InpSweepLookback) return;
   
   double currentHigh = high[0];
   double currentLow = low[0];
   double currentClose = close[0];
   double buffer = InpSweepBuffer;
   
   double recentHigh = 0;
   datetime recentHighTime = 0;
   double recentLow = DBL_MAX;
   datetime recentLowTime = 0;
   
   for(int i = 1; i < InpSweepLookback; i++)
   {
      if(recentHigh == 0 && IsSwingHigh(i, high))
      {
         recentHigh = high[i];
         recentHighTime = time[i];
      }
      
      if(recentLow == DBL_MAX && IsSwingLow(i, low))
      {
         recentLow = low[i];
         recentLowTime = time[i];
      }
      
      if(recentHigh > 0 && recentLow < DBL_MAX) break;
   }
   
   // Bullish Sweep
   if(recentLow < DBL_MAX && currentLow < recentLow - buffer && 
      currentClose > recentLow && time[0] != lastSweepTime)
   {
      ProcessSweep(time[0], recentLow, currentLow, currentClose, true);
   }
   
   // Bearish Sweep
   if(recentHigh > 0 && currentHigh > recentHigh + buffer && 
      currentClose < recentHigh && time[0] != lastSweepTime)
   {
      ProcessSweep(time[0], recentHigh, currentHigh, currentClose, false);
   }
}

void ProcessSweep(datetime time, double sweptLevel, double sweepPrice, 
                 double closePrice, bool isBullish)
{
   lastSweep.time = time;
   lastSweep.price = sweptLevel;
   lastSweep.isBullish = isBullish;
   lastSweep.sweptPrice = sweepPrice;
   lastSweep.type = isBullish ? "Low" : "High";
   
   totalSweeps++;
   lastSweepTime = time;
   
   if(InpShowSweepLabels)
      DrawSweep(time, sweptLevel, sweepPrice, isBullish);
   
   if(InpAlertOnSweep && InpEnableAlerts)
   {
      SendSweepAlert(isBullish, sweptLevel, closePrice);
   }
}

void SendSweepAlert(bool isBullish, double sweptLevel, double currentPrice)
{
   string msg = StringFormat("🔄 %s MARKET SWEEP!\n%s\nSwept %s: %.5f\nCurrent: %.5f",
                           isBullish ? "BULLISH" : "BEARISH",
                           _Symbol,
                           isBullish ? "Low" : "High",
                           sweptLevel, currentPrice);
   Alert(msg);
   if(InpEnableSound) PlaySound(InpAlertSound);
}

//+------------------------------------------------------------------+
//| Draw Sweep with COMPACT Label                                    |
//+------------------------------------------------------------------+
void DrawSweep(datetime time, double sweptLevel, double sweepPrice, bool isBullish)
{
   string name = "SWP_" + TimeToString(time);
   if(ObjectFind(0, name) >= 0) return;
   
   color sweepColor = isBullish ? InpSweepBullColor : InpSweepBearColor;
   datetime endTime = time + PeriodSeconds(_Period) * 25;
   
   // Draw swept level line
   ObjectCreate(0, name + "_Level", OBJ_TREND, 0, time - PeriodSeconds(_Period) * 10, 
                sweptLevel, endTime, sweptLevel);
   ObjectSetInteger(0, name + "_Level", OBJPROP_COLOR, sweepColor);
   ObjectSetInteger(0, name + "_Level", OBJPROP_WIDTH, InpSweepLineWidth);
   ObjectSetInteger(0, name + "_Level", OBJPROP_STYLE, STYLE_SOLID);
   ObjectSetInteger(0, name + "_Level", OBJPROP_RAY_RIGHT, false);
   
   // COMPACT LABEL - Shortened sweep text
   string labelName = name + "_Label";
   ObjectCreate(0, labelName, OBJ_TEXT, 0, time, sweptLevel);
   ObjectSetString(0, labelName, OBJPROP_TEXT, 
                  StringFormat("  %s SWP %.5f", isBullish ? "▲" : "▼", sweptLevel));  // SHORTENED!
   ObjectSetInteger(0, labelName, OBJPROP_COLOR, sweepColor);
   ObjectSetInteger(0, labelName, OBJPROP_FONTSIZE, InpSweepFontSize);
   ObjectSetString(0, labelName, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, labelName, OBJPROP_ANCHOR, isBullish ? ANCHOR_BOTTOM : ANCHOR_TOP);
}

//+------------------------------------------------------------------+
//| Calculate Risk Management                                         |
//+------------------------------------------------------------------+
RiskInfo CalculateRiskManagement(double entry, double sl, bool isBuy)
{
   RiskInfo risk;
   
   double riskPoints = MathAbs(entry - sl);
   risk.riskPips = riskPoints / _Point;
   risk.riskAmount = InpAccountBalance * (InpRiskPercent / 100.0);
   
   risk.lotSize = (risk.riskAmount / (riskPoints / g_tickSize * g_tickValue));
   risk.lotSize = MathFloor(risk.lotSize / g_lotStep) * g_lotStep;
   risk.lotSize = MathMax(g_minLot, MathMin(g_maxLot, risk.lotSize));
   
   risk.tp1Pips = risk.riskPips * InpTP1_RR;
   risk.tp2Pips = risk.riskPips * InpTP2_RR;
   risk.tp3Pips = risk.riskPips * InpTP3_RR;
   
   risk.tp1Amount = risk.riskAmount * InpTP1_RR;
   risk.tp2Amount = risk.riskAmount * InpTP2_RR;
   risk.tp3Amount = risk.riskAmount * InpTP3_RR;
   
   risk.is1to3Valid = (risk.riskPips >= InpMinRiskPips && 
                       risk.riskPips <= InpMaxRiskPips &&
                       InpTP3_RR >= 2.8);
   
   return risk;
}

//+------------------------------------------------------------------+
//| Detect Swings                                                    |
//+------------------------------------------------------------------+
void DetectSwings(int idx, const double &high[], const double &low[], const datetime &time[])
{
   if(IsSwingHigh(idx, high))
   {
      prevHigh = lastHigh;
      lastHigh.time = time[idx];
      lastHigh.price = high[idx];
      lastHigh.type = (prevHigh.time > 0 && high[idx] > prevHigh.price) ? "HH" : "LH";
      
      if(InpShowStructure && lastHigh.type != "")
         DrawLabel(time[idx], high[idx], lastHigh.type, true);
   }
   
   if(IsSwingLow(idx, low))
   {
      prevLow = lastLow;
      lastLow.time = time[idx];
      lastLow.price = low[idx];
      lastLow.type = (prevLow.time > 0 && low[idx] < prevLow.price) ? "LL" : "HL";
      
      if(InpShowStructure && lastLow.type != "")
         DrawLabel(time[idx], low[idx], lastLow.type, false);
   }
}

bool IsSwingHigh(int idx, const double &high[])
{
   int arraySize = ArraySize(high);
   if(idx < InpSwingStrength || idx >= arraySize - InpSwingStrength)
      return false;
   
   double center = high[idx];
   for(int i = 1; i <= InpSwingStrength; i++)
   {
      if(high[idx+i] >= center || high[idx-i] >= center)
         return false;
   }
   
   return true;
}

bool IsSwingLow(int idx, const double &low[])
{
   int arraySize = ArraySize(low);
   if(idx < InpSwingStrength || idx >= arraySize - InpSwingStrength)
      return false;
   
   double center = low[idx];
   for(int i = 1; i <= InpSwingStrength; i++)
   {
      if(low[idx+i] <= center || low[idx-i] <= center)
         return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| Detect Zones with COMPACT Labels                                 |
//+------------------------------------------------------------------+
void DetectZones(int idx, const double &open[], const double &high[], 
                 const double &low[], const double &close[], const datetime &time[])
{
   if(idx < 3 || zoneCount >= MAX_ZONES) return;
   
   double range1 = high[idx-1] - low[idx-1];
   double range2 = high[idx-2] - low[idx-2];
   
   // Bullish Order Block
   if(close[idx-1] > open[idx-1] && close[idx-2] < open[idx-2] && range1 > range2 * 1.3)
   {
      zones[zoneCount].time = time[idx-2];
      zones[zoneCount].high = high[idx-2];
      zones[zoneCount].low = low[idx-2];
      zones[zoneCount].isBull = true;
      zones[zoneCount].touches = 0;
      zones[zoneCount].broken = false;
      DrawZone(zones[zoneCount]);
      zoneCount++;
   }
   
   // Bearish Order Block
   if(close[idx-1] < open[idx-1] && close[idx-2] > open[idx-2] && range1 > range2 * 1.3)
   {
      zones[zoneCount].time = time[idx-2];
      zones[zoneCount].high = high[idx-2];
      zones[zoneCount].low = low[idx-2];
      zones[zoneCount].isBull = false;
      zones[zoneCount].touches = 0;
      zones[zoneCount].broken = false;
      DrawZone(zones[zoneCount]);
      zoneCount++;
   }
}

int CalcScore(bool isBuy, int idx, const double &close[], const double &low[], const double &high[])
{
   int score = 0;
   
   if(isBuy && lastHigh.type == "HH" && lastLow.type == "HL") score += 3;
   if(!isBuy && lastLow.type == "LL" && lastHigh.type == "LH") score += 3;
   
   if(InpUseEMA && ArraySize(emaBuffer) > 0)
   {
      if(isBuy && close[idx] > emaBuffer[0]) score += 3;
      if(!isBuy && close[idx] < emaBuffer[0]) score += 3;
   }
   
   double price = isBuy ? low[idx] : high[idx];
   for(int i = 0; i < zoneCount; i++)
   {
      if(zones[i].isBull == isBuy && price >= zones[i].low && price <= zones[i].high)
      {
         score += 4;
         break;
      }
   }
   
   if(lastSweep.time > 0 && TimeCurrent() - lastSweep.time < PeriodSeconds(_Period) * 5)
   {
      if((isBuy && lastSweep.isBullish) || (!isBuy && !lastSweep.isBullish))
         score += 2;
   }
   
   return score;
}

//+------------------------------------------------------------------+
//| Check Buy Signal                                                 |
//+------------------------------------------------------------------+
void CheckBuySignal(int idx, const double &close[], const double &high[], 
                    const double &low[], const datetime &time[], const long &vol[])
{
   if(idx != 0) return;
   if(lastHigh.type != "HH" || lastLow.type != "HL") return;
   
   int score = CalcScore(true, idx, close, low, high);
   ScoreBuy[idx] = score;
   
   if(score < InpMinScore) return;
   
   double entry = close[idx];
   double sl = lastLow.price;
   double risk = entry - sl;
   
   if(risk <= 0)
   {
      sl = entry - (atrBuffer[0] * 1.5);
      risk = entry - sl;
   }
   
   RiskInfo riskInfo = CalculateRiskManagement(entry, sl, true);
   
   if(InpShow1to3Only && !riskInfo.is1to3Valid) return;
   
   if(time[idx] != lastSignalTime)
   {
      lastSignalTime = time[idx];
      totalSignals++;
      if(score >= 8) strongSignals++;
      if(riskInfo.is1to3Valid) signals1to3++;
      
      double tp1 = entry + (risk * InpTP1_RR);
      double tp2 = entry + (risk * InpTP2_RR);
      double tp3 = entry + (risk * InpTP3_RR);
      
      if(InpShowLevels)
         DrawTradeWithRisk(time[idx], entry, sl, tp1, tp2, tp3, true, score, riskInfo);
      
      bool shouldAlert = InpEnableAlerts && (!InpAlert1to3Only || riskInfo.is1to3Valid);
      
      if(shouldAlert)
         SendRiskAlert(true, score, entry, sl, tp3, riskInfo);
   }
}

//+------------------------------------------------------------------+
//| Check Sell Signal                                                |
//+------------------------------------------------------------------+
void CheckSellSignal(int idx, const double &close[], const double &high[], 
                     const double &low[], const datetime &time[], const long &vol[])
{
   if(idx != 0) return;
   if(lastLow.type != "LL" || lastHigh.type != "LH") return;
   
   int score = CalcScore(false, idx, close, low, high);
   ScoreSell[idx] = score;
   
   if(score < InpMinScore) return;
   
   double entry = close[idx];
   double sl = lastHigh.price;
   double risk = sl - entry;
   
   if(risk <= 0)
   {
      sl = entry + (atrBuffer[0] * 1.5);
      risk = sl - entry;
   }
   
   RiskInfo riskInfo = CalculateRiskManagement(entry, sl, false);
   
   if(InpShow1to3Only && !riskInfo.is1to3Valid) return;
   
   if(time[idx] != lastSignalTime)
   {
      lastSignalTime = time[idx];
      totalSignals++;
      if(score >= 8) strongSignals++;
      if(riskInfo.is1to3Valid) signals1to3++;
      
      double tp1 = entry - (risk * InpTP1_RR);
      double tp2 = entry - (risk * InpTP2_RR);
      double tp3 = entry - (risk * InpTP3_RR);
      
      if(InpShowLevels)
         DrawTradeWithRisk(time[idx], entry, sl, tp1, tp2, tp3, false, score, riskInfo);
      
      bool shouldAlert = InpEnableAlerts && (!InpAlert1to3Only || riskInfo.is1to3Valid);
      
      if(shouldAlert)
         SendRiskAlert(false, score, entry, sl, tp3, riskInfo);
   }
}

//+------------------------------------------------------------------+
//| Draw Trade with Risk Management                                  |
//+------------------------------------------------------------------+
void DrawTradeWithRisk(datetime time, double entry, double sl, double tp1, double tp2, double tp3,
                       bool isBuy, int score, RiskInfo &risk)
{
   string p = "MS_T_" + TimeToString(time) + "_";
   
   if(ObjectFind(0, p+"Entry") >= 0) return;
   
   datetime endTime = time + PeriodSeconds(_Period) * 50;
   color signalColor = risk.is1to3Valid ? InpGood1to3Color : (isBuy ? clrLime : clrRed);
   
   CreateTrendLine(p+"Entry", time, entry, endTime, entry, clrWhite, 2, STYLE_SOLID);
   
   if(InpShowRRLabels)
   {
      CreateTextLabel(p+"EntryTxt", endTime, entry, " ◆ ENTRY " + DoubleToString(entry, g_digits), 
                     clrWhite, 9, ANCHOR_LEFT);
   }
   
   CreateTrendLine(p+"SL", time, sl, endTime, sl, clrRed, 2, STYLE_SOLID);
   
   if(InpShowRRLabels)
   {
      CreateTextLabel(p+"SLTxt", endTime, sl, 
                     StringFormat(" ✖ SL %.5f [%.0f pips | -$%.2f]", sl, risk.riskPips, risk.riskAmount),
                     clrRed, 8, ANCHOR_LEFT);
   }
   
   CreateTrendLine(p+"TP1", time, tp1, endTime, tp1, C'0,255,150', 1, STYLE_DOT);
   CreateTrendLine(p+"TP2", time, tp2, endTime, tp2, C'0,200,100', 1, STYLE_DOT);
   CreateTrendLine(p+"TP3", time, tp3, endTime, tp3, signalColor, risk.is1to3Valid ? 2 : 1, STYLE_SOLID);
   
   if(InpShowRRLabels)
   {
      CreateTextLabel(p+"TP1Txt", endTime, tp1,
                     StringFormat(" ✓ TP1 %.5f [%.0f pips | +$%.2f]", tp1, risk.tp1Pips, risk.tp1Amount),
                     C'0,255,150', 8, ANCHOR_LEFT);
      
      CreateTextLabel(p+"TP2Txt", endTime, tp2,
                     StringFormat(" ✓ TP2 %.5f [%.0f pips | +$%.2f]", tp2, risk.tp2Pips, risk.tp2Amount),
                     C'0,200,100', 8, ANCHOR_LEFT);
      
      string tp3Label = StringFormat(" ✓ TP3 %.5f [%.0f pips | +$%.2f] 1:%.1f%s", 
                                    tp3, risk.tp3Pips, risk.tp3Amount, InpTP3_RR,
                                    risk.is1to3Valid ? " ★" : "");
      CreateTextLabel(p+"TP3Txt", endTime, tp3, tp3Label, signalColor, 9, ANCHOR_LEFT);
   }
   
   if(InpShowRiskBox)
   {
      string infoText = StringFormat("📊 #%d | Score: %d/10\n"
                                    "💰 Risk: %.0f pips ($%.2f) | %.2f lots\n"
                                    "🎯 Target: %.0f pips ($%.2f) | R:R 1:%.1f%s",
                                    totalSignals, score,
                                    risk.riskPips, risk.riskAmount, risk.lotSize,
                                    risk.tp3Pips, risk.tp3Amount, InpTP3_RR,
                                    risk.is1to3Valid ? " ★★★" : "");
      
      double infoPrice = isBuy ? entry - (risk.riskPips * _Point * 0.5) : entry + (risk.riskPips * _Point * 0.5);
      CreateTextLabel(p+"Info", time, infoPrice, infoText, signalColor, 9, 
                     isBuy ? ANCHOR_TOP : ANCHOR_BOTTOM);
   }
}

//+------------------------------------------------------------------+
//| Create Trend Line Helper                                         |
//+------------------------------------------------------------------+
void CreateTrendLine(string name, datetime time1, double price1, datetime time2, double price2,
                    color clr, int width, int style)
{
   ObjectCreate(0, name, OBJ_TREND, 0, time1, price1, time2, price2);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, width);
   ObjectSetInteger(0, name, OBJPROP_STYLE, style);
   ObjectSetInteger(0, name, OBJPROP_RAY_RIGHT, false);
}

//+------------------------------------------------------------------+
//| Create Text Label Helper                                         |
//+------------------------------------------------------------------+
void CreateTextLabel(string name, datetime time, double price, string text, 
                    color clr, int fontSize, int anchor)
{
   ObjectCreate(0, name, OBJ_TEXT, 0, time, price);
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, fontSize);
   ObjectSetString(0, name, OBJPROP_FONT, "Arial Bold");
   ObjectSetInteger(0, name, OBJPROP_ANCHOR, anchor);
}

//+------------------------------------------------------------------+
//| Draw Label Helper                                                |
//+------------------------------------------------------------------+
void DrawLabel(datetime time, double price, string text, bool isHigh)
{
   string name = "MS_L_" + TimeToString(time);
   if(ObjectFind(0, name) >= 0) return;
   
   CreateTextLabel(name, time, price, text, clrWhite, 9, 
                  isHigh ? ANCHOR_BOTTOM : ANCHOR_TOP);
}

//+------------------------------------------------------------------+
//| Draw Zone with COMPACT Label (OB)                                |
//+------------------------------------------------------------------+
void DrawZone(Zone &z)
{
   string name = "OB_Z_" + TimeToString(z.time);
   if(ObjectFind(0, name) >= 0) return;
   
   color clr = z.isBull ? InpOBBullColor : InpOBBearColor;
   
   // Draw Order Block rectangle
   ObjectCreate(0, name, OBJ_RECTANGLE, 0, z.time, z.high, 
                TimeCurrent() + PeriodSeconds(_Period) * 10, z.low);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, 2);
   ObjectSetInteger(0, name, OBJPROP_BACK, true);
   
   // COMPACT LABEL - Just "OB"
   if(InpShowOBLabels)
   {
      string labelName = name + "_Label";
      ObjectCreate(0, labelName, OBJ_TEXT, 0, z.time, z.isBull ? z.low : z.high);
      ObjectSetString(0, labelName, OBJPROP_TEXT, "  OB");  // SHORTENED TO "OB" !
      ObjectSetInteger(0, labelName, OBJPROP_COLOR, InpOBTextColor);
      ObjectSetInteger(0, labelName, OBJPROP_FONTSIZE, InpOBFontSize);
      ObjectSetString(0, labelName, OBJPROP_FONT, "Arial Bold");
      ObjectSetInteger(0, labelName, OBJPROP_ANCHOR, z.isBull ? ANCHOR_TOP : ANCHOR_BOTTOM);
   }
}

void SendRiskAlert(bool isBuy, int score, double entry, double sl, double tp3, RiskInfo &risk)
{
   string direction = isBuy ? "BUY 🟢" : "SELL 🔴";
   string special = risk.is1to3Valid ? " ★★★ 1:3 R:R ★★★" : "";
   
   string message = StringFormat("═══════════════════════\n"
                                "%s SIGNAL%s\n"
                                "═══════════════════════\n"
                                "Score: %d/10\n"
                                "Pair: %s\n\n"
                                "Entry: %.5f\n"
                                "SL: %.5f (%.0f pips)\n"
                                "TP: %.5f (%.0f pips)\n\n"
                                "💰 Risk: $%.2f (%.0f pips)\n"
                                "🎯 Reward: $%.2f (%.0f pips)\n"
                                "📊 R:R = 1:%.1f\n"
                                "📈 Lot Size: %.2f\n"
                                "═══════════════════════",
                                direction, special, score, _Symbol,
                                entry, sl, risk.riskPips, tp3, risk.tp3Pips,
                                risk.riskAmount, risk.tp3Amount,
                                InpTP3_RR, risk.lotSize);
   
   Alert(message);
   if(InpEnableSound) PlaySound(InpAlertSound);
}

//+------------------------------------------------------------------+
//| Dashboard Functions                                              |
//+------------------------------------------------------------------+
void CreateDashboard()
{
   int x = 10, y = 20, w = 340, h = 320;
   
   ObjectCreate(0, "DASH_BG", OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, "DASH_BG", OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, "DASH_BG", OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, "DASH_BG", OBJPROP_XSIZE, w);
   ObjectSetInteger(0, "DASH_BG", OBJPROP_YSIZE, h);
   ObjectSetInteger(0, "DASH_BG", OBJPROP_BGCOLOR, C'20,20,30');
   ObjectSetInteger(0, "DASH_BG", OBJPROP_BORDER_TYPE, BORDER_FLAT);
   ObjectSetInteger(0, "DASH_BG", OBJPROP_COLOR, C'70,130,180');
   
   CreateDashLabel("DASH_Title", "⚡ MARKET STRUCTURE PRO", x+15, y+8, C'70,200,255', 12);
   CreateDashLabel("DASH_Ver", "Professional Edition v3.21", x+15, y+28, C'120,180,220', 9);
}

void UpdateDashboard()
{
   int x = 25, y = 60, lh = 20;
   
   double cp = iClose(_Symbol, _Period, 0);
   string trend = "Loading...";
   color trendColor = clrGray;
   
   if(InpUseEMA && ArraySize(emaBuffer) > 0 && emaBuffer[0] > 0)
   {
      trend = cp > emaBuffer[0] ? "▲ BULLISH" : "▼ BEARISH";
      trendColor = cp > emaBuffer[0] ? C'0,255,100' : clrRed;
   }
   
   CreateDashLabel("DASH_Trend", "Trend: " + trend, x, y, trendColor, 10);
   
   string struct_text = (lastHigh.type != "" && lastLow.type != "") ? 
                        lastHigh.type + " / " + lastLow.type : "Detecting...";
   CreateDashLabel("DASH_Struct", "Structure: " + struct_text, x, y+lh, C'150,220,255', 9);
   
   CreateDashLabel("DASH_BreakTitle", "─── Breakouts & Sweeps ───", x, y+lh*2+5, C'60,60,80', 9);
   CreateDashLabel("DASH_Breakouts", StringFormat("💥 Breakouts: %d", totalBreakouts), 
                  x, y+lh*3+5, InpBreakoutColor, 9);
   CreateDashLabel("DASH_Sweeps", StringFormat("🔄 Market Sweeps: %d", totalSweeps), 
                  x, y+lh*4+5, C'255,200,100', 9);
   
   string lastSweepText = "No recent sweep";
   color sweepColor = clrGray;
   if(lastSweep.time > 0 && TimeCurrent() - lastSweep.time < PeriodSeconds(_Period) * 10)
   {
      lastSweepText = StringFormat("%s Sweep @ %.5f", 
                                   lastSweep.isBullish ? "▲ BULL" : "▼ BEAR", 
                                   lastSweep.price);
      sweepColor = lastSweep.isBullish ? InpSweepBullColor : InpSweepBearColor;
   }
   CreateDashLabel("DASH_LastSweep", lastSweepText, x, y+lh*5+5, sweepColor, 8);
   
   CreateDashLabel("DASH_RiskTitle", "─── Risk Management ───", x, y+lh*6+10, C'60,60,80', 9);
   CreateDashLabel("DASH_RiskPct", StringFormat("Risk per Trade: %.1f%%", InpRiskPercent), 
                  x, y+lh*7+10, C'255,200,100', 9);
   CreateDashLabel("DASH_Target", StringFormat("Target R:R: 1:%.1f", InpTP3_RR), 
                  x, y+lh*8+10, InpGood1to3Color, 10);
   
   CreateDashLabel("DASH_StatsTitle", "─── Statistics ───", x, y+lh*9+15, C'60,60,80', 9);
   CreateDashLabel("DASH_Total", StringFormat("Total Signals: %d", totalSignals), 
                  x, y+lh*10+15, clrWhite, 9);
   CreateDashLabel("DASH_1to3", StringFormat("★ 1:3 Signals: %d", signals1to3), 
                  x, y+lh*11+15, InpGood1to3Color, 10);
   CreateDashLabel("DASH_Strong", StringFormat("High Quality: %d", strongSignals), 
                  x, y+lh*12+15, C'255,215,0', 9);
   
   int bs = (int)ScoreBuy[0];
   int ss = (int)ScoreSell[0];
   color bc = bs >= 8 ? C'0,255,100' : (bs >= 4 ? clrYellow : clrGray);
   color sc = ss >= 8 ? clrRed : (ss >= 4 ? clrOrange : clrGray);
   
   CreateDashLabel("DASH_ScoreTitle", "─── Current Scores ───", x, y+lh*13+20, C'60,60,80', 9);
   CreateDashLabel("DASH_BuyScore", StringFormat("▲ BUY: %d/10", bs), x, y+lh*14+20, bc, 10);
   CreateDashLabel("DASH_SellScore", StringFormat("▼ SELL: %d/10", ss), x+160, y+lh*14+20, sc, 10);
   
   CreateDashLabel("DASH_Status", "● ACTIVE", x, y+lh*15+25, clrLime, 8);
   CreateDashLabel("DASH_Pair", _Symbol + " | " + GetTF(), x+90, y+lh*15+25, clrGray, 8);
}

void CreateDashLabel(string name, string text, int x, int y, color clr, int size)
{
   if(ObjectFind(0, name) < 0)
   {
      ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
      ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   }
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, size);
}

string GetTF()
{
   switch(_Period)
   {
      case PERIOD_M1: return "M1";
      case PERIOD_M5: return "M5";
      case PERIOD_M15: return "M15";
      case PERIOD_M30: return "M30";
      case PERIOD_H1: return "H1";
      case PERIOD_H4: return "H4";
      case PERIOD_D1: return "D1";
      default: return "M" + IntegerToString(_Period);
   }
}
//+------------------------------------------------------------------+