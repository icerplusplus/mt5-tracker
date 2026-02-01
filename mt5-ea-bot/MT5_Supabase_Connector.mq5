//+------------------------------------------------------------------+
//|                                     MT5_Supabase_Connector.mq5 |
//|                          Direct Supabase Integration for Vercel |
//+------------------------------------------------------------------+
#property copyright "MT5 Trading Dashboard"
#property version   "2.00"
#property strict

// Input parameters
input string SUPABASE_URL = "https://xxxxx.supabase.co";  // Your Supabase Project URL
input string SUPABASE_KEY = "eyJhbGc...";                 // Your Supabase Anon Key
input int UPDATE_INTERVAL = 1;                             // Update interval in seconds
input int MAGIC_NUMBER = 123456;                           // Magic number for orders
input ENUM_TIMEFRAMES CHART_TIMEFRAME = PERIOD_H1;         // Timeframe for chart data
input int BARS_TO_SEND = 100;                              // Number of bars to send

// Global variables
datetime lastUpdate = 0;
datetime lastChartUpdate = 0;
datetime lastTickUpdate = 0;
datetime lastPositionUpdate = 0;
datetime lastCommandCheck = 0;
string botStatus = "RUNNING";
string accountSuffix = "";
string accountId = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("MT5 Supabase Connector initialized");
   Print("Supabase URL: ", SUPABASE_URL);
   
   // Generate unique account ID
   accountId = "account_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   
   // Detect account type
   accountSuffix = DetectAccountSuffix();
   
   // Send initial data
   SendBotStatus();
   SendAccountInfo();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("MT5 Supabase Connector stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Send tick data every second
   if(TimeCurrent() - lastTickUpdate >= 1)
   {
      lastTickUpdate = TimeCurrent();
      SendTickData();
   }
   
   // Send positions every 0.5 seconds
   if(GetTickCount() - lastPositionUpdate >= 500)
   {
      lastPositionUpdate = GetTickCount();
      SendOpenPositions();
   }
   
   // Update other data at specified interval
   if(TimeCurrent() - lastUpdate >= UPDATE_INTERVAL)
   {
      lastUpdate = TimeCurrent();
      SendAccountInfo();
      SendBotStatus();
   }
   
   // Send chart data every 5 seconds
   if(TimeCurrent() - lastChartUpdate >= 5)
   {
      lastChartUpdate = TimeCurrent();
      SendChartData();
   }
   
   // Check commands every 2 seconds
   if(TimeCurrent() - lastCommandCheck >= 2)
   {
      lastCommandCheck = TimeCurrent();
      CheckCommands();
   }
}

//+------------------------------------------------------------------+
//| Detect account type from symbol suffix                          |
//+------------------------------------------------------------------+
string DetectAccountSuffix()
{
   string currentSymbol = Symbol();
   int len = StringLen(currentSymbol);
   
   if(len > 0)
   {
      string lastChar = StringSubstr(currentSymbol, len - 1, 1);
      if(lastChar == "m" || lastChar == "M") return "m";
      if(lastChar == "c" || lastChar == "C") return "c";
   }
   
   return "m";
}

//+------------------------------------------------------------------+
//| Send account info to Supabase                                    |
//+------------------------------------------------------------------+
void SendAccountInfo()
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double marginLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   double profit = AccountInfoDouble(ACCOUNT_PROFIT);
   
   string json = "{";
   json += "\"account_id\":\"" + accountId + "\",";
   json += "\"balance\":" + DoubleToJSON(balance, 2) + ",";
   json += "\"equity\":" + DoubleToJSON(equity, 2) + ",";
   json += "\"margin\":" + DoubleToJSON(margin, 2) + ",";
   json += "\"free_margin\":" + DoubleToJSON(freeMargin, 2) + ",";
   json += "\"margin_level\":" + DoubleToJSON(marginLevel, 2) + ",";
   json += "\"profit\":" + DoubleToJSON(profit, 2) + ",";
   json += "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
   json += "}";
   
   SupabaseUpsert("account_history", json);
}

//+------------------------------------------------------------------+
//| Send open positions to Supabase                                  |
//+------------------------------------------------------------------+
void SendOpenPositions()
{
   // First, delete all old positions for this account
   SupabaseDelete("open_positions", "account_id=eq." + accountId);
   
   int total = PositionsTotal();
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         string symbol = PositionGetString(POSITION_SYMBOL);
         string type = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL");
         double volume = PositionGetDouble(POSITION_VOLUME);
         double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
         double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
         double profit = PositionGetDouble(POSITION_PROFIT);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         string comment = PositionGetString(POSITION_COMMENT);
         long magic = PositionGetInteger(POSITION_MAGIC);
         datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
         
         StringReplace(comment, "\"", "\\\"");
         
         string json = "{";
         json += "\"account_id\":\"" + accountId + "\",";
         json += "\"ticket\":" + IntegerToString(ticket) + ",";
         json += "\"symbol\":\"" + symbol + "\",";
         json += "\"type\":\"" + type + "\",";
         json += "\"volume\":" + DoubleToJSON(volume, 2) + ",";
         json += "\"open_price\":" + DoubleToJSON(openPrice, 5) + ",";
         json += "\"current_price\":" + DoubleToJSON(currentPrice, 5) + ",";
         json += "\"profit\":" + DoubleToJSON(profit, 2) + ",";
         json += "\"sl\":" + DoubleToJSON(sl, 5) + ",";
         json += "\"tp\":" + DoubleToJSON(tp, 5) + ",";
         json += "\"comment\":\"" + comment + "\",";
         json += "\"magic_number\":" + IntegerToString(magic) + ",";
         json += "\"open_time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\"";
         json += "}";
         
         SupabaseInsert("open_positions", json);
      }
   }
}

//+------------------------------------------------------------------+
//| Send bot status to Supabase                                      |
//+------------------------------------------------------------------+
void SendBotStatus()
{
   long accountNumber = AccountInfoInteger(ACCOUNT_LOGIN);
   string broker = AccountInfoString(ACCOUNT_COMPANY);
   StringReplace(broker, "\"", "\\\"");
   
   string json = "{";
   json += "\"account_id\":\"" + accountId + "\",";
   json += "\"status\":\"" + botStatus + "\",";
   json += "\"version\":\"2.0.0\",";
   json += "\"account_number\":" + IntegerToString(accountNumber) + ",";
   json += "\"broker\":\"" + broker + "\",";
   json += "\"account_suffix\":\"" + accountSuffix + "\",";
   json += "\"last_update\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
   json += "}";
   
   SupabaseUpsert("bot_status", json);
}

//+------------------------------------------------------------------+
//| Send tick data to Supabase                                       |
//+------------------------------------------------------------------+
void SendTickData()
{
   string chartSymbol = Symbol();
   double bid = SymbolInfoDouble(chartSymbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(chartSymbol, SYMBOL_ASK);
   string timeframeStr = TimeframeToString(CHART_TIMEFRAME);
   
   string json = "{";
   json += "\"account_id\":\"" + accountId + "\",";
   json += "\"symbol\":\"" + chartSymbol + "\",";
   json += "\"timeframe\":\"" + timeframeStr + "\",";
   json += "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"bid\":" + DoubleToJSON(bid, 5) + ",";
   json += "\"ask\":" + DoubleToJSON(ask, 5);
   json += "}";
   
   // Note: Tick data is high frequency, consider using a separate table or skip if not needed
   // SupabaseInsert("tick_data", json);
}

//+------------------------------------------------------------------+
//| Send chart data to Supabase                                      |
//+------------------------------------------------------------------+
void SendChartData()
{
   string chartSymbol = Symbol();
   string timeframeStr = TimeframeToString(CHART_TIMEFRAME);
   
   // Delete old chart data for this symbol/timeframe
   string filter = "account_id=eq." + accountId + "&symbol=eq." + chartSymbol + "&timeframe=eq." + timeframeStr;
   SupabaseDelete("chart_data", filter);
   
   MqlRates rates[];
   int copied = CopyRates(chartSymbol, CHART_TIMEFRAME, 0, BARS_TO_SEND, rates);
   
   if(copied > 0)
   {
      // Send in batches to avoid timeout
      int batchSize = 50;
      for(int batch = 0; batch < copied; batch += batchSize)
      {
         string json = "[";
         int end = MathMin(batch + batchSize, copied);
         
         for(int i = batch; i < end; i++)
         {
            if(i > batch) json += ",";
            
            json += "{";
            json += "\"account_id\":\"" + accountId + "\",";
            json += "\"symbol\":\"" + chartSymbol + "\",";
            json += "\"timeframe\":\"" + timeframeStr + "\",";
            json += "\"timestamp\":\"" + TimeToString(rates[i].time, TIME_DATE|TIME_SECONDS) + "\",";
            json += "\"open\":" + DoubleToJSON(rates[i].open, 5) + ",";
            json += "\"high\":" + DoubleToJSON(rates[i].high, 5) + ",";
            json += "\"low\":" + DoubleToJSON(rates[i].low, 5) + ",";
            json += "\"close\":" + DoubleToJSON(rates[i].close, 5) + ",";
            json += "\"volume\":" + IntegerToString(rates[i].tick_volume);
            json += "}";
         }
         
         json += "]";
         SupabaseInsertBatch("chart_data", json);
      }
      
      Print("Sent ", copied, " bars for ", chartSymbol, " ", timeframeStr);
   }
}

//+------------------------------------------------------------------+
//| Check for pending commands from Supabase                         |
//+------------------------------------------------------------------+
void CheckCommands()
{
   string filter = "account_id=eq." + accountId + "&status=eq.PENDING";
   string response = SupabaseSelect("commands", filter);
   
   if(StringLen(response) > 0 && StringFind(response, "\"id\"") > 0)
   {
      ProcessCommands(response);
   }
}

//+------------------------------------------------------------------+
//| Process commands from Supabase                                   |
//+------------------------------------------------------------------+
void ProcessCommands(string response)
{
   int searchPos = 0;
   
   while(true)
   {
      int idPos = StringFind(response, "\"id\":\"", searchPos);
      if(idPos < 0) break;
      
      int idStart = idPos + 6;
      int idEnd = StringFind(response, "\"", idStart);
      string commandId = StringSubstr(response, idStart, idEnd - idStart);
      
      int typePos = StringFind(response, "\"command_type\":\"", idPos);
      int typeStart = typePos + 16;
      int typeEnd = StringFind(response, "\"", typeStart);
      string commandType = StringSubstr(response, typeStart, typeEnd - typeStart);
      
      Print("Processing command: ", commandId, " Type: ", commandType);
      
      bool success = false;
      string resultMsg = "";
      
      if(commandType == "PLACE_ORDER")
      {
         success = ExecutePlaceOrder(response, idPos, resultMsg);
      }
      else if(commandType == "CLOSE_ORDER")
      {
         success = ExecuteCloseOrder(response, idPos, resultMsg);
      }
      else if(commandType == "PAUSE_BOT")
      {
         botStatus = "PAUSED";
         success = true;
         resultMsg = "Bot paused";
      }
      else if(commandType == "RESUME_BOT")
      {
         botStatus = "RUNNING";
         success = true;
         resultMsg = "Bot resumed";
      }
      
      // Update command status
      UpdateCommandStatus(commandId, success ? "EXECUTED" : "FAILED", resultMsg);
      
      searchPos = idEnd;
   }
}

//+------------------------------------------------------------------+
//| Update command status in Supabase                                |
//+------------------------------------------------------------------+
void UpdateCommandStatus(string commandId, string status, string resultMsg)
{
   StringReplace(resultMsg, "\"", "\\\"");
   
   string json = "{";
   json += "\"status\":\"" + status + "\",";
   json += "\"result\":{\"message\":\"" + resultMsg + "\"},";
   json += "\"executed_at\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
   json += "}";
   
   SupabaseUpdate("commands", "id=eq." + commandId, json);
}

//+------------------------------------------------------------------+
//| Execute PLACE_ORDER command                                      |
//+------------------------------------------------------------------+
bool ExecutePlaceOrder(string response, int startPos, string &resultMsg)
{
   string symbol = ExtractJsonString(response, "symbol", startPos);
   string type = ExtractJsonString(response, "type", startPos);
   double volume = ExtractJsonDouble(response, "volume", startPos);
   double sl = ExtractJsonDouble(response, "sl", startPos);
   double tp = ExtractJsonDouble(response, "tp", startPos);
   
   return PlaceOrder(symbol, type, volume, sl, tp, "from_web_app", resultMsg);
}

//+------------------------------------------------------------------+
//| Execute CLOSE_ORDER command                                      |
//+------------------------------------------------------------------+
bool ExecuteCloseOrder(string response, int startPos, string &resultMsg)
{
   double ticketDouble = ExtractJsonDouble(response, "ticket", startPos);
   ulong ticket = (ulong)ticketDouble;
   
   return ClosePosition(ticket, resultMsg);
}

//+------------------------------------------------------------------+
//| Place order                                                      |
//+------------------------------------------------------------------+
bool PlaceOrder(string symbol, string type, double volume, double sl, double tp, string comment, string &resultMsg)
{
   if(!SymbolSelect(symbol, true))
   {
      resultMsg = "Symbol not found: " + symbol;
      return false;
   }
   
   MqlTradeRequest request;
   MqlTradeResult result;
   ZeroMemory(request);
   ZeroMemory(result);
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = symbol;
   request.volume = volume;
   request.type = (type == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   request.price = (type == "BUY") ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID);
   request.sl = sl;
   request.tp = tp;
   request.deviation = 10;
   request.magic = MAGIC_NUMBER;
   request.comment = comment;
   request.type_filling = ORDER_FILLING_IOC;
   
   if(!OrderSend(request, result))
   {
      resultMsg = "Order failed. Error: " + IntegerToString(GetLastError());
      return false;
   }
   
   if(result.retcode == TRADE_RETCODE_DONE || result.retcode == TRADE_RETCODE_PLACED)
   {
      resultMsg = "Order placed. Ticket: " + IntegerToString(result.order);
      return true;
   }
   
   resultMsg = "Order rejected. RetCode: " + IntegerToString(result.retcode);
   return false;
}

//+------------------------------------------------------------------+
//| Close position                                                   |
//+------------------------------------------------------------------+
bool ClosePosition(ulong ticket, string &resultMsg)
{
   if(!PositionSelectByTicket(ticket))
   {
      resultMsg = "Position not found";
      return false;
   }
   
   MqlTradeRequest request;
   MqlTradeResult result;
   ZeroMemory(request);
   ZeroMemory(result);
   
   request.action = TRADE_ACTION_DEAL;
   request.position = ticket;
   request.symbol = PositionGetString(POSITION_SYMBOL);
   request.volume = PositionGetDouble(POSITION_VOLUME);
   request.type = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   request.price = (request.type == ORDER_TYPE_SELL) ? SymbolInfoDouble(request.symbol, SYMBOL_BID) : SymbolInfoDouble(request.symbol, SYMBOL_ASK);
   request.deviation = 10;
   request.magic = MAGIC_NUMBER;
   request.type_filling = ORDER_FILLING_IOC;
   
   if(OrderSend(request, result))
   {
      resultMsg = "Position closed";
      return true;
   }
   
   resultMsg = "Close failed. Error: " + IntegerToString(GetLastError());
   return false;
}

//+------------------------------------------------------------------+
//| Helper functions                                                 |
//+------------------------------------------------------------------+
string DoubleToJSON(double value, int digits)
{
   string result = DoubleToString(value, digits);
   StringReplace(result, ",", ".");
   return result;
}

string TimeframeToString(ENUM_TIMEFRAMES tf)
{
   switch(tf)
   {
      case PERIOD_M1:  return "M1";
      case PERIOD_M5:  return "M5";
      case PERIOD_M15: return "M15";
      case PERIOD_M30: return "M30";
      case PERIOD_H1:  return "H1";
      case PERIOD_H4:  return "H4";
      case PERIOD_D1:  return "D1";
      case PERIOD_W1:  return "W1";
      case PERIOD_MN1: return "MN1";
      default:         return "H1";
   }
}

string ExtractJsonString(string json, string key, int startPos)
{
   string searchKey = "\"" + key + "\":\"";
   int keyPos = StringFind(json, searchKey, startPos);
   if(keyPos < 0) return "";
   
   int valueStart = keyPos + StringLen(searchKey);
   int valueEnd = StringFind(json, "\"", valueStart);
   if(valueEnd < 0) return "";
   
   return StringSubstr(json, valueStart, valueEnd - valueStart);
}

double ExtractJsonDouble(string json, string key, int startPos)
{
   string searchKey = "\"" + key + "\":";
   int keyPos = StringFind(json, searchKey, startPos);
   if(keyPos < 0) return 0;
   
   int valueStart = keyPos + StringLen(searchKey);
   int valueEnd = valueStart;
   
   while(valueEnd < StringLen(json))
   {
      string ch = StringSubstr(json, valueEnd, 1);
      if(ch == "," || ch == "}" || ch == "]") break;
      valueEnd++;
   }
   
   string valueStr = StringSubstr(json, valueStart, valueEnd - valueStart);
   StringTrimLeft(valueStr);
   StringTrimRight(valueStr);
   
   return StringToDouble(valueStr);
}

//+------------------------------------------------------------------+
//| Supabase REST API Functions                                      |
//+------------------------------------------------------------------+

void SupabaseInsert(string table, string json)
{
   string url = SUPABASE_URL + "/rest/v1/" + table;
   string headers = "Content-Type: application/json\r\n";
   headers += "apikey: " + SUPABASE_KEY + "\r\n";
   headers += "Authorization: Bearer " + SUPABASE_KEY + "\r\n";
   headers += "Prefer: return=minimal\r\n";
   
   SendRequest("POST", url, headers, json);
}

void SupabaseInsertBatch(string table, string jsonArray)
{
   string url = SUPABASE_URL + "/rest/v1/" + table;
   string headers = "Content-Type: application/json\r\n";
   headers += "apikey: " + SUPABASE_KEY + "\r\n";
   headers += "Authorization: Bearer " + SUPABASE_KEY + "\r\n";
   headers += "Prefer: return=minimal\r\n";
   
   SendRequest("POST", url, headers, jsonArray);
}

void SupabaseUpsert(string table, string json)
{
   string url = SUPABASE_URL + "/rest/v1/" + table + "?on_conflict=account_id";
   string headers = "Content-Type: application/json\r\n";
   headers += "apikey: " + SUPABASE_KEY + "\r\n";
   headers += "Authorization: Bearer " + SUPABASE_KEY + "\r\n";
   headers += "Prefer: resolution=merge-duplicates,return=minimal\r\n";
   
   SendRequest("POST", url, headers, json);
}

void SupabaseUpdate(string table, string filter, string json)
{
   string url = SUPABASE_URL + "/rest/v1/" + table + "?" + filter;
   string headers = "Content-Type: application/json\r\n";
   headers += "apikey: " + SUPABASE_KEY + "\r\n";
   headers += "Authorization: Bearer " + SUPABASE_KEY + "\r\n";
   headers += "Prefer: return=minimal\r\n";
   
   SendRequest("PATCH", url, headers, json);
}

void SupabaseDelete(string table, string filter)
{
   string url = SUPABASE_URL + "/rest/v1/" + table + "?" + filter;
   string headers = "apikey: " + SUPABASE_KEY + "\r\n";
   headers += "Authorization: Bearer " + SUPABASE_KEY + "\r\n";
   
   char data[];
   char result[];
   string resultHeaders;
   
   WebRequest("DELETE", url, headers, 5000, data, result, resultHeaders);
}

string SupabaseSelect(string table, string filter)
{
   string url = SUPABASE_URL + "/rest/v1/" + table + "?" + filter;
   string headers = "apikey: " + SUPABASE_KEY + "\r\n";
   headers += "Authorization: Bearer " + SUPABASE_KEY + "\r\n";
   
   char data[];
   char result[];
   string resultHeaders;
   
   int res = WebRequest("GET", url, headers, 5000, data, result, resultHeaders);
   
   if(res >= 200 && res < 300)
   {
      return CharArrayToString(result);
   }
   
   return "";
}

void SendRequest(string method, string url, string headers, string jsonData)
{
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, post);
   int size = ArraySize(post);
   if(size > 0 && post[size-1] == 0)
   {
      ArrayResize(post, size - 1);
   }
   
   int res = WebRequest(method, url, headers, 5000, post, result, resultHeaders);
   
   if(res == -1)
   {
      int error = GetLastError();
      if(error == 4060)
      {
         Print("ERROR: Add Supabase URL to allowed list in MT5!");
         Print("Tools -> Options -> Expert Advisors -> Allow WebRequest for: ", SUPABASE_URL);
      }
   }
}
//+------------------------------------------------------------------+
