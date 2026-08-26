-- Production / current 21-day challenge database
CREATE DATABASE fitino_challenge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fitino_challenge'@'localhost' IDENTIFIED BY 'Ch4llenge21-Fitino-2026';
GRANT ALL PRIVILEGES ON fitino_challenge.* TO 'fitino_challenge'@'localhost';

-- Local/main alternate schema (kept so neither side is dropped)
CREATE DATABASE IF NOT EXISTS fitino_21day CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'fitino_21day_user'@'localhost' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON fitino_21day.* TO 'fitino_21day_user'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;
