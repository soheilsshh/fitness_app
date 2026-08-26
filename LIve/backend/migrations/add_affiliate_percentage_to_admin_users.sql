-- Migration: Add affiliate_percentage field to admin_users table
-- Date: 2024
-- Description: Adds affiliate_percentage field to track commission percentage for affiliate users

-- Check if column already exists before adding
SET @dbname = DATABASE();
SET @tablename = "admin_users";
SET @columnname = "affiliate_percentage";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column affiliate_percentage already exists in admin_users table.' AS result;",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " DECIMAL(5,2) DEFAULT 0 COMMENT 'درصد سود افیلیت (مثلاً 20.00 برای 20%)';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on affiliate_percentage for better query performance (optional)
-- CREATE INDEX IF NOT EXISTS idx_admin_users_affiliate_percentage ON admin_users(affiliate_percentage);

SELECT 'Migration completed: affiliate_percentage field added to admin_users table' AS result;
