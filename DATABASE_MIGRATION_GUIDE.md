# Database Migration Guide - Add account_suffix Column

## Issue
Error: `Could not find the 'account_suffix' column of 'bot_status' in the schema cache`

This error occurs because the `account_suffix` column doesn't exist in the `bot_status` table yet.

## Solution

You need to run the SQL migration to add the `account_suffix` column to your Supabase database.

## Step-by-Step Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Login to your account
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migration SQL**
   - Copy and paste this SQL:
   ```sql
   -- Add account_suffix column to bot_status table
   ALTER TABLE bot_status 
   ADD COLUMN IF NOT EXISTS account_suffix VARCHAR(10);

   -- Add comment
   COMMENT ON COLUMN bot_status.account_suffix IS 
     'Account type suffix: m for dollar account, c for cent account';
   ```

4. **Execute Query**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for success message

5. **Verify Column Added**
   - Go to "Table Editor" in left sidebar
   - Select "bot_status" table
   - Check if "account_suffix" column appears

### Option 2: Using Migration File

The migration file is already created at:
```
lib/supabase/migrations/add_account_suffix.sql
```

**Content:**
```sql
-- Add account_suffix column to bot_status table
ALTER TABLE bot_status 
ADD COLUMN IF NOT EXISTS account_suffix VARCHAR(10);

-- Add comment
COMMENT ON COLUMN bot_status.account_suffix IS 
  'Account type suffix: m for dollar account, c for cent account';
```

**To apply:**
1. Copy the SQL from the file
2. Paste into Supabase SQL Editor
3. Run the query

### Option 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Run migration
supabase db push
```

## After Migration

### 1. Restart EA Bot
After adding the column, you need to recompile and restart the EA Bot:

1. Open MetaEditor
2. Open `MT5_WebApp_Connector.mq5`
3. Uncomment this line in `SendBotStatus()`:
   ```mql5
   // Change from:
   // json += ",\"account_suffix\":\"" + accountSuffix + "\"";
   
   // To:
   json += ",\"account_suffix\":\"" + accountSuffix + "\"";
   ```
4. Compile (F7)
5. Attach to chart

### 2. Verify in Web App
1. Open web app at http://localhost:3000
2. Open Symbol Search Modal
3. Check if "Account Type" badge appears
4. Verify symbols have correct suffix (m or c)

## What This Column Does

### Purpose
The `account_suffix` column stores the account type detected by the EA Bot:
- **"m"** = Dollar account (symbols like BTCUSDm, ETHUSDm)
- **"c"** = Cent account (symbols like BTCUSDc, ETHUSDc)

### How It Works
1. EA Bot detects suffix from current chart symbol
2. Sends suffix to web app via `/api/mt5/bot-status`
3. Web app stores in database
4. Symbol Search Modal fetches suffix
5. All symbols automatically get correct suffix

### Example
If you're using a dollar account:
- EA Bot detects: `BTCUSDm` → suffix = "m"
- Web app shows: BTCUSD → BTCUSDm, ETHUSD → ETHUSDm, etc.

## Troubleshooting

### Error Still Appears After Migration
1. **Clear Supabase cache**
   - In Supabase Dashboard, go to Settings → API
   - Click "Restart API" button
   - Wait 30 seconds

2. **Verify column exists**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'bot_status';
   ```

3. **Check column permissions**
   ```sql
   -- Grant permissions if needed
   GRANT SELECT, INSERT, UPDATE ON bot_status TO authenticated;
   GRANT SELECT, INSERT, UPDATE ON bot_status TO anon;
   ```

### EA Bot Still Sending Old Data
1. Remove EA Bot from chart
2. Recompile in MetaEditor
3. Attach to chart again
4. Check Expert Advisor logs

### Web App Not Showing Suffix
1. Clear browser cache
2. Restart development server:
   ```bash
   pnpm dev
   ```
3. Check browser console for errors

## Current Status

### Temporarily Disabled
The `account_suffix` feature is currently **disabled** in the EA Bot to prevent errors:

**EA Bot (`mt5-ea-bot/MT5_WebApp_Connector.mq5`):**
```mql5
// Line 241 - Commented out
// json += ",\"account_suffix\":\"" + accountSuffix + "\"";
```

**Web App (`app/api/mt5/bot-status/route.ts`):**
```typescript
// Optional field - won't cause error if missing
const account_suffix = body.account_suffix;
if (account_suffix) {
  updateData.account_suffix = account_suffix;
}
```

### To Enable
1. Run database migration (see above)
2. Uncomment line in EA Bot
3. Recompile and restart EA Bot
4. Feature will work automatically

## Migration SQL (Copy-Paste Ready)

```sql
-- Add account_suffix column to bot_status table
ALTER TABLE bot_status 
ADD COLUMN IF NOT EXISTS account_suffix VARCHAR(10);

-- Add comment explaining the column
COMMENT ON COLUMN bot_status.account_suffix IS 
  'Account type suffix: m for dollar account, c for cent account';

-- Verify column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'bot_status' 
  AND column_name = 'account_suffix';
```

Expected output:
```
column_name      | data_type        | character_maximum_length
-----------------+------------------+-------------------------
account_suffix   | character varying| 10
```

## Summary

1. ✅ Migration file created: `lib/supabase/migrations/add_account_suffix.sql`
2. ✅ EA Bot code updated (temporarily disabled)
3. ✅ Web App code updated (handles missing column)
4. ⏳ **Action Required**: Run SQL migration in Supabase
5. ⏳ **Action Required**: Uncomment EA Bot code after migration
6. ⏳ **Action Required**: Recompile and restart EA Bot

## Need Help?

If you encounter issues:
1. Check Supabase logs in Dashboard
2. Check EA Bot logs in MetaTrader
3. Check browser console in web app
4. Verify database connection in `.env.local`

The app will work fine without this feature - it just won't auto-detect account type and add suffix to symbols.
