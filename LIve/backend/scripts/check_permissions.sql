-- Script to check admin user permissions
-- Run this to diagnose permission issues

-- 1. Check all admin users
SELECT id, username, is_active, created_at 
FROM admin_users 
ORDER BY id;

-- 2. Check all permissions
SELECT id, `key`, name, category 
FROM admin_permissions 
ORDER BY category, name;

-- 3. Check admin_user_permissions join table
SELECT 
    aup.admin_user_id,
    au.username,
    aup.admin_permission_id,
    ap.`key` as permission_key,
    ap.name as permission_name
FROM admin_user_permissions aup
JOIN admin_users au ON aup.admin_user_id = au.id
JOIN admin_permissions ap ON aup.admin_permission_id = ap.id
ORDER BY au.username, ap.category, ap.name;

-- 4. Count permissions per user
SELECT 
    au.id,
    au.username,
    COUNT(aup.admin_permission_id) as permission_count
FROM admin_users au
LEFT JOIN admin_user_permissions aup ON au.id = aup.admin_user_id
GROUP BY au.id, au.username
ORDER BY au.id;

-- 5. Check specific user (replace 'admin4' with your username)
SELECT 
    au.username,
    ap.`key` as permission_key,
    ap.name as permission_name,
    ap.category
FROM admin_users au
LEFT JOIN admin_user_permissions aup ON au.id = aup.admin_user_id
LEFT JOIN admin_permissions ap ON aup.admin_permission_id = ap.id
WHERE au.username = 'admin4'
ORDER BY ap.category, ap.name;

-- 6. Find users with no permissions
SELECT 
    au.id,
    au.username,
    au.is_active
FROM admin_users au
LEFT JOIN admin_user_permissions aup ON au.id = aup.admin_user_id
WHERE aup.admin_permission_id IS NULL;

