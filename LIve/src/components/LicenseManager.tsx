import React, { useState, useEffect } from 'react';
import { formatJalali, toPersianDigits } from '@/utils/jalali';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, CheckCircle, XCircle, Key, Users, Package, Trash2 } from "lucide-react";
import { config } from '@/config/environment';
import { usePermissions } from '@/hooks/usePermissions';

interface License {
  id: number;
  code: string;
  is_used: boolean;
  user_id?: number;
  payment_id?: number;
  assigned_at?: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  };
  payment?: {
    id: number;
    ref_id: string;
    amount: number;
  };
}

interface LicenseStats {
  total: number;
  used: number;
  available: number;
}

const LicenseManager: React.FC = () => {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "available">("all");

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  const canViewLicenses = hasPermission("licenses.view");
  const canManageLicenses = hasPermission("licenses.manage");

  useEffect(() => {
    if (!canViewLicenses) {
      setLoading(false);
      return;
    }
    fetchStats();
    fetchLicenses();
  }, [canViewLicenses, page, statusFilter]);

  const fetchStats = async () => {
    if (!canViewLicenses) return;
    try {
      const response = await fetch(`${API_URL}/admin/licenses/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch license stats:", error);
    }
  };

  const fetchLicenses = async () => {
    if (!canViewLicenses) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`${API_URL}/admin/licenses?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLicenses(data.licenses || []);
        setTotalPages(data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !canManageLicenses) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/admin/licenses/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        let message = `✅ ${data.inserted} لایسنس با موفقیت آپلود شد`;
        if (data.duplicates > 0) {
          message += `\n⚠️ ${data.duplicates} لایسنس تکراری نادیده گرفته شد`;
        }
        if (data.invalid > 0) {
          message += `\n❌ ${data.invalid} لایسنس با فرمت نامعتبر حذف شد`;
          if (data.invalid_codes && data.invalid_codes.length > 0) {
            message += `\n\nلایسنس‌های نامعتبر:\n${data.invalid_codes.slice(0, 10).join('\n')}`;
            if (data.invalid_codes.length > 10) {
              message += `\n... و ${data.invalid_codes.length - 10} مورد دیگر`;
            }
          }
        }
        alert(message);
        setSelectedFile(null);
        fetchStats();
        fetchLicenses();
      } else {
        const error = await response.json();
        alert(`❌ خطا در آپلود: ${error.error || "خطای ناشناخته"}`);
      }
    } catch (error: any) {
      console.error("Failed to upload licenses:", error);
      alert(`❌ خطا در آپلود: ${error.message || "خطای ناشناخته"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!canManageLicenses) return;

    if (!confirm("⚠️ آیا مطمئن هستید که می‌خواهید همه لایسنس‌ها را حذف کنید؟\n\nاین عمل غیرقابل بازگشت است!")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/admin/licenses/all`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.deleted} لایسنس با موفقیت حذف شد\n(استفاده شده: ${data.used_count}, استفاده نشده: ${data.unused_count})`);
        fetchStats();
        fetchLicenses();
      } else {
        const error = await response.json();
        alert(`❌ خطا در حذف: ${error.error || "خطای ناشناخته"}`);
      }
    } catch (error: any) {
      console.error("Failed to delete all licenses:", error);
      alert(`❌ خطا در حذف: ${error.message || "خطای ناشناخته"}`);
    } finally {
      setDeleting(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!canViewLicenses) {
    return (
      <Card className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl overflow-hidden">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">شما دسترسی به این بخش را ندارید</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">کل لایسنس‌ها</p>
                <p className="text-2xl font-bold text-white">{stats?.total.toLocaleString('fa-IR') || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">استفاده شده</p>
                <p className="text-2xl font-bold text-emerald-400">{stats?.used.toLocaleString('fa-IR') || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">باقیمانده</p>
                <p className="text-2xl font-bold text-yellow-400">{stats?.available.toLocaleString('fa-IR') || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <Key className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      {canManageLicenses && (
        <Card className="bg-[#0f0f0f] border border-yellow-500/30 rounded-2xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                آپلود لایسنس‌ها
              </CardTitle>
              {stats && stats.total > 0 && (
                <Button
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  variant="destructive"
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      در حال حذف...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف همه لایسنس‌ها
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                فایل متنی لایسنس‌ها (هر خط یک لایسنس)
              </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileSelect}
                className="w-full bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 hover:bg-[#151515]"
              />
              <p className="text-xs text-gray-400 mt-2">
                فایل متنی باید شامل لایسنس‌ها باشد (هر خط یک لایسنس)
              </p>
              <p className="text-xs text-yellow-400 mt-1 font-medium">
                ⚠️ فرمت صحیح: XXXX-XXXXX-XXXXX-XXXXX (مثال: D98M-NA5VS-MSXG5-YWQBG)
              </p>
              <p className="text-xs text-red-400 mt-1">
                لایسنس‌هایی که فرمت صحیح نداشته باشند حذف می‌شوند
              </p>
            </div>
            {selectedFile && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm">{selectedFile.name}</span>
                </div>
              </div>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  در حال آپلود...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 ml-2" />
                  آپلود لایسنس‌ها
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Licenses List */}
      <Card className="bg-[#0a0a0a] border-2 border-white/20 rounded-2xl overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
              <Key className="h-5 w-5" />
              لیست لایسنس‌ها
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="text-xs"
              >
                همه
              </Button>
              <Button
                variant={statusFilter === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter("available");
                  setPage(1);
                }}
                className="text-xs"
              >
                موجود
              </Button>
              <Button
                variant={statusFilter === "used" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter("used");
                  setPage(1);
                }}
                className="text-xs"
              >
                استفاده شده
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center p-8 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>هیچ لایسنسی یافت نشد</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {licenses.map((license) => (
                  <div
                    key={license.id}
                    className={`bg-[#0f0f0f] border rounded-xl p-4 ${
                      license.is_used ? "border-emerald-600/30" : "border-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-white font-mono text-sm">{license.code}</code>
                          {license.is_used ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 font-medium text-xs border border-emerald-600/50">
                              <CheckCircle size={12} />
                              استفاده شده
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-600/30 text-gray-300 font-medium text-xs border border-gray-600/50">
                              <XCircle size={12} />
                              موجود
                            </span>
                          )}
                        </div>
                        {license.is_used && license.user && (
                          <div className="text-xs text-gray-400 mt-2">
                            <p>کاربر: {license.user.first_name} {license.user.last_name}</p>
                            <p className="font-mono" dir="ltr">{license.user.phone}</p>
                          </div>
                        )}
                        {license.assigned_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            تاریخ اختصاص: {toPersianDigits(formatJalali(new Date(license.assigned_at), 'YYYY/MM/DD'))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    قبلی
                  </Button>
                  <span className="text-gray-400 text-sm">
                    صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    بعدی
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseManager;

