-- Create the database
CREATE DATABASE fitino_challenge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a user (replace 'yourpassword' with a strong password)
CREATE USER 'fitino_challenge'@'localhost' IDENTIFIED BY 'Ch4llenge21-Fitino-2026';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON fitino_challenge.* TO 'fitino_challenge'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;