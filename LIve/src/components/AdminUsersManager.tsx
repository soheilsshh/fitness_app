import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Save, X, UserPlus, Shield, CheckCircle, XCircle, ShieldOff, Link2, Copy, Check, Users, RefreshCw, FileText } from "lucide-react";
import { config } from '@/config/environment';
import { usePermissions } from '@/hooks/usePermissions';

interface AdminUser {
  id: number;
  username: string;
  is_active: boolean;
  is_affiliate?: boolean;
  affiliate_percentage?: number | null;
  content_mode_enabled?: boolean;
  name?: string | null;
  phone?: string | null;
  created_at: string;
  permissions?: AdminPermission[];
  permissions_count?: number;
}

interface AdminPermission {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
}

const AdminUsersManager: React.FC = () => {
  const { hasPermission, loading: permissionsLoading, refreshPermissions } = usePermissions();
  const canViewAdminUsers = hasPermission("admin_users.view");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    is_active: true,
    is_affiliate: false,
    affiliate_percentage: 0,
    content_mode_enabled: false,
    name: "",
    phone: "",
    selectedPermissions: [] as string[],
  });
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (permissionsLoading) return;
    if (canViewAdminUsers) {
      // CRITICAL: Don't auto-sync permissions - it would override user customizations
      // Only fetch data on mount
      fetchData(true); // Force refresh on mount
      
      // CRITICAL: Set up real-time polling to refresh permissions every 2 seconds
      // This ensures permissions are always up-to-date even if another admin changes them
      const pollingInterval = setInterval(() => {
        fetchData(true); // Force refresh on each poll
      }, 2000); // Poll every 2 seconds for real-time updates
      
      return () => {
        clearInterval(pollingInterval);
      };
    } else {
      setLoading(false);
    }
  }, [permissionsLoading, canViewAdminUsers]);

  const fetchData = async (forceRefresh: boolean = false) => {
    try {
      // CRITICAL: Add cache busting to ensure we always get fresh data
      const cacheBuster = `?t=${Date.now()}&_=${Math.random()}`;
      const response = await fetch(`${API_URL}/admin/admin-users${cacheBuster}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      console.log("📋 Fetched admin users data:", data);
      // Fetch fresh permissions for each user to ensure accuracy
      // CRITICAL: Add cache busting for individual user requests too
      const usersWithPermissions = await Promise.all(
        (data.users || []).map(async (user: AdminUser) => {
          try {
            const userCacheBuster = `?t=${Date.now()}&_=${Math.random()}`;
            const userResponse = await fetch(`${API_URL}/admin/admin-users/${user.id}${userCacheBuster}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log(`📋 Fetched fresh permissions for user ${user.username} (ID: ${user.id}):`, {
                permissionsCount: userData.user?.permissions?.length || 0,
                permissionKeys: userData.user?.permissions?.map((p: AdminPermission) => p.key) || [],
              });
              return {
                ...user,
                permissions: userData.user?.permissions || user.permissions || [],
                permissions_count: userData.user?.permissions_count ?? user.permissions_count ?? userData.user?.permissions?.length ?? user.permissions?.length ?? 0,
              };
            }
          } catch (err) {
            console.error(`Failed to fetch permissions for user ${user.id}:`, err);
          }
          return {
            ...user,
            permissions: user.permissions || [],
            permissions_count: user.permissions_count ?? user.permissions?.length ?? 0,
          };
        })
      );
      setUsers(usersWithPermissions);
      setPermissions(data.permissions || []);
      console.log("📋 All permissions received:", data.permissions || []);
      console.log("📋 Total permissions count:", (data.permissions || []).length);
      const paymentPerms = (data.permissions || []).filter((p: AdminPermission) => p.category === "payments");
      console.log("📋 Payments permissions:", paymentPerms);
      console.log("📋 Payment permissions count:", paymentPerms.length);
      console.log("📋 Payment permissions keys:", paymentPerms.map((p: AdminPermission) => p.key));
      console.log("📋 Looking for these payment permissions:");
      const expectedKeys = [
        "payments.view.installment_only",
        "payments.view.full_only",
        "payments.view.success_only",
        "payments.view.pending_only",
        "payments.view.landing_activity"
      ];
      expectedKeys.forEach(key => {
        const found = paymentPerms.find((p: AdminPermission) => p.key === key);
        console.log(`  - ${key}:`, found ? "✅ FOUND" : "❌ NOT FOUND", found);
      });
    } catch (error) {
      console.error("Failed to fetch admin users:", error);
      alert("خطا در دریافت لیست کاربران");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmedUsername = formData.username.trim();

    if (!trimmedUsername) {
      alert("لطفاً نام کاربری را وارد کنید");
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      alert("لطفاً رمز عبور را وارد کنید");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    setSaving(true);
    try {
      const url = editingUser
        ? `${API_URL}/admin/admin-users/${editingUser.id}`
        : `${API_URL}/admin/admin-users`;
      const method = editingUser ? "PUT" : "POST";

      const body: any = {
        username: trimmedUsername,
        is_active: formData.is_active,
        is_affiliate: formData.is_affiliate,
        content_mode_enabled: formData.content_mode_enabled,
        permissions: formData.selectedPermissions || [], // Always send permissions array (even if empty)
      };
      
      // Debug: Log what we're sending
      console.log("📤 Sending update request:", {
        userId: editingUser?.id,
        username: trimmedUsername,
        permissionsCount: formData.selectedPermissions.length,
        permissions: formData.selectedPermissions,
      });

      if (formData.is_affiliate) {
        body.affiliate_percentage = formData.affiliate_percentage || 0;
      }

      if (formData.name && formData.name.trim()) {
        body.name = formData.name.trim();
      }
      if (formData.phone && formData.phone.trim()) {
        body.phone = formData.phone.trim();
      }

      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new Error("این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید یا کاربر موجود را ویرایش کنید.");
        }
        throw new Error(errorData.error || "Failed to save user");
      }

      const responseData = await response.json().catch(() => ({}));
      console.log("✅ User saved successfully:", responseData);
      console.log("📋 Sent permissions:", formData.selectedPermissions);
      console.log("📋 Response user permissions:", responseData.user?.permissions?.map((p: AdminPermission) => p.key) || []);
      
      // CRITICAL: Force refresh to get latest data from database (bypass all caches)
      // Wait a moment to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reload data with force refresh to get updated permissions
      await fetchData(true);
      setShowAddModal(false);
      setEditingUser(null);
      resetForm();
      alert(editingUser ? "✅ کاربر با موفقیت به‌روزرسانی شد" : "✅ کاربر با موفقیت ایجاد شد");
    } catch (error: any) {
      console.error("Failed to save user:", error);
      alert("❌ خطا در ذخیره کاربر: " + (error.message || "خطای ناشناخته"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید کاربر "${username}" را حذف کنید؟`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/admin-users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete user");
      }

      await fetchData();
      alert("✅ کاربر با موفقیت حذف شد");
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      alert("❌ خطا در حذف کاربر: " + (error.message || "خطای ناشناخته"));
    }
  };

  const handleEdit = async (user: AdminUser) => {
    // Fetch fresh user data with permissions
    try {
      const response = await fetch(`${API_URL}/admin/admin-users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const freshUser = data.user || user;
        console.log("📋 Editing user with permissions:", freshUser);
        setEditingUser(freshUser);
        setFormData({
          username: freshUser.username,
          password: "",
          is_active: freshUser.is_active,
          is_affiliate: freshUser.is_affiliate || false,
          affiliate_percentage: freshUser.affiliate_percentage || 0,
          content_mode_enabled: freshUser.content_mode_enabled || false,
          name: freshUser.name || "",
          phone: freshUser.phone || "",
          selectedPermissions: freshUser.permissions?.map((p: AdminPermission) => p.key) || [],
        });
        setShowAddModal(true);
      } else {
        // Fallback to user data we have
        setEditingUser(user);
        setFormData({
          username: user.username,
          password: "",
          is_active: user.is_active,
          is_affiliate: user.is_affiliate || false,
          affiliate_percentage: user.affiliate_percentage || 0,
          content_mode_enabled: user.content_mode_enabled || false,
          name: user.name || "",
          phone: user.phone || "",
          selectedPermissions: user.permissions?.map(p => p.key) || [],
        });
        setShowAddModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      // Fallback to user data we have
      setEditingUser(user);
        setFormData({
          username: user.username,
          password: "",
          is_active: user.is_active,
          is_affiliate: user.is_affiliate || false,
          affiliate_percentage: user.affiliate_percentage || 0,
          content_mode_enabled: user.content_mode_enabled || false,
          name: user.name || "",
          phone: user.phone || "",
          selectedPermissions: user.permissions?.map(p => p.key) || [],
        });
      setShowAddModal(true);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      is_active: true,
      is_affiliate: false,
      affiliate_percentage: 0,
      content_mode_enabled: false,
      name: "",
      phone: "",
      selectedPermissions: [],
    });
    setEditingUser(null);
  };

  const togglePermission = (permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionKey)
        ? prev.selectedPermissions.filter(k => k !== permissionKey)
        : [...prev.selectedPermissions, permissionKey],
    }));
  };

  const generatePromoterLink = (userId: number) => {
    // Get the base URL from window location or config
    const baseUrl = window.location.origin;
    const landingUrl = `${baseUrl}?promoter=${userId}`;
    return landingUrl;
  };

  const handleCopyLink = async (userId: number) => {
    const link = generatePromoterLink(userId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(userId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      // Fallback: show link in alert
      alert(`لینک اختصاصی:\n${link}`);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, AdminPermission[]>);

  const categoryNames: Record<string, string> = {
    dashboard: "داشبورد",
    users: "کاربران",
    sms: "پیام‌های SMS",
    avanak: "تماس‌های صوتی",
    workflow: "گردش‌کارها",
    settings: "تنظیمات",
    tasks: "مدیریت تسک‌ها",
    admin_users: "مدیریت کاربران ادمین",
    payments: "پرداخت‌ها",
    licenses: "لایسنس‌ها",
    affiliates: "افیلیت‌ها",
  };

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!canViewAdminUsers) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center text-gray-300 border border-dashed border-gray-900 rounded-2xl bg-[#0a0a0a]" dir="rtl">
        <ShieldOff className="h-12 w-12 text-red-400" />
        <div>
          <p className="text-lg font-semibold text-white">دسترسی غیرمجاز</p>
          <p className="text-sm text-gray-400 mt-1">
            شما مجوز مشاهده و مدیریت کاربران ادمین را ندارید. در صورت نیاز با مدیر سیستم تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      <div className="space-y-4 sm:space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">مدیریت کاربران ادمین</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">ایجاد و مدیریت کاربران و دسترسی‌های ادمین پنل</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={async () => {
              try {
                const response = await fetch(`${API_URL}/admin/sync-permissions`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  alert(`✅ دسترسی‌ها با موفقیت همگام‌سازی شدند\nتعداد دسترسی‌ها: ${data.count}`);
                  await fetchData(); // Refresh permissions list
                  await refreshPermissions(); // Refresh current user permissions
                } else {
                  let errorMessage = "Failed to sync permissions";
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                  } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                  }
                  throw new Error(errorMessage);
                }
              } catch (error: any) {
                console.error("Failed to sync permissions:", error);
                alert("❌ خطا در همگام‌سازی دسترسی‌ها: " + (error.message || "خطای ناشناخته"));
              }
            }}
            variant="outline"
            className="w-full sm:w-auto bg-[#0f0f0f] border border-gray-700 hover:bg-[#151515] hover:border-gray-600 text-gray-300 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300"
            title="همگام‌سازی دسترسی‌ها با دیتابیس"
          >
            <RefreshCw className="h-4 w-4 sm:ml-2" />
            <span className="hidden sm:inline">همگام‌سازی دسترسی‌ها</span>
            <span className="sm:hidden">همگام‌سازی</span>
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300"
          >
            <UserPlus className="h-4 w-4 ml-2" />
            <span className="hidden sm:inline">افزودن کاربر جدید</span>
            <span className="sm:hidden">افزودن کاربر</span>
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="grid gap-3 sm:gap-4">
        {users.map((user) => (
          <Card key={user.id} className="bg-[#0f0f0f] border border-teal-500/30 rounded-xl sm:rounded-2xl overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      user.is_active ? 'bg-green-500/20' : 'bg-gray-500/20'
                    }`}>
                      <Shield className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        user.is_active ? 'text-green-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm sm:text-base truncate">{user.username}</span>
                        {user.is_active ? (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded flex-shrink-0">فعال</span>
                        ) : (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded flex-shrink-0">غیرفعال</span>
                        )}
                        {user.is_affiliate && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-teal-500/20 text-cyan-400 text-xs rounded flex items-center gap-1 flex-shrink-0">
                            <Users size={10} className="sm:w-3 sm:h-3" />
                            افیلیت
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        {(user.permissions_count ?? user.permissions?.length ?? 0).toLocaleString('fa-IR')} دسترسی
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                    <Button
                      onClick={() => handleCopyLink(user.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-initial bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-all text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                      title="کپی لینک اختصاصی"
                    >
                      {copiedLink === user.id ? (
                        <>
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                          <span className="hidden sm:inline">کپی شد</span>
                          <span className="sm:hidden">کپی</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                          <span className="hidden sm:inline">لینک اختصاصی</span>
                          <span className="sm:hidden">لینک</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleEdit(user)}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-initial bg-black/30 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      onClick={() => handleDelete(user.id, user.username)}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-initial bg-black/30 border-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
                { (user.permissions && user.permissions.length > 0) && (
                  <div className="border-t border-white/5 pt-3">
                    <div className="text-xs text-gray-400 mb-2">دسترسی‌ها</div>
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.slice(0, 6).map((perm) => (
                        <span
                          key={`${user.id}-${perm.id}`}
                          className="px-2 py-1 text-xs rounded-lg bg-[#0f0f0f] border border-teal-500/20 text-gray-200"
                        >
                          {perm.name}
                        </span>
                      ))}
                      {user.permissions_count && user.permissions && user.permissions_count > user.permissions.length && (
                        <span className="text-xs text-gray-400">
                          +{user.permissions_count - user.permissions.length} دسترسی دیگر
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4 animate-fadeIn" dir="rtl" onClick={(e) => e.target === e.currentTarget && (setShowAddModal(false), resetForm())}>
          <Card className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-teal-500/30 shadow-2xl shadow-teal-900/20 w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[95vh] sm:rounded-3xl overflow-hidden rounded-none animate-slideUp">
            {/* Beautiful Header with Gradient */}
            <CardHeader className="sticky top-0 z-10 bg-gradient-to-r from-[#187272]/20 via-[#2a9c96]/20 to-[#26fce3]/20 backdrop-blur-xl border-b border-teal-500/30 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center shadow-lg shadow-[#26fce3]/30">
                    <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                {editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"}
              </CardTitle>
                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
                      {editingUser ? "ویرایش اطلاعات و دسترسی‌های کاربر" : "ایجاد کاربر جدید با دسترسی‌های مشخص"}
                    </p>
                  </div>
                </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                  className="text-gray-400 hover:text-white hover:bg-white/10 p-2 sm:p-2.5 rounded-xl transition-all duration-300"
              >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[calc(95vh-150px)] sm:max-h-[calc(95vh-180px)]">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-teal-500/20">
                  <div className="w-1 h-5 bg-gradient-to-b from-[#187272] to-[#26fce3] rounded-full"></div>
                  <h3 className="text-white font-bold text-base sm:text-lg">اطلاعات پایه</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2">
                      <span>نام کاربری</span>
                      <span className="text-red-400">*</span>
                    </label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="bg-[#0a0a0a] border border-teal-500/30 text-white text-sm sm:text-base rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/70 transition-all duration-300 hover:border-teal-500/50"
                  placeholder="مثال: admin"
                />
              </div>

              {/* Password */}
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2">
                      <span>رمز عبور</span>
                      {!editingUser && <span className="text-red-400">*</span>}
                      {editingUser && <span className="text-xs text-gray-500 font-normal">(خالی بگذارید برای عدم تغییر)</span>}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-[#0a0a0a] border border-teal-500/30 text-white text-sm sm:text-base rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/70 transition-all duration-300 hover:border-teal-500/50"
                  placeholder="حداقل 6 کاراکتر"
                />
              </div>

                  {/* Name */}
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-2">نام (برای ارسال SMS)</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#0a0a0a] border border-teal-500/30 text-white text-sm sm:text-base rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/70 transition-all duration-300 hover:border-teal-500/50"
                      placeholder="مثال: علی احمدی"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-2">شماره تماس (برای ارسال SMS)</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-[#0a0a0a] border border-teal-500/30 text-white text-sm sm:text-base rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/70 transition-all duration-300 hover:border-teal-500/50"
                      placeholder="مثال: 09123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-teal-500/20">
                  <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <h3 className="text-white font-bold text-base sm:text-lg">وضعیت و تنظیمات</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Is Active */}
                  <div className="flex items-center gap-3 p-4 rounded-xl sm:rounded-2xl bg-[#0a0a0a] border border-green-500/20 hover:border-green-500/40 transition-all duration-300 cursor-pointer group" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-green-500/50 bg-white/5 text-green-500 focus:ring-2 focus:ring-green-500/50 cursor-pointer accent-green-500"
                />
                    <div className="flex-1">
                      <label htmlFor="is_active" className="text-white font-semibold text-sm sm:text-base cursor-pointer block">کاربر فعال است</label>
                      <p className="text-gray-400 text-xs mt-0.5">کاربر می‌تواند وارد سیستم شود</p>
                    </div>
                    {formData.is_active && (
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0" />
                    )}
              </div>

              {/* Is Affiliate */}
                  <div className="flex items-center gap-3 p-4 rounded-xl sm:rounded-2xl bg-[#0a0a0a] border border-teal-500/20 hover:border-teal-500/40 transition-all duration-300 cursor-pointer group" onClick={() => setFormData({ ...formData, is_affiliate: !formData.is_affiliate })}>
                <input
                  type="checkbox"
                  id="is_affiliate"
                  checked={formData.is_affiliate}
                  onChange={(e) => setFormData({ ...formData, is_affiliate: e.target.checked })}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-teal-500/50 bg-white/5 text-teal-500 focus:ring-2 focus:ring-teal-500/50 cursor-pointer accent-teal-500"
                />
                    <div className="flex-1">
                      <label htmlFor="is_affiliate" className="text-white font-semibold text-sm sm:text-base cursor-pointer block">افیلیت فعال</label>
                      <p className="text-gray-400 text-xs mt-0.5">دسترسی‌های محدود افیلیت</p>
                    </div>
                    {formData.is_affiliate && (
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Affiliate Percentage - Only show if is_affiliate is true */}
                {formData.is_affiliate && (
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2">
                      <span>درصد سود افیلیت</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.affiliate_percentage}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, affiliate_percentage: Math.min(100, Math.max(0, value)) });
                      }}
                      className="bg-[#0a0a0a] border border-teal-500/30 text-white text-sm sm:text-base rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/70 transition-all duration-300 hover:border-teal-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="مثال: 20 (برای 20%)"
                    />
                    <p className="text-gray-400 text-xs mt-1">درصد سود از مجموع پرداخت‌های موفق (0 تا 100)</p>
                  </div>
                )}

                {/* Content Mode Enabled */}
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-3 p-4 rounded-xl sm:rounded-2xl bg-[#0a0a0a] border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group" onClick={() => setFormData({ ...formData, content_mode_enabled: !formData.content_mode_enabled })}>
                    <input
                      type="checkbox"
                      id="content_mode_enabled"
                      checked={formData.content_mode_enabled}
                      onChange={(e) => setFormData({ ...formData, content_mode_enabled: e.target.checked })}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-cyan-500/50 bg-white/5 text-cyan-500 focus:ring-2 focus:ring-cyan-500/50 cursor-pointer accent-cyan-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="content_mode_enabled" className="text-white font-semibold text-sm sm:text-base cursor-pointer block">حالت محتوا سازی</label>
                      <p className="text-gray-400 text-xs mt-0.5">دسترسی به حالت محتوا سازی در تسک منیجر</p>
                    </div>
                    {formData.content_mode_enabled && (
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-teal-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                    <h3 className="text-white font-bold text-base sm:text-lg">دسترسی‌ها</h3>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-teal-500/20 border border-teal-500/30">
                    <span className="text-cyan-300 text-xs sm:text-sm font-semibold">
                      {formData.selectedPermissions.length} دسترسی انتخاب شده
                    </span>
              </div>
              </div>

                <div className="space-y-4 max-h-80 sm:max-h-[32rem] overflow-y-auto pr-2 scrollbar-thin">
                  {Object.entries(groupedPermissions).map(([category, perms]) => {
                    // Debug: Log payments category
                    if (category === "payments") {
                      console.log("📋 Payments category permissions:", perms);
                    }
                    return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-0.5 h-4 bg-blue-500/50 rounded-full"></div>
                        <h4 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-400" />
                        {categoryNames[category] || category}
                      </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        {perms.map((perm) => {
                          const isSelected = formData.selectedPermissions.includes(perm.key);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermission(perm.key)}
                              className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all duration-300 group ${
                                isSelected
                                  ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/10"
                                  : "bg-[#0a0a0a] border-teal-500/20 hover:bg-[#0f0f0f] hover:border-teal-500/40"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 mt-0.5 transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
                                    {isSelected ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    ) : (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 border-gray-600 bg-[#0f0f0f] group-hover:border-teal-500/50 transition-colors duration-300 flex items-center justify-center">
                                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 group-hover:text-cyan-400 transition-colors duration-300" />
                                    </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-sm sm:text-base font-semibold ${
                                      isSelected ? "text-green-300" : "text-white"
                                    }`}>
                                      {perm.name}
                                    </span>
                                  </div>
                                  {perm.description && (
                                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-2">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-6 border-t border-teal-500/20">
                <Button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="order-2 sm:order-1 bg-[#0f0f0f] border border-gray-700/50 text-gray-300 hover:bg-[#1a1a1a] hover:border-gray-600/50 hover:text-white text-sm sm:text-base py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all duration-300"
                >
                  <X className="h-4 w-4 ml-2" />
                  انصراف
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="order-1 sm:order-2 flex-1 bg-gradient-to-r from-[#187272] via-[#2a9c96] to-[#26fce3] hover:from-[#2a9c96] hover:via-[#58cac0] hover:to-[#58cac0] text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-lg shadow-[#26fce3]/20 hover:shadow-[#26fce3]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 ml-2" />
                      {editingUser ? "💾 به‌روزرسانی کاربر" : "✨ ایجاد کاربر"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminUsersManager;

