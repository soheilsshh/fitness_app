import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Users, Eye, MousePointerClick, TrendingUp, LogOut, ChevronRight, ChevronLeft, BarChart3, Filter, Settings, Clock, MessageSquare, Phone, X, Shield } from "lucide-react";
import { config } from "@/config/environment";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot } from "recharts";
import SMSMessageManager from "@/components/SMSMessageManager";
import TimedCommentsManager from "@/components/TimedCommentsManager";
import AdminUsersManager from "@/components/AdminUsersManager";
import AppointmentSchedulingManager from "@/components/AppointmentSchedulingManager";
import { 
  formatJalali as formatJalaliImport, 
  getJalaliDate as getJalaliDateImport, 
  getJalaliDayName as getJalaliDayNameImport, 
  getJalaliMonthName as getJalaliMonthNameImport, 
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
// Note: Keeping old date utilities for backward compatibility with chart data conversion
import { convertShamsiToTimestamp } from "@/utils/date/convertShamsiToTimestamp";
import { usePermissions } from "@/hooks/usePermissions";

interface DashboardStats {
  total_registrations: number;
  total_clicks: number;
  total_viewers: number;
  total_view_minutes: number;
  average_view_minutes: number;
  non_viewers: number;
  conversion_rate: number;
  registration_to_view_rate: number;
}

interface UserWithActivity {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  registered_at: string;
  clicked_at?: string;
  view_start_time?: string;
  view_end_time?: string;
  total_view_minutes: number;
  active_watch_minutes: number;
  watched_webinar: boolean;
}

interface PaginationInfo {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

type FilterType = "all" | "today" | "yesterday" | "week" | "last_week" | "month" | "last_month";

interface SystemConfig {
  webinar: {
    start_hour: number;
    start_minute: number;
    end_hour: number;
    duration_minutes: number;
    comment_offset_seconds: number;
  };
  melipayamak: {
    username: string;
    api_key: string;
    body_id_welcome: number;
    body_id_welcome_next_day: number;
    body_id_reminder_2pm: number;
    body_id_reminder_30min: number;
    enabled: boolean;
  };
  avanak: {
    token: string;
    message_id: number;
    base_url: string;
    enabled: boolean;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#2a9c96', '#f59e0b', '#ef4444', '#06b6d4'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserWithActivity[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, page_size: 50, total_count: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"viewers" | "non-viewers" | "all-users" | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<FilterType>("all");
  const [watchFilter, setWatchFilter] = useState<"all" | "watched" | "not_watched">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [registrationChartFilter, setRegistrationChartFilter] = useState<"week" | "month">("week");
  const [dailyRegistrations, setDailyRegistrations] = useState<any[]>([]);
  const [currentPersianMonth, setCurrentPersianMonth] = useState<{ year: number; month: number; monthName: string } | null>(null);
  const [selectedPersianMonth, setSelectedPersianMonth] = useState<{ year: number; month: number } | null>(null);
  const navigate = useNavigate();

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchStats();
    fetchUsers();
    fetchConfig();
    fetchDailyRegistrations();
    
    // Real-time polling: Refresh every 2 seconds for instant updates
    const interval = setInterval(() => {
      fetchStats();
      fetchUsers();
      fetchDailyRegistrations(); // Add daily registrations to polling
    }, 2000);

    return () => clearInterval(interval);
  }, [token, navigate, filter, watchFilter, currentPage, registrationChartFilter]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        throw new Error("خطا در دریافت تنظیمات");
      }

      const data = await response.json();
      setSystemConfig(data);
    } catch (err) {
      console.error("Failed to fetch config:", err);
    }
  };

  const updateWebinarConfig = async (config: SystemConfig["webinar"]) => {
    setSavingConfig(true);
    try {
      // Ensure all required fields are numbers, not undefined/null
      const payload = {
        start_hour: Number(config.start_hour) || 0,
        start_minute: Number(config.start_minute) || 0,
        end_hour: Number(config.end_hour) || 0,
        comment_offset_seconds: Number(config.comment_offset_seconds) || 0,
      };
      console.log("📤 updateWebinarConfig payload:", payload);
      const response = await fetch(`${API_URL}/admin/config/webinar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "خطا در به‌روزرسانی تنظیمات کارگاه";
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      await fetchConfig();
      alert("✅ تنظیمات کارگاه با موفقیت به‌روزرسانی شد");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "خطای ناشناخته";
      alert("❌ خطا: " + errorMessage);
    } finally {
      setSavingConfig(false);
    }
  };

  const updateMelipayamakConfig = async (config: SystemConfig["melipayamak"]) => {
    setSavingConfig(true);
    try {
      const response = await fetch(`${API_URL}/admin/config/melipayamak`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("خطا در به‌روزرسانی تنظیمات Melipayamak");
      }

      await fetchConfig();
      alert("✅ تنظیمات Melipayamak با موفقیت به‌روزرسانی شد");
    } catch (err: any) {
      alert("❌ خطا: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const updateAvanakConfig = async (config: SystemConfig["avanak"]) => {
    setSavingConfig(true);
    try {
      const response = await fetch(`${API_URL}/admin/config/avanak`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("خطا در به‌روزرسانی تنظیمات Avanak");
      }

      await fetchConfig();
      alert("✅ تنظیمات Avanak با موفقیت به‌روزرسانی شد");
    } catch (err: any) {
      alert("❌ خطا: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchStats = async () => {
    try {
      const url = `${API_URL}/admin/stats?filter=${filter}`;
      console.log('[Stats] Fetching stats with filter:', filter, url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error('[Stats] Error response:', errorText);
        throw new Error("خطا در دریافت آمار");
      }

      const data = await response.json();
      console.log('[Stats] Stats received:', data);
      
      // Validate stats data
      if (data && typeof data === 'object') {
        setStats(data);
      } else {
        console.warn('[Stats] Invalid stats data, using null');
        setStats(null);
      }
      
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error('[Stats] Error:', err);
      setError(err.message || "خطا در دریافت آمار");
      setStats(null); // Set to null on error
      setLoading(false);
    }
  };

  const fetchDailyRegistrations = async () => {
    if (!token) return;
    
    try {
      let url = `${API_URL}/admin/stats/daily-registrations?filter=${registrationChartFilter}`;
      
      // Add Persian month/year query parameters if month filter is selected
      if (registrationChartFilter === 'month' && selectedPersianMonth) {
        url += `&persian_year=${selectedPersianMonth.year}&persian_month=${selectedPersianMonth.month}`;
      }
      
      console.log('[DailyRegistrations] Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-cache',
      });

      console.log('[DailyRegistrations] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error('[DailyRegistrations] Error response:', errorText);
        throw new Error(`خطا در دریافت آمار روزانه ثبت‌نام‌ها: ${response.status}`);
      }

      const data = await response.json();
      console.log('[DailyRegistrations] Received data:', data);
      
      // Check multiple possible response formats
      let dailyStats = null;
      if (data && data.daily_stats && Array.isArray(data.daily_stats)) {
        dailyStats = data.daily_stats;
      } else if (data && Array.isArray(data)) {
        dailyStats = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        dailyStats = data.data;
      }
      
      if (dailyStats && Array.isArray(dailyStats) && dailyStats.length > 0) {
        console.log('[DailyRegistrations] Setting daily stats:', dailyStats.length, 'items');
        console.log('[DailyRegistrations] Sample data:', dailyStats[0]);
        setDailyRegistrations(dailyStats);
      } else {
        console.warn('[DailyRegistrations] No valid data found, received:', data);
        setDailyRegistrations([]);
      }
    } catch (err: any) {
      console.error('[DailyRegistrations] Fetch error:', err);
      console.error('[DailyRegistrations] Error details:', err.message, err.stack);
      setDailyRegistrations([]);
    }
  };

  useEffect(() => {
    if (token) {
      console.log('[DailyRegistrations] useEffect triggered, filter:', registrationChartFilter, 'selectedMonth:', selectedPersianMonth);
      fetchDailyRegistrations();
    } else {
      console.warn('[DailyRegistrations] No token available');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationChartFilter, token, selectedPersianMonth]);

  // Extract current Persian month from daily registrations
  useEffect(() => {
    if (dailyRegistrations && dailyRegistrations.length > 0 && registrationChartFilter === 'month') {
      const firstItem = dailyRegistrations[0];
      if (firstItem.persian_year && firstItem.persian_month) {
        const monthNumber = firstItem.persian_month === 'فروردین' ? 1 :
                 firstItem.persian_month === 'اردیبهشت' ? 2 :
                 firstItem.persian_month === 'خرداد' ? 3 :
                 firstItem.persian_month === 'تیر' ? 4 :
                 firstItem.persian_month === 'مرداد' ? 5 :
                 firstItem.persian_month === 'شهریور' ? 6 :
                 firstItem.persian_month === 'مهر' ? 7 :
                 firstItem.persian_month === 'آبان' ? 8 :
                 firstItem.persian_month === 'آذر' ? 9 :
                 firstItem.persian_month === 'دی' ? 10 :
                 firstItem.persian_month === 'بهمن' ? 11 :
                 firstItem.persian_month === 'اسفند' ? 12 : 1;
        
        // Only update if selectedPersianMonth is not set (initial load)
        // This prevents override when user manually changes month
        if (!selectedPersianMonth) {
          setCurrentPersianMonth({
            year: firstItem.persian_year,
            month: monthNumber,
            monthName: firstItem.persian_month
          });
          setSelectedPersianMonth({
            year: firstItem.persian_year,
            month: monthNumber
          });
        } else {
          // Update currentPersianMonth to match selectedPersianMonth (for display)
          // But don't change selectedPersianMonth - user's selection takes priority
          setCurrentPersianMonth({
            year: selectedPersianMonth.year,
            month: selectedPersianMonth.month,
            monthName: getJalaliMonthName(selectedPersianMonth.month)
          });
        }
      }
    } else if (registrationChartFilter === 'week') {
      setCurrentPersianMonth(null);
      setSelectedPersianMonth(null);
    }
  }, [dailyRegistrations, registrationChartFilter, selectedPersianMonth]);

  const fetchUsers = async () => {
    try {
      const url = `${API_URL}/admin/users?filter=${filter}&watch_filter=${watchFilter}&page=${currentPage}&page_size=50`;
      console.log('[Users] Fetching users with filter:', filter, url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error('[Users] Error response:', errorText);
        throw new Error("خطا در دریافت لیست کاربران");
      }

      const data = await response.json();
      console.log('[Users] Users received:', data);
      
      // Ensure users is always an array - with better error handling
      let usersArray: UserWithActivity[] = [];
      try {
        if (data && Array.isArray(data.users)) {
          usersArray = data.users;
        } else if (Array.isArray(data)) {
          usersArray = data;
        } else if (data && data.users && typeof data.users === 'object' && !Array.isArray(data.users)) {
          // If it's an object, try to convert to array
          usersArray = Object.values(data.users) as UserWithActivity[];
        } else {
          console.warn('[Users] Unexpected data format, defaulting to empty array:', data);
          usersArray = [];
        }
      } catch (parseError) {
        console.error('[Users] Error parsing users data:', parseError);
        usersArray = [];
      }
      
      // Ensure all items in array are valid
      usersArray = usersArray.filter(user => user && typeof user === 'object');
      
      console.log('[Users] Processed users array:', usersArray.length, 'users');
      setUsers(usersArray);
      
      if (data && data.pagination && typeof data.pagination === 'object') {
        setPagination(data.pagination);
      }
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('[Users] Error:', err);
      setError(err.message || "خطا در دریافت لیست کاربران");
      // Set empty array on error to prevent crashes
      setUsers([]);
    }
  };

  const exportExcel = async (type: "viewers" | "non-viewers") => {
    setExporting(type);
    setError(""); // Clear previous errors
    try {
      const endpoint = type === "viewers" ? "/export/viewers" : "/export/non-viewers";
      const url = `${API_URL}/admin${endpoint}?filter=${filter}`;
      console.log('[Export] Fetching', type, 'export:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[Export] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Export] Error response:', errorText);
        throw new Error(`خطا در دریافت فایل اکسل: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[Export] Blob received, size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error("فایل خالی است. احتمالاً کاربری در این بازه زمانی وجود ندارد.");
      }

      const url_obj = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url_obj;
      const filterLabels: Record<FilterType, string> = {
        all: "کلی",
        today: "امروز",
        yesterday: "دیروز",
        week: "این_هفته",
        last_week: "هفته_گذشته",
        month: "این_ماه",
        last_month: "ماه_گذشته"
      };
      const filterLabel = filterLabels[filter] || "کلی";
      a.download = type === "viewers" 
        ? `webinar_viewers_${filterLabel}.csv` 
        : `webinar_non_viewers_${filterLabel}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_obj);
      document.body.removeChild(a);
      console.log('[Export] File downloaded successfully');
    } catch (err: any) {
      console.error('[Export] Error:', err);
      setError(err.message || "خطا در دریافت فایل اکسل");
      alert(`❌ خطا: ${err.message || "خطا در دریافت فایل اکسل"}`);
    } finally {
      setExporting(null);
    }
  };

  const exportAllUsers = async () => {
    setExporting("all-users");
    setError(""); // Clear previous errors
    try {
      const url = `${API_URL}/admin/export/users?filter=${filter}`;
      console.log('[Export] Fetching users export:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[Export] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Export] Error response:', errorText);
        throw new Error(`خطا در دریافت فایل اکسل: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[Export] Blob received, size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error("فایل خالی است. احتمالاً کاربری در این بازه زمانی وجود ندارد.");
      }

      const url_obj = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url_obj;
      const filterLabels: Record<FilterType, string> = {
        all: "کلی",
        today: "امروز",
        yesterday: "دیروز",
        week: "این_هفته",
        last_week: "هفته_گذشته",
        month: "این_ماه",
        last_month: "ماه_گذشته"
      };
      const filterLabel = filterLabels[filter] || "کلی";
      a.download = `users_${filterLabel}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_obj);
      document.body.removeChild(a);
      console.log('[Export] File downloaded successfully');
    } catch (err: any) {
      console.error('[Export] Error:', err);
      setError(err.message || "خطا در دریافت فایل اکسل");
      alert(`❌ خطا: ${err.message || "خطا در دریافت فایل اکسل"}`);
    } finally {
      setExporting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  // Chart data for statistics visualization - Improved with better labels
  const chartData = useMemo(() => {
    try {
      if (!stats || typeof stats !== 'object') return [];
      return [
        { name: "ثبت‌نام‌ها", value: Number(stats.total_registrations) || 0, fill: COLORS[0] },
        { name: "کلیک‌ها", value: Number(stats.total_clicks) || 0, fill: COLORS[1] },
        { name: "بینندگان", value: Number(stats.total_viewers) || 0, fill: COLORS[2] },
        { name: "عدم تماشا", value: Number(stats.non_viewers) || 0, fill: COLORS[4] },
      ];
    } catch (error) {
      console.error('[ChartData] Error creating chart data:', error);
      return [];
    }
  }, [stats]);

  const registrationChartData = useMemo(() => {
    try {
      console.log('[RegistrationChartData] Processing dailyRegistrations:', dailyRegistrations);
      
      if (!dailyRegistrations || !Array.isArray(dailyRegistrations) || dailyRegistrations.length === 0) {
        console.log('[RegistrationChartData] No data available');
        return [];
      }
      
      const processed = dailyRegistrations.map((item, index) => {
        const value = Number(item.registrations) || Number(item.value) || 0;
        
        // Get Persian date string from backend (format: "1403/09/12" or "1403-09-12")
        const persianDateStr = item.persian_date || item.persianDate || '';
        
        // Convert Persian date to timestamp for chart
        let timestamp = 0;
        if (persianDateStr) {
          try {
            // Normalize date format (handle both / and -)
            const normalizedDate = persianDateStr.replace(/\//g, '-');
            timestamp = convertShamsiToTimestamp(normalizedDate);
          } catch (err) {
            console.error('[RegistrationChartData] Error converting date:', persianDateStr, err);
            // Fallback: use index as timestamp offset (not ideal but prevents crash)
            timestamp = Date.now() + (index * 24 * 60 * 60 * 1000);
          }
        } else {
          // Fallback: use index as timestamp offset
          timestamp = Date.now() + (index * 24 * 60 * 60 * 1000);
        }
        
        // For display names (X-axis labels)
        let displayName = '';
        if (registrationChartFilter === 'week') {
          displayName = item.day_name || item.name || '';
        } else {
          // Month view: show day number only (cleaner for chart)
          const dayNum = item.day_number || item.dayNumber || (index + 1);
          displayName = `${dayNum}`;
        }
        
        return {
          // x: timestamp (for chart sorting and positioning)
          x: timestamp,
          // name: display name for X-axis
          name: displayName,
          // y: value (for chart height)
          y: value,
          // Keep original data for tooltip
          fullName: item.day_name || item.dayName || item.name || '',
          persianDate: persianDateStr,
          persianMonth: item.persian_month || '',
          persianYear: item.persian_year || 0,
          dayNumber: item.day_number || item.dayNumber || 0,
          date: item.date || '',
          value: value,
          fill: COLORS[index % COLORS.length],
        };
      }).sort((a, b) => a.x - b.x); // Sort by timestamp to ensure correct order
      
      console.log('[RegistrationChartData] Processed data:', processed);
      return processed;
    } catch (error) {
      console.error('[RegistrationChartData] Error creating chart data:', error);
      return [];
    }
  }, [dailyRegistrations, registrationChartFilter]);

  // Safety check: ensure registrationChartData is always an array
  const safeRegistrationChartData = Array.isArray(registrationChartData) ? registrationChartData : [];

  // Calculate statistics for registration chart
  const registrationStats = useMemo(() => {
    if (!safeRegistrationChartData || safeRegistrationChartData.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        total: 0,
        minDay: '',
        maxDay: '',
      };
    }

    const values = safeRegistrationChartData.map(d => d.y || d.value || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;

    const minDay = safeRegistrationChartData.find(d => (d.y || d.value || 0) === min)?.fullName || safeRegistrationChartData.find(d => (d.y || d.value || 0) === min)?.name || '';
    const maxDay = safeRegistrationChartData.find(d => (d.y || d.value || 0) === max)?.fullName || safeRegistrationChartData.find(d => (d.y || d.value || 0) === max)?.name || '';

    return {
      min,
      max,
      average: Math.round(average * 10) / 10,
      total,
      minDay,
      maxDay,
    };
  }, [safeRegistrationChartData]);

  // Detailed stats chart data
  const detailedChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "میانگین تماشا", value: Math.round(stats.average_view_minutes || 0), fill: COLORS[3] },
      { name: "کل دقیقه تماشا", value: Math.round((stats.total_view_minutes || 0) / 100), fill: COLORS[5] },
    ];
  }, [stats]);

  const handleFilterChange = (newFilter: FilterType) => {
    try {
      console.log('[Filter] Changing filter from', filter, 'to', newFilter);
      setFilter(newFilter);
      setCurrentPage(1); // Reset to first page when filter changes
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error('[Filter] Error changing filter:', error);
      setError("خطا در تغییر فیلتر");
    }
  };

  const handlePageChange = (newPage: number) => {
    try {
      const maxPages = safePagination.total_pages || 1;
      if (newPage >= 1 && newPage <= maxPages) {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('[PageChange] Error:', error);
      setError("خطا در تغییر صفحه");
    }
  };

  // Safety check: ensure users is always an array and pagination is valid
  const safeUsers = Array.isArray(users) ? users : [];
  const safeChartData = Array.isArray(chartData) ? chartData : [];
  const safePagination = pagination && typeof pagination === 'object' ? pagination : { page: 1, page_size: 50, total_count: 0, total_pages: 1 };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 sm:p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header - Improved Mobile Layout */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-right w-full sm:w-auto">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">پنل مدیریتی کارگاه</h1>
                <div className="flex items-center gap-2 justify-end flex-wrap mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">آنلاین</span>
                  <span className="text-xs text-gray-500 hidden sm:inline">•</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    آخرین به‌روزرسانی: {lastUpdate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 shadow-lg w-full sm:w-auto"
                >
                  <Settings className="ml-2 h-4 w-4" />
                  تنظیمات
                </Button>
                <Button 
                  onClick={handleLogout} 
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 shadow-lg w-full sm:w-auto"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  خروج
                </Button>
              </div>
            </div>
            
            {/* Filter Buttons - Improved Styling */}
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 border-t border-gray-700">
              <Button
                onClick={() => handleFilterChange("all")}
                className={`${filter === "all" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Filter className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                کلی
              </Button>
              <Button
                onClick={() => handleFilterChange("today")}
                className={`${filter === "today" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Filter className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                امروز
              </Button>
              <Button
                onClick={() => handleFilterChange("yesterday")}
                className={`${filter === "yesterday" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Filter className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                دیروز
              </Button>
              <Button
                onClick={() => handleFilterChange("week")}
                className={`${filter === "week" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Filter className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                این هفته
              </Button>
              <Button
                onClick={() => handleFilterChange("last_week")}
                className={`${filter === "last_week" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Filter className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                هفته گذشته
              </Button>
              <Button
                onClick={() => handleFilterChange("month")}
                className={`${filter === "month" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Filter className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                این ماه
              </Button>
              <Button
                onClick={() => handleFilterChange("last_month")}
                className={`${filter === "last_month" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Filter className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                ماه گذشته
              </Button>
            </div>
            
            {/* Watch Filter Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 border-t border-gray-700 mt-2">
              <Button
                onClick={() => setWatchFilter("all")}
                className={`${watchFilter === "all" 
                  ? "bg-gradient-to-r from-[#187272] to-[#2a9c96] hover:from-[#2a9c96] hover:to-[#187272] text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Eye className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                همه کاربران
              </Button>
              <Button
                onClick={() => setWatchFilter("watched")}
                className={`${watchFilter === "watched" 
                  ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Eye className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                تماشا کرده‌ها
              </Button>
              <Button
                onClick={() => setWatchFilter("not_watched")}
                className={`${watchFilter === "not_watched" 
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg" 
                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                } font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all`}
              >
                <Eye className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                تماشا نکرده‌ها
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3 sm:px-6">
              <CardTitle className="text-white text-xs sm:text-sm font-medium text-right">ثبت‌نام‌ها</CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white/90 flex-shrink-0" />
            </CardHeader>
            <CardContent className="text-right px-4 pb-4 sm:px-6">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats?.total_registrations?.toLocaleString('fa-IR') || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3 sm:px-6">
              <CardTitle className="text-white text-xs sm:text-sm font-medium text-right">کلیک روی لینک</CardTitle>
              <MousePointerClick className="h-4 w-4 sm:h-5 sm:w-5 text-white/90 flex-shrink-0" />
            </CardHeader>
            <CardContent className="text-right px-4 pb-4 sm:px-6">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats?.total_clicks?.toLocaleString('fa-IR') || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#187272] to-[#2a9c96] border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3 sm:px-6">
              <CardTitle className="text-white text-xs sm:text-sm font-medium text-right">بینندگان</CardTitle>
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white/90 flex-shrink-0" />
            </CardHeader>
            <CardContent className="text-right px-4 pb-4 sm:px-6">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stats?.total_viewers?.toLocaleString('fa-IR') || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3 sm:px-6">
              <CardTitle className="text-white text-xs sm:text-sm font-medium text-right">میانگین تماشا (دقیقه)</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white/90 flex-shrink-0" />
            </CardHeader>
            <CardContent className="text-right px-4 pb-4 sm:px-6">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {stats?.average_view_minutes ? stats.average_view_minutes.toFixed(1).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]) : "۰"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Improved with better design */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Bar Chart - Statistics */}
            <Card className="bg-gray-800/50 border-gray-700 shadow-lg">
              <CardHeader className="px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-cyan-400" />
                    <CardTitle className="text-white text-right text-base sm:text-lg">آمار کلی</CardTitle>
                  </div>
                  <div className="text-xs text-gray-400">تعداد</div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={safeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      tick={{ fill: '#9ca3af' }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={11}
                      tick={{ fill: '#9ca3af' }}
                      tickFormatter={(value) => value.toLocaleString('fa-IR')}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151', 
                        borderRadius: '8px', 
                        color: '#fff',
                        padding: '10px'
                      }}
                      labelStyle={{ color: '#fff', marginBottom: '5px' }}
                      formatter={(value: number) => [value.toLocaleString('fa-IR'), 'تعداد']}
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {safeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Registration Chart - Modern Minimal Dark Theme */}
            <Card className="bg-[#1a1a1a] border border-gray-800/50 shadow-xl overflow-hidden">
              <CardHeader className="px-6 py-5 border-b border-gray-800/50 bg-[#1f1f1f]">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Title Section */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg font-semibold">
                        نمودار ثبت‌نام‌ها
                        {currentPersianMonth && registrationChartFilter === 'month' && (
                          <span className="text-base text-gray-300 mr-2 font-medium">
                            - {currentPersianMonth.monthName} {currentPersianMonth.year}
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  
                  {/* Filter Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-[#252525] rounded-lg p-1 border border-gray-700/30">
                    <Button
                      onClick={() => setRegistrationChartFilter("week")}
                        className={`px-4 py-1.5 text-sm font-medium transition-all rounded-md ${
                        registrationChartFilter === "week"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                            : "bg-transparent hover:bg-gray-700/30 text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      هفته
                    </Button>
                    <Button
                      onClick={() => setRegistrationChartFilter("month")}
                        className={`px-4 py-1.5 text-sm font-medium transition-all rounded-md ${
                        registrationChartFilter === "month"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                            : "bg-transparent hover:bg-gray-700/30 text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      ماه
                      </Button>
                    </div>
                    {registrationChartFilter === 'month' && currentPersianMonth && (
                      <div className="flex items-center gap-1 bg-[#252525] rounded-lg p-1 border border-gray-700/30">
                        <Button
                          onClick={() => {
                            if (selectedPersianMonth) {
                              let newMonth = selectedPersianMonth.month - 1;
                              let newYear = selectedPersianMonth.year;
                              
                              if (newMonth < 1) {
                                newMonth = 12;
                                newYear--;
                              }
                              
                              setSelectedPersianMonth({ year: newYear, month: newMonth });
                            }
                          }}
                          className="px-2 py-1.5 text-sm font-medium bg-transparent hover:bg-gray-700/30 text-gray-400 hover:text-gray-300 rounded-md"
                          title="ماه قبل"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="px-3 py-1.5 text-xs text-gray-300 min-w-[100px] text-center font-medium">
                          {selectedPersianMonth ? 
                            `${getJalaliMonthName(selectedPersianMonth.month)} ${selectedPersianMonth.year}` :
                            (currentPersianMonth ? `${currentPersianMonth.monthName} ${currentPersianMonth.year}` : '')
                          }
                        </div>
                        <Button
                          onClick={() => {
                            if (selectedPersianMonth) {
                              let newMonth = selectedPersianMonth.month + 1;
                              let newYear = selectedPersianMonth.year;
                              
                              if (newMonth > 12) {
                                newMonth = 1;
                                newYear++;
                              }
                              
                              setSelectedPersianMonth({ year: newYear, month: newMonth });
                            }
                          }}
                          className="px-2 py-1.5 text-sm font-medium bg-transparent hover:bg-gray-700/30 text-gray-400 hover:text-gray-300 rounded-md"
                          title="ماه بعد"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        console.log('🔄 Manual refresh triggered');
                        fetchDailyRegistrations();
                      }}
                      className="px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md"
                      title="به‌روزرسانی دستی"
                    >
                      🔄
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Statistics Row - Minimal Design */}
              {safeRegistrationChartData.length > 0 && (
                <div className="px-6 py-4 bg-[#1f1f1f] border-b border-gray-800/50">
                  <div className="flex items-center justify-end gap-6 sm:gap-8 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="text-sm text-gray-400">کمترین</div>
                      <div className="text-base font-semibold text-white">
                        {registrationStats.min.toLocaleString('fa-IR')}
                      </div>
                      {registrationStats.minDay && (
                        <div className="text-xs text-gray-500 mr-1">
                          {registrationStats.minDay}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-sm text-gray-400">بیشترین</div>
                      <div className="text-base font-semibold text-white">
                        {registrationStats.max.toLocaleString('fa-IR')}
                      </div>
                      {registrationStats.maxDay && (
                        <div className="text-xs text-gray-500 mr-1">
                          {registrationStats.maxDay}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <div className="text-sm text-gray-400">میانگین روزانه</div>
                      <div className="text-base font-semibold text-white">
                        {registrationStats.average.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <div className="text-sm text-gray-400">جمع کل</div>
                      <div className="text-base font-semibold text-white">
                        {registrationStats.total.toLocaleString('fa-IR')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Area */}
              <CardContent className="px-6 py-6 bg-[#1a1a1a]">
                {loading && safeRegistrationChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">در حال بارگذاری داده‌ها...</p>
                    </div>
                  </div>
                ) : safeRegistrationChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-3 opacity-50" />
                      <p className="text-gray-400 text-sm mb-1">هیچ داده‌ای یافت نشد</p>
                      <p className="text-gray-500 text-xs">داده‌های ثبت‌نام در این بازه زمانی موجود نیست</p>
                      <p className="text-gray-600 text-xs mt-2">لطفاً Console را بررسی کنید</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart 
                    data={safeRegistrationChartData} 
                      margin={{ top: 10, right: 20, left: 0, bottom: registrationChartFilter === 'week' ? 60 : 50 }}
                  >
                    <defs>
                        <linearGradient id="modernLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="50%" stopColor="#2a9c96" stopOpacity={1} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={1} />
                      </linearGradient>
                        <filter id="modernGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#2a2a2a" 
                        vertical={false}
                        opacity={0.5}
                      />
                    <XAxis 
                      dataKey="x" 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      stroke="#666" 
                      fontSize={12}
                      tick={{ fill: '#999', fontWeight: 500 }}
                      axisLine={{ stroke: '#333' }}
                      tickLine={{ stroke: '#333' }}
                      height={registrationChartFilter === 'week' ? 60 : 50}
                      interval={0}
                      tickFormatter={(value) => {
                        // Convert timestamp to Jalali for display
                        if (!value) return '';
                        try {
                          // Find the data point for this timestamp
                          const data = safeRegistrationChartData.find((d: any) => Math.abs(d.x - value) < 1000);
                          
                          if (registrationChartFilter === 'week') {
                            // For week view, show day name + date
                            if (data?.fullName && data?.persianYear && data?.persianMonth) {
                              const parts = data.persianDate?.split(/[-/]/) || [];
                              if (parts.length === 3) {
                                const day = parseInt(parts[2]);
                                return `${data.fullName}\n${day} ${data.persianMonth}`;
                              }
                            }
                            // Fallback: convert timestamp to Jalali
                            try {
                              const date = new Date(value);
                              const jalali = getJalaliDate(date);
                              const monthName = getJalaliMonthName(jalali?.month || 1);
                              return jalali ? `${jalali.day} ${monthName}` : '';
                            } catch {
                              return '';
                            }
                          } else {
                            // For month view, show day number
                            if (data?.dayNumber) {
                              return `${data.dayNumber}`;
                            }
                            // Fallback: convert timestamp to Jalali day
                            try {
                              const date = new Date(value);
                              const jalali = getJalaliDate(date);
                              return jalali ? jalali.day.toString() : '';
                            } catch {
                              return '';
                            }
                          }
                        } catch (err) {
                          console.error('[XAxis] Error formatting tick:', err);
                          return '';
                        }
                      }}
                    />
                    <YAxis 
                        stroke="#666" 
                      fontSize={12}
                        tick={{ fill: '#999', fontWeight: 500 }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                        width={60}
                      tickFormatter={(value) => value.toLocaleString('fa-IR')}
                    />
                    <Tooltip
                      contentStyle={{ 
                          backgroundColor: '#2a2a2a', 
                          border: '1px solid #3a3a3a', 
                          borderRadius: '8px', 
                        color: '#fff',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                      }}
                      labelStyle={{ 
                          color: '#ccc', 
                          marginBottom: '8px', 
                          fontWeight: '600',
                          fontSize: '13px'
                      }}
                      formatter={(value: number) => [
                          <span key="value" style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '15px' }}>
                          {value.toLocaleString('fa-IR')} نفر
                        </span>,
                          <span key="label" style={{ color: '#999' }}>ثبت‌نام</span>
                      ]}
                        labelFormatter={(value, payload) => {
                          // value is the x-axis timestamp
                          if (!payload || payload.length === 0) return '';
                        const data = payload[0].payload;
                          
                          // Convert timestamp to Jalali date for display
                          if (data.x) {
                            try {
                        if (registrationChartFilter === 'week') {
                                // For week view: show day name + full date
                                if (data.fullName && data.persianYear && data.persianMonth) {
                                  const parts = data.persianDate?.split(/[-/]/) || [];
                                  if (parts.length === 3) {
                                    const day = parseInt(parts[2]);
                                    return `${data.fullName} - ${day} ${data.persianMonth} ${data.persianYear}`;
                                  }
                                }
                                // Fallback: convert timestamp to Jalali
                                try {
                                  const date = new Date(data.x);
                                  const jalali = getJalaliDate(date);
                                  const monthName = getJalaliMonthName(jalali?.month || 1);
                                  return jalali ? `${data.fullName || ''} - ${jalali.day} ${monthName} ${jalali.year}` : '';
                                } catch {
                                  return data.fullName || '';
                                }
                        } else {
                                // For month view: show day + month + year
                                if (data.persianYear && data.persianMonth) {
                                  const parts = data.persianDate?.split(/[-/]/) || [];
                                  if (parts.length === 3) {
                                    const day = parseInt(parts[2]);
                                    return `${day} ${data.persianMonth} ${data.persianYear}`;
                                  }
                                }
                                // Fallback: convert timestamp to Jalali
                                try {
                                  const date = new Date(data.x);
                                  const jalali = getJalaliDate(date);
                                  const monthName = getJalaliMonthName(jalali?.month || 1);
                                  return jalali ? `${jalali.day} ${monthName} ${jalali.year}` : '';
                                } catch {
                                  return '';
                                }
                              }
                            } catch (err) {
                              console.error('[Tooltip] Error formatting date:', err);
                              return '';
                            }
                          }
                          return '';
                        }}
                        cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                    <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="url(#modernLineGradient)"
                        strokeWidth={2.5}
                        dot={{ 
                          fill: '#3b82f6', 
                          strokeWidth: 2, 
                          stroke: '#1a1a1a',
                          r: 4,
                          filter: 'url(#modernGlow)'
                        }}
                        activeDot={{ 
                          r: 6, 
                          fill: '#3b82f6',
                          stroke: '#fff',
                          strokeWidth: 2,
                          filter: 'url(#modernGlow)'
                        }}
                        animationDuration={2000}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gray-800/50 border-gray-700 shadow-lg sm:col-span-2 lg:col-span-1">
            <CardHeader className="px-4 py-3 sm:px-6">
              <CardTitle className="text-white text-right text-sm sm:text-base">عدم تماشا</CardTitle>
            </CardHeader>
            <CardContent className="text-right px-4 pb-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-red-400">{stats?.non_viewers?.toLocaleString('fa-IR') || 0}</div>
              <CardDescription className="text-gray-400 mt-1 text-right text-xs sm:text-sm">
                ثبت‌نام شده اما تماشا نکرده
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-gray-800/50 border-gray-700 shadow-lg">
          <CardHeader className="text-right">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div className="w-full sm:w-auto">
                <CardTitle className="text-white text-right text-lg sm:text-xl">
                  لیست کاربران ({safePagination.total_count?.toLocaleString('fa-IR') || 0})
                </CardTitle>
                <CardDescription className="text-gray-400 text-right text-xs sm:text-sm">
                  صفحه {currentPage.toLocaleString('fa-IR')} از {safePagination.total_pages?.toLocaleString('fa-IR') || 1}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => exportAllUsers()}
                  disabled={exporting !== null}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  {exporting === "all-users" ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال دانلود...
                    </>
                  ) : (
                    <>
                      <Download className="ml-2 h-4 w-4" />
                      <span className="hidden sm:inline">خروجی اکسل - همه کاربران</span>
                      <span className="sm:hidden">همه کاربران</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => exportExcel("viewers")}
                  disabled={exporting !== null}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  {exporting === "viewers" ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال دانلود...
                    </>
                  ) : (
                    <>
                      <Download className="ml-2 h-4 w-4" />
                      <span className="hidden sm:inline">خروجی اکسل - بینندگان</span>
                      <span className="sm:hidden">بینندگان</span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => exportExcel("non-viewers")}
                  disabled={exporting !== null}
                  variant="outline"
                  className="border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold shadow-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  {exporting === "non-viewers" ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال دانلود...
                    </>
                  ) : (
                    <>
                      <Download className="ml-2 h-4 w-4" />
                      <span className="hidden sm:inline">خروجی اکسل - غیر بینندگان</span>
                      <span className="sm:hidden">غیر بینندگان</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-white text-right text-xs sm:text-sm px-2 sm:px-4">نام</TableHead>
                    <TableHead className="text-white text-right text-xs sm:text-sm px-2 sm:px-4">نام خانوادگی</TableHead>
                    <TableHead className="text-white text-right text-xs sm:text-sm px-2 sm:px-4">شماره تماس</TableHead>
                    <TableHead className="text-white text-right text-xs sm:text-sm px-2 sm:px-4">تاریخ ثبت‌نام</TableHead>
                    <TableHead className="text-white text-right text-xs sm:text-sm px-2 sm:px-4">وضعیت تماشا</TableHead>
                    <TableHead className="text-white text-right text-xs sm:text-sm px-2 sm:px-4">مدت تماشا (فعال)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                        هیچ کاربری یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : (
                    safeUsers.map((user) => (
                      <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700/30 transition-colors">
                        <TableCell className="text-gray-300 text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-4">{user.first_name}</TableCell>
                        <TableCell className="text-gray-300 text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-4">{user.last_name}</TableCell>
                        <TableCell className="text-gray-300 font-mono text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-4" dir="ltr">{user.phone}</TableCell>
                        <TableCell className="text-gray-300 text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-4">
                          {formatJalali(new Date(user.registered_at), 'YYYY/MM/DD')} {new Date(user.registered_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-4">
                          {user.watched_webinar ? (
                            <span className="text-green-400 font-semibold">✓ تماشا کرده</span>
                          ) : (
                            <span className="text-red-400 font-semibold">✗ تماشا نکرده</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-4">{user.active_watch_minutes?.toLocaleString('fa-IR') || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {safeUsers.length === 0 ? (
                <div className="text-center text-gray-400 py-8">هیچ کاربری یافت نشد</div>
              ) : (
                safeUsers.map((user) => (
                  <Card key={user.id} className="bg-gray-700/30 border-gray-600">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="text-right flex-1">
                          <div className="text-white font-semibold text-base mb-1">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-gray-400 text-sm font-mono" dir="ltr">{user.phone}</div>
                        </div>
                        <div className="flex-shrink-0">
                          {user.watched_webinar ? (
                            <span className="text-green-400 font-semibold text-sm">✓ تماشا کرده</span>
                          ) : (
                            <span className="text-red-400 font-semibold text-sm">✗ تماشا نکرده</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-600">
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">تاریخ ثبت‌نام</div>
                          <div className="text-sm text-gray-300">
                            {toPersianDigits(formatJalali(new Date(user.registered_at), 'YYYY/MM/DD'))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">مدت تماشا (فعال)</div>
                          <div className="text-sm text-gray-300">{user.active_watch_minutes?.toLocaleString('fa-IR') || 0} دقیقه</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination - Improved Styling */}
            {safePagination.total_pages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-700">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="hidden sm:inline mr-1">قبلی</span>
                </Button>
                
                {Array.from({ length: Math.min(5, safePagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (safePagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= safePagination.total_pages - 2) {
                    pageNum = safePagination.total_pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={currentPage === pageNum 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg px-3 py-2" 
                        : "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600 px-3 py-2"
                      }
                      size="sm"
                    >
                      {pageNum.toLocaleString('fa-IR')}
                    </Button>
                  );
                })}
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === safePagination.total_pages}
                  className="bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2"
                  size="sm"
                >
                  <span className="hidden sm:inline ml-1">بعدی</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Panel */}
        {showSettings && systemConfig && (
          <SettingsPanel
            config={systemConfig}
            onClose={() => setShowSettings(false)}
            onUpdateWebinar={updateWebinarConfig}
            onUpdateMelipayamak={updateMelipayamakConfig}
            onUpdateAvanak={updateAvanakConfig}
            saving={savingConfig}
          />
        )}
      </div>
    </div>
  );
};

// Settings Panel Component
interface SettingsPanelProps {
  config: SystemConfig;
  onClose: () => void;
  onUpdateWebinar: (config: SystemConfig["webinar"]) => void;
  onUpdateMelipayamak: (config: SystemConfig["melipayamak"]) => void;
  onUpdateAvanak: (config: SystemConfig["avanak"]) => void;
  saving: boolean;
}

const SettingsPanel = ({ config: systemConfig, onClose, onUpdateWebinar, onUpdateMelipayamak, onUpdateAvanak, saving }: SettingsPanelProps) => {
  const { hasPermission } = usePermissions();
  const [webinarConfig, setWebinarConfig] = useState({
    start_hour: systemConfig.webinar?.start_hour ?? 0,
    start_minute: systemConfig.webinar?.start_minute ?? 0,
    end_hour: systemConfig.webinar?.end_hour ?? 0,
    duration_minutes: systemConfig.webinar?.duration_minutes ?? 0,
    comment_offset_seconds: systemConfig.webinar?.comment_offset_seconds ?? 0,
  });
  const [melipayamakConfig, setMelipayamakConfig] = useState(systemConfig.melipayamak);
  const [avanakConfig, setAvanakConfig] = useState(systemConfig.avanak);
  const [activeTab, setActiveTab] = useState<"webinar" | "melipayamak" | "avanak" | "comments" | "admin_users">("webinar");
  const [schedulingMode, setSchedulingMode] = useState<"manual" | "appointment">("manual");
  
  // Update webinar config when config prop changes
  useEffect(() => {
    if (systemConfig.webinar) {
      setWebinarConfig({
        start_hour: systemConfig.webinar.start_hour ?? 0,
        start_minute: systemConfig.webinar.start_minute ?? 0,
        end_hour: systemConfig.webinar.end_hour ?? 0,
        duration_minutes: systemConfig.webinar.duration_minutes ?? 0,
        comment_offset_seconds: systemConfig.webinar.comment_offset_seconds ?? 0,
      });
    }
  }, [systemConfig.webinar]);
  
  // Determine which tabs user can access
  const canViewSettings = hasPermission("settings.view");
  const canViewSMS = hasPermission("sms.view");
  const canViewAvanak = hasPermission("avanak.view");
  const canViewAdminUsers = hasPermission("admin_users.view");

  // Fetch scheduling mode on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    
    const API_URL = config.API_BASE_URL; // Use config from environment import
    fetch(`${API_URL}/admin/appointment-slots/scheduling-mode`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSchedulingMode(data.mode || "manual"))
      .catch((err) => console.error("Failed to fetch scheduling mode:", err));
  }, []);
  
  // Set default tab to first available tab
  useEffect(() => {
    // If current tab is not accessible, switch to first available tab
    if (activeTab === "melipayamak" && !canViewSMS) {
      setActiveTab("webinar");
    } else if (activeTab === "avanak" && !canViewAvanak) {
      setActiveTab("webinar");
    } else if (activeTab === "admin_users" && !canViewAdminUsers) {
      setActiveTab("webinar");
    }
  }, [activeTab, canViewSMS, canViewAvanak, canViewAdminUsers]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4" dir="rtl">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-gray-800 z-10 border-b border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
              <CardTitle className="text-white text-base sm:text-xl">تنظیمات سیستم</CardTitle>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-700 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("webinar")}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === "webinar"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Clock className="inline ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">زمان‌بندی کارگاه</span>
              <span className="sm:hidden">کارگاه</span>
            </button>
            <button
              onClick={() => setActiveTab("melipayamak")}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === "melipayamak"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <MessageSquare className="inline ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">مدیریت پیام‌های SMS</span>
              <span className="sm:hidden">SMS</span>
            </button>
            <button
              onClick={() => setActiveTab("avanak")}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === "avanak"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Phone className="inline ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Avanak (تماس صوتی)</span>
              <span className="sm:hidden">تماس</span>
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === "comments"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <MessageSquare className="inline ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">مدیریت کامنت‌ها</span>
              <span className="sm:hidden">کامنت</span>
            </button>
            <button
              onClick={() => setActiveTab("admin_users")}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === "admin_users"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Shield className="inline ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">مدیریت کاربران ادمین</span>
              <span className="sm:hidden">کاربران</span>
            </button>
          </div>

          {/* Webinar Settings */}
          {activeTab === "webinar" && (
            <div className="space-y-4">
              {/* Appointment Scheduling Manager */}
              <AppointmentSchedulingManager token={localStorage.getItem("admin_token") || ""} />
              
              <div className={`bg-gray-700/50 rounded-lg p-3 sm:p-4 ${schedulingMode === "appointment" ? "opacity-50 pointer-events-none" : ""}`}>
                <h3 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">
                  زمان‌بندی کارگاه (تنظیم دستی)
                  {schedulingMode === "appointment" && (
                    <span className="text-xs text-yellow-400 block mt-1">
                      ⚠️ این بخش غیرفعال است چون حالت نوبت‌دهی فعال است
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">ساعت شروع (0-23)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={webinarConfig.start_hour ?? 0}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        setWebinarConfig({ ...webinarConfig, start_hour: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">دقیقه شروع (0-59)</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={webinarConfig.start_minute ?? 0}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        setWebinarConfig({ ...webinarConfig, start_minute: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">ساعت پایان (0-23)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={webinarConfig.end_hour ?? 0}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        setWebinarConfig({ ...webinarConfig, end_hour: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">مدت زمان (دقیقه)</label>
                    <input
                      type="number"
                      value={webinarConfig.duration_minutes}
                      disabled
                      className="w-full bg-gray-700 text-gray-400 rounded-lg px-3 py-2 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">محاسبه خودکار بر اساس زمان شروع و پایان</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 text-sm mb-2">Offset کامنت (ثانیه) - برای همه دستگاه‌ها</label>
                    <input
                      type="number"
                      step="0.1"
                      value={webinarConfig.comment_offset_seconds || 0}
                      onChange={(e) => setWebinarConfig({ ...webinarConfig, comment_offset_seconds: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">مقدار منفی = کامنت‌ها زودتر، مثبت = کامنت‌ها دیرتر (برای همه دستگاه‌ها یکسان)</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Ensure all required fields have valid values
                    const configToSend = {
                      start_hour: Number(webinarConfig.start_hour) || 0,
                      start_minute: Number(webinarConfig.start_minute) || 0,
                      end_hour: Number(webinarConfig.end_hour) || 0,
                      duration_minutes: Number(webinarConfig.duration_minutes) || 0,
                      comment_offset_seconds: Number(webinarConfig.comment_offset_seconds) || 0,
                    };
                    console.log("📤 Sending webinar config:", configToSend);
                    onUpdateWebinar(configToSend);
                  }}
                  disabled={saving}
                  className="mt-3 sm:mt-4 bg-teal-600 hover:bg-teal-700 text-white w-full text-sm sm:text-base"
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    "ذخیره تنظیمات کارگاه"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Melipayamak Settings */}
          {activeTab === "melipayamak" && canViewSMS && (
            <div className="space-y-4">
              {/* SMS Message Manager */}
              <SMSMessageManager />
              
              {/* Basic Settings */}
              <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">تنظیمات پایه Melipayamak</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Username</label>
                    <input
                      type="text"
                      value={melipayamakConfig.username}
                      onChange={(e) => setMelipayamakConfig({ ...melipayamakConfig, username: e.target.value })}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="989103946748"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">API Key</label>
                    <input
                      type="password"
                      value={melipayamakConfig.api_key}
                      onChange={(e) => setMelipayamakConfig({ ...melipayamakConfig, api_key: e.target.value })}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="API Key"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={melipayamakConfig.enabled}
                      onChange={(e) => setMelipayamakConfig({ ...melipayamakConfig, enabled: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <label className="text-gray-300">فعال/غیرفعال</label>
                  </div>
                </div>
                <Button
                  onClick={() => onUpdateMelipayamak(melipayamakConfig)}
                  disabled={saving}
                  className="mt-3 sm:mt-4 bg-teal-600 hover:bg-teal-700 text-white w-full text-sm sm:text-base"
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    "ذخیره تنظیمات پایه"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Avanak Settings */}
          {activeTab === "avanak" && canViewAvanak && (
            <div className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg">تنظیمات Avanak (تماس صوتی)</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Token</label>
                    <input
                      type="password"
                      value={avanakConfig.token}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, token: e.target.value })}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Token"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Message ID (کد فایل صوتی)</label>
                    <input
                      type="number"
                      value={avanakConfig.message_id}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, message_id: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Base URL</label>
                    <input
                      type="text"
                      value={avanakConfig.base_url}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, base_url: e.target.value })}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="https://portal.avanak.ir/Rest/QuickSend"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={avanakConfig.enabled}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, enabled: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <label className="text-gray-300">فعال/غیرفعال</label>
                  </div>
                </div>
                <Button
                  onClick={() => onUpdateAvanak(avanakConfig)}
                  disabled={saving}
                  className="mt-3 sm:mt-4 bg-teal-600 hover:bg-teal-700 text-white w-full text-sm sm:text-base"
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    "ذخیره تنظیمات Avanak"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Comments Management */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              <TimedCommentsManager token={localStorage.getItem("admin_token") || ""} />
            </div>
          )}

          {/* Admin Users Management */}
          {activeTab === "admin_users" && canViewAdminUsers && (
            <div className="space-y-4">
              <AdminUsersManager />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;