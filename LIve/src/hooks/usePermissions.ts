import { useState, useEffect } from 'react';
import { config } from '@/config/environment';

export interface UsePermissionsReturn {
  permissions: string[];
  loading: boolean;
  username: string | null;
  isActive: boolean;
  isAffiliate: boolean;
  contentModeEnabled: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isAffiliate, setIsAffiliate] = useState<boolean>(false);
  const [contentModeEnabled, setContentModeEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  const fetchPermissions = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/admin-users/me/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const perms = data.permissions || [];
        const user = data.user || {};
        
        setPermissions(perms);
        setUsername(user.username || null);
        setIsActive(user.is_active ?? true);
        setIsAffiliate(user.is_affiliate ?? false);
        setContentModeEnabled(user.content_mode_enabled ?? false);
        
        console.log(`[Permissions] Loaded ${perms.length} permissions for user: ${user.username}, is_affiliate: ${user.is_affiliate ?? false}, content_mode_enabled: ${user.content_mode_enabled ?? false}`);
        
        // Only auto-grant for "admin" user if they have no permissions
        if (perms.length === 0 && user.username === "admin") {
          console.log("[Permissions] Admin user has no permissions, attempting to grant all...");
          try {
            const grantResponse = await fetch(`${API_URL}/admin/admin-users/grant-all-to-admin`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (grantResponse.ok) {
              const grantData = await grantResponse.json();
              const newPerms = grantData.permissions || [];
              setPermissions(newPerms);
              console.log(`[Permissions] Auto-granted ${newPerms.length} permissions to admin`);
            }
          } catch (grantError) {
            console.error("[Permissions] Failed to auto-grant permissions:", grantError);
          }
        }
      } else {
        console.warn("[Permissions] Failed to fetch permissions:", response.status, response.statusText);
        setPermissions([]);
      }
    } catch (error) {
      console.error("[Permissions] Failed to fetch permissions:", error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [token]);

  const refreshPermissions = async () => {
    setLoading(true);
    await fetchPermissions();
  };

  const hasPermission = (permission: string): boolean => {
    // STRICT PERMISSION CHECK - NO FALLBACK
    // Only "admin" user with explicitly no permissions gets fallback
    // This ensures other users MUST have explicit permissions
    if (permissions.length === 0 && !loading) {
      if (username === "admin") {
        console.log("[Permissions] Admin user fallback - granting access");
        return true;
      }
      // For all other users, NO fallback
      console.log(`[Permissions] User "${username}" has no permissions, access DENIED for: ${permission}`);
      return false;
    }
    const hasAccess = permissions.includes(permission);
    if (!hasAccess) {
      console.log(`[Permissions] User "${username}" denied access to: ${permission}`);
    }
    return hasAccess;
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(perm => permissions.includes(perm));
  };

  return {
    permissions,
    loading,
    username,
    isActive,
    isAffiliate,
    contentModeEnabled,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };
};

