-- Create the database
CREATE DATABASE fitino_21day CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a user (replace 'change_me' with a strong password)
CREATE USER 'fitino_21day_user'@'localhost' IDENTIFIED BY 'change_me';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON fitino_21day.* TO 'fitino_21day_user'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;
