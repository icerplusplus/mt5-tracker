//+------------------------------------------------------------------+
//|                                        MT5_WebApp_Connector.mq5 |
//|                                  Real-time Web App Integration |
//+------------------------------------------------------------------+
#property copyright "MT5 Trading Dashboard"
#property version   "1.00"
#property strict

// Input parameters
input string API_URL = "127.0.0.1:3000/api/mt5";  // Web App API URL
input string API_KEY = "your_secure_api_key_here";        // API Key for authentication
input int UPDATE_INTERVAL = 1;                             // Update interval in seconds (1 = realtime)
input int MAGIC_NUMBER = 123456;                           // Magic number for orders
input ENUM_TIMEFRAMES CHART_TIMEFRAME = PERIOD_H1;         // Timeframe for chart data (H1 default)
input int BARS_TO_SEND = 100;                              // Number of bars to send

// Global variables
datetime lastUpdate = 0;
datetime lastChartUpdate = 0;
datetime lastTickUpdate = 0;
datetime lastPositionUpdate = 0;
string botStatus = "RUNNING";
string accountSuffix = ""; // "m" for dollar account, "c" for cent account

//+------------------------------------------------------------------+
//| Detect account type from symbol suffix                          |
//+------------------------------------------------------------------+
string DetectAccountSuffix()
{
   // Get current chart symbol
   string currentSymbol = Symbol();
   int len = StringLen(currentSymbol);
   
   if(len > 0)
   {
      // Check last character
      string lastChar = StringSubstr(currentSymbol, len - 1, 1);
      
      if(lastChar == "m" || lastChar == "M")
      {
         Print("Detected DOLLAR account (suffix: m)");
         return "m";
      }
      else if(lastChar == "c" || lastChar == "C")
      {
         Print("Detected CENT account (suffix: c)");
         return "c";
      }
   }
   
   // Default: check if any symbol in Market Watch has suffix
   int total = SymbolsTotal(true);
   for(int i = 0; i < MathMin(total, 10); i++) // Check first 10 symbols
   {
      string sym = SymbolName(i, true);
      int symLen = StringLen(sym);
      if(symLen > 0)
      {
         string lastChar = StringSubstr(sym, symLen - 1, 1);
         if(lastChar == "m" || lastChar == "M")
         {
            Print("Detected DOLLAR account from Market Watch (suffix: m)");
            return "m";
         }
         else if(lastChar == "c" || lastChar == "C")
         {
            Print("Detected CENT account from Market Watch (suffix: c)");
            return "c";
         }
      }
   }
   
   Print("No suffix detected, using default (m)");
   return "m"; // Default to dollar account
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("MT5 WebApp Connector initialized");
   Print("API URL: ", API_URL);
   
   // Detect account type
   accountSuffix = DetectAccountSuffix();
   
   // Send initial bot status
   SendBotStatus();
   SendAccountInfo();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("MT5 WebApp Connector stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Send tick data for realtime candle updates (every second)
   if(TimeCurrent() - lastTickUpdate >= 1)
   {
      lastTickUpdate = TimeCurrent();
      SendTickData();
   }
   
   // Send positions every 0.5 seconds for FAST profit updates
   // Much faster than 1 second, but not overwhelming like every tick
   static datetime lastPositionSend = 0;
   if(GetTickCount() - lastPositionSend >= 500) // 500ms = 0.5 seconds
   {
      lastPositionSend = GetTickCount();
      SendOpenPositions();
   }
   
   // Update other data at specified interval
   if(TimeCurrent() - lastUpdate >= UPDATE_INTERVAL)
   {
      lastUpdate = TimeCurrent();
      
      // Send updates to web app
      SendAccountInfo();
      SendBotStatus();
      
      // Check for pending commands
      CheckCommands();
   }
   
   // Send chart data every 5 seconds for realtime updates
   if(TimeCurrent() - lastChartUpdate >= 5)
   {
      lastChartUpdate = TimeCurrent();
      SendChartData();
   }
}

//+------------------------------------------------------------------+
//| Send account information to web app                              |
//+------------------------------------------------------------------+
void SendAccountInfo()
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double marginLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   double profit = AccountInfoDouble(ACCOUNT_PROFIT);
   
   // Build JSON manually without StringFormat to avoid locale issues
   string json = "{";
   json += "\"balance\":" + DoubleToJSON(balance, 2);
   json += ",\"equity\":" + DoubleToJSON(equity, 2);
   json += ",\"margin\":" + DoubleToJSON(margin, 2);
   json += ",\"free_margin\":" + DoubleToJSON(freeMargin, 2);
   json += ",\"margin_level\":" + DoubleToJSON(marginLevel, 2);
   json += ",\"profit\":" + DoubleToJSON(profit, 2);
   json += "}";
   
   SendPostRequest("/account-info", json);
}

//+------------------------------------------------------------------+
//| Convert double to JSON-safe string (replace comma with dot)     |
//+------------------------------------------------------------------+
string DoubleToJSON(double value, int digits)
{
   string result = DoubleToString(value, digits);
   // Replace comma with dot for JSON compatibility
   StringReplace(result, ",", ".");
   return result;
}

//+------------------------------------------------------------------+
//| Send open positions to web app                                   |
//+------------------------------------------------------------------+
void SendOpenPositions()
{
   int total = PositionsTotal();
   Print("📊 Sending ", total, " open positions");
   
   string json = "{\"positions\":[";
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(i > 0) json += ",";
         
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
         
         Print("  Position #", i+1, ": ", symbol, " ", type, " ", volume, " lots, Profit: ", profit);
         
         // Escape comment for JSON
         StringReplace(comment, "\"", "\\\"");
         
         json += "{";
         json += "\"ticket\":" + IntegerToString(ticket);
         json += ",\"symbol\":\"" + symbol + "\"";
         json += ",\"type\":\"" + type + "\"";
         json += ",\"volume\":" + DoubleToJSON(volume, 2);
         json += ",\"open_price\":" + DoubleToJSON(openPrice, 5);
         json += ",\"current_price\":" + DoubleToJSON(currentPrice, 5);
         json += ",\"profit\":" + DoubleToJSON(profit, 2);
         json += ",\"sl\":" + DoubleToJSON(sl, 5);
         json += ",\"tp\":" + DoubleToJSON(tp, 5);
         json += ",\"comment\":\"" + comment + "\"";
         json += ",\"magic_number\":" + IntegerToString(magic);
         json += ",\"open_time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\"";
         json += "}";
      }
   }
   
   json += "]}";
   
   if(total == 0) {
      Print("  No open positions");
   }
   
   SendPostRequest("/positions", json);
}

//+------------------------------------------------------------------+
//| Send bot status to web app                                       |
//+------------------------------------------------------------------+
void SendBotStatus()
{
   long accountNumber = AccountInfoInteger(ACCOUNT_LOGIN);
   string broker = AccountInfoString(ACCOUNT_COMPANY);
   
   // Escape broker name for JSON
   StringReplace(broker, "\"", "\\\"");
   
   string json = "{";
   json += "\"status\":\"" + botStatus + "\"";
   json += ",\"version\":\"1.0.0\"";
   json += ",\"account_number\":" + IntegerToString(accountNumber);
   json += ",\"broker\":\"" + broker + "\"";
   // Temporarily disabled until database column is added
   // json += ",\"account_suffix\":\"" + accountSuffix + "\"";
   json += "}";
   
   SendPostRequest("/bot-status", json);
}

//+------------------------------------------------------------------+
//| Send tick data for realtime candle updates                       |
//+------------------------------------------------------------------+
void SendTickData()
{
   string chartSymbol = Symbol();
   double bid = SymbolInfoDouble(chartSymbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(chartSymbol, SYMBOL_ASK);
   datetime currentTime = TimeCurrent();
   string timeframeStr = TimeframeToString(CHART_TIMEFRAME);
   
   string json = "{";
   json += "\"symbol\":\"" + chartSymbol + "\"";
   json += ",\"timeframe\":\"" + timeframeStr + "\"";
   json += ",\"timestamp\":\"" + TimeToString(currentTime, TIME_DATE|TIME_SECONDS) + "\"";
   json += ",\"bid\":" + DoubleToJSON(bid, 5);
   json += ",\"ask\":" + DoubleToJSON(ask, 5);
   json += "}";
   
   SendPostRequest("/tick-data", json);
}

//+------------------------------------------------------------------+
//| Send chart data to web app                                       |
//+------------------------------------------------------------------+
void SendChartData()
{
   // Get symbol from current chart
   string chartSymbol = Symbol();
   
   MqlRates rates[];
   int copied = CopyRates(chartSymbol, CHART_TIMEFRAME, 0, BARS_TO_SEND, rates);
   
   if(copied > 0)
   {
      string timeframeStr = TimeframeToString(CHART_TIMEFRAME);
      string json = "{\"bars\":[";
      
      for(int i = 0; i < copied; i++)
      {
         if(i > 0) json += ",";
         
         datetime barTime = rates[i].time;
         
         json += "{";
         json += "\"symbol\":\"" + chartSymbol + "\"";
         json += ",\"timeframe\":\"" + timeframeStr + "\"";
         json += ",\"timestamp\":\"" + TimeToString(barTime, TIME_DATE|TIME_SECONDS) + "\"";
         json += ",\"open\":" + DoubleToJSON(rates[i].open, 5);
         json += ",\"high\":" + DoubleToJSON(rates[i].high, 5);
         json += ",\"low\":" + DoubleToJSON(rates[i].low, 5);
         json += ",\"close\":" + DoubleToJSON(rates[i].close, 5);
         json += ",\"volume\":" + IntegerToString(rates[i].tick_volume);
         json += "}";
      }
      
      json += "]}";
      
      SendPostRequest("/chart-data", json);
      Print("Sent ", copied, " bars for ", chartSymbol, " ", timeframeStr);
   }
   else
   {
      Print("Failed to copy rates. Error: ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| Convert timeframe enum to string                                 |
//+------------------------------------------------------------------+
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
      default:         return "M5";
   }
}

//+------------------------------------------------------------------+
//| Convert timeframe string to enum                                 |
//+------------------------------------------------------------------+
ENUM_TIMEFRAMES StringToTimeframe(string tfStr)
{
   if(tfStr == "M1")   return PERIOD_M1;
   if(tfStr == "M5")   return PERIOD_M5;
   if(tfStr == "M15")  return PERIOD_M15;
   if(tfStr == "M30")  return PERIOD_M30;
   if(tfStr == "H1")   return PERIOD_H1;
   if(tfStr == "H2")   return PERIOD_H2;
   if(tfStr == "H4")   return PERIOD_H4;
   if(tfStr == "H8")   return PERIOD_H8;
   if(tfStr == "H12")  return PERIOD_H12;
   if(tfStr == "D1")   return PERIOD_D1;
   if(tfStr == "D3")   return PERIOD_D1; // MT5 doesn't have D3, use D1
   if(tfStr == "W1")   return PERIOD_W1;
   if(tfStr == "MN1")  return PERIOD_MN1;
   return PERIOD_H1; // Default to H1
}

//+------------------------------------------------------------------+
//| Send closed trades to web app                                    |
//+------------------------------------------------------------------+
void SendTradeHistory()
{
   string json = "{\"trades\":[";
   
   HistorySelect(0, TimeCurrent());
   int total = HistoryDealsTotal();
   int count = 0;
   
   for(int i = 0; i < total && count < 50; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT)
         {
            if(count > 0) json += ",";
            
            json += "{";
            json += "\"ticket\":" + IntegerToString(ticket) + ",";
            json += "\"symbol\":\"" + HistoryDealGetString(ticket, DEAL_SYMBOL) + "\",";
            json += "\"type\":\"" + (HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY ? "BUY" : "SELL") + "\",";
            json += "\"volume\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_VOLUME), 2) + ",";
            json += "\"open_price\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
            json += "\"close_price\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
            json += "\"open_time\":\"" + TimeToString(HistoryDealGetInteger(ticket, DEAL_TIME), TIME_DATE|TIME_SECONDS) + "\",";
            json += "\"close_time\":\"" + TimeToString(HistoryDealGetInteger(ticket, DEAL_TIME), TIME_DATE|TIME_SECONDS) + "\",";
            json += "\"profit\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) + ",";
            json += "\"commission\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_COMMISSION), 2) + ",";
            json += "\"swap\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_SWAP), 2) + ",";
            json += "\"comment\":\"" + HistoryDealGetString(ticket, DEAL_COMMENT) + "\",";
            json += "\"magic_number\":" + IntegerToString(HistoryDealGetInteger(ticket, DEAL_MAGIC));
            json += "}";
            
            count++;
         }
      }
   }
   
   json += "]}";
   
   SendPostRequest("/trades", json);
}

//+------------------------------------------------------------------+
//| Check for pending commands from web app                          |
//+------------------------------------------------------------------+
void CheckCommands()
{
   string response = SendGetRequest("/commands");
   
   if(StringLen(response) > 0)
   {
      // Parse and execute commands
      // This is a simplified version - you'll need proper JSON parsing
      ProcessCommands(response);
   }
}

//+------------------------------------------------------------------+
//| Process commands from web app                                    |
//+------------------------------------------------------------------+
void ProcessCommands(string response)
{
   // Parse JSON response and execute commands
   // Example: {"success":true,"data":[{"id":"xxx","command_type":"PLACE_ORDER","parameters":{...}}]}
   
   Print("Received commands: ", response);
   
   // Simple JSON parsing - find "data" array
   int dataPos = StringFind(response, "\"data\":[");
   if(dataPos < 0) {
      Print("No data array found in response");
      return;
   }
   
   // Find all command objects
   int searchPos = dataPos;
   while(true) {
      // Find next command object
      int idPos = StringFind(response, "\"id\":\"", searchPos);
      if(idPos < 0) break;
      
      // Extract command ID
      int idStart = idPos + 6;
      int idEnd = StringFind(response, "\"", idStart);
      string commandId = StringSubstr(response, idStart, idEnd - idStart);
      
      // Extract command type
      int typePos = StringFind(response, "\"command_type\":\"", idPos);
      int typeStart = typePos + 16;
      int typeEnd = StringFind(response, "\"", typeStart);
      string commandType = StringSubstr(response, typeStart, typeEnd - typeStart);
      
      Print("Processing command: ", commandId, " Type: ", commandType);
      
      // Execute command based on type
      bool success = false;
      string resultMsg = "";
      
      if(commandType == "PLACE_ORDER") {
         success = ExecutePlaceOrder(response, idPos, resultMsg);
      }
      else if(commandType == "CLOSE_ORDER") {
         success = ExecuteCloseOrder(response, idPos, resultMsg);
      }
      else if(commandType == "REQUEST_CHART_DATA") {
         success = ExecuteRequestChartData(response, idPos, resultMsg);
      }
      else if(commandType == "PAUSE_BOT") {
         botStatus = "PAUSED";
         success = true;
         resultMsg = "Bot paused";
      }
      else if(commandType == "RESUME_BOT") {
         botStatus = "RUNNING";
         success = true;
         resultMsg = "Bot resumed";
      }
      else {
         resultMsg = "Unknown command type";
      }
      
      // Report execution result
      ReportCommandResult(commandId, success ? "EXECUTED" : "FAILED", resultMsg);
      
      searchPos = idEnd;
   }
}

//+------------------------------------------------------------------+
//| Execute PLACE_ORDER command                                      |
//+------------------------------------------------------------------+
bool ExecutePlaceOrder(string response, int startPos, string &resultMsg)
{
   // Extract parameters from JSON
   string symbol = ExtractJsonString(response, "symbol", startPos);
   string type = ExtractJsonString(response, "type", startPos);
   double volume = ExtractJsonDouble(response, "volume", startPos);
   double sl = ExtractJsonDouble(response, "sl", startPos);
   double tp = ExtractJsonDouble(response, "tp", startPos);
   string comment = ExtractJsonString(response, "comment", startPos);
   
   if(comment == "") comment = "from_web_app";
   
   Print("Placing order: ", symbol, " ", type, " ", volume, " lots");
   
   // Place the order
   bool result = PlaceOrder(symbol, type, volume, sl, tp, comment);
   
   if(result) {
      resultMsg = "Order placed successfully";
   } else {
      resultMsg = "Failed to place order. Error: " + IntegerToString(GetLastError());
   }
   
   return result;
}

//+------------------------------------------------------------------+
//| Execute CLOSE_ORDER command                                      |
//+------------------------------------------------------------------+
bool ExecuteCloseOrder(string response, int startPos, string &resultMsg)
{
   // Extract ticket from parameters (ticket is a number, not string)
   double ticketDouble = ExtractJsonDouble(response, "ticket", startPos);
   ulong ticket = (ulong)ticketDouble;
   
   Print("Closing position: ", ticket);
   
   bool result = ClosePosition(ticket);
   
   if(result) {
      resultMsg = "Position closed successfully";
   } else {
      resultMsg = "Failed to close position. Error: " + IntegerToString(GetLastError());
   }
   
   return result;
}

//+------------------------------------------------------------------+
//| Execute REQUEST_CHART_DATA command                               |
//+------------------------------------------------------------------+
bool ExecuteRequestChartData(string response, int startPos, string &resultMsg)
{
   // Extract symbol and timeframe from parameters
   string requestedSymbol = ExtractJsonString(response, "symbol", startPos);
   string requestedTimeframe = ExtractJsonString(response, "timeframe", startPos);
   
   if(requestedSymbol == "") {
      requestedSymbol = Symbol(); // Use current chart symbol if not specified
   }
   
   ENUM_TIMEFRAMES tf = CHART_TIMEFRAME; // Default
   if(requestedTimeframe != "") {
      tf = StringToTimeframe(requestedTimeframe);
   }
   
   string timeframeStr = TimeframeToString(tf);
   Print("Requesting chart data for: ", requestedSymbol, " ", timeframeStr);
   
   // Send chart data for requested symbol and timeframe
   MqlRates rates[];
   int copied = CopyRates(requestedSymbol, tf, 0, BARS_TO_SEND, rates);
   
   if(copied > 0)
   {
      string json = "{\"bars\":[";
      
      for(int i = 0; i < copied; i++)
      {
         if(i > 0) json += ",";
         
         datetime barTime = rates[i].time;
         
         json += "{";
         json += "\"symbol\":\"" + requestedSymbol + "\"";
         json += ",\"timeframe\":\"" + timeframeStr + "\"";
         json += ",\"timestamp\":\"" + TimeToString(barTime, TIME_DATE|TIME_SECONDS) + "\"";
         json += ",\"open\":" + DoubleToJSON(rates[i].open, 5);
         json += ",\"high\":" + DoubleToJSON(rates[i].high, 5);
         json += ",\"low\":" + DoubleToJSON(rates[i].low, 5);
         json += ",\"close\":" + DoubleToJSON(rates[i].close, 5);
         json += ",\"volume\":" + IntegerToString(rates[i].tick_volume);
         json += "}";
      }
      
      json += "]}";
      
      SendPostRequest("/chart-data", json);
      resultMsg = "Sent " + IntegerToString(copied) + " bars for " + requestedSymbol + " " + timeframeStr;
      Print(resultMsg);
      return true;
   }
   else
   {
      resultMsg = "Failed to copy rates for " + requestedSymbol + ". Error: " + IntegerToString(GetLastError());
      Print(resultMsg);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Extract string value from JSON                                   |
//+------------------------------------------------------------------+
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

//+------------------------------------------------------------------+
//| Extract double value from JSON                                   |
//+------------------------------------------------------------------+
double ExtractJsonDouble(string json, string key, int startPos)
{
   string searchKey = "\"" + key + "\":";
   int keyPos = StringFind(json, searchKey, startPos);
   if(keyPos < 0) return 0;
   
   int valueStart = keyPos + StringLen(searchKey);
   
   // Find end of number (comma, brace, or bracket)
   int valueEnd = valueStart;
   while(valueEnd < StringLen(json)) {
      string charss = StringSubstr(json, valueEnd, 1);
      if(charss == ",") break;
      if(charss == "}") break;
      if(charss == "]") break;
      valueEnd++;
   }
   
   string valueStr = StringSubstr(json, valueStart, valueEnd - valueStart);
   StringTrimLeft(valueStr);
   StringTrimRight(valueStr);
   
   return StringToDouble(valueStr);
}

//+------------------------------------------------------------------+
//| Report command execution result to web app                       |
//+------------------------------------------------------------------+
void ReportCommandResult(string commandId, string status, string resultMsg)
{
   string json = "{";
   json += "\"command_id\":\"" + commandId + "\",";
   json += "\"status\":\"" + status + "\",";
   json += "\"result\":{\"message\":\"" + resultMsg + "\"}";
   json += "}";
   
   SendPostRequest("/commands", json);
   Print("Reported result: ", status, " - ", resultMsg);
}

//+------------------------------------------------------------------+
//| Place order based on command                                     |
//+------------------------------------------------------------------+
bool PlaceOrder(string symbol, string type, double volume, double sl, double tp, string comment)
{
   // Validate symbol exists
   if(!SymbolSelect(symbol, true)) {
      Print("Symbol not found: ", symbol);
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
      Print("Order failed. Error: ", GetLastError(), " RetCode: ", result.retcode);
      return false;
   }
   
   if(result.retcode == TRADE_RETCODE_DONE || result.retcode == TRADE_RETCODE_PLACED)
   {
      Print("✅ Order placed successfully. Ticket: ", result.order, " Deal: ", result.deal);
      return true;
   }
   else
   {
      Print("❌ Order rejected. RetCode: ", result.retcode);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Close position based on command                                  |
//+------------------------------------------------------------------+
bool ClosePosition(ulong ticket)
{
   if(PositionSelectByTicket(ticket))
   {
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
         Print("Position closed successfully. Ticket: ", ticket);
         return true;
      }
      else
      {
         Print("Close failed. Error: ", GetLastError());
         return false;
      }
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Send POST request to web app                                     |
//+------------------------------------------------------------------+
void SendPostRequest(string endpoint, string jsonData)
{
   string url = API_URL + endpoint;
   string headers = "Content-Type: application/json\r\nX-API-Key: " + API_KEY + "\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   // Convert string to char array - StringToCharArray adds null terminator
   StringToCharArray(jsonData, post);
   
   // Remove the null terminator that StringToCharArray adds
   int size = ArraySize(post);
   if(size > 0 && post[size-1] == 0) {
      ArrayResize(post, size - 1);
   }
   
   // Debug: Print what we're sending
   Print("Sending to ", endpoint);
   Print("JSON: ", jsonData);
   Print("Array size: ", ArraySize(post));
   
   // WebRequest signature: (method, url, headers, timeout, data, result, resultHeaders)
   int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
   
   if(res == -1)
   {
      int error = GetLastError();
      Print("WebRequest error: ", error);
      if(error == 4060) {
         Print("ERROR: URL not in allowed list!");
         Print("Add this URL in MT5: Tools -> Options -> Expert Advisors");
         Print("URL to add: ", API_URL);
      }
   }
   else if(res >= 200 && res < 300)
   {
      Print("✓ Success! HTTP ", res);
   }
   else
   {
      Print("✗ HTTP Error: ", res);
      string response = CharArrayToString(result);
      if(StringLen(response) > 0) {
         Print("Response: ", response);
      }
   }
}

//+------------------------------------------------------------------+
//| Send GET request to web app                                      |
//+------------------------------------------------------------------+
string SendGetRequest(string endpoint)
{
   string url = API_URL + endpoint;
   string headers = "X-API-Key: " + API_KEY + "\r\n";
   
   char data[];    // Empty data for GET request
   char result[];
   string resultHeaders;
   
   // WebRequest signature: (method, url, headers, timeout, data, result, resultHeaders)
   int res = WebRequest("GET", url, headers, 5000, data, result, resultHeaders);
   
   if(res == -1)
   {
      Print("WebRequest error: ", GetLastError());
      return "";
   }
   
   return CharArrayToString(result);
}
//+------------------------------------------------------------------+
