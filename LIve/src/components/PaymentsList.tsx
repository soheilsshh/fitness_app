import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2, DollarSign, CheckCircle, XCircle, Clock, Eye, Download, Filter, Calendar, User, X, Search, Plus, CreditCard, Calendar as CalendarIcon, Timer, TrendingUp, Trash2, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { config } from "@/config/environment";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  formatJalali as formatJalaliImport, 
  toJalali, 
  getJalaliDate as getJalaliDateImport, 
  getJalaliMonthName as getJalaliMonthNameImport, 
  getJalaliDayName as getJalaliDayNameImport, 
  toPersianDigits as toPersianDigitsImport 
} from "@/utils/jalali";

// Fallback functions: use imported version, window fallback, or inline implementation
const formatJalali = formatJalaliImport || 
  (typeof window !== 'undefined' && (window as any).formatJalali) ||
  ((date: Date | string | null | undefined, format: string): string => {
    if (!date) return '';
    try {
      const dt = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dt.getTime())) return '';
      return formatJalaliImport ? formatJalaliImport(date, format) : '';
    } catch {
      return '';
    }
  });

const getJalaliDate = getJalaliDateImport || 
  (typeof window !== 'undefined' && (window as any).getJalaliDate) ||
  (() => null);

const getJalaliMonthName = getJalaliMonthNameImport || 
  (typeof window !== 'undefined' && (window as any).getJalaliMonthName) ||
  (() => '');

const getJalaliDayName = getJalaliDayNameImport || 
  (typeof window !== 'undefined' && (window as any).getJalaliDayName) ||
  (() => '');

const toPersianDigits = toPersianDigitsImport || 
  (typeof window !== 'undefined' && (window as any).toPersianDigits) ||
  ((str: string | number): string => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(str).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  });
import { cn } from "@/lib/utils";
import PersianDatePicker from "./PersianDatePicker/index";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import PaymentSMSManager from "./PaymentSMSManager";

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "success", label: "موفق" },
  { value: "pending", label: "در انتظار" },
  { value: "failed", label: "ناموفق" },
] as const;

const LANDING_ACTIVITY_OPTIONS = [
  { value: "all", label: "همه فعالیت‌ها" },
  { value: "clicked_registration_link", label: "کلیک ثبت‌نام" },
  { value: "entered_landing", label: "ورود لندینگ" },
  { value: "in_landing", label: "در لندینگ" },
  { value: "left_landing", label: "خارج شده" },
  { value: "clicked_payment_button", label: "کلیک درگاه" },
  { value: "clicked_card_to_card", label: "کلیک کارت" },
  { value: "copied_card_to_card", label: "کپی کارت" },
  { value: "clicked_installment", label: "کلیک قسطی" },
  { value: "copied_installment_card", label: "کپی قسطی" },
  { value: "payment_initiated", label: "شروع پرداخت" },
  { value: "payment_success", label: "پرداخت موفق" },
  { value: "payment_failed", label: "پرداخت ناموفق" },
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "installment", label: "قسطی" },
  { value: "full", label: "کامل" },
] as const;

// Helper component for displaying Persian dates
const PersianDateDisplay = ({ date }: { date: Date }) => {
  const dayName = getJalaliDayName(date);
  const jalali = getJalaliDate(date);
  if (!jalali) return <>{formatJalali(date, 'YYYY/MM/DD HH:mm')}</>;
  
  const monthName = getJalaliMonthName(jalali.month);
  const time = formatJalali(date, 'HH:mm');
  
  return <>{`${dayName}، ${toPersianDigits(jalali.day.toString())} ${monthName} ${toPersianDigits(jalali.year.toString())} - ${toPersianDigits(time)}`}</>;
};

// Helper component for displaying affiliate profit
const AffiliateProfitDisplay = ({ payments, affiliateId, percentage }: { payments: Payment[], affiliateId: number, percentage: number }) => {
  const profit = useMemo(() => {
    // محاسبه مجموع پرداخت‌های موفق این افیلیت
    const successfulPayments = payments.filter(p => 
      p.lead_promoter?.id === affiliateId && 
      p.status === 'success'
    );
    const totalAmount = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
    const calculatedProfit = Math.round((totalAmount * percentage) / 100);
    return calculatedProfit;
  }, [payments, affiliateId, percentage]);

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600/30 text-cyan-300 font-medium text-sm border border-teal-600/50 whitespace-nowrap">
      <TrendingUp size={16} className="text-cyan-300 flex-shrink-0" />
      سود شما: {toPersianDigits(profit.toLocaleString('fa-IR'))} تومان
    </span>
  );
};

interface Payment {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  amount: number;
  type: string;
  status: "pending" | "success" | "failed";
  authority: string;
  ref_id?: string;
  license_code?: string;
  description?: string;
  payment_method?: string; // "gateway", "card_to_card", "installment"
  is_installment?: boolean;
  installment_number?: number; // 1 or 2
  total_installments?: number;
  next_installment_date?: string;
  parent_installment_id?: number;
  lead_promoter_id?: number;
  lead_promoter?: {
    id: number;
    username: string;
    name?: string;
    is_affiliate?: boolean;
    affiliate_percentage?: number | null;
  };
  landing_activity?: {
    status: string;
    landing_duration_minutes: number;
    last_status_update: string;
  };
  created_at: string;
  updated_at: string;
}

interface LandingActivity {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  status: string;
  landing_duration_minutes: number;
  last_status_update: string;
  created_at: string;
  metadata?: string;
}

interface UserDetails {
  phone: string;
  firstName: string;
  lastName: string;
  activities: LandingActivity[];
  status_counts: Record<string, number>;
  total_actions: number;
  payments?: Payment[]; // All payments for this user
}

interface PaymentsListProps {
  token: string;
  isAffiliate?: boolean;
}

const PaymentsList = ({ token, isAffiliate = false }: PaymentsListProps) => {
  const { hasPermission } = usePermissions();
  const canViewListControls = hasPermission("payments.list.controls");
  const canViewStatsSuccess = hasPermission("payments.stats.success");
  const canViewStatsPending = hasPermission("payments.stats.pending");
  const canViewStatsTotal = hasPermission("payments.stats.total");
  const canViewStatsProfit = hasPermission("payments.stats.profit");
  const canViewDailyChart = hasPermission("payments.daily.chart");
  const canFilterInstallment = hasPermission("payments.filter.installment");
  // دسترسی‌های محدود برای مدیریت پرداخت‌ها
  const canViewInstallmentOnly = hasPermission("payments.view.installment_only");
  const canViewFullOnly = hasPermission("payments.view.full_only");
  const canViewSuccessOnly = hasPermission("payments.view.success_only");
  const canViewPendingOnly = hasPermission("payments.view.pending_only");
  // Landing activity is always visible if user has payments.view permission
  // No need for separate permission check
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 1000,
    total_count: 0,
    total_pages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed" | "pending">("all");
  const [landingStatusFilter, setLandingStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<"all" | "installment" | "full">("all");
  
  // Apply automatic filters based on permissions
  // SPECIAL CASE: If user has all 3 permissions (view, installment_only, full_only),
  // show ALL payments without any filters (full access)
  // Otherwise, apply filters based on which permissions are missing
  useEffect(() => {
    const hasAllThreePermissions = hasPermission("payments.view") && 
                                  canViewInstallmentOnly && 
                                  canViewFullOnly;
    
    if (hasAllThreePermissions) {
      // User has all permissions - don't apply any automatic filters
      // Let them see everything (all statuses, all payment methods)
      console.log("[PaymentsList] User has all 3 payment permissions - showing ALL payments without filters");
      // Reset to "all" to show everything
      setStatusFilter("all");
      setPaymentMethodFilter("all");
      return;
    }
    
    // Apply filters based on which permissions are missing
    // If user has installment_only but NOT full_only → show only installment
    // If user has full_only but NOT installment_only → show only full
    // If user has both → show all (but this case is handled above)
    if (canViewInstallmentOnly && !canViewFullOnly) {
      setPaymentMethodFilter("installment");
      console.log("[PaymentsList] User has installment_only but not full_only - showing only installment payments");
    } else if (canViewFullOnly && !canViewInstallmentOnly) {
      setPaymentMethodFilter("full");
      console.log("[PaymentsList] User has full_only but not installment_only - showing only full payments");
    }
    
    // Apply status filters
    if (canViewSuccessOnly && !canViewPendingOnly) {
      setStatusFilter("success");
      console.log("[PaymentsList] User has success_only but not pending_only - showing only success payments");
    } else if (canViewPendingOnly && !canViewSuccessOnly) {
      setStatusFilter("pending");
      console.log("[PaymentsList] User has pending_only but not success_only - showing only pending payments");
    }
  }, [hasPermission, canViewSuccessOnly, canViewPendingOnly, canViewInstallmentOnly, canViewFullOnly]);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedStartDate, setAdvancedStartDate] = useState("");
  const [advancedStartTime, setAdvancedStartTime] = useState("00:00");
  const [advancedEndDate, setAdvancedEndDate] = useState("");
  const [advancedEndTime, setAdvancedEndTime] = useState("23:59");

  // Reset to show only 6 when filters change
  useEffect(() => {
    setShowAllPayments(false);
    setPagination({
      page: 1,
      page_size: 6,
      total_count: 0,
      total_pages: 1,
    });
  }, [statusFilter, landingStatusFilter, paymentMethodFilter, showAdvancedFilter, advancedStartDate, advancedEndDate, advancedStartTime, advancedEndTime]);
  const [exporting, setExporting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Payment | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [exportMode, setExportMode] = useState<"current" | "all_history">("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [showManualPaymentForm, setShowManualPaymentForm] = useState(false);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<"card_to_card" | "installment">("card_to_card");
  const [installmentNumber, setInstallmentNumber] = useState<1 | 2>(1);
  const [submittingManualPayment, setSubmittingManualPayment] = useState(false);
  const [manualPaymentDescription, setManualPaymentDescription] = useState("");
  // Simple manual payment form fields
  const [showSimpleManualPaymentForm, setShowSimpleManualPaymentForm] = useState(false);
  const [simpleFirstName, setSimpleFirstName] = useState("");
  const [simpleLastName, setSimpleLastName] = useState("");
  const [simplePhone, setSimplePhone] = useState("");
  const [simplePaymentDate, setSimplePaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailySalesStats, setDailySalesStats] = useState<any[]>([]);
  const [loadingDailySales, setLoadingDailySales] = useState(false);
  const [salesChartFilter, setSalesChartFilter] = useState<"month" | "week" | "all">("month");
  const [showPaymentSMSManager, setShowPaymentSMSManager] = useState(false);
  const [adminUsers, setAdminUsers] = useState<Array<{id: number; username: string; name?: string; is_affiliate?: boolean; affiliate_percentage?: number | null}>>([]);
  const [selectedLeadPromoterId, setSelectedLeadPromoterId] = useState<number | null>(null);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);

  const API_URL = config.API_BASE_URL;

  // Fetch chart data only when filter changes or component mounts (NO auto-refresh)
  useEffect(() => {
    fetchDailySalesStats();
  }, [token, salesChartFilter]);

  // Fetch admin users for lead promoter selection and profit calculation
  useEffect(() => {
    if (token) {
      fetchAdminUsers();
    }
  }, [token]);

  const fetchAdminUsers = async () => {
    if (!token) return;
    
    setLoadingAdminUsers(true);
    try {
      const response = await fetch(`${API_URL}/admin/admin-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("خطا در دریافت لیست ادمین‌ها");
      }

      const data = await response.json();
      setAdminUsers(data.users || []);
    } catch (err: any) {
      console.error("[PaymentsList] Failed to fetch admin users:", err);
    } finally {
      setLoadingAdminUsers(false);
    }
  };

  const fetchDailySalesStats = async () => {
    if (!token) return;
    
    setLoadingDailySales(true);
    try {
      const response = await fetch(`${API_URL}/admin/payments/daily-sales?filter=${salesChartFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("خطا در دریافت آمار فروش روزانه");
      }

      const data = await response.json();
      console.log("[PaymentsList] Daily sales stats response:", data);
      console.log("[PaymentsList] Daily stats count:", data.daily_stats?.length || 0);
      if (data.daily_stats && data.daily_stats.length > 0) {
        console.log("[PaymentsList] Sample daily stat:", data.daily_stats[0]);
      }
      setDailySalesStats(data.daily_stats || []);
    } catch (err: any) {
      console.error("[PaymentsList] Failed to fetch daily sales stats:", err);
      setDailySalesStats([]);
    } finally {
      setLoadingDailySales(false);
    }
  };

  const fetchPayments = async () => {
    try {
      let url = `${API_URL}/admin/payments?status=${statusFilter}&page=1&page_size=1000`;
      
      // Add landing status filter
      if (landingStatusFilter && landingStatusFilter !== "all") {
        url += `&landing_status=${landingStatusFilter}`;
      }
      
      // Add payment method filter (installment/full)
      if (paymentMethodFilter && paymentMethodFilter !== "all") {
        url += `&payment_method=${paymentMethodFilter}`;
      }
      
      // Add advanced filter parameters if active
      if (showAdvancedFilter && advancedStartDate && advancedEndDate) {
        url += `&start_date=${advancedStartDate}&start_time=${advancedStartTime}&end_date=${advancedEndDate}&end_time=${advancedEndTime}`;
      }
      
      console.log('[PaymentsList] Fetching payments from:', url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-cache', // CRITICAL: Always fetch fresh data (no cache) for real-time updates
      });

      console.log('[PaymentsList] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.href = "/admin/login";
          return;
        }
        const errorText = await response.text();
        console.error('[PaymentsList] Error response:', errorText);
        throw new Error("خطا در دریافت لیست پرداخت‌ها");
      }

      const data = await response.json();
      console.log('[PaymentsList] Payments data received:', data);
      console.log('[PaymentsList] First payment sample:', data.payments?.[0]);
      if (data.payments?.[0]) {
        console.log('[PaymentsList] Lead promoter for first payment:', data.payments[0].lead_promoter);
      }
      // Replace payments completely (don't append)
      setPayments(data.payments || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      setError("");
    } catch (err: any) {
      console.error("[PaymentsList] Failed to fetch payments:", err);
      setError(err.message || "خطا در دریافت لیست پرداخت‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments with auto-refresh (real-time updates)
  useEffect(() => {
    console.log('[PaymentsList] Component mounted, fetching payments...');
    fetchPayments();
    
    // CRITICAL: Refresh payments every 3 seconds for real-time landing activity updates
    // When user clicks payment button or performs action, it will appear in list within 3 seconds
    const interval = setInterval(() => {
      fetchPayments();
    }, 3000); // Reduced from 5s to 3s for faster updates

    return () => clearInterval(interval);
  }, [token, statusFilter, landingStatusFilter, paymentMethodFilter, showAdvancedFilter, advancedStartDate, advancedStartTime, advancedEndDate, advancedEndTime]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" />
            موفق
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <XCircle className="w-3 h-3" />
            ناموفق
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            در انتظار
          </span>
        );
      default:
        return <span className="text-gray-400">{status}</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "subscription":
        return "اشتراک";
      case "roadmap":
        return "رودمپ";
      default:
        return type;
    }
  };

  // Format date and time in Persian (Jalali) format
  const formatPersianDateWithTime = (date: Date): string => {
    const jalaliDate = formatJalali(date, 'YYYY/MM/DD');
    const time = formatJalali(date, 'HH:mm:ss');
    return `${toPersianDigits(jalaliDate)} ${toPersianDigits(time)}`;
  };

  // Format Persian date with full format: روز، تاریخ ماه سال - ساعت
  const formatPersianDateFull = (date: Date): string => {
    const dayName = getJalaliDayName(date);
    const jalali = getJalaliDate(date);
    if (!jalali) return formatJalali(date, 'YYYY/MM/DD HH:mm');
    
    const monthName = getJalaliMonthName(jalali.month);
    const time = formatJalali(date, 'HH:mm');
    
    return `${dayName}، ${toPersianDigits(jalali.day.toString())} ${monthName} ${toPersianDigits(jalali.year.toString())} - ${toPersianDigits(time)}`;
  };

  // Format Persian date only (without time)
  const formatPersianDateOnly = (date: Date): string => {
    const jalali = getJalaliDate(date);
    if (!jalali) return formatJalali(date, 'YYYY/MM/DD');
    
    const monthName = getJalaliMonthName(jalali.month);
    return `${toPersianDigits(jalali.day.toString())} ${monthName} ${toPersianDigits(jalali.year.toString())}`;
  };

  const handleUserClick = async (payment: Payment) => {
    setSelectedUser(payment);
    setShowUserDetails(true);
    setLoadingDetails(true);
    
    try {
      // Fetch landing activities
      const activitiesResponse = await fetch(`${API_URL}/admin/landing/activities?phone=${encodeURIComponent(payment.phone)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch all payments for this user
      const paymentsResponse = await fetch(`${API_URL}/admin/payments?status=all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!activitiesResponse.ok || !paymentsResponse.ok) {
        if (activitiesResponse.status === 401 || paymentsResponse.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("خطا در دریافت جزئیات کاربر");
      }

      const activitiesData = await activitiesResponse.json();
      const paymentsData = await paymentsResponse.json();
      
      console.log("[PaymentsList] User details response:", activitiesData);
      console.log("[PaymentsList] Payments response:", paymentsData);
      
      if (activitiesData.success) {
        // Normalize phone for comparison
        const normalizePhoneForCompare = (phone: string) => {
          return phone.replace(/^\+98/, "0").replace(/^0098/, "0").trim();
        };
        
        const normalizedSelectedPhone = normalizePhoneForCompare(payment.phone);
        
        // Filter payments for this user's phone (handle different phone formats)
        const userPayments = (paymentsData.payments || []).filter((p: Payment) => {
          const normalizedPPhone = normalizePhoneForCompare(p.phone);
          return normalizedPPhone === normalizedSelectedPhone || 
                 p.phone === payment.phone || 
                 p.phone === payment.phone.replace(/^\+98/, "0");
        });

        // Ensure the data structure matches UserDetails interface
        const userDetailsData: UserDetails = {
          phone: activitiesData.phone || payment.phone,
          firstName: payment.first_name,
          lastName: payment.last_name,
          activities: activitiesData.activities || [],
          status_counts: activitiesData.status_counts || {},
          total_actions: activitiesData.total_actions || 0,
          payments: userPayments,
        };
        setUserDetails(userDetailsData);
      } else {
        throw new Error(activitiesData.error || "خطا در دریافت جزئیات کاربر");
      }
    } catch (err: any) {
      console.error("[PaymentsList] Failed to fetch user details:", err);
      alert("خطا در دریافت جزئیات کاربر: " + (err.message || "خطای ناشناخته"));
      setUserDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let url = `${API_URL}/admin/payments/export?status=${statusFilter}&export_mode=${exportMode}`;
      
      // Add landing status filter
      if (landingStatusFilter && landingStatusFilter !== "all") {
        url += `&landing_status=${landingStatusFilter}`;
      }
      
      // Add advanced filter parameters if active
      if (showAdvancedFilter && advancedStartDate && advancedEndDate) {
        url += `&start_date=${advancedStartDate}&start_time=${advancedStartTime}&end_date=${advancedEndDate}&end_time=${advancedEndTime}`;
      }
      
      console.log('[PaymentsList] Exporting payments:', url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("خطا در دریافت خروجی");
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "payments.csv";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('[PaymentsList] Export completed:', filename);
    } catch (err: any) {
      console.error("[PaymentsList] Export failed:", err);
      alert("خطا در دریافت خروجی: " + (err.message || "خطای ناشناخته"));
    } finally {
      setExporting(false);
    }
  };

  // محاسبات باید قبل از هر return قرار گیرند تا تعداد hook‌ها ثابت بماند
  const totalAmount = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  // Statistics: count payments by status (from current page)
  const successCount = payments.filter((p) => p.status === "success").length;
  const failedCount = payments.filter((p) => p.status === "failed").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  // محاسبه کل سود افیلیت‌ها
  const totalAffiliateProfit = useMemo(() => {
    // گروه‌بندی پرداخت‌های موفق بر اساس افیلیت
    const affiliatePaymentsMap = new Map<number, number>(); // affiliateId -> total successful amount
    
    payments
      .filter(p => p.status === 'success' && p.lead_promoter?.is_affiliate && p.lead_promoter?.id)
      .forEach(payment => {
        const affiliateId = payment.lead_promoter!.id;
        const currentTotal = affiliatePaymentsMap.get(affiliateId) || 0;
        affiliatePaymentsMap.set(affiliateId, currentTotal + payment.amount);
      });

    // محاسبه سود برای هر افیلیت
    let totalProfit = 0;
    affiliatePaymentsMap.forEach((totalAmount, affiliateId) => {
      // ابتدا از adminUsers درصد را بگیر (دقیق‌تر است)
      const adminUser = adminUsers.find(au => au.id === affiliateId);
      const percentage = adminUser?.affiliate_percentage || 
                        payments.find(p => 
                          p.lead_promoter?.id === affiliateId && 
                          p.lead_promoter?.is_affiliate
                        )?.lead_promoter?.affiliate_percentage || 0;
      
      if (percentage > 0) {
        const profit = Math.round((totalAmount * percentage) / 100);
        totalProfit += profit;
      }
    });

    return totalProfit;
  }, [payments, adminUsers]);

  if (loading) {
    return (
      <div className="fp-card fp-notch overflow-hidden border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-white/8 bg-gradient-to-l from-emerald-950/30 via-transparent to-transparent">
          <div className="w-11 h-11 fp-notch-sm bg-gradient-to-l from-emerald-700 to-teal-400 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">پرداخت‌ها</h2>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-4 border-emerald-600/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 text-sm">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fp-card fp-notch overflow-hidden border-red-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-white/8 bg-gradient-to-l from-red-950/30 via-transparent to-transparent">
          <div className="w-11 h-11 fp-notch-sm bg-gradient-to-l from-red-700 to-rose-500 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">پرداخت‌ها</h2>
        </div>
        <div className="p-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-600/40">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fp-card fp-notch overflow-hidden border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 border-b border-white/8 bg-gradient-to-l from-emerald-950/30 via-transparent to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 fp-notch-sm bg-gradient-to-l from-emerald-700 to-teal-400 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 text-right">
            <h2 className="text-lg sm:text-xl font-bold text-white">پرداخت‌ها</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {toPersianDigits(payments.length)} ردیف • ردیابی لندینگ تا پرداخت
            </p>
          </div>
        </div>

        {canViewListControls && (
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl text-xs border-white/10",
                showAdvancedFilter
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-black/30 text-gray-400 hover:text-white"
              )}
            >
              <Calendar className="h-3.5 w-3.5 sm:ml-1" />
              {showAdvancedFilter ? "بستن تاریخ" : "فیلتر تاریخ"}
            </Button>

            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setExportMode("current")}
                className={cn(
                  "px-2.5 py-1.5 text-xs rounded-lg transition-all",
                  exportMode === "current" ? "bg-emerald-600/30 text-emerald-200" : "text-gray-500 hover:text-white"
                )}
              >
                وضعیت فعلی
              </button>
              <button
                type="button"
                onClick={() => setExportMode("all_history")}
                className={cn(
                  "px-2.5 py-1.5 text-xs rounded-lg transition-all",
                  exportMode === "all_history" ? "bg-emerald-600/30 text-emerald-200" : "text-gray-500 hover:text-white"
                )}
              >
                همه حالت‌ها
              </button>
            </div>

            {!isAffiliate && (
              <Button
                onClick={() => {
                  setShowSimpleManualPaymentForm(true);
                  setSimpleFirstName("");
                  setSimpleLastName("");
                  setSimplePhone("");
                  setSimplePaymentDate(new Date().toISOString().split("T")[0]);
                  setSelectedLeadPromoterId(null);
                }}
                className="bg-gradient-to-l from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white text-xs sm:text-sm px-3 py-2 rounded-xl"
                title="افزودن پرداخت دستی"
              >
                <Plus className="h-4 w-4 sm:ml-1" />
                <span className="hidden sm:inline">پرداخت دستی</span>
              </Button>
            )}

            {!isAffiliate && (
              <Button
                onClick={() => setShowPaymentSMSManager(true)}
                variant="outline"
                className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 text-xs sm:text-sm px-3 py-2 rounded-xl"
              >
                <MessageSquare className="h-4 w-4 sm:ml-1" />
                <span className="hidden sm:inline">پیام</span>
              </Button>
            )}

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 sm:ml-1" />
                  <span className="hidden sm:inline">اکسل</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {canViewListControls && (
        <>
          <div className="px-4 sm:px-5 py-3 border-b border-white/5">
            <p className="text-[11px] text-gray-500 mb-2">وضعیت پرداخت</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={canViewSuccessOnly || canViewPendingOnly}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    "fp-chip whitespace-nowrap transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                    statusFilter === opt.value
                      ? "text-emerald-200 border-emerald-400/40 bg-emerald-500/15"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {canFilterInstallment && (
            <div className="px-4 sm:px-5 py-3 border-b border-white/5">
              <p className="text-[11px] text-gray-500 mb-2">نوع پرداخت</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={canViewInstallmentOnly || canViewFullOnly}
                    onClick={() => setPaymentMethodFilter(opt.value)}
                    className={cn(
                      "fp-chip whitespace-nowrap transition-all disabled:opacity-40",
                      paymentMethodFilter === opt.value
                        ? "text-teal-200 border-teal-400/40 bg-teal-500/15"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 sm:px-5 py-3 border-b border-white/5 overflow-x-auto scrollbar-hide">
            <p className="text-[11px] text-gray-500 mb-2">فعالیت لندینگ</p>
            <div className="flex gap-2 min-w-max pb-1">
              {LANDING_ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLandingStatusFilter(opt.value)}
                  className={cn(
                    "fp-chip whitespace-nowrap transition-all text-xs",
                    landingStatusFilter === opt.value
                      ? "text-cyan-200 border-cyan-400/40 bg-cyan-500/10"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5 border-b border-white/5">
            <div className="relative max-w-2xl ms-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  isAffiliate
                    ? "جستجو: نام یا نام خانوادگی..."
                    : "جستجو: نام، موبایل، ایمیل..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-gray-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {showAdvancedFilter && (
            <div className="mx-4 sm:mx-5 mb-4 p-4 fp-card fp-notch border-white/10 bg-black/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2">تاریخ شروع</label>
                  <input
                    type="date"
                    value={advancedStartDate}
                    onChange={(e) => setAdvancedStartDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2">ساعت شروع</label>
                  <input
                    type="time"
                    value={advancedStartTime}
                    onChange={(e) => setAdvancedStartTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2">تاریخ پایان</label>
                  <input
                    type="date"
                    value={advancedEndDate}
                    onChange={(e) => setAdvancedEndDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-2">ساعت پایان</label>
                  <input
                    type="time"
                    value={advancedEndTime}
                    onChange={(e) => setAdvancedEndTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="p-4 sm:p-5 border-b border-white/5 space-y-5">
        {/* Statistics Cards - Sharp & Clear */}
        {(() => {
          // محاسبه تعداد کادرهای قابل نمایش
          const visibleCardsCount = [
            canViewStatsProfit && isAffiliate,
            canViewStatsSuccess,
            canViewStatsPending,
            canViewStatsTotal
          ].filter(Boolean).length;
          
          if (visibleCardsCount === 0) return null;
          
          // تعیین تعداد ستون‌ها بر اساس تعداد کادرها
          const gridCols = visibleCardsCount === 1 ? 'md:grid-cols-1' :
                          visibleCardsCount === 2 ? 'md:grid-cols-2' :
                          visibleCardsCount === 3 ? 'md:grid-cols-3' :
                          'md:grid-cols-4';
          
          return (
            <div className={`grid grid-cols-2 ${gridCols} gap-3`}>
              {canViewStatsProfit && isAffiliate && (
                <div className="fp-card fp-notch border-teal-500/25 bg-gradient-to-bl from-teal-950/40 to-transparent p-4">
                  <div className="text-cyan-400 text-[11px] font-medium mb-1.5">سود شما</div>
                  <div className="text-cyan-200 text-lg sm:text-xl font-bold tabular-nums">
                    {formatAmount(totalAffiliateProfit)}
                  </div>
                </div>
              )}
              
              {canViewStatsSuccess && (
                <div className="fp-card fp-notch border-emerald-500/25 bg-gradient-to-bl from-emerald-950/40 to-transparent p-4">
                  <div className="text-emerald-400 text-[11px] font-medium mb-1.5">موفق</div>
                  <div className="text-emerald-200 text-2xl font-bold tabular-nums">
                    {successCount.toLocaleString('fa-IR')}
                  </div>
                </div>
              )}
              
              {canViewStatsPending && (
                <div className="fp-card fp-notch border-amber-500/25 bg-gradient-to-bl from-amber-950/40 to-transparent p-4">
                  <div className="text-amber-400 text-[11px] font-medium mb-1.5">در انتظار</div>
                  <div className="text-amber-200 text-2xl font-bold tabular-nums">
                    {pendingCount.toLocaleString('fa-IR')}
                  </div>
                </div>
              )}
              
              {canViewStatsTotal && (
                <div className="fp-card fp-notch border-teal-500/25 bg-gradient-to-bl from-teal-950/40 to-transparent p-4">
                  <div className="text-teal-400 text-[11px] font-medium mb-1.5">مجموع موفق</div>
                  <div className="text-teal-200 text-lg sm:text-xl font-bold tabular-nums">
                    {formatAmount(totalAmount)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Daily Sales Chart - Ultra Minimal & Elegant */}
        {canViewDailyChart && (
          <div className="fp-card fp-notch border-emerald-500/20 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-gradient-to-l from-emerald-950/20 via-transparent to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 fp-notch-sm bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">فروش روزانه</h3>
                <p className="text-gray-500 text-[11px]">مبلغ فروش موفق</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                onClick={() => setSalesChartFilter("week")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all rounded-lg",
                  salesChartFilter === "week"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-gray-500 hover:text-white"
                )}
              >
                هفته
              </button>
              <button
                onClick={() => setSalesChartFilter("month")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all rounded-lg",
                  salesChartFilter === "month"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-gray-500 hover:text-white"
                )}
              >
                ماه
              </button>
              <button
                onClick={() => setSalesChartFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-all rounded-lg",
                  salesChartFilter === "all"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-gray-500 hover:text-white"
                )}
              >
                همه
              </button>
            </div>
          </div>
          
          <div className="px-4 sm:px-5 pb-5 pt-2">
            {loadingDailySales ? (
              <div className="flex items-center justify-center h-[280px]">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">در حال بارگذاری...</p>
                </div>
              </div>
            ) : !dailySalesStats || dailySalesStats.length === 0 ? (
              <div className="flex items-center justify-center h-[280px]">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 text-gray-700 mx-auto mb-2 opacity-30" />
                  <p className="text-gray-500 text-xs">داده‌ای یافت نشد</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailySalesStats} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1a1a1a" opacity={0.5} vertical={false} />
                  <XAxis 
                    dataKey="date"
                    stroke="transparent"
                    fontSize={10}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    tickFormatter={(value) => {
                      const stat = dailySalesStats.find(s => s.date === value);
                      if (!stat) return '';
                      
                      // Convert date string to Date object for jalali conversion
                      const dateObj = new Date(stat.date);
                      if (isNaN(dateObj.getTime())) return '';
                      
                      if (salesChartFilter === 'week') {
                        // Show Persian day name
                        const dayName = getJalaliDayName(dateObj);
                        return dayName || '';
                      } else if (salesChartFilter === 'month') {
                        // Show Jalali day number
                        const jalali = getJalaliDate(dateObj);
                        return jalali ? toPersianDigits(jalali.day.toString()) : '';
                      } else {
                        // For "all" filter, show month/day in Jalali
                        const jalali = getJalaliDate(dateObj);
                        if (jalali) {
                          return `${toPersianDigits(jalali.month)}/${toPersianDigits(jalali.day)}`;
                        }
                        // Fallback to backend persian_date if available
                        const parts = stat.persian_date?.split('/') || [];
                        if (parts.length >= 2) {
                          return `${toPersianDigits(parts[1])}/${toPersianDigits(parts[2])}`;
                        }
                      }
                      return '';
                    }}
                    height={35}
                  />
                  <YAxis 
                    stroke="transparent"
                    fontSize={10}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    tickFormatter={(value) => {
                      let formatted: string;
                      if (value >= 1000000) {
                        formatted = `${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        formatted = `${(value / 1000).toFixed(0)}K`;
                      } else {
                        formatted = value.toString();
                      }
                      // Convert to Persian digits
                      return toPersianDigits(formatted);
                    }}
                    width={45}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const stat = dailySalesStats.find(s => s.date === label);
                        const value = payload[0].value as number;
                        
                        // Format amount with Persian digits
                        const formattedAmount = toPersianDigits(new Intl.NumberFormat('fa-IR').format(value));
                        
                        // Format date in Jalali with full format
                        let formattedDate = '';
                        if (stat?.date) {
                          try {
                            const dateObj = new Date(stat.date);
                            if (!isNaN(dateObj.getTime())) {
                              const jalali = getJalaliDate(dateObj);
                              const dayName = getJalaliDayName(dateObj);
                              if (jalali) {
                                const monthName = getJalaliMonthName(jalali.month);
                                formattedDate = `${dayName}، ${toPersianDigits(jalali.day.toString())} ${monthName} ${toPersianDigits(jalali.year.toString())}`;
                              }
                            }
                          } catch (e) {
                            // Fallback to backend persian_date if available
                            formattedDate = stat.persian_date || label;
                          }
                        } else {
                          formattedDate = label;
                        }
                        
                        return (
                          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 shadow-xl">
                            <p className="text-gray-400 text-xs mb-1">{formattedDate}</p>
                            <p className="text-emerald-400 font-semibold text-sm">{formattedAmount} تومان</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#salesGradient)"
                    dot={false}
                    activeDot={{ 
                      r: 5, 
                      fill: '#10b981',
                      stroke: '#0a0a0a',
                      strokeWidth: 2,
                      className: 'drop-shadow-lg'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}
      </div>

      <div className="p-0" data-payments-list>

        {(() => {
          // Backend returns payments sorted by last action time (most recent first)
          // Show only first 6 payments (most recent) by default, or all if showAllPayments is true
          const displayedPayments = showAllPayments ? payments : payments.slice(0, 6);
          
          return displayedPayments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0f0f0f] border border-gray-900 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm">هیچ پرداختی ثبت نشده است</p>
            </div>
          </div>
        ) : (
          <>
            {/* Table View - All Screen Sizes */}
            <div className="overflow-x-auto">
              <Table className="w-full text-right">
                <TableHeader>
                  <TableRow className="bg-[#0f0f0f] border-0 border-transparent hover:bg-[#0f0f0f] hover:border hover:border-green-500 hover:border-t-green-500 hover:border-b-green-500 hover:border-l-green-500 hover:border-r-green-500 transition-all duration-200">
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">نام کاربر</TableHead>
                    {!isAffiliate && (
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">شماره تماس</TableHead>
                    )}
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">مبلغ</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">نوع</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">وضعیت پرداخت</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">وضعیت لندینگ</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">مدت حضور</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">لید از</TableHead>
                    <TableHead className="hidden md:table-cell text-right text-gray-400 font-semibold py-4 px-6">لایسنس</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPayments.map((payment, index) => (
                    <TableRow 
                      key={payment.id} 
                      className="border-0 border-transparent hover:bg-transparent hover:border hover:border-green-500 hover:border-t-green-500 hover:border-b-green-500 hover:border-l-green-500 hover:border-r-green-500 transition-all duration-200"
                    >
                      <TableCell className="py-4 px-6">
                        <button
                          onClick={() => handleUserClick(payment)}
                          className="text-white font-medium hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          {payment.first_name} {payment.last_name}
                        </button>
                      </TableCell>
                      {!isAffiliate && (
                      <TableCell className="py-4 px-6">
                        <span className="text-gray-400 font-mono text-sm bg-[#0f0f0f] px-3 py-1.5 rounded-lg border border-gray-900">
                          {payment.phone}
                        </span>
                      </TableCell>
                      )}
                      <TableCell className="py-4 px-6">
                        <span className="text-emerald-400 font-bold text-lg">
                          {formatAmount(payment.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 text-sm font-medium border border-blue-600/50">
                          {getTypeLabel(payment.type)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {payment.status === 'success' && (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 font-medium text-sm border border-emerald-600/50 whitespace-nowrap">
                            <CheckCircle size={16} className="text-emerald-300 flex-shrink-0" />
                            موفق
                          </span>
                        )}
                        {payment.status === 'failed' && (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/30 text-red-300 font-medium text-sm border border-red-600/50 whitespace-nowrap">
                            <XCircle size={16} className="text-red-300 flex-shrink-0" />
                            ناموفق
                          </span>
                        )}
                        {payment.status === 'pending' && (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-600/30 text-yellow-300 font-medium text-sm border border-yellow-600/50 whitespace-nowrap">
                            <Clock size={16} className="text-yellow-300 flex-shrink-0" />
                            در انتظار
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {payment.landing_activity ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 font-medium text-xs border border-blue-600/50 whitespace-nowrap">
                            {(() => {
                              const status = payment.landing_activity?.status;
                              if (status === 'clicked_registration_link') return 'کلیک لینک ثبت‌نام';
                              if (status === 'entered_landing') return 'ورود به لندینگ';
                              if (status === 'in_landing') return 'در لندینگ';
                              if (status === 'left_landing') return 'خارج شده از لندینگ';
                              if (status === 'clicked_payment_button') return 'کلیک ورود به درگاه';
                              if (status === 'clicked_card_to_card') return 'کلیک کارت به کارت';
                              if (status === 'copied_card_to_card') return 'کپی کارت به کارت';
                              if (status === 'clicked_installment') return 'کلیک قسطی';
                              if (status === 'copied_installment_card') return 'کپی کارت قسطی';
                              if (status === 'payment_initiated') return 'شروع پرداخت';
                              if (status === 'payment_success') return 'پرداخت موفق';
                              if (status === 'payment_failed') return 'پرداخت ناموفق';
                              return status || '-';
                            })()}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {payment.landing_activity?.landing_duration_minutes ? (
                          <span className="text-gray-400 text-sm">
                            {payment.landing_activity.landing_duration_minutes} دقیقه
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {payment.lead_promoter ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-cyan-300 font-medium text-sm">
                              {payment.lead_promoter.name || payment.lead_promoter.username}
                            </span>
                            <span className="text-gray-500 text-xs font-mono">
                              @{payment.lead_promoter.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4 px-6">
                        {payment.license_code ? (
                          <code className="text-emerald-400 font-mono text-xs bg-[#0f0f0f] px-3 py-1.5 rounded-lg border border-emerald-600/30">
                            {payment.license_code}
                          </code>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-500 text-sm">
                        {formatPersianDateWithTime(new Date(payment.created_at))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Show All Button */}
            {!showAllPayments && payments.length > 6 && (
              <div className="p-6 border-t border-gray-900">
                <Button
                  onClick={() => setShowAllPayments(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all duration-300"
                >
                  <Eye className="h-4 w-4 ml-2" />
                  نمایش همه ({payments.length} پرداخت)
                </Button>
              </div>
            )}
            
            {/* Show Less Button */}
            {showAllPayments && payments.length > 6 && (
              <div className="p-6 border-t border-gray-900">
                <Button
                  onClick={() => {
                    setShowAllPayments(false);
                    // Scroll to top of payments list when collapsing
                    const cardContent = document.querySelector('[data-payments-list]');
                    if (cardContent) {
                      cardContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  variant="outline"
                  className="w-full bg-[#0f0f0f] hover:bg-[#151515] border border-gray-900 text-gray-300 hover:text-white font-semibold py-3 rounded-xl transition-all duration-300"
                >
                  نمایش کمتر (فقط ۶ مورد آخر)
                </Button>
              </div>
            )}
          </>
        );
        })()}
      </div>
    </div>

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="bg-[#0a0a0a] border border-gray-900 rounded-2xl max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-900 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-right text-2xl font-bold flex items-center gap-3">
                <User className="h-6 w-6 text-emerald-400" />
                جزئیات کاربر و سابقه رفتار
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
                <p className="text-gray-400 text-sm">در حال بارگذاری جزئیات...</p>
              </div>
            </div>
          ) : userDetails && selectedUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gradient-to-r from-[#0f0f0f] to-[#151515] border border-emerald-600/30 rounded-xl p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <div className="text-gray-400 text-xs mb-2 font-medium">نام و نام خانوادگی</div>
                    <div className="text-white font-bold text-lg">{selectedUser.first_name} {selectedUser.last_name}</div>
                  </div>
                  {!isAffiliate && (
                  <div>
                    <div className="text-gray-400 text-xs mb-2 font-medium">شماره تماس</div>
                    <div className="text-emerald-400 font-mono text-lg">{userDetails.phone}</div>
                  </div>
                  )}
                  <div>
                    <div className="text-gray-400 text-xs mb-2 font-medium">وضعیت پرداخت</div>
                    <div className="text-white font-semibold">
                      {(() => {
                        // Check all payments for this user
                        const allPayments = userDetails.payments || [];
                        const installmentPayments = allPayments.filter(p => p.is_installment && p.payment_method === "installment") || [];
                        const cardToCardPayments = allPayments.filter(p => p.payment_method === "card_to_card" && p.status === "success") || [];
                        const gatewayPayments = allPayments.filter(p => (!p.payment_method || p.payment_method === "gateway") && p.status === "success") || [];
                        
                        // Check for complete payments (card-to-card or gateway)
                        if (cardToCardPayments.length > 0 || gatewayPayments.length > 0) {
                          return <span className="text-emerald-400">✅ پرداخت کامل شد</span>;
                        }
                        
                        // Check installment payments
                        if (installmentPayments.length > 0) {
                          const firstInstallment = installmentPayments.find(p => p.installment_number === 1);
                          const secondInstallment = installmentPayments.find(p => p.installment_number === 2);
                          
                          if (firstInstallment && secondInstallment) {
                            return <span className="text-emerald-400">✅ پرداخت کامل شد</span>;
                          } else if (firstInstallment) {
                            return <span className="text-yellow-400">⏳ در حال تکمیل</span>;
                          } else {
                            return <span className="text-gray-400">در انتظار ثبت قسط اول</span>;
                          }
                        }
                        
                        // Fallback to selected user status
                        if (selectedUser.status === 'success') return <span className="text-emerald-400">✅ موفق</span>;
                        if (selectedUser.status === 'failed') return <span className="text-red-400">❌ ناموفق</span>;
                        if (selectedUser.status === 'pending') return <span className="text-yellow-400">⏳ در انتظار</span>;
                        return <span className="text-gray-400">-</span>;
                      })()}
                    </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={async () => {
                        const phoneText = isAffiliate ? "" : ` با شماره ${userDetails.phone}`;
                        if (!confirm(`آیا از حذف کاربر "${selectedUser.first_name} ${selectedUser.last_name}"${phoneText} مطمئن هستید؟\n\nاین عمل غیرقابل بازگشت است و تمام اطلاعات مرتبط با این کاربر حذف خواهد شد.`)) {
                          return;
                        }

                        try {
                          const response = await fetch(`${API_URL}/admin/users?phone=${encodeURIComponent(userDetails.phone)}`, {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          });

                          if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.error || "خطا در حذف کاربر");
                          }

                          alert("✅ کاربر با موفقیت حذف شد");
                          
                          // Close modal and refresh payments list
                          setShowUserDetails(false);
                          setSelectedUser(null);
                          setUserDetails(null);
                          await fetchPayments();
                        } catch (err: any) {
                          console.error("Failed to delete user:", err);
                          alert(`❌ خطا در حذف کاربر: ${err.message || "خطای ناشناخته"}`);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف کاربر
                    </Button>
                  </div>
                </div>
              </div>

              {/* Installment Status */}
              {userDetails.payments && (() => {
                const installmentPayments = userDetails.payments.filter(p => p.is_installment && p.payment_method === "installment") || [];
                
                // Check if user has installment payment based on amount (2,450,000 or 4,900,000)
                const hasInstallmentAmount = selectedUser.amount === 2450000 || selectedUser.amount === 4900000;
                const installmentAmount = selectedUser.amount === 2450000 ? 2450000 : selectedUser.amount === 4900000 ? 2450000 : 0;
                
                // CRITICAL: Check if user has paid first installment (amount = 2,450,000 and status = success)
                // This means they paid the first installment but haven't registered it as installment payment
                const hasPaidFirstInstallment = selectedUser.amount === 2450000 && selectedUser.status === "success";
                
                // Show installment status if user has installment payments OR has installment amount OR has paid first installment
                if (installmentPayments.length === 0 && !hasInstallmentAmount && !hasPaidFirstInstallment) return null;

                const firstInstallment = installmentPayments.find(p => p.installment_number === 1);
                const secondInstallment = installmentPayments.find(p => p.installment_number === 2);
                const nextInstallmentDate = firstInstallment?.next_installment_date;
                
                // Calculate next installment date
                let calculatedNextInstallmentDate = nextInstallmentDate;
                
                if (hasPaidFirstInstallment && !firstInstallment) {
                  // User has paid first installment (2,450,000 success) but it's not registered as installment
                  // Calculate next installment date from selectedUser.created_at + 30 days
                  const firstPaymentDate = new Date(selectedUser.created_at);
                  const nextDate = new Date(firstPaymentDate);
                  nextDate.setDate(nextDate.getDate() + 30); // Add 30 days
                  calculatedNextInstallmentDate = nextDate.toISOString();
                } else if (firstInstallment && !nextInstallmentDate) {
                  // First installment exists but no next_installment_date - calculate from created_at + 30 days
                  const firstInstallmentDate = new Date(firstInstallment.created_at);
                  const nextDate = new Date(firstInstallmentDate);
                  nextDate.setDate(nextDate.getDate() + 30); // Add 30 days
                  calculatedNextInstallmentDate = nextDate.toISOString();
                }

                return (
                  <div className="bg-gradient-to-r from-[#187272]/10 to-[#26fce3]/10 border border-blue-600/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="h-5 w-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-lg">وضعیت پرداخت قسطی</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Installment */}
                      <div className="bg-[#0a0a0a] border border-blue-600/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-gray-400 text-sm font-medium">قسط اول</div>
                          {firstInstallment || hasPaidFirstInstallment ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-600/50">
                              ✅ تکمیل شده
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-600/20 text-gray-400 border border-gray-600/50">
                              ❌ تکمیل نشده
                            </span>
                          )}
                        </div>
                        {firstInstallment ? (
                          <div className="space-y-1 mt-3">
                            <div className="text-emerald-400 font-bold text-lg">
                              {firstInstallment.amount.toLocaleString('fa-IR')} تومان
                            </div>
                            <div className="text-gray-400 text-xs">
                              تاریخ: {formatPersianDateFull(new Date(firstInstallment.created_at))}
                            </div>
                          </div>
                        ) : hasPaidFirstInstallment ? (
                          <div className="space-y-1 mt-3">
                            <div className="text-emerald-400 font-bold text-lg">
                              {selectedUser.amount.toLocaleString('fa-IR')} تومان
                            </div>
                            <div className="text-gray-400 text-xs">
                              تاریخ: {formatPersianDateFull(new Date(selectedUser.created_at))}
                            </div>
                          </div>
                        ) : hasInstallmentAmount && (
                          <div className="space-y-1 mt-3">
                            <div className="text-gray-400 text-sm">
                              مبلغ هر قسط: {installmentAmount.toLocaleString('fa-IR')} تومان
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Second Installment */}
                      <div className="bg-[#0a0a0a] border border-blue-600/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-gray-400 text-sm font-medium">قسط دوم</div>
                          {secondInstallment ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-600/50">
                              ✅ تکمیل شده
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-600/20 text-yellow-400 border border-yellow-600/50">
                              ⏳ تکمیل نشده
                            </span>
                          )}
                        </div>
                        {secondInstallment ? (
                          <div className="space-y-1 mt-3">
                            <div className="text-emerald-400 font-bold text-lg">
                              {secondInstallment.amount.toLocaleString('fa-IR')} تومان
                            </div>
                            <div className="text-gray-400 text-xs">
                              تاریخ: {formatPersianDateFull(new Date(secondInstallment.created_at))}
                            </div>
                          </div>
                        ) : calculatedNextInstallmentDate ? (
                          <InstallmentTimer nextInstallmentDate={calculatedNextInstallmentDate} />
                        ) : hasInstallmentAmount ? (
                          <div className="space-y-2 mt-3">
                            <div className="text-yellow-400 font-bold text-lg">
                              {installmentAmount.toLocaleString('fa-IR')} تومان
                            </div>
                            <div className="text-gray-400 text-sm">در انتظار ثبت قسط اول</div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm mt-3">در انتظار ثبت قسط اول</div>
                        )}
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="mt-4 pt-4 border-t border-blue-600/20">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-400 text-sm font-medium">مبلغ کل</div>
                        <div className="text-white font-bold text-xl">
                          {installmentPayments.length > 0 
                            ? installmentPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('fa-IR')
                            : hasInstallmentAmount 
                              ? (installmentAmount * 2).toLocaleString('fa-IR')
                              : '0'
                          } تومان
                          {firstInstallment && secondInstallment && (
                            <span className="text-emerald-400 text-sm mr-2">(کامل)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Manual Payment Form */}
              <div className="bg-gradient-to-r from-[#187272]/10 to-[#26fce3]/10 border border-teal-600/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-cyan-400" />
                    <h3 className="text-white font-semibold text-lg">ثبت دستی پرداخت</h3>
                  </div>
                  <Button
                    onClick={() => setShowManualPaymentForm(!showManualPaymentForm)}
                    variant="outline"
                    size="sm"
                    className="bg-teal-600/20 border-teal-600/50 text-cyan-300 hover:bg-teal-600/30"
                  >
                    {showManualPaymentForm ? (
                      <>
                        <X className="h-4 w-4 ml-1" />
                        بستن
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 ml-1" />
                        ثبت پرداخت
                      </>
                    )}
                  </Button>
                </div>

                {showManualPaymentForm && (() => {
                  // Check if user has installment payment based on amount
                  const hasInstallmentAmount = selectedUser.amount === 2450000 || selectedUser.amount === 4900000;
                  const installmentAmountPerPayment = selectedUser.amount === 2450000 ? 2450000 : selectedUser.amount === 4900000 ? 2450000 : 2450000;
                  const totalAmount = selectedUser.amount === 2450000 ? 4900000 : selectedUser.amount === 4900000 ? 4900000 : 4900000;
                  
                  // Check if user has paid first installment
                  const allPayments = userDetails?.payments || [];
                  const installmentPayments = allPayments.filter(p => p.is_installment && p.payment_method === "installment") || [];
                  const firstInstallment = installmentPayments.find(p => p.installment_number === 1);
                  const hasPaidFirstInstallment = selectedUser.amount === 2450000 && selectedUser.status === "success";
                  
                  // Check if timer has expired (30 days passed from first payment)
                  const isTimerExpired = (() => {
                    if (!hasPaidFirstInstallment && !firstInstallment) return false;
                    const firstPaymentDate = firstInstallment 
                      ? new Date(firstInstallment.created_at) 
                      : new Date(selectedUser.created_at);
                    const now = new Date();
                    const daysPassed = Math.floor((now.getTime() - firstPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
                    return daysPassed >= 30;
                  })();
                  
                  return (
                  <div className="space-y-4 mt-4 pt-4 border-t border-teal-600/20">
                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">نوع پرداخت</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setManualPaymentMethod("card_to_card");
                            setInstallmentNumber(1);
                          }}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                            manualPaymentMethod === "card_to_card"
                              ? "bg-teal-600/30 border-teal-500 text-white"
                              : "bg-[#0a0a0a] border-gray-800 text-gray-400 hover:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 justify-center">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-medium">کارت به کارت</span>
                          </div>
                          <div className="text-xs mt-1 opacity-80">{totalAmount.toLocaleString('fa-IR')} تومان (کامل)</div>
                        </button>
                        <button
                          onClick={() => setManualPaymentMethod("installment")}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                            manualPaymentMethod === "installment"
                              ? "bg-blue-600/30 border-blue-500 text-white"
                              : hasInstallmentAmount
                                ? "bg-blue-600/10 border-blue-600/50 text-blue-300 hover:border-blue-500"
                                : "bg-[#0a0a0a] border-gray-800 text-gray-400 hover:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 justify-center">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="font-medium">قسطی</span>
                            {hasInstallmentAmount && (
                              <span className="text-xs bg-blue-600/30 px-1.5 py-0.5 rounded">فعال</span>
                            )}
                          </div>
                          <div className="text-xs mt-1 opacity-80">{installmentAmountPerPayment.toLocaleString('fa-IR')} تومان (هر قسط)</div>
                        </button>
                      </div>
                    </div>

                    {/* Installment Number Selection */}
                    {manualPaymentMethod === "installment" && (
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">شماره قسط</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setInstallmentNumber(1)}
                            disabled={hasPaidFirstInstallment || firstInstallment}
                            className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                              installmentNumber === 1
                                ? "bg-blue-600/30 border-blue-500 text-white"
                                : "bg-[#0a0a0a] border-gray-800 text-gray-400 hover:border-gray-700"
                            } ${(hasPaidFirstInstallment || firstInstallment) ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="font-medium">قسط اول</div>
                            <div className="text-xs mt-1 opacity-80">{installmentAmountPerPayment.toLocaleString('fa-IR')} تومان</div>
                            {installmentNumber === 1 && !hasPaidFirstInstallment && !firstInstallment && (
                              <div className="text-xs mt-1 text-blue-300">یادآوری: یک ماه بعد</div>
                            )}
                            {(hasPaidFirstInstallment || firstInstallment) && (
                              <div className="text-xs mt-1 text-emerald-300">✅ قبلاً ثبت شده</div>
                            )}
                          </button>
                          <button
                            onClick={() => setInstallmentNumber(2)}
                            disabled={!hasPaidFirstInstallment && !firstInstallment}
                            className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                              installmentNumber === 2
                                ? "bg-blue-600/30 border-blue-500 text-white"
                                : isTimerExpired && (hasPaidFirstInstallment || firstInstallment)
                                  ? "bg-green-600/20 border-green-500/50 text-green-300 hover:border-green-500"
                                  : "bg-[#0a0a0a] border-gray-800 text-gray-400 hover:border-gray-700"
                            } ${(!hasPaidFirstInstallment && !firstInstallment) ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="font-medium">قسط دوم</div>
                            <div className="text-xs mt-1 opacity-80">{installmentAmountPerPayment.toLocaleString('fa-IR')} تومان</div>
                            {installmentNumber === 2 && (
                              <>
                                {isTimerExpired ? (
                                  <div className="text-xs mt-1 text-green-300">✅ زمان پرداخت رسیده - آماده ثبت</div>
                                ) : (
                                  <div className="text-xs mt-1 text-green-300">پس از ثبت، مبلغ کل به ۴,۹۰۰,۰۰۰ تومان تغییر می‌کند</div>
                                )}
                              </>
                            )}
                            {isTimerExpired && (hasPaidFirstInstallment || firstInstallment) && installmentNumber !== 2 && (
                              <div className="text-xs mt-1 text-green-400 font-semibold">⏰ زمان پرداخت رسیده</div>
                            )}
                          </button>
                        </div>
                        {isTimerExpired && (hasPaidFirstInstallment || firstInstallment) && (
                          <div className="mt-2 p-2 bg-green-600/10 border border-green-600/30 rounded-lg">
                            <div className="text-green-300 text-xs">
                              ⏰ زمان ۳۰ روزه گذشته است. می‌توانید قسط دوم را ثبت کنید. پس از ثبت، مبلغ کل به ۴,۹۰۰,۰۰۰ تومان تغییر می‌کند.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description (Optional) */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">توضیحات (اختیاری)</label>
                      <textarea
                        value={manualPaymentDescription}
                        onChange={(e) => setManualPaymentDescription(e.target.value)}
                        placeholder="مثال: پرداخت از طریق کارت به کارت - شماره کارت: 1234..."
                        className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={async () => {
                        if (!selectedUser) return;

                        setSubmittingManualPayment(true);
                        try {
                          const response = await fetch(`${API_URL}/admin/payments/manual`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              first_name: selectedUser.first_name,
                              last_name: selectedUser.last_name,
                              phone: selectedUser.phone,
                              payment_method: manualPaymentMethod,
                              installment: manualPaymentMethod === "installment" ? {
                                installment_number: installmentNumber,
                              } : undefined,
                              description: manualPaymentDescription || undefined,
                            }),
                          });

                          if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.error || "خطا در ثبت پرداخت");
                          }

                          const data = await response.json();
                          alert(`✅ ${data.message || "پرداخت با موفقیت ثبت شد"}`);
                          
                          // Reset form
                          setManualPaymentDescription("");
                          setShowManualPaymentForm(false);
                          setManualPaymentMethod("card_to_card");
                          setInstallmentNumber(1);
                          
                          // Refresh payments list
                          await fetchPayments();
                          
                          // Refresh user details by re-fetching
                          if (selectedUser) {
                            // Wait a bit for database to be ready
                            setTimeout(() => {
                              handleUserClick(selectedUser);
                            }, 500);
                          }
                        } catch (err: any) {
                          alert(`❌ خطا: ${err.message || "خطای ناشناخته"}`);
                        } finally {
                          setSubmittingManualPayment(false);
                        }
                      }}
                      disabled={submittingManualPayment}
                      className="w-full bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                    >
                      {submittingManualPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          در حال ثبت...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 ml-2" />
                          ثبت پرداخت {manualPaymentMethod === "card_to_card" ? "کارت به کارت" : `قسط ${installmentNumber}`}
                        </>
                      )}
                    </Button>

                    {/* Info Box */}
                    <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 text-xs text-blue-300">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">ℹ️</div>
                        <div>
                          {manualPaymentMethod === "card_to_card" ? (
                            <>
                              <div className="font-semibold mb-1">پرداخت کامل کارت به کارت:</div>
                              <div>• مبلغ: {totalAmount.toLocaleString('fa-IR')} تومان</div>
                              <div>• وضعیت: بلافاصله به "موفق" تغییر می‌کند</div>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold mb-1">
                                {installmentNumber === 1 ? "قسط اول قسطی:" : "قسط دوم قسطی:"}
                              </div>
                              <div>• مبلغ هر قسط: {installmentAmountPerPayment.toLocaleString('fa-IR')} تومان</div>
                              {installmentNumber === 1 && (
                                <div>• یادآوری قسط بعدی: یک ماه بعد از امروز</div>
                              )}
                              {installmentNumber === 2 && (
                                <div>• پس از ثبت، وضعیت کل پرداخت به "موفق" تغییر می‌کند</div>
                              )}
                              <div>• مبلغ کل: {totalAmount.toLocaleString('fa-IR')} تومان (۲ قسط)</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </div>

              {/* Status Counts */}
              <div className="bg-[#0f0f0f] border border-gray-900 rounded-xl p-4">
                <div className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5 text-emerald-400" />
                  تعداد دفعات هر وضعیت
                </div>
                {Object.keys(userDetails.status_counts).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    هیچ فعالیتی ثبت نشده است
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(userDetails.status_counts)
                        .sort(([, a], [, b]) => b - a) // Sort by count descending
                        .map(([status, count]) => (
                        <div key={status} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 hover:border-emerald-600/50 transition-colors">
                          <div className="text-gray-400 text-xs mb-2">{translateStatus(status)}</div>
                          <div className="text-emerald-400 font-bold text-xl">{count.toLocaleString('fa-IR')} بار</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-900">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-400 text-sm">مجموع اقدامات</div>
                        <div className="text-emerald-400 font-bold text-2xl">{userDetails.total_actions.toLocaleString('fa-IR')} اقدام</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Activities Timeline */}
              <div className="bg-[#0f0f0f] border border-gray-900 rounded-xl p-4">
                <div className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  تاریخچه کامل فعالیت‌ها ({userDetails.activities.length} مورد)
                </div>
                {userDetails.activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    هیچ فعالیتی ثبت نشده است
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {userDetails.activities.map((activity, index) => (
                      <div key={activity.id || index} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 hover:border-emerald-600/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                                {userDetails.activities.length - index}
                              </div>
                              <div className="text-white font-medium">{translateStatus(activity.status)}</div>
                            </div>
                            <div className="text-gray-400 text-xs mr-10">
                              {formatPersianDateWithTime(new Date(activity.last_status_update || activity.created_at))}
                            </div>
                            {(activity.landing_duration_minutes && activity.landing_duration_minutes > 0) && (
                              <div className="text-gray-500 text-xs mt-1 mr-10">
                                مدت حضور: {activity.landing_duration_minutes} دقیقه
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Simple Manual Payment Form Modal */}
      <Dialog open={showSimpleManualPaymentForm} onOpenChange={setShowSimpleManualPaymentForm}>
        <DialogContent className="bg-[#0a0a0a] border border-gray-900 rounded-2xl max-w-md">
          <DialogHeader className="border-b border-gray-900 pb-4 mb-4">
            <DialogTitle className="text-white text-right text-xl font-bold flex items-center gap-3">
              <Plus className="h-5 w-5 text-cyan-400" />
              افزودن پرداخت دستی
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نام *</label>
              <input
                type="text"
                value={simpleFirstName}
                onChange={(e) => setSimpleFirstName(e.target.value)}
                placeholder="مثال: علی"
                className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نام خانوادگی *</label>
              <input
                type="text"
                value={simpleLastName}
                onChange={(e) => setSimpleLastName(e.target.value)}
                placeholder="مثال: احمدی"
                className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">شماره تماس *</label>
              <input
                type="text"
                value={simplePhone}
                onChange={(e) => setSimplePhone(e.target.value)}
                placeholder="مثال: 09123456789"
                className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">تاریخ پرداخت *</label>
              <input
                type="date"
                value={simplePaymentDate}
                onChange={(e) => setSimplePaymentDate(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نوع پرداخت *</label>
              <select
                value={manualPaymentMethod}
                onChange={(e) => setManualPaymentMethod(e.target.value as "card_to_card" | "installment")}
                className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="card_to_card">کارت به کارت (کامل)</option>
                <option value="installment">قسطی</option>
              </select>
            </div>

            {/* Installment Number (if installment) */}
            {manualPaymentMethod === "installment" && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">شماره قسط *</label>
                <select
                  value={installmentNumber}
                  onChange={(e) => setInstallmentNumber(parseInt(e.target.value) as 1 | 2)}
                  className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value={1}>قسط اول</option>
                  <option value={2}>قسط دوم</option>
                </select>
              </div>
            )}

            {/* Lead Promoter Selection */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">لید گرفته شده از (اختیاری)</label>
              <select
                value={selectedLeadPromoterId || ""}
                onChange={(e) => setSelectedLeadPromoterId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                disabled={loadingAdminUsers}
              >
                <option value="">انتخاب کنید (اختیاری)</option>
                {adminUsers.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name || admin.username} (@{admin.username})
                  </option>
                ))}
              </select>
              {loadingAdminUsers && (
                <p className="text-gray-500 text-xs mt-1">در حال بارگذاری...</p>
              )}
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">توضیحات (اختیاری)</label>
              <textarea
                value={manualPaymentDescription}
                onChange={(e) => setManualPaymentDescription(e.target.value)}
                placeholder="مثال: پرداخت از طریق کارت به کارت"
                className="w-full bg-[#0f0f0f] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={async () => {
                  if (!simpleFirstName.trim() || !simpleLastName.trim() || !simplePhone.trim() || !simplePaymentDate) {
                    alert("لطفاً تمام فیلدهای الزامی را پر کنید");
                    return;
                  }

                  setSubmittingManualPayment(true);
                  try {
                    // Parse payment date and time
                    const paymentDateTime = new Date(simplePaymentDate);
                    paymentDateTime.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

                    const response = await fetch(`${API_URL}/admin/payments/manual`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        first_name: simpleFirstName.trim(),
                        last_name: simpleLastName.trim(),
                        phone: simplePhone.trim(),
                        payment_method: manualPaymentMethod,
                        installment: manualPaymentMethod === "installment" ? {
                          installment_number: installmentNumber,
                        } : undefined,
                        description: manualPaymentDescription.trim() || undefined,
                        payment_date: paymentDateTime.toISOString(), // Send payment date
                        lead_promoter_id: selectedLeadPromoterId || undefined, // Send lead promoter ID if selected
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      throw new Error(errorData.error || "خطا در ثبت پرداخت");
                    }

                    const data = await response.json();
                    alert(`✅ ${data.message || "پرداخت با موفقیت ثبت شد"}`);
                    
                    // Reset form
                    setSimpleFirstName("");
                    setSimpleLastName("");
                    setSimplePhone("");
                    setSimplePaymentDate(new Date().toISOString().split('T')[0]);
                    setManualPaymentDescription("");
                    setManualPaymentMethod("card_to_card");
                    setInstallmentNumber(1);
                    setSelectedLeadPromoterId(null);
                    setShowSimpleManualPaymentForm(false);
                    
                    // Refresh payments list
                    await fetchPayments();
                  } catch (err: any) {
                    alert(`❌ خطا: ${err.message || "خطای ناشناخته"}`);
                  } finally {
                    setSubmittingManualPayment(false);
                  }
                }}
                disabled={submittingManualPayment}
                className="flex-1 bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {submittingManualPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ml-2" />
                    ثبت پرداخت
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowSimpleManualPaymentForm(false);
                  setSimpleFirstName("");
                  setSimpleLastName("");
                  setSimplePhone("");
                  setSimplePaymentDate(new Date().toISOString().split('T')[0]);
                  setManualPaymentDescription("");
                  setSelectedLeadPromoterId(null);
                }}
                variant="outline"
                className="border-gray-800 text-gray-300 hover:bg-gray-900"
              >
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment SMS Manager Dialog */}
      {!isAffiliate && (
      <PaymentSMSManager
        open={showPaymentSMSManager}
        onClose={() => setShowPaymentSMSManager(false)}
        token={token}
      />
      )}
    </>
  );
};

// Installment Timer Component
const InstallmentTimer = ({ nextInstallmentDate, onExpired }: { nextInstallmentDate: string; onExpired?: () => void }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const targetDate = new Date(nextInstallmentDate);
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        if (!isExpired && onExpired) {
          onExpired();
        }
        setIsExpired(true);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total: diff });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextInstallmentDate]);

  const formatNumber = (num: number) => {
    return num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="text-yellow-400 font-bold text-lg">
        ۲,۴۵۰,۰۰۰ تومان
      </div>
      
      {/* Timer Display */}
      {isExpired ? (
        <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <Clock className="h-4 w-4" />
            <span>زمان پرداخت قسط دوم گذشته است</span>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">روزشمار قسط بعدی</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="bg-[#0a0a0a] rounded px-2 py-1 border border-yellow-600/30">
                <span className="text-yellow-300 font-bold text-lg">{formatNumber(timeRemaining.days)}</span>
              </div>
              <span className="text-yellow-400 text-xs">روز</span>
            </div>
            <span className="text-yellow-400">:</span>
            <div className="flex items-center gap-1">
              <div className="bg-[#0a0a0a] rounded px-2 py-1 border border-yellow-600/30">
                <span className="text-yellow-300 font-bold text-lg">{formatNumber(timeRemaining.hours)}</span>
              </div>
              <span className="text-yellow-400 text-xs">ساعت</span>
            </div>
            <span className="text-yellow-400">:</span>
            <div className="flex items-center gap-1">
              <div className="bg-[#0a0a0a] rounded px-2 py-1 border border-yellow-600/30">
                <span className="text-yellow-300 font-bold text-lg">{formatNumber(timeRemaining.minutes)}</span>
              </div>
              <span className="text-yellow-400 text-xs">دقیقه</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Installment Date */}
      <div className="text-gray-400 text-xs">
        <div className="flex items-center gap-1 mb-1">
          <CalendarIcon className="h-3 w-3" />
          <span className="font-medium">تاریخ پیگیری:</span>
        </div>
        <div className="text-gray-300 text-sm mr-4">
          <PersianDateDisplay date={new Date(nextInstallmentDate)} />
        </div>
      </div>
    </div>
  );
};

const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    clicked_registration_link: "کلیک لینک ثبت‌نام",
    entered_landing: "ورود به لندینگ",
    in_landing: "در لندینگ",
    left_landing: "خارج شده از لندینگ",
    clicked_payment_button: "کلیک ورود به درگاه",
    clicked_card_to_card: "کلیک کارت به کارت",
    copied_card_to_card: "کپی کارت به کارت",
    clicked_installment: "کلیک قسطی",
    copied_installment_card: "کپی کارت قسطی",
    payment_initiated: "شروع پرداخت",
    payment_success: "پرداخت موفق",
    payment_failed: "پرداخت ناموفق",
  };
  return statusMap[status] || status;
};

export default PaymentsList;

