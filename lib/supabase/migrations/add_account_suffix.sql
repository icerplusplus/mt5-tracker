-- Add account_suffix column to bot_status table
ALTER TABLE bot_status 
ADD COLUMN IF NOT EXISTS account_suffix VARCHAR(10);

-- Add comment
COMMENT ON COLUMN bot_status.account_suffix IS 'Account type suffix: m for dollar account, c for cent account';
