-- Create the database
CREATE DATABASE monetizeai_free_farsi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a user (replace 'yourpassword' with a strong password)
CREATE USER 'monetizeai_free_user'@'localhost' IDENTIFIED BY 'mgstudio884';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON monetizeai_free_farsi.* TO 'monetizeai_free_user'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;