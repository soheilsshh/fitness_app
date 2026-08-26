import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Users, Eye, MousePointerClick, TrendingUp, ChevronRight, ChevronLeft, Filter, Settings, Clock, MessageSquare, Phone, X, Shield, DollarSign, ChevronDown, Search, Calendar, RefreshCw, Edit, Save, Play, Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { config } from "@/config/environment";
import { cn } from "@/lib/utils";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import SMSMessageManager from "@/components/SMSMessageManager";
import AvanakMessageManager from "@/components/AvanakMessageManager";
import TimedCommentsManager from "@/components/TimedCommentsManager";
import WebinarProgramsManager from "@/components/WebinarProgramsManager";
import AdminUsersManager from "@/components/AdminUsersManager";
import UserProfile from "@/components/UserProfile";
import PaymentsList from "@/components/PaymentsList";
import AffiliatesManager from "@/components/AffiliatesManager";
import LicenseManager from "@/components/LicenseManager";
import AppointmentSchedulingManager from "@/components/AppointmentSchedulingManager";
import { 
  formatJalali, 
  getJalaliDate, 
  getJalaliDayName, 
  getJalaliMonthName, 
  toPersianDigits,
  toGregorian as persianToGregorian 
} from "@/utils/jalali";

import { convertShamsiToTimestamp } from "@/utils/date/convertShamsiToTimestamp";
import { timestampToShamsi, timestampToShamsiFull, timestampToShamsiDayMonth } from "@/utils/date/timestampToShamsi";
import { usePermissions, UsePermissionsReturn } from "@/hooks/usePermissions";
import PillNav from "@/components/PillNav";

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
  promoter_id?: number;
  promoter_username?: string;
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

type UsersSubview = "list" | "behavior" | "sms_center";

interface ThankYouFunnelResponse {
  success: boolean;
  range: { start: number; end: number };
  total_unique_users: number;
  reached: {
    opened?: number;
    step_1: number;
    step_2: number;
    step_3: number;
    step_4: number;
    step_5: number;
    step_6: number;
    step_7: number;
    complete: number;
  };
  max_step_distribution: Record<string, number>;
  watch: {
    watched_count: number;
    watched_rate: number;
    avg_watch_minutes: number;
  };
}

interface BehaviorFunnelResponse {
  success: boolean;
  cohort_range: { start: number; end: number };
  event_range: { start: number; end: number };
  reached: Record<string, number>;
  watch: { watched_any: number; avg_active_minutes: number };
}

// Inline باکس تست آوانک (برای جلوگیری از ReferenceError و استفاده مجدد)
const AvanakQuickTestBox: React.FC<{
  defaultMessageId?: number;
  loading: boolean;
  onSend: (phone: string, messageId?: number) => void;
  helper?: string;
}> = ({ defaultMessageId, loading, onSend, helper }) => {
  const [phone, setPhone] = useState("");
  const [mid, setMid] = useState<string>(defaultMessageId ? String(defaultMessageId) : "");

  useEffect(() => {
    if (defaultMessageId) {
      setMid(String(defaultMessageId));
    }
  }, [defaultMessageId]);

  return (
    <div className="mt-3 p-3 sm:p-4 border border-cyan-500/20 rounded-xl bg-[#0b0b0b] text-right">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="h-4 w-4 text-cyan-400" />
        <span className="text-gray-200 font-semibold text-sm">تست فوری آوانک</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1">شماره گیرنده</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-cyan-500/20 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            placeholder="مثلاً 0912xxxxxxx"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1">کد فایل صوتی (MessageID)</label>
          <input
            type="number"
            value={mid}
            onChange={(e) => setMid(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-cyan-500/20 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            placeholder="مثلاً 41027586"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          onClick={() => onSend(phone, mid ? parseInt(mid) : defaultMessageId)}
          disabled={loading}
          className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/30 text-cyan-100 rounded-lg px-4 py-2 flex items-center gap-2"
          variant="secondary"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال تست...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              ارسال تست
            </>
          )}
        </Button>
        <span className="text-xs text-gray-500">
          {helper || "وضعیت دقیق در پاپ‌آپ نمایش داده می‌شود."}
        </span>
      </div>
    </div>
  );
};

interface SmartSMSTodayResponse {
  success: boolean;
  yesterday_range: { start: string; end: string };
  items: Array<{
    category: string;
    provider: "melipayamak" | "faraz" | "avanak";
    scheduled_time: string; // HH:MM
    message_text: string;
    pattern_key?: string;
    pattern_code?: string;
    avanak_message_id?: number; // For Avanak voice calls
    status: string;
    eligible_count: number;
    sent_count: number;
  }>;
}

interface SmartSMSPopupFollowupsResponse {
  success: boolean;
  cutoff: string;
  items: Array<{
    category: string;
    provider: "melipayamak" | "faraz" | "avanak";
    pattern_code?: string;
    title: string;
    description: string;
    status: string; // فعال | غیرفعال
    eligible_count: number;
  }>;
}

interface SmartSMSEligibleUsersResponse {
  success: boolean;
  category: string;
  cutoff?: string;
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  users: Array<{
    user_id: number; // identity id
    cycle_id: number; // registration cycle id
    first_name: string;
    total_watch_seconds?: number; // Total watch time in seconds
    first_join_at?: string; // First time joined webinar
    last_name: string;
    phone: string;
    registered_at: string;
  }>;
  excluded_users?: Array<{
    user_id: number;
    cycle_id: number;
    first_name: string;
    last_name: string;
    phone: string;
    registered_at: string;
    total_watch_seconds?: number;
    first_join_at?: string;
  }>; // Users excluded because they watched more than 10 minutes
}

interface SmartSMSSentUsersResponse {
  success: boolean;
  category: string;
  range?: { start: string; end: string };
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  users: Array<{
    user_id: number;
    cycle_id: number;
    first_name: string;
    last_name: string;
    phone: string;
    registered_at: string;
    sent_at: string;
    provider: string;
    total_watch_seconds?: number;
    first_join_at?: string;
  }>;
}

// RegistrationChartPoint interface removed - no longer needed

type FilterType = "all" | "today" | "yesterday" | "week" | "last_week" | "month" | "last_month";

const DATE_FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "همه تاریخ‌ها" },
  { value: "today", label: "امروز" },
  { value: "yesterday", label: "دیروز" },
  { value: "week", label: "هفته جاری" },
  { value: "last_week", label: "هفته گذشته" },
  { value: "month", label: "ماه جاری" },
  { value: "last_month", label: "ماه گذشته" },
];

const WATCH_FILTER_OPTIONS = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "watched", label: "تماشا کرده" },
  { value: "not_watched", label: "تماشا نکرده" },
] as const;

interface SystemConfig {
  webinar: {
    start_hour: number;
    start_minute: number;
    end_hour: number;
    duration_minutes: number;
    comment_offset_seconds: number;
  };
  payment: {
    subscription_price: number;
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
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const formatPersianNumber = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "";
  }
  return value.toLocaleString("fa-IR");
};

const parseGregorianDateString = (dateStr?: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/]/).map((part) => parseInt(part, 10));
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [year, month, day] = parts;
  return new Date(year, (month || 1) - 1, day || 1);
};

// Local copies to prevent tree-shaking issues in production build
// This ensures functions are always available even if bundler optimizes imports
function toPersianDigitsLocal(str: string | number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(str).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

type StatSlice = Pick<DashboardStats, "total_registrations" | "total_clicks" | "total_viewers" | "non_viewers">;

function calcDayOverDayChange(today: number, yesterday: number): number {
  if (yesterday === 0) return today === 0 ? 0 : 100;
  return ((today - yesterday) / yesterday) * 100;
}

function DayChangeBadge({ change }: { change: number }) {
  const isUp = change >= 0;
  return (
    <div className="flex items-center gap-1.5 mt-1 lg:mt-2">
      <span className={cn("text-[10px] lg:text-xs font-medium", isUp ? "text-emerald-300" : "text-red-300")}>
        {isUp ? "+" : ""}
        {toPersianDigitsLocal(change.toFixed(1))}%
      </span>
      <span className="text-[10px] lg:text-xs text-gray-500">نسبت به روز قبل</span>
    </div>
  );
}

function MetricRing({
  value,
  strokeColor,
  label,
  subtitle,
}: {
  value: number;
  strokeColor: string;
  label: string;
  subtitle: string;
}) {
  const safe = Math.min(Math.max(value, 0), 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="fp-card fp-notch border-white/10 p-5 lg:p-6 flex items-center gap-5 min-w-0">
      <div className="relative h-[88px] w-[88px] shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
          <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center fp-hud-num text-base lg:text-lg text-white">
          {toPersianDigitsLocal(safe.toFixed(1))}%
        </span>
      </div>
      <div className="text-right min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}

// Store references to imported functions to prevent tree-shaking
const formatJalaliRef = formatJalali;
const getJalaliDateRef = getJalaliDate;
const getJalaliMonthNameRef = getJalaliMonthName;
const getJalaliDayNameRef = getJalaliDayName;
const toPersianDigitsRef = toPersianDigits;

// Make functions available globally for child components (PaymentsList, AdminPanel)
// This prevents "function is not defined" errors in production builds
if (typeof window !== 'undefined') {
  (window as any).toPersianDigits = toPersianDigitsRef || toPersianDigitsLocal;
  (window as any).formatJalali = formatJalaliRef;
  (window as any).getJalaliDate = getJalaliDateRef;
  (window as any).getJalaliMonthName = getJalaliMonthNameRef;
  (window as any).getJalaliDayName = getJalaliDayNameRef;
}

const AdminDashboard = () => {
  // Ensure formatJalali is available in component scope (prevent tree-shaking)
  const formatJalali = formatJalaliRef;
  const getJalaliDate = getJalaliDateRef;
  const getJalaliMonthName = getJalaliMonthNameRef;
  const getJalaliDayName = getJalaliDayNameRef;
  const toPersianDigits = toPersianDigitsRef || toPersianDigitsLocal;
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dayComparison, setDayComparison] = useState<{ today: StatSlice; yesterday: StatSlice } | null>(null);
  const [users, setUsers] = useState<UserWithActivity[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, page_size: 50, total_count: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"viewers" | "non-viewers" | "all-users" | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [watchFilter, setWatchFilter] = useState<"all" | "watched" | "not_watched">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  // Registration chart and hot users removed - no longer needed
  const [onlineViewersCount, setOnlineViewersCount] = useState<number>(0);
  const [showOnlineViewersModal, setShowOnlineViewersModal] = useState<boolean>(false);
  const [onlineViewersList, setOnlineViewersList] = useState<Array<{
    phone: string;
    first_name: string;
    last_name: string;
    view_start_time: string;
    watch_duration_minutes: number;
    active_watch_minutes: number;
    last_updated: string;
    user_id?: number;
  }>>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [loadingOnlineViewers, setLoadingOnlineViewers] = useState<boolean>(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedStartDate, setAdvancedStartDate] = useState("");
  const [advancedStartTime, setAdvancedStartTime] = useState("00:00");
  const [advancedEndDate, setAdvancedEndDate] = useState("");
  const [advancedEndTime, setAdvancedEndTime] = useState("23:59");
  const [filterUniquePhones, setFilterUniquePhones] = useState(false);
  const [usersSubview, setUsersSubview] = useState<UsersSubview>("list");

  const [thankYouPreset, setThankYouPreset] = useState<"24h" | "7d" | "30d" | "custom">("7d");
  const [thankYouStartDate, setThankYouStartDate] = useState("");
  const [thankYouStartTime, setThankYouStartTime] = useState("00:00");
  const [thankYouEndDate, setThankYouEndDate] = useState("");
  const [thankYouEndTime, setThankYouEndTime] = useState("23:59");
  const [thankYouWatchFilter, setThankYouWatchFilter] = useState<"all" | "watched" | "not_watched">("all");
  const [thankYouFunnel, setThankYouFunnel] = useState<ThankYouFunnelResponse | null>(null);
  const [loadingThankYouFunnel, setLoadingThankYouFunnel] = useState(false);
  const [behaviorFunnel, setBehaviorFunnel] = useState<BehaviorFunnelResponse | null>(null);
  const [loadingBehaviorFunnel, setLoadingBehaviorFunnel] = useState(false);
  const [smartSmsToday, setSmartSmsToday] = useState<SmartSMSTodayResponse | null>(null);
  const [loadingSmartSmsToday, setLoadingSmartSmsToday] = useState(false);
  const [smartSmsPopup, setSmartSmsPopup] = useState<SmartSMSPopupFollowupsResponse | null>(null);
  const [loadingSmartSmsPopup, setLoadingSmartSmsPopup] = useState(false);
  const [editingScheduledMessage, setEditingScheduledMessage] = useState<{
    category: string;
    provider: string;
    hour: number;
    minute: number;
    message: string;
    pattern_key?: string;
    avanak_message_id?: number; // For Avanak voice calls
    is_active: boolean;
    display_order: number;
  } | null>(null);
  const [savingScheduledMessage, setSavingScheduledMessage] = useState(false);
  const [eligibleUsersOpen, setEligibleUsersOpen] = useState(false);
  const [eligibleUsersLoading, setEligibleUsersLoading] = useState(false);
  const [eligibleUsersTitle, setEligibleUsersTitle] = useState<string>("");
  const [eligibleUsersCategory, setEligibleUsersCategory] = useState<string>("");
  const [eligibleUsersPage, setEligibleUsersPage] = useState<number>(1);
  const [eligibleUsersMode, setEligibleUsersMode] = useState<"eligible" | "sent">("eligible");
  const [eligibleUsersResp, setEligibleUsersResp] = useState<SmartSMSEligibleUsersResponse | null>(null);
  const [sentUsersResp, setSentUsersResp] = useState<SmartSMSSentUsersResponse | null>(null);
  const [avanakLogs, setAvanakLogs] = useState<{ data: any[]; pagination: { page: number; total_count: number; limit: number } } | null>(null);
  const [avanakLogsLoading, setAvanakLogsLoading] = useState(false);
  const [avanakLogsPage, setAvanakLogsPage] = useState(1);
  const [showAvanakLogsModal, setShowAvanakLogsModal] = useState(false);
  const [avanakTestPhone, setAvanakTestPhone] = useState("");
  const [avanakTestMessageId, setAvanakTestMessageId] = useState<string>("");
  const [avanakTestLoading, setAvanakTestLoading] = useState(false);
  const [showAvanakTestModal, setShowAvanakTestModal] = useState(false);
  const [avanakTestModalContent, setAvanakTestModalContent] = useState<{ title: string; body: string; status: "success" | "error" } | null>(null);
  const [dailyRegistrationsStats, setDailyRegistrationsStats] = useState<any[]>([]);
  const [loadingDailyRegistrations, setLoadingDailyRegistrations] = useState(false);
  const [registrationsChartFilter, setRegistrationsChartFilter] = useState<"month" | "week" | "all">("month");
  const [schedulingMode, setSchedulingMode] = useState<"manual" | "appointment">("manual");
  const navigate = useNavigate();

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");
  const permissionsContext = usePermissions();
  const { hasPermission, loading: permissionsLoading } = permissionsContext;
  // Type assertion to fix TypeScript inference issue
  // @ts-ignore - TypeScript cache issue, isAffiliate exists in UsePermissionsReturn
  const currentUserIsAffiliate: boolean = permissionsContext.isAffiliate ?? false;
  
  // Debug: Log affiliate status
  useEffect(() => {
    if (!permissionsLoading) {
      console.log('[AdminDashboard] Current user isAffiliate:', currentUserIsAffiliate);
    }
  }, [currentUserIsAffiliate, permissionsLoading]);
  
  // Use toPersianDigitsLocal directly in component
  const canViewUsersList = hasPermission("users.view");
  const canExportUsers = hasPermission("users.export");
  const canManageWebinar = hasPermission("settings.webinar") || hasPermission("settings.edit");
  const canManageSMSConfig = hasPermission("settings.sms") || hasPermission("sms.view");
  const canManageComments = hasPermission("settings.comments") || hasPermission("settings.edit");
  const canViewAvanak = hasPermission("avanak.view");
  const canViewAdminUsers = hasPermission("admin_users.view");
  const canViewPayments = hasPermission("payments.view");
  const canViewAffiliates = hasPermission("affiliates.view");
  const canViewDashboard = hasPermission("dashboard.view");
  const canViewAffiliate = hasPermission("dashboard.affiliate.view");
  // If user has affiliate permission but not full dashboard permission, they see only affiliate stats
  const isAffiliateOnly = canViewAffiliate && !canViewDashboard;
  
  // Widget permissions - Online viewers only for full admin (not affiliate)
  const canViewWidgetOnline = hasPermission("dashboard.widget.online") || hasPermission("dashboard.view");
  const canViewWidgetRegistrations = hasPermission("dashboard.widget.registrations") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewWidgetClicks = hasPermission("dashboard.widget.clicks") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewWidgetViewers = hasPermission("dashboard.widget.viewers") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewWidgetNonViewers = hasPermission("dashboard.widget.non_viewers") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewWidgetOverview = hasPermission("dashboard.widget.overview") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewWidgetRegChart = hasPermission("dashboard.widget.registration_chart") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewWidgetConversion = hasPermission("dashboard.widget.conversion_rate") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewWidgetRegToView = hasPermission("dashboard.widget.registration_to_view") || hasPermission("dashboard.view") || hasPermission("dashboard.affiliate.view");
  const canViewTimeFilters =
    canViewWidgetOnline ||
    canViewWidgetRegistrations ||
    canViewWidgetClicks ||
    canViewWidgetViewers ||
    canViewWidgetNonViewers ||
    canViewWidgetOverview ||
    canViewWidgetRegChart ||
    canViewWidgetConversion ||
    canViewWidgetRegToView;

  const canOpenSettings =
    hasPermission("settings.view") ||
    canManageWebinar ||
    canManageSMSConfig ||
    canViewAvanak ||
    canManageComments ||
    canViewAdminUsers ||
    canViewWidgetOnline ||
    canViewWidgetRegistrations ||
    canViewWidgetClicks;

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchStats();
    fetchDayComparison();
    if (canViewUsersList) {
    fetchUsers();
    } else {
      setUsers([]);
    }
    fetchConfig();
    fetchOnlineViewers();
    
    // Fetch scheduling mode on mount
    const fetchSchedulingMode = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/admin/appointment-slots/scheduling-mode`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSchedulingMode(data.mode || "manual");
      } catch (err) {
        console.error("Failed to fetch scheduling mode:", err);
      }
    };
    fetchSchedulingMode();
    
    // OPTIMIZED: Reduced polling frequency to reduce server load
    // Stats refresh every 5 seconds (was 2 seconds) - still feels real-time
    const statsInterval = setInterval(() => {
      fetchStats();
    fetchDayComparison();
      if (canViewUsersList) {
      fetchUsers();
      }
    }, 5000); // Increased from 2000ms to 5000ms

    // OPTIMIZED: Online viewers refresh every 3 seconds (was 1 second) - still feels real-time
    const onlineViewersInterval = setInterval(() => {
      fetchOnlineViewers();
    }, 3000); // Increased from 1000ms to 3000ms

    return () => {
      clearInterval(statsInterval);
      clearInterval(onlineViewersInterval);
    };
  }, [token, navigate, filter, watchFilter, currentPage, canViewUsersList, filterUniquePhones, showAdvancedFilter, advancedStartDate, advancedStartTime, advancedEndDate, advancedEndTime, userSearchQuery]);

  // Fetch daily registrations stats for chart
  useEffect(() => {
    if (!canViewUsersList || !token) return;
    fetchDailyRegistrationsStats();
  }, [token, registrationsChartFilter, canViewUsersList]);


  // Auto-refresh online viewers list when modal is open (real-time updates)
  useEffect(() => {
    if (!showOnlineViewersModal || !token) return;

    // Fetch immediately when modal opens (with loading)
    fetchOnlineViewersList(true);

    // OPTIMIZED: Auto-refresh every 5 seconds (was 2 seconds) to reduce server load
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing online viewers list...');
      fetchOnlineViewersList(false); // Don't show loading spinner for auto-refresh
    }, 5000); // Increased from 2000ms to 5000ms

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlineViewersModal, token]); // Only depend on modal state and token

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFilterDropdown && !target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const fetchConfig = async () => {
    try {
      // Add cache busting
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}/admin/config?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
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
      console.log("📥 Fetched config from server:", data);
      console.log("💰 Payment config:", data.payment);
      console.log("💰 Subscription price:", data.payment?.subscription_price);
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


  const updatePaymentConfig = async (subscriptionPrice: number) => {
    console.log("🔍 updatePaymentConfig called with price:", subscriptionPrice, "Type:", typeof subscriptionPrice);
    
    // Validate price
    if (subscriptionPrice <= 0 || isNaN(subscriptionPrice)) {
      throw new Error("قیمت باید عددی مثبت باشد");
    }
    console.log("🔍 API_URL:", API_URL);
    console.log("🔍 token exists:", !!token);
    
    // Try direct payment config endpoint first
    const directUrl = `${API_URL}/admin/config/payment`;
    console.log("🔍 Trying direct payment config endpoint:", directUrl);
    
    try {
      let response = await fetch(directUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription_price: subscriptionPrice }),
      });

      console.log("📡 Direct endpoint response status:", response.status, response.statusText);

      // If direct endpoint works, use it
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Price updated via direct endpoint:", result);
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchConfig();
        return result;
      }

      // If 404, fallback to webinar endpoint
      if (response.status === 404) {
        console.log("⚠️ Direct endpoint returned 404, trying webinar endpoint...");
        const url = `${API_URL}/admin/config/webinar`;
        console.log("🔍 Updating price via webinar config endpoint (fallback):", { url, subscriptionPrice });
        
        // Get current webinar config first
        const currentConfig = systemConfig?.webinar;
        if (!currentConfig) {
          throw new Error("تنظیمات کارگاه در دسترس نیست");
        }

        // Update webinar config with subscription_price included
        response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_hour: currentConfig.start_hour,
            start_minute: currentConfig.start_minute,
            end_hour: currentConfig.end_hour,
            comment_offset_seconds: currentConfig.comment_offset_seconds || 0,
            subscription_price: subscriptionPrice, // Include price in the request
          }),
        });

        console.log("📡 Webinar endpoint response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Error response:", errorText);
          let errorMessage = "خطا در به‌روزرسانی قیمت";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("✅ Price updated successfully via webinar config endpoint:", result);
        
        // Broadcast price change event to all open pages (including AIPage)
        window.dispatchEvent(new CustomEvent('subscriptionPriceChanged', { 
          detail: { price: subscriptionPrice } 
        }));
        console.log("📢 Broadcasted subscriptionPriceChanged event with price:", subscriptionPrice);
        
        // Wait a bit for DB to be ready, then fetch multiple times
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch config with cache busting
        const fetchConfigWithCacheBust = async () => {
          const timestamp = new Date().getTime();
          try {
            const response = await fetch(`${API_URL}/admin/config?t=${timestamp}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              },
              cache: 'no-store',
            });
            if (response.ok) {
              const data = await response.json();
              console.log("📥 Fetched config after price update:", data);
              console.log("💰 Payment config in response:", data.payment);
              setSystemConfig(data);
              return data;
            }
          } catch (err) {
            console.error("Failed to fetch config:", err);
          }
          return null;
        };
        
        // Fetch multiple times to ensure we get the updated value
        let fetchedData = await fetchConfigWithCacheBust();
        await new Promise(resolve => setTimeout(resolve, 500));
        fetchedData = await fetchConfigWithCacheBust();
        await new Promise(resolve => setTimeout(resolve, 500));
        fetchedData = await fetchConfigWithCacheBust();
        
        // Also manually update the state to ensure UI updates immediately
        if (systemConfig) {
          const updatedConfig = {
            ...systemConfig,
            payment: {
              ...systemConfig.payment,
              subscription_price: subscriptionPrice,
            },
          };
          setSystemConfig(updatedConfig);
          console.log("🔄 Manually updated systemConfig with new price:", subscriptionPrice);
        }
        
        // Verify the price was actually updated
        if (fetchedData?.payment?.subscription_price) {
          console.log("✅ Verified: Price in fetched config =", fetchedData.payment.subscription_price);
          if (fetchedData.payment.subscription_price !== subscriptionPrice) {
            console.warn("⚠️ WARNING: Fetched price doesn't match! Expected:", subscriptionPrice, "Got:", fetchedData.payment.subscription_price);
          }
        }
        
        return result;
      }
      
      // If we get here, direct endpoint returned non-404 error
      const errorText = await response.text();
      console.error("❌ Direct endpoint error response:", errorText);
      let errorMessage = "خطا در به‌روزرسانی قیمت";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    } catch (err: any) {
      console.error("❌ Failed to update price:", err);
      throw err;
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "خطای ناشناخته";
      alert("❌ خطا: " + errorMessage);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "خطای ناشناخته";
      alert("❌ خطا: " + errorMessage);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleStopStream = async () => {
    if (!confirm("⚠️ آیا مطمئن هستید که می‌خواهید استریم را متوقف کنید؟\n\nاین عمل استریم را فوراً متوقف می‌کند و تا زمانی که این وضعیت پاک نشود، استریم دوباره شروع نخواهد شد.")) {
      return;
    }

    setSavingConfig(true);
    try {
      const response = await fetch(`${API_URL}/admin/config/webinar/stop-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در توقف استریم");
      }

      await fetchConfig();
      alert("✅ استریم با موفقیت متوقف شد");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "خطای ناشناخته";
      alert("❌ خطا: " + errorMessage);
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchDayComparison = async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [todayRes, yesterdayRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats?filter=today`, { headers, cache: "no-cache" }),
        fetch(`${API_URL}/admin/stats?filter=yesterday`, { headers, cache: "no-cache" }),
      ]);

      if (!todayRes.ok || !yesterdayRes.ok) return;

      const today = await todayRes.json();
      const yesterday = await yesterdayRes.json();

      setDayComparison({
        today: {
          total_registrations: today.total_registrations ?? 0,
          total_clicks: today.total_clicks ?? 0,
          total_viewers: today.total_viewers ?? 0,
          non_viewers: today.non_viewers ?? 0,
        },
        yesterday: {
          total_registrations: yesterday.total_registrations ?? 0,
          total_clicks: yesterday.total_clicks ?? 0,
          total_viewers: yesterday.total_viewers ?? 0,
          non_viewers: yesterday.non_viewers ?? 0,
        },
      });
    } catch (err) {
      console.warn("[Stats] Day comparison fetch failed:", err);
    }
  };

  const fetchStats = async () => {
    try {
      let url = `${API_URL}/admin/stats?filter=${filter}`;
      if (filterUniquePhones) {
        url += `&unique_phones=true`;
      }
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
      
      setLoading(false);
    } catch (err: any) {
      console.error('[Stats] Error:', err);
      setError(err.message || "خطا در دریافت آمار");
      setStats(null); // Set to null on error
      setLoading(false);
    }
  };

  const fetchOnlineViewers = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/stats/online-viewers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store', // Force no cache for real-time updates
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        // Don't throw error - just log it and keep previous count
        console.warn(`[OnlineViewers] Failed to fetch: ${response.status}`);
        return;
      }

      const data = await response.json();
      const count = data?.online_viewers || 0;
      setOnlineViewersCount(typeof count === 'number' ? count : 0);
    } catch (err: any) {
      console.error('[OnlineViewers] Fetch error:', err);
      // Don't reset to 0 on error - keep previous count to avoid flickering
    }
  };

  const fetchOnlineViewersList = async (showLoading: boolean = true) => {
    if (!token) return;
    
    if (showLoading) {
      setLoadingOnlineViewers(true);
    }
    
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_URL}/admin/stats/online-viewers/list?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        console.warn(`[OnlineViewersList] Failed to fetch: ${response.status}`);
        return;
      }

      const data = await response.json();
      const viewers = data?.online_viewers || [];
      console.log(`✅ Fetched ${viewers.length} online viewers at ${new Date().toLocaleTimeString('fa-IR')}`);
      setOnlineViewersList(viewers);
    } catch (err: any) {
      console.error('[OnlineViewersList] Fetch error:', err);
    } finally {
      if (showLoading) {
        setLoadingOnlineViewers(false);
      }
    }
  };

  // Registration chart and hot users removed - fetchDailyRegistrations and related useEffect removed

  const fetchUsers = async () => {
    if (!canViewUsersList) {
      console.warn("[Users] Skipping fetch - insufficient permissions");
      setUsers([]);
          return;
        }
    try {
      let url = `${API_URL}/admin/users?filter=${filter}&watch_filter=${watchFilter}&page=${currentPage}&page_size=6`;
      
      // Add unique phones filter
      if (filterUniquePhones) {
        url += `&unique_phones=true`;
      }
      
      // Add advanced filter parameters if active
      if (showAdvancedFilter && advancedStartDate && advancedEndDate) {
        url += `&start_date=${advancedStartDate}&start_time=${advancedStartTime}&end_date=${advancedEndDate}&end_time=${advancedEndTime}`;
      }
      
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
    } catch (err: any) {
      console.error('[Users] Error:', err);
      setError(err.message || "خطا در دریافت لیست کاربران");
      // Set empty array on error to prevent crashes
      setUsers([]);
    }
  };

  const getPresetRangeMs = useMemo(() => {
    const now = Date.now();
    if (thankYouPreset === "24h") {
      return { start: now - 24 * 60 * 60 * 1000, end: now };
    }
    if (thankYouPreset === "30d") {
      return { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
    }
    // default 7d
    return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
  }, [thankYouPreset]);

  const computeThankYouRange = () => {
    if (thankYouPreset !== "custom") return getPresetRangeMs;
    if (!thankYouStartDate || !thankYouEndDate) return getPresetRangeMs;
    const start = new Date(`${thankYouStartDate}T${thankYouStartTime || "00:00"}:00`).getTime();
    const end = new Date(`${thankYouEndDate}T${thankYouEndTime || "23:59"}:59`).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return getPresetRangeMs;
    return { start, end };
  };

  const fetchThankYouFunnel = async () => {
    if (!token) return;
    if (!(canViewUsersList || canViewDashboard || canViewAffiliate)) return;

    setLoadingThankYouFunnel(true);
    try {
      const { start, end } = computeThankYouRange();
      const url = new URL(`${API_URL}/admin/analytics/thankyou-funnel`);
      url.searchParams.set("start_ts", String(start));
      url.searchParams.set("end_ts", String(end));
      url.searchParams.set("watch_filter", thankYouWatchFilter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error("[ThankYouFunnel] Error response:", errorText);
        throw new Error("خطا در دریافت رفتار کاربران");
      }

      const data = (await response.json()) as ThankYouFunnelResponse;
      setThankYouFunnel(data && typeof data === "object" ? data : null);
    } catch (err: any) {
      console.error("[ThankYouFunnel] Error:", err);
      setThankYouFunnel(null);
      setError(err?.message || "خطا در دریافت رفتار کاربران");
    } finally {
      setLoadingThankYouFunnel(false);
    }
  };

  const fetchBehaviorFunnel = async () => {
    if (!token) return;
    if (!(canViewUsersList || canViewDashboard || canViewAffiliate)) return;

    setLoadingBehaviorFunnel(true);
    try {
      const { start, end } = computeThankYouRange();
      const url = new URL(`${API_URL}/admin/analytics/behavior-funnel`);
      url.searchParams.set("start_ts", String(start));
      url.searchParams.set("end_ts", String(end));

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error("[BehaviorFunnel] Error response:", errorText);
        throw new Error("خطا در دریافت قیف رفتار کاربران");
      }

      const data = (await response.json()) as BehaviorFunnelResponse;
      setBehaviorFunnel(data && typeof data === "object" ? data : null);
    } catch (err: any) {
      console.error("[BehaviorFunnel] Error:", err);
      setBehaviorFunnel(null);
      setError(err?.message || "خطا در دریافت قیف رفتار کاربران");
    } finally {
      setLoadingBehaviorFunnel(false);
    }
  };

  const fetchSmartSmsToday = async () => {
    if (!token) return;
    if (!canViewUsersList) return;

    setLoadingSmartSmsToday(true);
    try {
      const response = await fetch(`${API_URL}/admin/smart-sms/today`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error("[SmartSMS] Error response:", errorText);
        throw new Error("خطا در دریافت مرکز ارسال پیامک هوشمند");
      }

      const data = (await response.json()) as SmartSMSTodayResponse;
      setSmartSmsToday(data && typeof data === "object" ? data : null);
    } catch (err: any) {
      console.error("[SmartSMS] Error:", err);
      setSmartSmsToday(null);
      setError(err?.message || "خطا در دریافت مرکز ارسال پیامک هوشمند");
    } finally {
      setLoadingSmartSmsToday(false);
    }
  };

  const openEditScheduledMessage = (item: SmartSMSTodayResponse["items"][0]) => {
    // Parse time from "HH:MM" format
    const [hour, minute] = item.scheduled_time.split(':').map(Number);
    // For Avanak messages, extract message ID and clean message text
    let messageText = item.message_text;
    let avanakMessageID = item.avanak_message_id;
    
    // If it's an Avanak message and message contains the code pattern, extract it
    if (item.provider === "avanak" && messageText.includes("(پیام صوتی - کد:")) {
      const codeMatch = messageText.match(/\(پیام صوتی - کد:\s*(\d+)\)/);
      if (codeMatch && codeMatch[1]) {
        avanakMessageID = parseInt(codeMatch[1], 10);
        // Remove the code part from message text
        messageText = messageText.replace(/\s*\(پیام صوتی - کد:\s*\d+\)\s*/g, "").trim();
      }
    }
    
    setEditingScheduledMessage({
      category: item.category,
      provider: item.provider,
      hour: hour,
      minute: minute,
      message: messageText,
      pattern_key: item.pattern_key || "",
      avanak_message_id: avanakMessageID,
      is_active: true,
      display_order: 0,
    });
  };

  const updateScheduledMessage = async () => {
    if (!editingScheduledMessage || !token) return;

    // For non-Avanak providers, message is required
    if (editingScheduledMessage.provider !== "avanak" && !editingScheduledMessage.message.trim()) {
      alert("❌ متن پیام نمی‌تواند خالی باشد");
      return;
    }

    if (editingScheduledMessage.hour < 0 || editingScheduledMessage.hour > 23) {
      alert("❌ ساعت باید بین 0 تا 23 باشد");
      return;
    }

    if (editingScheduledMessage.minute < 0 || editingScheduledMessage.minute > 59) {
      alert("❌ دقیقه باید بین 0 تا 59 باشد");
      return;
    }

    // Validate AvanakMessageID for Avanak provider
    if (editingScheduledMessage.provider === "avanak") {
      if (!editingScheduledMessage.avanak_message_id || editingScheduledMessage.avanak_message_id <= 0) {
        alert("❌ کد پیام صوتی آوانک باید وارد شود");
        return;
      }
    }

    setSavingScheduledMessage(true);
    try {
      const response = await fetch(`${API_URL}/admin/smart-sms/scheduled-messages`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingScheduledMessage),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در به‌روزرسانی پیام");
      }

      alert("✅ پیام زمان‌بندی شده با موفقیت به‌روزرسانی شد");
      setEditingScheduledMessage(null);
      // Refresh the list
      await fetchSmartSmsToday();
    } catch (err: any) {
      alert("❌ خطا: " + (err.message || "خطای ناشناخته"));
    } finally {
      setSavingScheduledMessage(false);
    }
  };

  const fetchSmartSmsPopupFollowups = async () => {
    if (!token) return;
    if (!canViewUsersList) return;

    setLoadingSmartSmsPopup(true);
    try {
      const response = await fetch(`${API_URL}/admin/smart-sms/popup-followups`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error("[SmartSMS Popup] Error response:", errorText);
        throw new Error("خطا در دریافت پیامک‌های رفتاری");
      }

      const data = (await response.json()) as SmartSMSPopupFollowupsResponse;
      setSmartSmsPopup(data && typeof data === "object" ? data : null);
    } catch (err: any) {
      console.error("[SmartSMS Popup] Error:", err);
      setSmartSmsPopup(null);
      setError(err?.message || "خطا در دریافت پیامک‌های رفتاری");
    } finally {
      setLoadingSmartSmsPopup(false);
    }
  };

  const cancelSmartSmsForToday = async (category: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/admin/smart-sms/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SmartSMS] Cancel error:", errorText);
        throw new Error("لغو پیامک ناموفق بود");
      }
      await fetchSmartSmsToday();
    } catch (err: any) {
      console.error("[SmartSMS] Cancel failed:", err);
      setError(err?.message || "لغو پیامک ناموفق بود");
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    if (!currentUserIsAffiliate) return phone;
    // Affiliate users should not see full phone numbers
    if (phone.length < 7) return "****";
    return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
  };

  const fetchEligibleUsers = async (category: string, page: number) => {
    if (!token) return;
    setEligibleUsersLoading(true);
    try {
      const url = new URL(`${API_URL}/admin/smart-sms/eligible-users`);
      url.searchParams.set("category", category);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "200");

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error("[SmartSMS EligibleUsers] Error response:", errorText);
        throw new Error("خطا در دریافت کاربران واجد شرایط");
      }

      const data = (await response.json()) as SmartSMSEligibleUsersResponse;
      setEligibleUsersResp(data && typeof data === "object" ? data : null);
    } catch (err: any) {
      console.error("[SmartSMS EligibleUsers] Error:", err);
      setEligibleUsersResp(null);
      setError(err?.message || "خطا در دریافت کاربران واجد شرایط");
    } finally {
      setEligibleUsersLoading(false);
    }
  };

  const fetchSentUsers = async (category: string, page: number) => {
    if (!token) return;
    setEligibleUsersLoading(true);
    try {
      const url = new URL(`${API_URL}/admin/smart-sms/sent-users`);
      url.searchParams.set("category", category);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "200");

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          navigate("/admin/login");
          return;
        }
        const errorText = await response.text();
        console.error("[SmartSMS SentUsers] Error response:", errorText);
        throw new Error("خطا در دریافت کاربران ارسال‌شده");
      }

      const data = (await response.json()) as SmartSMSSentUsersResponse;
      setSentUsersResp(data && typeof data === "object" ? data : null);
    } catch (err: any) {
      console.error("[SmartSMS SentUsers] Error:", err);
      setSentUsersResp(null);
      setError(err?.message || "خطا در دریافت کاربران ارسال‌شده");
    } finally {
      setEligibleUsersLoading(false);
    }
  };

  const openEligibleUsersModal = async (category: string, title: string) => {
    setEligibleUsersCategory(category);
    setEligibleUsersTitle(title);
    setEligibleUsersMode("eligible");
    setEligibleUsersResp(null);
    setSentUsersResp(null);
    setEligibleUsersPage(1);
    setEligibleUsersOpen(true);
    await fetchEligibleUsers(category, 1);
  };

  const openSentUsersModal = async (category: string, title: string) => {
    setEligibleUsersCategory(category);
    setEligibleUsersTitle(title);
    setEligibleUsersMode("sent");
    setEligibleUsersResp(null);
    setSentUsersResp(null);
    setEligibleUsersPage(1);
    setEligibleUsersOpen(true);
    await fetchSentUsers(category, 1);
  };

  const fetchAvanakLogs = async (page = 1) => {
    if (!token) return;
    if (!canViewAvanak) return;
    setAvanakLogsLoading(true);
    try {
      const url = new URL(`${API_URL}/admin/avanak/logs`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "50");
      url.searchParams.set("ts", String(Date.now())); // جلوگیری از کش
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-cache",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[AvanakLogs] Error response:", errorText);
        throw new Error("خطا در دریافت گزارش‌های آوانک");
      }
      const data = (await response.json()) as any;
      setAvanakLogs({
        data: data.data || [],
        pagination: data.pagination || { page: 1, total_count: 0, limit: 50 },
      });
      setAvanakLogsPage(page);
    } catch (err: any) {
      console.error("[AvanakLogs] Error:", err);
      setAvanakLogs(null);
      setError(err?.message || "خطا در دریافت گزارش‌های آوانک");
    } finally {
      setAvanakLogsLoading(false);
    }
  };

  const runAvanakTest = async (phoneOverride?: string, messageIdOverride?: number) => {
    if (!token) return;
    const phoneVal = (phoneOverride ?? avanakTestPhone).trim();
    const msgVal = messageIdOverride ?? (parseInt(avanakTestMessageId) || 0);
    if (!phoneVal || !msgVal) {
      alert("شماره و کد آوانک را وارد کنید");
      return;
    }
    setAvanakTestLoading(true);
    try {
      const payload = {
        phone: phoneVal,
        message_id: msgVal,
      };
      const response = await fetch(`${API_URL}/admin/avanak/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        const detail = data?.details || data?.error || "ارسال ناموفق بود";
        setAvanakTestModalContent({
          title: "ارسال ناموفق",
          body: `دلیل: ${detail}\nشماره: ${data?.normalized_phone || payload.phone}\nکد صوت: ${payload.message_id}`,
          status: "error",
        });
        setShowAvanakTestModal(true);
        return;
      }
      setAvanakTestModalContent({
        title: "ارسال موفق",
        body: `تماس آزمایشی با موفقیت ارسال شد.\nشماره: ${data?.normalized_phone || payload.phone}\nکد صوت: ${payload.message_id}`,
        status: "success",
      });
      setShowAvanakTestModal(true);
    } catch (err: any) {
      setAvanakTestModalContent({
        title: "خطا در ارسال",
        body: err?.message || "ارسال ناموفق بود",
        status: "error",
      });
      setShowAvanakTestModal(true);
    } finally {
      setAvanakTestLoading(false);
    }
  };

  useEffect(() => {
    if (usersSubview !== "behavior") return;
    fetchThankYouFunnel();
    fetchBehaviorFunnel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersSubview, thankYouPreset, thankYouStartDate, thankYouStartTime, thankYouEndDate, thankYouEndTime, thankYouWatchFilter, token]);

  useEffect(() => {
    if (usersSubview !== "sms_center") return;
    fetchSmartSmsToday();
    fetchSmartSmsPopupFollowups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersSubview, token]);

  const exportExcel = async (type: "viewers" | "non-viewers") => {
    if (!canExportUsers) {
      alert("شما مجوز خروجی گرفتن از لیست کاربران را ندارید");
      return;
    }
    setExporting(type);
    setError(""); // Clear previous errors
    try {
      const endpoint = type === "viewers" ? "/export/viewers" : "/export/non-viewers";
      const url = `${API_URL}/admin${endpoint}?filter=${filter}&watch_filter=${watchFilter}`;
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

  const fetchDailyRegistrationsStats = async () => {
    if (!token) return;
    
    setLoadingDailyRegistrations(true);
    try {
      const response = await fetch(`${API_URL}/admin/stats/daily-registrations?filter=${registrationsChartFilter}`, {
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
        throw new Error("خطا در دریافت آمار ثبت‌نام روزانه");
      }

      const data = await response.json();
      console.log("[AdminDashboard] Daily registrations stats response:", data);
      console.log("[AdminDashboard] Filter:", registrationsChartFilter, "Stats count:", data.daily_stats?.length || 0);
      if (data.daily_stats && data.daily_stats.length > 0) {
        console.log("[AdminDashboard] Sample stat:", data.daily_stats[0]);
      }
      setDailyRegistrationsStats(data.daily_stats || []);
    } catch (err: any) {
      console.error("[AdminDashboard] Failed to fetch daily registrations stats:", err);
      setDailyRegistrationsStats([]);
    } finally {
      setLoadingDailyRegistrations(false);
    }
  };

  const exportAllUsers = async () => {
    if (!canExportUsers) {
      alert("شما مجوز خروجی گرفتن از لیست کاربران را ندارید");
      return;
    }
    setExporting("all-users");
    setError(""); // Clear previous errors
    try {
      let url = `${API_URL}/admin/export/users?filter=${filter}&watch_filter=${watchFilter}`;
      
      // Add unique phones filter
      if (filterUniquePhones) {
        url += `&unique_phones=true`;
      }
      
      // Add advanced filter parameters if active
      if (showAdvancedFilter && advancedStartDate && advancedEndDate) {
        url += `&start_date=${advancedStartDate}&start_time=${advancedStartTime}&end_date=${advancedEndDate}&end_time=${advancedEndTime}`;
      }
      
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

  const dayChanges = useMemo(() => {
    if (!dayComparison) return null;
    const { today, yesterday } = dayComparison;
    return {
      registrations: calcDayOverDayChange(today.total_registrations, yesterday.total_registrations),
      clicks: calcDayOverDayChange(today.total_clicks, yesterday.total_clicks),
      viewers: calcDayOverDayChange(today.total_viewers, yesterday.total_viewers),
      nonViewers: calcDayOverDayChange(today.non_viewers, yesterday.non_viewers),
    };
  }, [dayComparison]);

  const adminNavItems = useMemo(
    () => [
      {
        href: "#logout",
        label: "خروج",
        ariaLabel: "خروج",
        onClick: handleLogout,
      },
    ],
    []
  );

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

  // Hot Users and Registration Chart removed - all related useMemo hooks removed

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

  // Filter users based on search query and unique phones
  const filteredUsers = (() => {
    let result = safeUsers;
    
    // Apply search filter
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase().trim();
      result = result.filter((user) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const phone = user.phone.toLowerCase();
        return (
          fullName.includes(query) ||
          user.first_name.toLowerCase().includes(query) ||
          user.last_name.toLowerCase().includes(query) ||
          phone.includes(query)
        );
      });
    }
    
    // Apply unique phone filter (as a safety layer - backend should already filter)
    if (filterUniquePhones) {
      const seenPhones = new Set<string>();
      result = result.filter((user) => {
        // Normalize phone number: remove spaces, remove country code prefixes
        const normalizedPhone = user.phone
          .replace(/\s+/g, '')
          .replace(/^\+98/, '')
          .replace(/^0098/, '')
          .replace(/^98/, '')
          .replace(/^0/, '')
          .trim();
        
        if (seenPhones.has(normalizedPhone)) {
          return false; // Duplicate phone, skip
        }
        seenPhones.add(normalizedPhone);
        return true; // First occurrence of this phone, keep it
      });
    }
    
    return result;
  })();

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="text-gray-400 text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fitino-landing min-h-screen bg-[#0e0e0e] relative overflow-x-hidden" dir="rtl">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen p-3 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="fp-card fp-notch p-5 sm:p-6 lg:p-8 mb-6">
            <div className="flex flex-col gap-6">
              {/* Top Row - Title and Actions */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div
                  className="fp-spine w-full py-1 ps-4 pe-2 text-right lg:w-auto"
                  style={{ borderInlineStartColor: "var(--fp-glow)" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 fp-notch-sm bg-gradient-to-l from-[#187272] to-[#26fce3] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white">داشبورد مدیریت</h1>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-auto [&_.pill-nav-container]:relative [&_.pill-nav-container]:top-0 [&_.pill-nav-container]:left-0 [&_.pill]:normal-case [&_.pill]:tracking-normal [&_.mobile-menu-link]:normal-case">
                  {permissionsLoading ? (
                    <div className="h-[42px] w-full lg:w-48 rounded-full bg-white/10 animate-pulse" />
                  ) : (
                    <PillNav
                      logo="/fitino-logo.png"
                      logoAlt="فیتینو"
                      logoHref="/admin/dashboard"
                      items={adminNavItems}
                      baseColor="#26fce3"
                      pillColor="#161616"
                      pillTextColor="#ffffff"
                      hoveredPillTextColor="#0e0e0e"
                      initialLoadAnimation={false}
                    />
                  )}
                </div>
              </div>

            {/* Modern Filter Pills */}
            {canViewTimeFilters && (
            <div className="space-y-4 pt-4 border-t border-white/8">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">فیلتر بازه زمانی</span>
              </div>

              {/* Desktop: Filter Pills — quick presets and date ranges as two
                  visually grouped clusters separated by a divider, instead of
                  one flat undifferentiated row. */}
              <div className="hidden lg:flex flex-wrap items-center gap-2">
                {[
                  { value: "all", label: "همه" },
                  { value: "today", label: "امروز" },
                  { value: "yesterday", label: "دیروز" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleFilterChange(item.value as FilterType)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      filter === item.value
                        ? "bg-gradient-to-l from-[#187272] to-[#26fce3] text-white"
                        : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] border border-white/8"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <span className="mx-1 h-6 w-px shrink-0 bg-white/10" aria-hidden="true" />

                {[
                  { value: "week", label: "این هفته" },
                  { value: "last_week", label: "هفته گذشته" },
                  { value: "month", label: "این ماه" },
                  { value: "last_month", label: "ماه گذشته" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleFilterChange(item.value as FilterType)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      filter === item.value
                        ? "bg-gradient-to-l from-[#187272] to-[#26fce3] text-white"
                        : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] border border-white/8"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Mobile: Dropdown */}
              <div className="lg:hidden relative filter-dropdown-container">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border border-gray-900 rounded-xl text-sm font-medium text-white hover:bg-[#151515] transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span>
                      {[
                        { value: "all", label: "همه" },
                        { value: "today", label: "امروز" },
                        { value: "yesterday", label: "دیروز" },
                        { value: "week", label: "این هفته" },
                        { value: "last_week", label: "هفته گذشته" },
                        { value: "month", label: "این ماه" },
                        { value: "last_month", label: "ماه گذشته" },
                      ].find(item => item.value === filter)?.label || "همه"}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f0f] border border-gray-900 rounded-xl overflow-hidden shadow-lg z-50">
                    {[
                      { value: "all", label: "همه" },
                      { value: "today", label: "امروز" },
                      { value: "yesterday", label: "دیروز" },
                      { value: "week", label: "این هفته" },
                      { value: "last_week", label: "هفته گذشته" },
                      { value: "month", label: "این ماه" },
                      { value: "last_month", label: "ماه گذشته" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          handleFilterChange(item.value as FilterType);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-right px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          filter === item.value
                            ? "bg-blue-600/30 text-blue-300 border-r-2 border-blue-600"
                            : "text-gray-400 hover:bg-[#151515] hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              </div>
            )}

          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30 rounded-2xl animate-fadeIn">
            <AlertDescription className="text-red-300 text-right flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Online Viewers Counter */}
        {canViewWidgetOnline && (
        <div
          className="fp-card fp-notch relative mb-8 cursor-pointer overflow-visible border-emerald-600/40 hover:border-emerald-600/60"
          onClick={() => {
            setShowOnlineViewersModal(true);
            fetchOnlineViewersList(true); // Show loading on manual open
          }}
        >
          <div className="flex items-start justify-between gap-4 p-6">
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1 font-medium">کاربران آنلاین</p>
              <p className="fp-hud-num text-4xl text-white mb-2">{onlineViewersCount.toLocaleString('fa-IR')}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Eye className="h-7 w-7 text-white" />
            </div>
          </div>
        </div>
        )}

        <style>{`
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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
            animation: fadeIn 0.4s ease-out;
          }
          .animate-slideUp {
            animation: slideUp 0.4s ease-out;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Modern Stats Cards — asymmetric bento instead of four identical
            boxes: registrations is the primary metric so it gets a larger,
            taller tile; the rest sit around it at smaller sizes. */}
        {(canViewWidgetRegistrations || canViewWidgetClicks || canViewWidgetViewers || canViewWidgetNonViewers) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8">
          {/* Card 1: Registrations — featured tile, spans two rows on desktop */}
          {canViewWidgetRegistrations && (
          <div className="fp-card fp-notch col-span-2 lg:col-span-2 lg:row-span-2 border-blue-600/40 hover:border-blue-600/60">
            <div className="flex h-full flex-col justify-between gap-4 p-5 lg:p-7">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-500">ثبت‌نام‌ها</p>
                <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
              <div className="text-right">
                <p className="fp-hud-num text-3xl lg:text-5xl text-white">{stats?.total_registrations?.toLocaleString('fa-IR') || 0}</p>
                {dayChanges ? <DayChangeBadge change={dayChanges.registrations} /> : null}
              </div>
            </div>
          </div>
          )}

          {/* Card 2: Clicks */}
          {canViewWidgetClicks && (
          <div className="fp-card fp-notch border-green-600/40 hover:border-green-600/60">
            <div className="flex h-full flex-col justify-between gap-3 p-4 lg:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs lg:text-sm text-gray-500 font-medium">کلیک روی لینک</p>
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                  <MousePointerClick className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
              </div>
              <div className="text-right">
                <p className="fp-hud-num text-xl lg:text-2xl text-white">{stats?.total_clicks?.toLocaleString('fa-IR') || 0}</p>
                {dayChanges ? <DayChangeBadge change={dayChanges.clicks} /> : null}
              </div>
            </div>
          </div>
          )}

          {/* Card 3: Viewers */}
          {canViewWidgetViewers && (
          <div className="fp-card fp-notch border-teal-600/40 hover:border-teal-600/60">
            <div className="flex h-full flex-col justify-between gap-3 p-4 lg:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs lg:text-sm text-gray-500 font-medium">بینندگان</p>
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
                  <Eye className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
              </div>
              <div className="text-right">
                <p className="fp-hud-num text-xl lg:text-2xl text-white">{stats?.total_viewers?.toLocaleString('fa-IR') || 0}</p>
                {dayChanges ? <DayChangeBadge change={dayChanges.viewers} /> : null}
              </div>
            </div>
          </div>
          )}

          {/* Card 4: Non-viewers — wide bottom tile mirroring the featured
              registrations tile above it */}
          {canViewWidgetNonViewers && (
          <div className="fp-card fp-notch col-span-2 border-red-600/40 hover:border-red-600/60">
            <div className="flex h-full items-center justify-between gap-4 p-4 lg:p-5">
              <div className="text-right">
                <p className="text-xs lg:text-sm text-gray-500 font-medium mb-0.5">عدم تماشا</p>
                <p className="fp-hud-num text-xl lg:text-2xl text-white">{stats?.non_viewers?.toLocaleString('fa-IR') || 0}</p>
                {dayChanges ? <DayChangeBadge change={dayChanges.nonViewers} /> : null}
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                <X className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
            </div>
          </div>
          )}
          </div>
        )}

        {/* Additional Stats — inline stat strip with a divider between the
            two rates, instead of two identical boxed cards side by side. */}
        {stats && (canViewWidgetConversion || canViewWidgetRegToView) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {canViewWidgetConversion && (
            <MetricRing
              value={stats.conversion_rate ?? 0}
              strokeColor="#26fce3"
              label="نرخ تبدیل کلیک → تماشا"
              subtitle="درصد کلیک‌کنندگانی که وبینار را تماشا کردند"
            />
          )}
          {canViewWidgetRegToView && (
            <MetricRing
              value={stats.registration_to_view_rate ?? 0}
              strokeColor="#f97316"
              label="نرخ تبدیل ثبت‌نام → تماشا"
              subtitle="درصد ثبت‌نام‌شدگان که حداقل یک‌بار تماشا کردند"
            />
          )}
        </div>
        )}

        {/* Affiliates Manager - Ultra Modern Design */}
        {canViewAffiliates && token ? (
          <div className="mb-8">
            <AffiliatesManager token={token} />
          </div>
        ) : null}

        {/* Payments List - Ultra Modern Design */}
        {canViewPayments && token ? (
          <div className="mb-8">
            <PaymentsList token={token} isAffiliate={Boolean(currentUserIsAffiliate)} />
          </div>
        ) : null}

        {/* Modern Users Table */}
        {canViewUsersList ? (
          <div>
            <div className="fp-card fp-notch overflow-hidden border-blue-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 border-b border-white/8 bg-gradient-to-l from-blue-950/30 via-transparent to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 fp-notch-sm bg-gradient-to-l from-blue-700 to-cyan-400 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 text-right">
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {usersSubview === "list"
                        ? "کاربران"
                        : usersSubview === "behavior"
                        ? "رفتار کاربران"
                        : usersSubview === "sms_center"
                        ? "پیام به کاربران"
                        : "کاربران"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {usersSubview === "list" ? (
                        <>
                          {toPersianDigits(safePagination.total_count || 0)} کاربر • صفحه{" "}
                          {toPersianDigits(currentPage)} از {toPersianDigits(safePagination.total_pages || 1)}
                        </>
                      ) : usersSubview === "behavior" ? (
                        <>
                          فانل Thank You
                          {thankYouFunnel?.total_unique_users !== undefined && (
                            <> • {toPersianDigits(thankYouFunnel.total_unique_users)} نفر</>
                          )}
                        </>
                      ) : usersSubview === "sms_center" ? (
                        <>پیام‌های برنامه‌ریزی‌شده + کاربران واجد شرایط</>
                      ) : (
                        <>
                          {toPersianDigits(safePagination.total_count || 0)} کاربر • صفحه{" "}
                          {toPersianDigits(currentPage)} از {toPersianDigits(safePagination.total_pages || 1)}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
                    <button
                      type="button"
                      onClick={() => setUsersSubview("list")}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap",
                        usersSubview === "list" ? "bg-blue-600/30 text-blue-200" : "text-gray-500 hover:text-white"
                      )}
                    >
                      لیست
                    </button>
                    {!currentUserIsAffiliate && (
                      <button
                        type="button"
                        onClick={() => setUsersSubview("behavior")}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap",
                          usersSubview === "behavior" ? "bg-emerald-600/30 text-emerald-200" : "text-gray-500 hover:text-white"
                        )}
                      >
                        رفتار
                      </button>
                    )}
                  </div>

                  {!currentUserIsAffiliate && (
                    usersSubview !== "sms_center" ? (
                      <button
                        type="button"
                        onClick={() => setUsersSubview("sms_center")}
                        className="fp-chip text-cyan-300 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5 inline ms-1" />
                        پیامک
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUsersSubview("list")}
                        className="fp-chip text-gray-400 hover:text-white text-xs"
                      >
                        بازگشت
                      </button>
                    )
                  )}
                </div>
              </div>
                
                  {!currentUserIsAffiliate && usersSubview === "behavior" && (
                    <div className="p-4 sm:p-5 border-b border-white/5">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="bg-[#0f0f0f] border border-gray-900 rounded-xl px-4 py-2.5">
                          <label className="block text-gray-400 text-xs font-medium mb-2">بازه زمانی</label>
                          <select
                            value={thankYouPreset}
                            onChange={(e) => setThankYouPreset(e.target.value as any)}
                            className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                          >
                            <option value="24h">۲۴ ساعت اخیر</option>
                            <option value="7d">۷ روز اخیر</option>
                            <option value="30d">۳۰ روز اخیر</option>
                            <option value="custom">بازه دلخواه</option>
                          </select>
                        </div>

                        <div className="bg-[#0f0f0f] border border-gray-900 rounded-xl px-4 py-2.5">
                          <label className="block text-gray-400 text-xs font-medium mb-2">فیلتر تماشا</label>
                          <select
                            value={thankYouWatchFilter}
                            onChange={(e) => setThankYouWatchFilter(e.target.value as any)}
                            className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                          >
                            <option value="all">همه</option>
                            <option value="watched">فقط بینندگان</option>
                            <option value="not_watched">فقط غیر بینندگان</option>
                          </select>
                        </div>

                        <Button
                          onClick={() => fetchThankYouFunnel()}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                          disabled={loadingThankYouFunnel}
                        >
                          {loadingThankYouFunnel ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              در حال بارگذاری...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4" />
                              بروزرسانی آمار
                            </>
                          )}
                        </Button>
                      </div>

                      {thankYouPreset === "custom" && (
                        <div className="mt-3 bg-[#0f0f0f] border border-gray-900 rounded-2xl p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span>از</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-400 text-xs font-medium mb-2">تاریخ شروع</label>
                                  <input
                                    type="date"
                                    value={thankYouStartDate}
                                    onChange={(e) => setThankYouStartDate(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-400 text-xs font-medium mb-2">ساعت شروع</label>
                                  <input
                                    type="time"
                                    value={thankYouStartTime}
                                    onChange={(e) => setThankYouStartTime(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span>تا</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-400 text-xs font-medium mb-2">تاریخ پایان</label>
                                  <input
                                    type="date"
                                    value={thankYouEndDate}
                                    onChange={(e) => setThankYouEndDate(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-400 text-xs font-medium mb-2">ساعت پایان</label>
                                  <input
                                    type="time"
                                    value={thankYouEndTime}
                                    onChange={(e) => setThankYouEndTime(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-500">
                        این بخش فقط رفتار کاربران در صفحه تشکر (پاپ‌آپ‌ها) را نشان می‌دهد.
                      </div>
                    </div>
                  )}

                  {usersSubview === "list" && (
                    <>
                      <div className="px-4 sm:px-5 py-3 border-b border-white/5 overflow-x-auto scrollbar-hide">
                        <p className="text-[11px] text-gray-500 mb-2">بازه ثبت‌نام</p>
                        <div className="flex gap-2 min-w-max pb-1 flex-wrap">
                          {DATE_FILTER_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleFilterChange(opt.value)}
                              className={cn(
                                "fp-chip whitespace-nowrap transition-all text-xs",
                                filter === opt.value
                                  ? "text-blue-200 border-blue-400/40 bg-blue-500/15"
                                  : "text-gray-400 hover:text-white"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="px-4 sm:px-5 py-3 border-b border-white/5">
                        <p className="text-[11px] text-gray-500 mb-2">وضعیت تماشا</p>
                        <div className="flex flex-wrap gap-2">
                          {WATCH_FILTER_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setWatchFilter(opt.value)}
                              className={cn(
                                "fp-chip whitespace-nowrap transition-all text-xs",
                                watchFilter === opt.value
                                  ? opt.value === "watched"
                                    ? "text-emerald-200 border-emerald-400/40 bg-emerald-500/15"
                                    : opt.value === "not_watched"
                                    ? "text-rose-200 border-rose-400/40 bg-rose-500/15"
                                    : "text-blue-200 border-blue-400/40 bg-blue-500/15"
                                  : "text-gray-400 hover:text-white"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setFilterUniquePhones(!filterUniquePhones)}
                            className={cn(
                              "fp-chip whitespace-nowrap transition-all text-xs inline-flex items-center gap-1",
                              filterUniquePhones
                                ? "text-cyan-200 border-cyan-400/40 bg-teal-500/15"
                                : "text-gray-400 hover:text-white"
                            )}
                          >
                            <Filter className="h-3 w-3" />
                            بدون تکراری
                          </button>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 border-b border-white/5">
                        <div className="relative max-w-2xl ms-auto">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="جستجو: نام، نام خانوادگی یا شماره تماس..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all placeholder:text-gray-600"
                          />
                          {userSearchQuery && (
                            <button
                              onClick={() => setUserSearchQuery("")}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 border-b border-white/5">
                        <Button
                          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "rounded-xl text-xs border-white/10",
                            showAdvancedFilter
                              ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                              : "bg-black/30 text-gray-400 hover:text-white"
                          )}
                        >
                          <Calendar className="h-3.5 w-3.5 sm:ml-1" />
                          {showAdvancedFilter ? "بستن تاریخ" : "فیلتر تاریخ"}
                        </Button>

                        {canExportUsers && (
                          <>
                            <Button
                              onClick={() => exportAllUsers()}
                              disabled={exporting !== null}
                              className="bg-gradient-to-l from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs sm:text-sm px-3 py-2 rounded-xl disabled:opacity-50"
                            >
                              {exporting === "all-users" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="h-4 w-4 sm:ml-1" />
                                  <span className="hidden sm:inline">اکسل همه</span>
                                  <span className="sm:hidden">همه</span>
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => exportExcel("viewers")}
                              disabled={exporting !== null}
                              className="bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm px-3 py-2 rounded-xl disabled:opacity-50"
                            >
                              {exporting === "viewers" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="h-4 w-4 sm:ml-1" />
                                  <span className="hidden sm:inline">بینندگان</span>
                                  <span className="sm:hidden">بیننده</span>
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => exportExcel("non-viewers")}
                              disabled={exporting !== null}
                              className="bg-gradient-to-l from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm px-3 py-2 rounded-xl disabled:opacity-50"
                            >
                              {exporting === "non-viewers" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="h-4 w-4 sm:ml-1" />
                                  <span className="hidden sm:inline">غیر بینندگان</span>
                                  <span className="sm:hidden">غیربیننده</span>
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>

                      {showAdvancedFilter && (
                        <div className="mx-4 sm:mx-5 mb-4 p-4 fp-card fp-notch border-white/10 bg-black/30">
                          <div className="space-y-4">
                        {/* Date Range Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Start Date/Time */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
                              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                              <span>از</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-400" />
                                  تاریخ شروع
                                </label>
                                <input
                                  type="date"
                                  value={advancedStartDate}
                                  onChange={(e) => setAdvancedStartDate(e.target.value)}
                                  className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all duration-300 hover:bg-[#0f0f0f]"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-400" />
                                  ساعت شروع
                                </label>
                                <input
                                  type="time"
                                  value={advancedStartTime}
                                  onChange={(e) => setAdvancedStartTime(e.target.value)}
                                  className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all duration-300 hover:bg-[#0f0f0f]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* End Date/Time */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
                              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                              <span>تا</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-400" />
                                  تاریخ پایان
                                </label>
                                <input
                                  type="date"
                                  value={advancedEndDate}
                                  onChange={(e) => setAdvancedEndDate(e.target.value)}
                                  className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all duration-300 hover:bg-[#0f0f0f]"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-400" />
                                  ساعت پایان
                                </label>
                                <input
                                  type="time"
                                  value={advancedEndTime}
                                  onChange={(e) => setAdvancedEndTime(e.target.value)}
                                  className="w-full bg-[#0a0a0a] border border-gray-900 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all duration-300 hover:bg-[#0f0f0f]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-900">
                          <Button
                            onClick={() => {
                              if (advancedStartDate && advancedEndDate) {
                                setCurrentPage(1);
                                fetchUsers();
                              } else {
                                alert("لطفاً تاریخ شروع و پایان را وارد کنید");
                              }
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-300"
                          >
                            <Filter className="h-4 w-4 ml-2" />
                            اعمال فیلتر
                          </Button>
                          <Button
                            onClick={() => {
                              setAdvancedStartDate("");
                              setAdvancedEndDate("");
                              setAdvancedStartTime("00:00");
                              setAdvancedEndTime("23:59");
                              setShowAdvancedFilter(false);
                              setCurrentPage(1);
                              fetchUsers();
                            }}
                            variant="outline"
                            className="text-sm bg-[#0a0a0a] border-gray-900 text-gray-400 hover:bg-[#0f0f0f] hover:text-white hover:border-gray-800 transition-all duration-300"
                          >
                            <X className="h-4 w-4 ml-2" />
                            پاک کردن
                          </Button>
                        </div>

                        {/* Download Button - Only show when filter is active */}
                        {advancedStartDate && advancedEndDate && (
                          <div className="pt-3 border-t border-gray-900">
                            {canExportUsers ? (
                              <Button
                                onClick={() => exportAllUsers()}
                                disabled={exporting !== null}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all duration-300 disabled:opacity-50"
                              >
                                {exporting === "all-users" ? (
                                  <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    در حال دانلود...
                                  </>
                                ) : (
                                  <>
                                    <Download className="ml-2 h-4 w-4" />
                                    دانلود افراد این بازه (Excel)
                                  </>
                                )}
                              </Button>
                            ) : (
                              <p className="text-xs text-red-400 text-center py-3">
                                برای دانلود کاربران این بازه نیاز به مجوز users.export دارید
                              </p>
                            )}
                            <p className="text-xs text-gray-400 text-center mt-2">
                              فایل Excel شامل: نام، نام خانوادگی، شماره تماس و تاریخ ثبت‌نام
                            </p>
                          </div>
                        )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

              <div className="p-4 sm:p-6">
              {!currentUserIsAffiliate && usersSubview === "sms_center" && (
                <div className="space-y-6">
                  <Dialog open={eligibleUsersOpen} onOpenChange={setEligibleUsersOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-gray-800 text-white overflow-y-auto">
                      <DialogHeader className="text-right" dir="rtl">
                        <DialogTitle className="text-white">کاربران واجد شرایط</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          {eligibleUsersTitle ? `${eligibleUsersTitle}` : "لیست کاربران واجد شرایط"}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4" dir="rtl">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="text-sm text-gray-300 break-all">
                            <span className="text-gray-500">Category:</span>{" "}
                            <span className="font-semibold">{eligibleUsersCategory || "-"}</span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!eligibleUsersCategory) return;
                              if (eligibleUsersMode === "sent") {
                                fetchSentUsers(eligibleUsersCategory, eligibleUsersPage);
                              } else {
                                fetchEligibleUsers(eligibleUsersCategory, eligibleUsersPage);
                              }
                            }}
                            className="bg-[#0f0f0f] hover:bg-[#151515] border border-gray-800 text-gray-200 rounded-xl"
                            variant="secondary"
                            disabled={eligibleUsersLoading || !eligibleUsersCategory}
                          >
                            {eligibleUsersLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="mr-2">در حال بروزرسانی...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4" />
                                <span className="mr-2">بروزرسانی</span>
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="bg-[#0f0f0f] border border-gray-900 rounded-2xl p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs text-gray-500">
                              {eligibleUsersMode === "sent"
                                ? sentUsersResp?.pagination
                                  ? `کل: ${sentUsersResp.pagination.total_count.toLocaleString("fa-IR")} نفر`
                                  : ""
                                : eligibleUsersResp?.pagination
                                ? `کل: ${eligibleUsersResp.pagination.total_count.toLocaleString("fa-IR")} نفر`
                                : ""}
                            </div>
                            {((eligibleUsersMode === "sent"
                              ? sentUsersResp?.pagination?.total_pages
                              : eligibleUsersResp?.pagination?.total_pages) || 0) > 1 && (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="bg-[#0a0a0a] border border-gray-900 text-gray-200 rounded-xl"
                                  disabled={eligibleUsersLoading || eligibleUsersPage <= 1}
                                  onClick={async () => {
                                    const nextPage = Math.max(1, eligibleUsersPage - 1);
                                    setEligibleUsersPage(nextPage);
                                    if (eligibleUsersMode === "sent") {
                                      await fetchSentUsers(eligibleUsersCategory, nextPage);
                                    } else {
                                      await fetchEligibleUsers(eligibleUsersCategory, nextPage);
                                    }
                                  }}
                                >
                                  قبلی
                                </Button>
                                <div className="text-xs text-gray-400">
                                  صفحه {eligibleUsersPage.toLocaleString("fa-IR")} از{" "}
                                  {(eligibleUsersMode === "sent"
                                    ? sentUsersResp?.pagination?.total_pages
                                    : eligibleUsersResp?.pagination?.total_pages
                                  )?.toLocaleString("fa-IR")}
                                </div>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="bg-[#0a0a0a] border border-gray-900 text-gray-200 rounded-xl"
                                  disabled={
                                    eligibleUsersLoading ||
                                    eligibleUsersPage >=
                                      ((eligibleUsersMode === "sent"
                                        ? sentUsersResp?.pagination?.total_pages
                                        : eligibleUsersResp?.pagination?.total_pages) || 1)
                                  }
                                  onClick={async () => {
                                    const totalPages =
                                      (eligibleUsersMode === "sent"
                                        ? sentUsersResp?.pagination?.total_pages
                                        : eligibleUsersResp?.pagination?.total_pages) || 1;
                                    const nextPage = Math.min(totalPages, eligibleUsersPage + 1);
                                    setEligibleUsersPage(nextPage);
                                    if (eligibleUsersMode === "sent") {
                                      await fetchSentUsers(eligibleUsersCategory, nextPage);
                                    } else {
                                      await fetchEligibleUsers(eligibleUsersCategory, nextPage);
                                    }
                                  }}
                                >
                                  بعدی
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {eligibleUsersLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                            <span className="mr-3 text-gray-400 text-sm">در حال بارگذاری...</span>
                          </div>
                        ) : eligibleUsersMode === "sent" ? (
                          !sentUsersResp?.users?.length ? (
                            <div className="text-right text-gray-400 bg-[#0f0f0f] border border-gray-900 rounded-2xl p-6">
                              کاربری برای نمایش وجود ندارد.
                            </div>
                          ) : (
                            <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-gray-900">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-gray-900">
                                    <TableHead className="text-right text-gray-400">نام</TableHead>
                                    <TableHead className="text-right text-gray-400">شماره</TableHead>
                                    <TableHead className="text-right text-gray-400">زمان ثبت‌نام</TableHead>
                                    <TableHead className="text-right text-gray-400">زمان ارسال</TableHead>
                                    <TableHead className="text-right text-gray-400">وضعیت تماشا</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sentUsersResp.users.map((u) => {
                                    const watchMinutes = u.total_watch_seconds ? Math.floor(u.total_watch_seconds / 60) : 0;
                                    const hasWatched = u.total_watch_seconds && u.total_watch_seconds > 0;
                                    return (
                                      <TableRow key={`${u.cycle_id}-${u.user_id}-${u.sent_at}`} className="border-gray-900">
                                        <TableCell className="text-right text-white">
                                          {`${u.first_name || ""} ${u.last_name || ""}`.trim() || "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-200">
                                          {maskPhone(u.phone || "")}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-400 text-sm">
                                          {u.registered_at ? new Date(u.registered_at).toLocaleString("fa-IR") : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-400 text-sm">
                                          {u.sent_at ? new Date(u.sent_at).toLocaleString("fa-IR") : "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                          {hasWatched ? (
                                            <span className="text-green-400 font-semibold">
                                              ✓ تماشا کرده ({watchMinutes.toLocaleString("fa-IR")} دقیقه)
                                            </span>
                                          ) : (
                                            <span className="text-gray-500">✗ تماشا نکرده</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )
                        ) : !eligibleUsersResp?.users?.length && !eligibleUsersResp?.excluded_users?.length ? (
                          <div className="text-right text-gray-400 bg-[#0f0f0f] border border-gray-900 rounded-2xl p-6">
                            کاربری برای نمایش وجود ندارد.
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Eligible Users Table */}
                            {eligibleUsersResp?.users && eligibleUsersResp.users.length > 0 && (
                              <div className="rounded-2xl border border-gray-900 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-gray-900 bg-[#0f0f0f]">
                                      <TableHead className="text-right text-gray-400">نام</TableHead>
                                      <TableHead className="text-right text-gray-400">شماره</TableHead>
                                      <TableHead className="text-right text-gray-400">زمان ثبت‌نام</TableHead>
                                      <TableHead className="text-right text-gray-400">وضعیت تماشا</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {eligibleUsersResp.users.map((u) => {
                                      const watchMinutes = u.total_watch_seconds ? Math.floor(u.total_watch_seconds / 60) : 0;
                                      const hasWatched = u.total_watch_seconds && u.total_watch_seconds > 0;
                                      return (
                                        <TableRow key={`${u.cycle_id}-${u.user_id}`} className="border-gray-900">
                                          <TableCell className="text-right text-white">
                                            {`${u.first_name || ""} ${u.last_name || ""}`.trim() || "—"}
                                          </TableCell>
                                          <TableCell className="text-right text-gray-200">
                                            {maskPhone(u.phone || "")}
                                          </TableCell>
                                          <TableCell className="text-right text-gray-400 text-sm">
                                            {u.registered_at ? new Date(u.registered_at).toLocaleString("fa-IR") : "—"}
                                          </TableCell>
                                          <TableCell className="text-right text-sm">
                                            {hasWatched ? (
                                              <span className="text-green-400 font-semibold">
                                                ✓ تماشا کرده ({watchMinutes.toLocaleString("fa-IR")} دقیقه)
                                              </span>
                                            ) : (
                                              <span className="text-gray-500">✗ تماشا نکرده</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            
                            {/* Excluded Users Table (watched more than 10 minutes) */}
                            {eligibleUsersResp?.excluded_users && eligibleUsersResp.excluded_users.length > 0 && (
                              <div className="rounded-2xl border-2 border-red-500/60 bg-gradient-to-br from-red-950/20 to-red-900/10 backdrop-blur-sm shadow-lg shadow-red-500/10 overflow-hidden">
                                <div className="p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border-b-2 border-red-500/40">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-right">
                                      <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
                                        <X className="h-5 w-5 text-red-400" />
                                      </div>
                                      <div>
                                        <div className="text-red-300 font-bold text-lg">
                                          کاربران حذف شده
                                        </div>
                                        <div className="text-red-400/80 text-sm mt-1">
                                          تماشا بیشتر از ۱۰ دقیقه - پیام ارسال نمی‌شود (نه SMS و نه Avanak)
                                        </div>
                                      </div>
                                    </div>
                                    <div className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg">
                                      <span className="text-red-300 font-bold text-lg">
                                        {eligibleUsersResp.excluded_users.length.toLocaleString("fa-IR")}
                                      </span>
                                      <span className="text-red-400/70 text-sm mr-1">نفر</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="max-h-[50vh] overflow-y-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-red-500/30 bg-red-950/10">
                                        <TableHead className="text-right text-red-300 font-semibold">نام</TableHead>
                                        <TableHead className="text-right text-red-300 font-semibold">شماره</TableHead>
                                        <TableHead className="text-right text-red-300 font-semibold">زمان ثبت‌نام</TableHead>
                                        <TableHead className="text-right text-red-300 font-semibold">وضعیت تماشا</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {eligibleUsersResp.excluded_users.map((u) => {
                                        const watchMinutes = u.total_watch_seconds ? Math.floor(u.total_watch_seconds / 60) : 0;
                                        return (
                                          <TableRow key={`excluded-${u.cycle_id}-${u.user_id}`} className="border-red-500/20 bg-red-950/5 hover:bg-red-950/10 transition-colors">
                                            <TableCell className="text-right text-red-200">
                                              {`${u.first_name || ""} ${u.last_name || ""}`.trim() || "—"}
                                            </TableCell>
                                            <TableCell className="text-right text-red-300">
                                              {maskPhone(u.phone || "")}
                                            </TableCell>
                                            <TableCell className="text-right text-red-400/80 text-sm">
                                              {u.registered_at ? new Date(u.registered_at).toLocaleString("fa-IR") : "—"}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 font-semibold">
                                                <span>✓</span>
                                                <span>تماشا کرده ({watchMinutes.toLocaleString("fa-IR")} دقیقه)</span>
                                                <span className="text-red-500">- حذف شده</span>
                                              </span>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-right">
                      <div className="text-white font-semibold">لیست پیام‌های برنامه‌ریزی‌شده امروز</div>
                      <div className="text-xs text-gray-500 mt-1">
                        فقط کاربران «ثبت‌نام دیروز (شمسی / Asia-Tehran)» واجد شرایط هستند.
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        fetchSmartSmsPopupFollowups();
                        fetchSmartSmsToday();
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                      disabled={loadingSmartSmsToday || loadingSmartSmsPopup}
                    >
                      {loadingSmartSmsToday || loadingSmartSmsPopup ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          در حال بروزرسانی...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          بروزرسانی
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] border border-gray-900 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-right">
                        <div className="text-white font-semibold">پیامک‌های رفتاری (ThankYou)</div>
                        <div className="text-xs text-gray-500 mt-1">بر اساس رفتار کاربر + شرط ۲ دقیقه عدم فعالیت</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {smartSmsPopup?.cutoff ? `آخرین بررسی تا: ${new Date(smartSmsPopup.cutoff).toLocaleString("fa-IR")}` : ""}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {loadingSmartSmsPopup ? (
                        <div className="col-span-1 lg:col-span-3 bg-[#0f0f0f] border border-gray-900 rounded-2xl p-6 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                          <span className="mr-3 text-gray-400 text-sm">در حال بارگذاری...</span>
                        </div>
                      ) : !smartSmsPopup?.items?.length ? (
                        <div className="col-span-1 lg:col-span-3 text-right text-gray-400 bg-[#0f0f0f] border border-gray-900 rounded-2xl p-6">
                          داده‌ای برای پیامک‌های رفتاری وجود ندارد.
                        </div>
                      ) : (
                        smartSmsPopup.items.map((it) => (
                          <div key={it.category} className="bg-[#0f0f0f] border border-gray-900 rounded-2xl p-4 text-right">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-white font-semibold text-sm">{it.title}</div>
                              <span
                                className={`text-xs px-2 py-1 rounded-lg border ${
                                  it.status === "فعال"
                                    ? "bg-emerald-600/15 border-emerald-600/30 text-emerald-300"
                                    : "bg-red-600/15 border-red-600/30 text-red-300"
                                }`}
                              >
                                {it.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">{it.description}</div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                                type="button"
                                onClick={() => openEligibleUsersModal(it.category, it.title)}
                                className="bg-[#0a0a0a] border border-gray-900 rounded-xl px-3 py-2 text-right hover:bg-[#0f0f0f] hover:border-gray-800 transition-all cursor-pointer"
                                disabled={it.status !== "فعال"}
                                title={it.status !== "فعال" ? "سرویس غیرفعال است" : "مشاهده کاربران واجد شرایط"}
                  >
                                <div className="text-[11px] text-gray-500 mb-1">واجد شرایط (الان)</div>
                                <div className="text-lg font-bold text-white">
                                  {(it.eligible_count || 0).toLocaleString("fa-IR")}
                                </div>
                  </button>
                              <button
                                type="button"
                                onClick={() => openSentUsersModal(it.category, `ارسال‌شده • ${it.title}`)}
                                className="bg-[#0a0a0a] border border-gray-900 rounded-xl px-3 py-2 text-right hover:bg-[#0f0f0f] hover:border-gray-800 transition-all cursor-pointer"
                                title="مشاهده کاربران ارسال‌شده"
                              >
                                <div className="text-[11px] text-gray-500 mb-1">Provider / Pattern</div>
                                <div className="text-sm font-semibold text-gray-200 break-all">
                                  {it.provider === "melipayamak"
                                    ? `ملی پیامک • ${it.pattern_code || ""}`
                                    : it.provider === "avanak"
                                    ? "آوانک • تماس صوتی"
                                    : "فراز • متنی"}
                                </div>
                              </button>
                            </div>
                          </div>
                        ))
                )}
              </div>
            </div>

                  <div className="grid grid-cols-1 gap-3">
                    {loadingSmartSmsToday ? (
                      <div className="bg-[#0f0f0f] border border-gray-900 rounded-2xl p-6 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                        <span className="mr-3 text-gray-400 text-sm">در حال بارگذاری...</span>
                      </div>
                    ) : !smartSmsToday?.items?.length ? (
                      <div className="bg-[#0f0f0f] border border-gray-900 rounded-2xl p-6 text-right text-gray-400">
                        داده‌ای برای نمایش وجود ندارد.
                      </div>
                    ) : (
                      smartSmsToday.items.map((item) => {
                        const statusColor =
                          item.status === "ارسال شده"
                            ? "bg-emerald-600/20 border-emerald-600/40 text-emerald-300"
                            : item.status === "لغو شده"
                            ? "bg-red-600/15 border-red-600/30 text-red-300"
                            : item.status === "در حال ارسال"
                            ? "bg-blue-600/15 border-blue-600/30 text-blue-300"
                            : "bg-gray-800/40 border-gray-700/40 text-gray-300";

                        const providerBadge =
                          item.provider === "melipayamak"
                            ? "ملی پیامک"
                            : item.provider === "faraz"
                            ? "فراز"
                            : item.provider === "avanak"
                            ? "آوانک"
                            : item.provider;

                        return (
                          <div
                            key={item.category}
                            className="bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] border border-gray-900 rounded-2xl p-5"
                            dir="rtl"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="text-right flex-1">
                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                  <span className="text-white font-semibold">{item.scheduled_time}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-400">{providerBadge}</span>
                                  <span className={`text-xs px-2 py-1 rounded-lg border ${statusColor}`}>
                                    {item.status}
                                  </span>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEligibleUsersModal(item.category, `پیام زمان‌بندی‌شده ${item.scheduled_time}`)}
                                    className="bg-[#0f0f0f] border border-gray-900 rounded-xl px-4 py-3 text-right hover:bg-[#151515] hover:border-gray-800 transition-all cursor-pointer"
                                    title="مشاهده کاربران واجد شرایط"
                                  >
                                    <div className="text-xs text-gray-500 mb-1">کاربران واجد شرایط</div>
                                    <div className="text-lg font-bold text-white">
                                      {item.eligible_count?.toLocaleString("fa-IR") || "۰"}
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openSentUsersModal(
                                        item.category,
                                        `ارسال‌شده • پیام زمان‌بندی‌شده ${item.scheduled_time}`
                                      )
                                    }
                                    className="bg-[#0f0f0f] border border-gray-900 rounded-xl px-4 py-3 text-right hover:bg-[#151515] hover:border-gray-800 transition-all cursor-pointer"
                                    title="مشاهده کاربران ارسال‌شده"
                                  >
                                    <div className="text-xs text-gray-500 mb-1">ارسال‌شده</div>
                                    <div className="text-lg font-bold text-white">
                                      {item.sent_count?.toLocaleString("fa-IR") || "۰"}
                                    </div>
                                  </button>
                                  <div className="bg-[#0f0f0f] border border-gray-900 rounded-xl px-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">Pattern</div>
                                    <div className="text-sm font-semibold text-gray-200 break-all">
                                      {item.provider === "melipayamak"
                                        ? item.pattern_code || "تنظیم نشده"
                                        : item.provider === "avanak"
                                        ? "تماس صوتی"
                                        : "متنی"}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 bg-[#0f0f0f] border border-gray-900 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-line">
                          {item.provider === "avanak" ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-cyan-400" />
                              <span>پیام صوتی (تماس آوانک)</span>
                            </div>
                          ) : (
                            item.message_text
                          )}
                                </div>
                              </div>

                              <div className="flex sm:flex-col gap-2 sm:justify-start">
                        {item.provider === "avanak" && canViewAvanak && (
                          <Button
                            type="button"
                            onClick={async () => {
                              setShowAvanakLogsModal(true);
                              await fetchAvanakLogs(1);
                            }}
                            className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/30 text-cyan-200 rounded-xl flex items-center gap-2"
                            variant="secondary"
                          >
                            گزارش‌های آوانک
                          </Button>
                        )}
                        {item.provider === "avanak" && (
                          <AvanakQuickTestBox
                            defaultMessageId={item.avanak_message_id}
                            loading={avanakTestLoading}
                            onSend={(phone, mid) => runAvanakTest(phone, mid)}
                            helper="نتیجه تست در پاپ‌آپ نمایش داده می‌شود."
                          />
                        )}
                        <Button
                          type="button"
                          onClick={() => openEditScheduledMessage(item)}
                          className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-200 rounded-xl flex items-center gap-2"
                          variant="secondary"
                                  title="ویرایش پیام و زمان"
                                >
                                  <Edit className="h-4 w-4" />
                                  ویرایش
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => fetchSmartSmsToday()}
                                  className="bg-[#0f0f0f] hover:bg-[#151515] border border-gray-800 text-gray-200 rounded-xl"
                                  variant="secondary"
                                >
                                  بروزرسانی
                                </Button>

                                {item.status === "در انتظار" && (
                                  <Button
                                    type="button"
                                    onClick={() => cancelSmartSmsForToday(item.category)}
                                    className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-200 rounded-xl"
                                    variant="secondary"
                                  >
                                    لغو امروز
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {!currentUserIsAffiliate && usersSubview === "behavior" && (
                <div className="space-y-6">
                  {(() => {
                    const total = thankYouFunnel?.total_unique_users || 0;
                    const reached = thankYouFunnel?.reached;
                    const step1 = reached?.step_1 || 0;
                    const complete = reached?.complete || 0;
                    const completionRate = step1 > 0 ? (complete / step1) * 100 : 0;
                    const watchedRate = (thankYouFunnel?.watch?.watched_rate || 0) * 100;

                    const stepColors: Record<number, string> = {
                      0: "#334155", // slate
                      1: "#10b981", // emerald
                      2: "#22c55e", // green
                      3: "#06b6d4", // cyan
                      4: "#3b82f6", // blue
                      5: "#2a9c96", // teal
                      6: "#26fce3", // glow
                      7: "#ec4899", // pink
                      8: "#f59e0b", // amber (complete)
                    };

                    const stepLabels: Record<number, string> = {
                      0: "فقط باز شد",
                      1: "تا پاپ‌آپ ۱",
                      2: "تا پاپ‌آپ ۲",
                      3: "تا پاپ‌آپ ۳",
                      4: "تا پاپ‌آپ ۴",
                      5: "تا پاپ‌آپ ۵",
                      6: "تا پاپ‌آپ ۶",
                      7: "تا پاپ‌آپ ۷",
                      8: "تا آخر",
                    };

                    const dist = thankYouFunnel?.max_step_distribution || {};
                    const donutData = Array.from({ length: 9 }, (_, i) => i)
                      .map((step) => ({
                        step,
                        label: stepLabels[step] || `مرحله ${step}`,
                        count: Number(dist[String(step)] || 0),
                      }))
                      .filter((x) => x.count > 0)
                      .map((x) => ({
                        ...x,
                        percent: total > 0 ? (x.count / total) * 100 : 0,
                        color: stepColors[x.step] || "#6b7280",
                      }));

                    return (
                      <>
                        {/* KPI Row — an inline stat strip with dividers and a
                            featured first figure, instead of four identical
                            boxes. */}
                        <div className="fp-card fp-notch p-4 sm:p-5">
                          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4">
                            <div className="flex items-baseline gap-2">
                              <span className="fp-hud-num gradient-text text-3xl">{total.toLocaleString("fa-IR")}</span>
                              <span className="text-xs text-gray-500">کل کاربران (یونیک) در بازه</span>
                            </div>
                            <span className="h-8 w-px shrink-0 self-center bg-white/10" aria-hidden="true" />
                            <div className="flex items-baseline gap-2">
                              <span className="fp-hud-num text-2xl text-white">{toPersianDigitsLocal(completionRate.toFixed(1))}%</span>
                              <span className="text-xs text-emerald-300/90">نرخ رسیدن تا آخر (از پاپ‌آپ ۱)</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="fp-hud-num text-2xl text-white">{toPersianDigitsLocal(watchedRate.toFixed(1))}%</span>
                              <span className="text-xs text-blue-300/90">نرخ تماشا (در همین گروه)</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="fp-hud-num text-2xl text-white">
                                {toPersianDigitsLocal((thankYouFunnel?.watch?.avg_watch_minutes || 0).toFixed(1))}
                              </span>
                              <span className="text-xs text-cyan-300/90">میانگین تماشا (دقیقه)</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] border border-gray-800/50 rounded-2xl overflow-hidden">
                          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <MousePointerClick className="h-4 w-4 text-emerald-400" />
                              </div>
                              <div className="text-right">
                                <h3 className="text-white text-sm font-semibold">نمودار دایره‌ای رفتار کاربران در پاپ‌آپ‌های Thank You</h3>
                                <p className="text-gray-500 text-xs mt-0.5">هر کاربر فقط یک‌بار، بر اساس «آخرین مرحله‌ای که رسیده» محاسبه می‌شود</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-5">
                            {loadingThankYouFunnel ? (
                              <div className="flex items-center justify-center py-14">
                                <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                                <span className="mr-3 text-gray-400 text-sm">در حال بارگذاری...</span>
                              </div>
                            ) : !thankYouFunnel ? (
                              <div className="text-center py-14 text-gray-500 text-sm">داده‌ای برای نمایش وجود ندارد.</div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                <div className="lg:col-span-3">
                                  <div className="h-[360px] flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Tooltip
                                          content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                              const d: any = payload[0].payload;
                                              return (
                                                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 shadow-xl">
                                                  <p className="text-gray-300 text-xs mb-1">{d.label}</p>
                                                  <p className="text-white font-semibold text-sm">{toPersianDigitsLocal(d.count)} نفر</p>
                                                  <p className="text-emerald-400 text-xs mt-1">
                                                    {toPersianDigitsLocal(d.percent.toFixed(1))}% از کل
                                                  </p>
                                                </div>
                                              );
                                            }
                                            return null;
                                          }}
                                        />
                                        <Pie
                                          data={donutData}
                                          dataKey="count"
                                          nameKey="label"
                                          innerRadius={92}
                                          outerRadius={140}
                                          paddingAngle={2}
                                          cornerRadius={10}
                                          stroke="rgba(255,255,255,0.08)"
                                          strokeWidth={1}
                                        >
                                          {donutData.map((entry: any) => (
                                            <Cell key={entry.step} fill={entry.color} />
                                          ))}
                                        </Pie>
                                        {/* Center label */}
                                        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="22" fontWeight="700">
                                          {toPersianDigitsLocal(total)}
                                        </text>
                                        <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="rgba(156,163,175,0.9)" fontSize="12">
                                          کاربر (یونیک)
                                        </text>
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                <div className="lg:col-span-2 space-y-3">
                                  <div className="text-xs text-gray-500">خلاصه (توزیع آخرین مرحله)</div>
                                  {donutData.length === 0 ? (
                                    <div className="bg-[#0f0f0f] border border-gray-900 rounded-xl p-3 text-gray-500 text-sm text-center">
                                      داده‌ای برای نمایش وجود ندارد.
                                    </div>
                                  ) : (
                                    donutData.map((row: any) => (
                                      <div key={row.step} className="bg-[#0f0f0f] border border-gray-900 rounded-xl p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                                          <div className="text-white text-sm font-semibold">{row.label}</div>
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                          {toPersianDigitsLocal(row.count)} نفر • {toPersianDigitsLocal(row.percent.toFixed(1))}%
                                        </div>
                                      </div>
                                      <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                                        <div
                                          className="h-full rounded-full"
                                          style={{ width: `${Math.min(100, row.percent)}%`, backgroundColor: row.color }}
                                        />
                                      </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                )}
              </div>
            </div>

                        {/* Full Funnel: Registration -> ThankYou -> Watch */}
                        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] border border-gray-800/50 rounded-2xl overflow-hidden">
                          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-blue-400" />
                              </div>
                              <div className="text-right">
                                <h3 className="text-white text-sm font-semibold">فانل کامل: ثبت‌نام تا تماشا</h3>
                                <p className="text-gray-500 text-xs mt-0.5">ثبت‌نام → پاپ‌آپ‌ها → شروع تماشا → عمق تماشا</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-5">
                            {loadingBehaviorFunnel ? (
                              <div className="flex items-center justify-center py-14">
                                <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
                                <span className="mr-3 text-gray-400 text-sm">در حال بارگذاری...</span>
                              </div>
                            ) : !behaviorFunnel ? (
                              <div className="text-center py-14 text-gray-500 text-sm">داده‌ای برای نمایش وجود ندارد.</div>
                            ) : (
                              (() => {
                                const r = behaviorFunnel.reached || {};
                                const registered = r["registered"] || 0;
                                const series = [
                                  { key: "registered", label: "ثبت‌نام", count: registered, color: "#3b82f6" },
                                  { key: "webinar_click", label: "ورود به وبینار", count: r["webinar_click"] || 0, color: "#22c55e" },
                                  { key: "thankyou_opened", label: "باز شدن صفحه تشکر", count: r["thankyou_opened"] || 0, color: "#10b981" },
                                  { key: "thankyou_step_1", label: "عبور از پاپ‌آپ ۱", count: r["thankyou_step_1"] || 0, color: "#34d399" },
                                  { key: "thankyou_complete", label: "تکمیل پاپ‌آپ‌ها", count: r["thankyou_complete"] || 0, color: "#26fce3" },
                                  { key: "watched_any", label: "شروع تماشا", count: r["watched_any"] || 0, color: "#f59e0b" },
                                  { key: "watched_5m", label: "تماشای ≥ ۵ دقیقه", count: r["watched_5m"] || 0, color: "#fb7185" },
                                  { key: "watched_20m", label: "تماشای ≥ ۲۰ دقیقه", count: r["watched_20m"] || 0, color: "#ef4444" },
                                ].map((x) => ({
                                  ...x,
                                  percent: registered > 0 ? (x.count / registered) * 100 : 0,
                                }));

                                return (
                                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                    <div className="lg:col-span-3">
                                      <div className="h-[360px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={series} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                            <XAxis
                                              type="number"
                                              tick={{ fill: "#6b7280", fontSize: 11 }}
                                              tickLine={false}
                                              axisLine={false}
                                              tickFormatter={(v) => toPersianDigitsLocal(v)}
                                            />
                                            <YAxis
                                              type="category"
                                              dataKey="label"
                                              tick={{ fill: "#9ca3af", fontSize: 12 }}
                                              tickLine={false}
                                              axisLine={false}
                                              width={120}
                                            />
                                            <Tooltip
                                              content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const d: any = payload[0].payload;
                                                  return (
                                                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 shadow-xl">
                                                      <p className="text-gray-300 text-xs mb-1">{d.label}</p>
                                                      <p className="text-white font-semibold text-sm">{toPersianDigitsLocal(d.count)} نفر</p>
                                                      <p className="text-blue-400 text-xs mt-1">
                                                        {toPersianDigitsLocal(d.percent.toFixed(1))}% از ثبت‌نام‌ها
                                                      </p>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }}
                                            />
                                            <Bar dataKey="count" radius={[8, 8, 8, 8]}>
                                              {series.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                              ))}
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>

                                    <div className="lg:col-span-2 space-y-3">
                                      <div className="text-xs text-gray-500">خلاصه سریع</div>
                                      <div className="bg-[#0f0f0f] border border-gray-900 rounded-xl p-3">
                                        <div className="text-xs text-gray-500 mb-1">میانگین تماشای فعال (در بین شروع‌کنندگان تماشا)</div>
                                        <div className="text-white font-semibold">
                                          {toPersianDigitsLocal((behaviorFunnel.watch?.avg_active_minutes || 0).toFixed(1))} دقیقه
                                        </div>
                                      </div>
                                      {series.map((row) => (
                                        <div key={row.key} className="bg-[#0f0f0f] border border-gray-900 rounded-xl p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="text-white text-sm font-semibold">{row.label}</div>
                                            <div className="text-gray-400 text-xs">
                                              {toPersianDigitsLocal(row.count)} نفر • {toPersianDigitsLocal(row.percent.toFixed(1))}%
                                            </div>
                                          </div>
                                          <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                                            <div
                                              className="h-full rounded-full"
                                              style={{ width: `${Math.min(100, row.percent)}%`, backgroundColor: row.color }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {usersSubview === "list" && (
                <>

            {/* Daily Registrations Chart - Ultra Minimal & Elegant */}
            <div className="mb-6 bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] border border-gray-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium">ثبت‌نام روزانه</h3>
                    <p className="text-gray-500 text-xs">تعداد کاربران ثبت‌نام شده</p>
                  </div>
                </div>
                
                {/* Minimal Filter Buttons */}
                <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-0.5">
                  <button
                    onClick={() => setRegistrationsChartFilter("week")}
                    className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${
                      registrationsChartFilter === "week"
                        ? "bg-blue-500/20 text-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    هفته
                  </button>
                  <button
                    onClick={() => setRegistrationsChartFilter("month")}
                    className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${
                      registrationsChartFilter === "month"
                        ? "bg-blue-500/20 text-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    ماه
                  </button>
                  <button
                    onClick={() => setRegistrationsChartFilter("all")}
                    className={`px-3 py-1.5 text-xs font-medium transition-all rounded-md ${
                      registrationsChartFilter === "all"
                        ? "bg-blue-500/20 text-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    همه
                  </button>
                </div>
              </div>
              
              <div className="px-5 pb-5 pt-2">
                {loadingDailyRegistrations ? (
                  <div className="flex items-center justify-center h-[280px]">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs">در حال بارگذاری...</p>
                    </div>
                  </div>
                ) : !dailyRegistrationsStats || dailyRegistrationsStats.length === 0 ? (
                  <div className="flex items-center justify-center h-[280px]">
                    <div className="text-center">
                      <Users className="h-10 w-10 text-gray-700 mx-auto mb-2 opacity-30" />
                      <p className="text-gray-500 text-xs">داده‌ای یافت نشد</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={dailyRegistrationsStats} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="registrationsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02}/>
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
                          const stat = dailyRegistrationsStats.find(s => s.date === value);
                          if (!stat) return '';
                          
                          const dateObj = new Date(stat.date);
                          if (isNaN(dateObj.getTime())) return '';
                          
                          if (registrationsChartFilter === 'week') {
                            const dayName = getJalaliDayName(dateObj);
                            return dayName || '';
                          } else if (registrationsChartFilter === 'month') {
                            const jalali = getJalaliDate(dateObj);
                            return jalali ? toPersianDigits(jalali.day.toString()) : '';
                          } else {
                            const jalali = getJalaliDate(dateObj);
                            if (jalali) {
                              return `${toPersianDigits(jalali.month)}/${toPersianDigits(jalali.day)}`;
                            }
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
                          return toPersianDigits(value.toString());
                        }}
                        width={45}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const stat = dailyRegistrationsStats.find(s => s.date === label);
                            const value = payload[0].value as number;
                            
                            const formattedCount = toPersianDigits(new Intl.NumberFormat('fa-IR').format(value));
                            
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
                                formattedDate = stat.persian_date || label;
                              }
                            } else {
                              formattedDate = label;
                            }
                            
                            return (
                              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 shadow-xl">
                                <p className="text-gray-400 text-xs mb-1">{formattedDate}</p>
                                <p className="text-blue-400 font-semibold text-sm">{formattedCount} کاربر</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="registrations"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#registrationsGradient)"
                        dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Modern Desktop Table View */}
            <div className="hidden md:block overflow-x-auto transition-all duration-300">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0f0f0f] border-0 border-transparent hover:bg-[#0f0f0f] hover:border hover:border-green-500 hover:border-t-green-500 hover:border-b-green-500 hover:border-l-green-500 hover:border-r-green-500 transition-all duration-200">
                    <TableHead className="text-gray-400 text-right text-sm font-semibold px-4">نام</TableHead>
                    <TableHead className="text-gray-400 text-right text-sm font-semibold px-4">نام خانوادگی</TableHead>
                    {!currentUserIsAffiliate && (
                    <TableHead className="text-gray-400 text-right text-sm font-semibold px-4">شماره تماس</TableHead>
                    )}
                    <TableHead className="text-gray-400 text-right text-sm font-semibold px-4">تاریخ ثبت‌نام</TableHead>
                    <TableHead className="text-gray-400 text-right text-sm font-semibold px-4">لید گرفته شده توسط</TableHead>
                    <TableHead className="text-gray-400 text-right text-sm font-semibold px-4">وضعیت تماشا</TableHead>
                    <TableHead className="text-gray-400 text-right text-sm font-semibold px-4">مدت تماشا (فعال)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={currentUserIsAffiliate ? 6 : 7} className="text-center text-gray-500 py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="h-12 w-12 text-gray-600 opacity-50" />
                          <p>هیچ کاربری یافت نشد</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <TableRow 
                        key={user.id} 
                        className="border-0 border-transparent hover:bg-transparent hover:border hover:border-green-500 hover:border-t-green-500 hover:border-b-green-500 hover:border-l-green-500 hover:border-r-green-500 transition-all duration-200"
                      >
                        <TableCell className="text-white text-right text-sm px-4 py-4 font-medium">{user.first_name}</TableCell>
                        <TableCell className="text-white text-right text-sm px-4 py-4 font-medium">{user.last_name}</TableCell>
                        {!currentUserIsAffiliate && (
                        <TableCell className="text-gray-400 font-mono text-right text-sm px-4 py-4" dir="ltr">
                          <span className="bg-[#0f0f0f] px-3 py-1.5 rounded-lg border border-gray-900">
                            {user.phone}
                          </span>
                        </TableCell>
                        )}
                        <TableCell className="text-gray-500 text-right text-sm px-4 py-4">
                          {toPersianDigitsLocal(formatJalali(new Date(user.registered_at), 'YYYY/MM/DD'))} {new Date(user.registered_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-right text-sm px-4 py-4">
                          {user.promoter_username ? (
                            <span className="inline-flex items-center gap-2 bg-blue-600/30 text-blue-300 font-semibold px-3 py-1.5 rounded-lg border border-blue-600/50">
                              {user.promoter_username}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm px-4 py-4">
                          {user.watched_webinar ? (
                            <span className="inline-flex items-center gap-2 bg-green-600/30 text-green-300 font-semibold px-3 py-1.5 rounded-lg border border-green-600/50">
                              <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                              تماشا کرده
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 bg-red-600/30 text-red-300 font-semibold px-3 py-1.5 rounded-lg border border-red-600/50">
                              <span className="w-2 h-2 bg-red-300 rounded-full"></span>
                              تماشا نکرده
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm px-4 py-4">
                          <span className="text-white font-semibold bg-blue-600/30 px-3 py-1.5 rounded-lg border border-blue-600/50">
                            {user.active_watch_minutes?.toLocaleString('fa-IR') || 0} دقیقه
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Modern Mobile Card View - Minimal, Dark, Platform Style */}
            <div className="md:hidden space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-12 w-12 text-gray-600 opacity-50" />
                    <p>هیچ کاربری یافت نشد</p>
                  </div>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id} className="bg-[#0f0f0f] border border-gray-900 rounded-xl overflow-hidden">
                    <CardContent className="p-3.5">
                      {/* Compact Header - Name, Phone, Status */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          {/* Name */}
                          <div className="text-white font-medium text-sm">
                            {user.first_name} {user.last_name}
                          </div>
                          {/* Phone and Watch Status Badge - Aligned to top right */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!currentUserIsAffiliate && (
                            <div className="text-gray-500 text-xs font-mono" dir="ltr">
                              {user.phone}
                            </div>
                            )}
                            {user.watched_webinar ? (
                              <div className="bg-green-600/30 text-green-300 font-medium text-[10px] px-2.5 py-1.5 rounded-lg border border-green-600/50 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-300 rounded-full"></span>
                                تماشا کرده
                              </div>
                            ) : (
                              <div className="bg-red-600/30 text-red-300 font-medium text-[10px] px-2.5 py-1.5 rounded-lg border border-red-600/50 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-red-300 rounded-full"></span>
                                تماشا نکرده
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Modern Pagination */}
            {safePagination && safePagination.total_pages && safePagination.total_pages > 1 && (
              <div className="p-6 border-t border-gray-900">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <button
                        onClick={() => {
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                          }
                        }}
                  disabled={currentPage === 1}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPage === 1
                            ? "opacity-50 cursor-not-allowed bg-[#0f0f0f] border border-gray-800 text-gray-600"
                            : "bg-[#0f0f0f] border border-gray-800 text-gray-300 hover:bg-[#151515] hover:border-blue-600/50 hover:text-blue-400 cursor-pointer"
                        }`}
                >
                  <ChevronRight className="h-4 w-4" />
                        <span>قبلی</span>
                      </button>
                    </PaginationItem>
                    
                    {/* Page Numbers */}
                    {(() => {
                      if (!safePagination || !safePagination.total_pages) return null;
                      
                      const totalPages = safePagination.total_pages;
                      const pages: number[] = [];
                      
                      if (totalPages <= 5) {
                        // Show all pages if 5 or less
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                  } else if (currentPage <= 3) {
                        // Show first 5 pages
                        for (let i = 1; i <= 5; i++) {
                          pages.push(i);
                        }
                      } else if (currentPage >= totalPages - 2) {
                        // Show last 5 pages
                        for (let i = totalPages - 4; i <= totalPages; i++) {
                          pages.push(i);
                        }
                  } else {
                        // Show pages around current page
                        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                          pages.push(i);
                        }
                  }
                  
                      return pages.map((pageNum) => (
                        <PaginationItem key={pageNum}>
                          <button
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white border border-blue-500"
                                : "bg-[#0f0f0f] border border-gray-800 text-gray-300 hover:bg-[#151515] hover:border-blue-600/50 hover:text-blue-400"
                            }`}
                    >
                            {toPersianDigits(pageNum.toString())}
                          </button>
                        </PaginationItem>
                      ));
                    })()}
                
                    <PaginationItem>
                      <button
                        onClick={() => {
                          if (currentPage < (safePagination?.total_pages || 1)) {
                            setCurrentPage(currentPage + 1);
                          }
                        }}
                        disabled={currentPage >= (safePagination?.total_pages || 1)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPage >= (safePagination?.total_pages || 1)
                            ? "opacity-50 cursor-not-allowed bg-[#0f0f0f] border border-gray-800 text-gray-600"
                            : "bg-[#0f0f0f] border border-gray-800 text-gray-300 hover:bg-[#151515] hover:border-blue-600/50 hover:text-blue-400 cursor-pointer"
                        }`}
                >
                        <span>بعدی</span>
                  <ChevronLeft className="h-4 w-4" />
                      </button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
                </>
            )}
            </div>
            </div>
          </div>
        ) : null}
        {!canViewUsersList ? (
          <Card className="bg-[#0a0a0a] border border-gray-900 rounded-2xl p-10 text-center text-gray-400 flex flex-col items-center gap-4">
            <Shield className="h-10 w-10 text-red-400" />
            <CardTitle className="text-white text-2xl">دسترسی به لیست کاربران محدود است</CardTitle>
            <p className="text-sm text-gray-500 max-w-xl">
              برای مشاهده یا خروجی گرفتن از کاربران، مجوز{" "}
              <span className="text-white font-semibold">users.view</span>
              {` `}
              و در صورت نیاز به خروجی، مجوز{" "}
              <span className="text-white font-semibold">users.export</span>
              را فعال کنید.
            </p>
          </Card>
        ) : null}


        {/* Settings Panel */}
        {showSettings && systemConfig && canOpenSettings && (
          <SettingsPanel
            config={systemConfig}
            apiUrl={API_URL}
            onClose={() => setShowSettings(false)}
            onUpdateWebinar={updateWebinarConfig}
            onUpdatePayment={updatePaymentConfig}
            onUpdateMelipayamak={updateMelipayamakConfig}
            onUpdateAvanak={updateAvanakConfig}
            onStopStream={handleStopStream}
            saving={savingConfig}
            permissionsContext={permissionsContext}
            onAvanakTest={runAvanakTest}
            avanakTestLoading={avanakTestLoading}
          />
        )}
        </div>
      </div>

      {/* Online Viewers Modal */}
      <Dialog open={showOnlineViewersModal} onOpenChange={setShowOnlineViewersModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-emerald-600/30 rounded-2xl overflow-hidden">
          <DialogHeader className="pb-4 border-b border-gray-800">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Eye className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <span>کاربران آنلاین</span>
                <span className="block text-sm font-normal text-emerald-400 mt-1">
                  {onlineViewersList.length.toLocaleString('fa-IR')} نفر در حال تماشا
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              به‌روزرسانی لحظه‌ای
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loadingOnlineViewers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <span className="mr-3 text-gray-400">در حال بارگذاری...</span>
              </div>
            ) : onlineViewersList.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">هیچ کاربر آنلاینی وجود ندارد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {onlineViewersList.map((viewer, index) => {
                  const fullName = viewer.first_name || viewer.last_name 
                    ? `${viewer.first_name || ''} ${viewer.last_name || ''}`.trim() 
                    : 'کاربر ناشناس';
                  const watchHours = Math.floor(viewer.watch_duration_minutes / 60);
                  const watchMinutes = viewer.watch_duration_minutes % 60;
                  const watchTimeStr = watchHours > 0 
                    ? `${watchHours} ساعت و ${watchMinutes} دقیقه`
                    : `${watchMinutes} دقیقه`;

                  return (
                    <div
                      key={`${viewer.phone}-${index}`}
                      className="bg-[#151515] border border-gray-800/50 rounded-xl p-4 hover:border-emerald-600/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Users className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div className="flex-1 text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold text-lg">{fullName}</h3>
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                <span className="font-mono">{viewer.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{watchTimeStr}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-left ml-4">
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                            <div className="text-xs text-emerald-400 mb-1">مدت تماشا</div>
                            <div className="text-emerald-300 font-bold text-sm">
                              {viewer.watch_duration_minutes.toLocaleString('fa-IR')} دقیقه
                            </div>
                            {viewer.active_watch_minutes > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                فعال: {viewer.active_watch_minutes.toLocaleString('fa-IR')} دقیقه
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                fetchOnlineViewersList(true); // Show loading on manual refresh
              }}
              disabled={loadingOnlineViewers}
              className="bg-[#151515] border-gray-700 text-gray-300 hover:bg-[#1a1a1a]"
            >
              {loadingOnlineViewers ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال به‌روزرسانی...
                </>
              ) : (
                <>
                  <Clock className="ml-2 h-4 w-4" />
                  به‌روزرسانی
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowOnlineViewersModal(false)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avanak Logs Modal */}
      <Dialog open={showAvanakLogsModal} onOpenChange={(open) => setShowAvanakLogsModal(open)}>
        <DialogContent className="max-w-4xl bg-[#0a0a0a] border border-cyan-600/30 rounded-2xl overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
              <Phone className="h-5 w-5 text-cyan-400" />
              گزارش تماس‌های آوانک
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              آخرین تماس‌های ثبت‌شده در سیستم آوانک (بر اساس لاگ‌های ارسال)
            </DialogDescription>
          </DialogHeader>

          {avanakLogsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              <span className="mr-3 text-gray-400 text-sm">در حال بارگذاری...</span>
            </div>
          ) : !avanakLogs?.data?.length ? (
            <div className="text-right text-gray-400 bg-[#0f0f0f] border border-gray-900 rounded-2xl p-6">
              گزارشی برای نمایش وجود ندارد.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-auto max-h-[420px] border border-gray-900 rounded-xl">
                <table className="min-w-full text-sm text-right text-gray-300">
                  <thead className="bg-[#0d0d0d] text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2">گیرنده</th>
                      <th className="px-3 py-2">وضعیت</th>
                      <th className="px-3 py-2">کد صوت</th>
                      <th className="px-3 py-2">نام پیام</th>
                      <th className="px-3 py-2">زمان ارسال</th>
                      <th className="px-3 py-2">خطا (درصورت وجود)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avanakLogs.data.map((row: any) => (
                      <tr key={row.id} className="border-b border-gray-900">
                        <td className="px-3 py-2 font-semibold text-white">{row.recipient}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs ${
                              row.status === "sent"
                                ? "bg-emerald-600/15 text-emerald-300 border border-emerald-600/30"
                                : "bg-red-600/15 text-red-300 border border-red-600/30"
                            }`}
                          >
                            {row.status === "sent" ? "ارسال شده" : "ناموفق"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-200">{row.message_id || "-"}</td>
                        <td className="px-3 py-2 text-gray-200">{row.message_name || "-"}</td>
                        <td className="px-3 py-2 text-gray-400">
                          {row.sent_at ? new Date(row.sent_at).toLocaleString("fa-IR") : "-"}
                        </td>
                        <td className="px-3 py-2 text-red-300 text-xs whitespace-pre-wrap">
                          {row.error_message || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  صفحه {avanakLogs.pagination?.page?.toLocaleString("fa-IR") || "۱"} از{" "}
                  {Math.max(
                    1,
                    Math.ceil(
                      (avanakLogs.pagination?.total_count || 0) /
                        (avanakLogs.pagination?.limit || 50),
                    ),
                  ).toLocaleString("fa-IR")}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="bg-[#0f0f0f] hover:bg-[#151515] border border-gray-800 text-gray-200"
                    onClick={() => {
                      const prev = Math.max(1, avanakLogsPage - 1);
                      fetchAvanakLogs(prev);
                    }}
                    disabled={avanakLogsPage <= 1 || avanakLogsLoading}
                  >
                    قبلی
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-[#0f0f0f] hover:bg-[#151515] border border-gray-800 text-gray-200"
                    onClick={() => {
                      const totalPages = Math.max(1, Math.ceil((avanakLogs?.pagination?.total_count || 0) / (avanakLogs?.pagination?.limit || 50)));
                      const next = Math.min(totalPages, avanakLogsPage + 1);
                      fetchAvanakLogs(next);
                    }}
                    disabled={
                      avanakLogsLoading ||
                      avanakLogsPage >=
                        Math.ceil((avanakLogs?.pagination?.total_count || 0) / (avanakLogs?.pagination?.limit || 50))
                    }
                  >
                    بعدی
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowAvanakLogsModal(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Avanak Test Result Modal */}
      <Dialog open={showAvanakTestModal} onOpenChange={(open) => setShowAvanakTestModal(open)}>
        <DialogContent className="max-w-xl bg-[#0a0a0a] border border-cyan-600/30 rounded-2xl overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${avanakTestModalContent?.status === "success" ? "text-emerald-300" : "text-red-300"}`}>
              {avanakTestModalContent?.title || "نتیجه تست آوانک"}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm whitespace-pre-line">
              {avanakTestModalContent?.body || "بدون جزئیات"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowAvanakTestModal(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Scheduled Message Modal */}
      <Dialog open={editingScheduledMessage !== null} onOpenChange={(open) => !open && setEditingScheduledMessage(null)}>
        <DialogContent className="max-w-2xl bg-[#0a0a0a] border border-blue-600/30 rounded-2xl overflow-hidden">
          <DialogHeader className="text-right" dir="rtl">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
              <Edit className="h-5 w-5 text-blue-400" />
              ویرایش پیام زمان‌بندی شده
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-2">
              می‌توانید متن و زمان ارسال این پیام را تغییر دهید
            </DialogDescription>
          </DialogHeader>

          {editingScheduledMessage && (
            <div className="space-y-4 mt-4" dir="rtl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">ساعت (0-23)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={editingScheduledMessage.hour}
                    onChange={(e) =>
                      setEditingScheduledMessage({
                        ...editingScheduledMessage,
                        hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)),
                      })
                    }
                    className="w-full bg-[#0f0f0f] border border-blue-500/30 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">دقیقه (0-59)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editingScheduledMessage.minute}
                    onChange={(e) =>
                      setEditingScheduledMessage({
                        ...editingScheduledMessage,
                        minute: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)),
                      })
                    }
                    className="w-full bg-[#0f0f0f] border border-blue-500/30 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              {editingScheduledMessage.provider === "avanak" && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    کد پیام صوتی آوانک (Avanak Message ID)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingScheduledMessage.avanak_message_id || ""}
                    onChange={(e) =>
                      setEditingScheduledMessage({
                        ...editingScheduledMessage,
                        avanak_message_id: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full bg-[#0f0f0f] border border-blue-500/30 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="مثال: 41027586"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 این کد برای ارسال تماس صوتی آوانک استفاده می‌شود
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {editingScheduledMessage.provider === "avanak" ? "توضیحات نمایشی (اختیاری)" : "متن پیام"}
                </label>
                <textarea
                  value={editingScheduledMessage.message}
                  onChange={(e) =>
                    setEditingScheduledMessage({
                      ...editingScheduledMessage,
                      message: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full bg-[#0f0f0f] border border-blue-500/30 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                  placeholder={editingScheduledMessage.provider === "avanak" ? "توضیحات نمایشی (اختیاری)..." : "متن پیام را وارد کنید..."}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {editingScheduledMessage.provider === "avanak" 
                    ? "💡 این متن فقط برای نمایش در پنل استفاده می‌شود. برای ارسال از کد آوانک استفاده می‌شود."
                    : "💡 می‌توانید از \\n برای خط جدید استفاده کنید"}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <Button
                  onClick={async () => {
                    if (!editingScheduledMessage || !token) return;
                    try {
                      const response = await fetch(`${API_URL}/admin/smart-sms/scheduler-logs?category=${editingScheduledMessage.category}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (response.ok) {
                        const logs = await response.text();
                        alert(`لاگ‌های Scheduler برای ${editingScheduledMessage.category}:\n\n${logs}`);
                      } else {
                        alert("خطا در دریافت لاگ‌ها");
                      }
                    } catch (err) {
                      alert("خطا در دریافت لاگ‌ها");
                    }
                  }}
                  className="bg-teal-600/20 hover:bg-teal-600/30 border border-teal-600/30 text-cyan-200 rounded-xl px-4 py-2 flex items-center gap-2"
                  variant="secondary"
                >
                  <Eye className="h-4 w-4" />
                  لاگ‌ها
                </Button>
                <Button
                  onClick={updateScheduledMessage}
                  disabled={savingScheduledMessage}
                  className="flex-1 bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingScheduledMessage ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      ذخیره تغییرات
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setEditingScheduledMessage(null)}
                  disabled={savingScheduledMessage}
                  className="bg-[#0f0f0f] hover:bg-[#151515] border border-gray-800 text-gray-200 rounded-xl px-6 py-3"
                  variant="secondary"
                >
                  انصراف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Settings Panel Component
interface SettingsPanelProps {
  config: SystemConfig;
  apiUrl: string;
  onClose: () => void;
  onUpdateWebinar: (config: SystemConfig["webinar"]) => void;
  onUpdatePayment: (subscriptionPrice: number) => Promise<any>;
  onUpdateMelipayamak: (config: SystemConfig["melipayamak"]) => void;
  onUpdateAvanak: (config: SystemConfig["avanak"]) => void;
  onStopStream: () => void;
  saving: boolean;
  permissionsContext: UsePermissionsReturn;
  onAvanakTest?: (phone: string, messageId?: number) => Promise<void>;
  avanakTestLoading?: boolean;
}

type SettingsTab = "profile" | "webinar" | "webinar_programs" | "hls" | "melipayamak" | "avanak" | "comments" | "admin_users" | "licenses";

const SettingsPanel = ({ config: systemConfig, apiUrl, onClose, onUpdateWebinar, onUpdatePayment, onUpdateMelipayamak, onUpdateAvanak, onStopStream, saving, permissionsContext, onAvanakTest, avanakTestLoading: externalAvanakTestLoading }: SettingsPanelProps) => {
  const { hasPermission } = permissionsContext;
  const API_URL = apiUrl; // Use API_URL passed from parent
  const token = localStorage.getItem("admin_token"); // Get token for fetch calls
  const [schedulingMode, setSchedulingMode] = useState<"manual" | "appointment">("manual");
  const [webinarConfig, setWebinarConfig] = useState({
    start_hour: systemConfig.webinar?.start_hour ?? 0,
    start_minute: systemConfig.webinar?.start_minute ?? 0,
    end_hour: systemConfig.webinar?.end_hour ?? 0,
    duration_minutes: systemConfig.webinar?.duration_minutes ?? 0,
    comment_offset_seconds: systemConfig.webinar?.comment_offset_seconds ?? 0,
  });
  const [hlsGenerating, setHlsGenerating] = useState(false);
  const [hlsStatus, setHlsStatus] = useState<{ hasPreGenerated: boolean; message: string; progress?: number; status?: string } | null>(null);
  const [hlsProgress, setHlsProgress] = useState(0);
  const [shouldShowHLSFiles, setShouldShowHLSFiles] = useState(false);
  
  // HLS Files List Component
  const HLSFilesList = ({ 
    apiUrl, 
    token,
    shouldShowFiles 
  }: { 
    apiUrl: string; 
    token: string;
    shouldShowFiles?: boolean;
  }) => {
    // Always show files by default, persist in localStorage to survive auto-refresh
    const [showFiles, setShowFiles] = useState(() => {
      const saved = localStorage.getItem('hls_files_show');
      // Default to true (always show files)
      return saved === null ? true : saved === 'true';
    });
    // Auto-refresh removed - only manual refresh available
    const [files, setFiles] = useState<Array<{ name: string; size: number }>>(() => {
      const saved = localStorage.getItem('hls_files_list');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
      return [];
    });
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    // Sort files by name (natural sort for stream files)
    const sortFiles = (fileList: Array<{ name: string; size: number }>) => {
      return [...fileList].sort((a, b) => {
        // Extract numbers from filenames for proper sorting
        const getNumber = (name: string): number => {
          const match = name.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        
        // Sort .m3u8 files first, then by number
        if (a.name.endsWith('.m3u8') && !b.name.endsWith('.m3u8')) return -1;
        if (!a.name.endsWith('.m3u8') && b.name.endsWith('.m3u8')) return 1;
        
        const numA = getNumber(a.name);
        const numB = getNumber(b.name);
        
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      });
    };
    
    const fetchFiles = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/admin/config/hls/files`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const sortedFiles = sortFiles(data.files || []);
          setFiles(sortedFiles);
          // Save to localStorage for cache
          localStorage.setItem('hls_files_list', JSON.stringify(sortedFiles));
        } else {
          console.error("Failed to fetch HLS files");
          // Don't clear files on error, keep existing ones
        }
      } catch (err) {
        console.error("Error fetching HLS files:", err);
        // Don't clear files on error, keep existing ones
      } finally {
        setLoading(false);
      }
    };
    
    const deleteAllFiles = async () => {
      if (!token) return;
      
      // Confirm deletion
      if (!confirm("⚠️ آیا مطمئن هستید که می‌خواهید تمام فایل‌های HLS را حذف کنید؟\n\nاین عمل غیرقابل بازگشت است!")) {
        return;
      }
      
      setDeleting(true);
      try {
        const response = await fetch(`${apiUrl}/admin/config/hls/files`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`✅ ${data.message || `تعداد ${data.deleted_count || 0} فایل با موفقیت حذف شد`}`);
          
          // Clear cache and files list
          localStorage.removeItem('hls_files_list');
          setFiles([]);
          
          // Refresh files list to show empty state
          await fetchFiles();
        } else {
          const errorData = await response.json();
          alert(`❌ خطا در حذف فایل‌ها: ${errorData.error || "خطای ناشناخته"}`);
        }
      } catch (err) {
        console.error("Error deleting HLS files:", err);
        alert("❌ خطای شبکه در حذف فایل‌ها");
      } finally {
        setDeleting(false);
      }
    };
    
    // Load files from cache on mount (don't fetch automatically)
    useEffect(() => {
      // Only load from cache on mount - no automatic fetch
      const saved = localStorage.getItem('hls_files_list');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFiles(parsed);
          }
        } catch {
          // Invalid cache, ignore
        }
      }
      
      // Listen for HLS generation completion event to refresh files
      const handleGenerationComplete = () => {
        // Clear cache when generation completes - user can manually refresh
        localStorage.removeItem('hls_files_list');
        // Don't fetch automatically - let user click refresh button
      };
      
      window.addEventListener('hlsGenerationComplete', handleGenerationComplete);
      
      return () => {
        window.removeEventListener('hlsGenerationComplete', handleGenerationComplete);
      };
    }, []); // Only run on mount
    
    // Show files when shouldShowFiles changes to true (triggered from parent when HLS generation starts)
    useEffect(() => {
      if (shouldShowFiles && !showFiles) {
        setShowFiles(true);
        // Don't fetch automatically - user will click refresh button manually
      }
    }, [shouldShowFiles, showFiles]);
    
    // Auto-refresh removed - only manual refresh available
    
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
    };
    
    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return (
      <div className="space-y-3 mt-6 pt-6 border-t border-gray-700/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-white font-semibold text-sm sm:text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            محتویات پوشه hls_media
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchFiles()}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              disabled={loading || deleting}
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              به‌روزرسانی
            </Button>
            <Button
              onClick={deleteAllFiles}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-500/70"
              disabled={loading || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 ml-2 animate-spin" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <X className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                  حذف همه
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Always show files */}
        <div className="bg-[#0a0a0a] border border-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            {/* Show loader only if loading and no files exist yet */}
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="mr-2 text-gray-400">در حال بارگذاری...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                پوشه خالی است یا فایلی یافت نشد
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary Stats */}
                <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-gray-700/50 flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span>تعداد کل فایل‌ها: <strong className="text-gray-300">{files.length}</strong></span>
                    <span>حجم کل: <strong className="text-gray-300">{formatFileSize(totalSize)}</strong></span>
                    {loading && files.length > 0 && (
                      <span className="text-blue-400 flex items-center gap-1 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        در حال به‌روزرسانی...
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Files List - Display like `ls` command in grid format */}
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-1">
                    {files.map((file, index) => {
                      const isM3U8 = file.name.endsWith('.m3u8');
                      return (
                        <div
                          key={index}
                          className={`font-mono text-xs sm:text-sm py-1 px-2 rounded border transition-colors ${
                            isM3U8 
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-300 font-semibold hover:bg-blue-500/20" 
                              : "bg-transparent border-transparent text-gray-300 hover:bg-gray-700/30 hover:border-gray-600/30"
                          }`}
                          title={`${file.name} (${formatFileSize(file.size)})`}
                        >
                          {file.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    );
  };
  
  // Update webinar config when systemConfig.webinar changes
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
  
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(systemConfig.payment?.subscription_price || 4900000);
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>("current");
  const [thankyouDisplayTime, setThankyouDisplayTime] = useState<string>("");
  const [savingThankyouTime, setSavingThankyouTime] = useState(false);
  
  // Avanak test states (for SettingsPanel) - use external if provided, otherwise use internal
  const [internalAvanakTestLoading, setInternalAvanakTestLoading] = useState(false);
  const avanakTestLoading = (externalAvanakTestLoading !== undefined) ? externalAvanakTestLoading : internalAvanakTestLoading;
  const [showAvanakTestModal, setShowAvanakTestModal] = useState(false);
  const [avanakTestModalContent, setAvanakTestModalContent] = useState<{ title: string; body: string; status: "success" | "error" } | null>(null);
  
  // Check HLS pre-generation status
  const checkHLSStatus = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/admin/config/webinar/pre-generate-hls/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHlsStatus({
          hasPreGenerated: data.has_pre_generated || false,
          message: data.message || "",
          progress: data.progress || 0,
          status: data.status || "",
        });
        setHlsProgress(data.progress || 0);
      }
    } catch (err) {
      console.error("Failed to check HLS status:", err);
    }
  };
  
  // Check HLS status on mount and periodically
  useEffect(() => {
    checkHLSStatus();
    // If generating, check more frequently (every 2 seconds) to show progress
    // Otherwise check every 30 seconds
    const interval = setInterval(checkHLSStatus, hlsGenerating ? 2000 : 30000);
    return () => clearInterval(interval);
  }, [token, hlsGenerating]);
  
  // Define price presets - recalculate when current price changes
  const currentPrice = systemConfig.payment?.subscription_price || 4900000;
  const pricePresets = useMemo(() => [
    { id: "current", label: "قیمت فعلی", value: currentPrice },
    { id: "minus2zeros", label: "دو صفر کمتر", value: Math.floor(currentPrice / 100) },
    { id: "49000", label: "49,000 تومان", value: 49000 },
    { id: "490000", label: "490,000 تومان", value: 490000 },
    { id: "4900000", label: "4,900,000 تومان", value: 4900000 },
    { id: "9900000", label: "9,900,000 تومان", value: 9900000 },
  ], [currentPrice]);
  
  // Update subscription price when config changes - FORCE update
  useEffect(() => {
    const newPrice = systemConfig.payment?.subscription_price;
    console.log("🔄 SettingsPanel useEffect triggered");
    console.log("🔄 systemConfig.payment:", JSON.stringify(systemConfig.payment));
    console.log("🔄 New price from config:", newPrice);
    console.log("🔄 Type of newPrice:", typeof newPrice);
    
    if (newPrice !== undefined && newPrice !== null && !isNaN(newPrice) && newPrice > 0) {
      // Use functional updater to avoid needing subscriptionPrice in dependencies
      setSubscriptionPrice(prevPrice => {
        if (prevPrice !== newPrice) {
          console.log("✅ State changed from", prevPrice, "to", newPrice);
          return newPrice;
        }
        console.log("ℹ️ State already matches:", newPrice);
        return prevPrice; // Return previous value if unchanged to avoid unnecessary re-renders
      });
      
      // Update selected preset separately (NOT inside the updater function)
      // This is a separate state update that happens after subscriptionPrice is updated
      const matchingPreset = pricePresets.find(p => p.value === newPrice);
      if (matchingPreset) {
        setSelectedPricePreset(matchingPreset.id);
      } else {
        setSelectedPricePreset("current");
      }
    } else {
      console.log("⚠️ systemConfig.payment.subscription_price is invalid:", newPrice);
    }
  }, [systemConfig.payment?.subscription_price, pricePresets]); // pricePresets is memoized, so it's safe
  const [melipayamakConfig, setMelipayamakConfig] = useState(systemConfig.melipayamak);
  const [avanakConfig, setAvanakConfig] = useState(systemConfig.avanak);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  // Fetch ThankYou display time from API
  useEffect(() => {
    const fetchThankYouTime = async () => {
      try {
        const response = await fetch(`${API_URL}/webinar/info`);
        if (response.ok) {
          const data = await response.json();
          if (data.thankyou_display_time) {
            setThankyouDisplayTime(data.thankyou_display_time);
          }
        }
      } catch (err) {
        console.error("Failed to fetch ThankYou display time:", err);
      }
    };
    fetchThankYouTime();
  }, [API_URL]);

  const updateThankYouDisplayTime = async () => {
    if (!thankyouDisplayTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(thankyouDisplayTime)) {
      alert("❌ فرمت زمان نامعتبر است. لطفاً به فرمت HH:MM وارد کنید (مثال: 19:01)");
      return;
    }

    setSavingThankyouTime(true);
    try {
      const response = await fetch(`${API_URL}/admin/config/thankyou/display-time`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_time: thankyouDisplayTime }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در به‌روزرسانی زمان نمایش");
      }

      alert("✅ زمان نمایش در صفحه ThankYou با موفقیت به‌روزرسانی شد");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "خطای ناشناخته";
      alert("❌ خطا: " + errorMessage);
    } finally {
      setSavingThankyouTime(false);
    }
  };
  
  // Determine which tabs user can access
  const canManageWebinarTab = hasPermission("settings.webinar") || hasPermission("settings.edit");
  const canManageCommentsTab = hasPermission("settings.comments") || hasPermission("settings.edit");
  const canManageSMSTab = hasPermission("settings.sms") || hasPermission("sms.view");
  const canViewAvanak = hasPermission("avanak.view");
  const canViewAdminUsers = hasPermission("admin_users.view");
  const canViewLicenses = hasPermission("licenses.view");
  const canManageHLSTab = hasPermission("settings.webinar") || hasPermission("settings.edit"); // Same permission as webinar
  const canManageWebinarProgramsTab = hasPermission("settings.webinar") || hasPermission("settings.edit"); // Same permission as webinar

  const allowedTabs: SettingsTab[] = ["profile"];
  if (canManageWebinarTab) allowedTabs.push("webinar");
  if (canManageWebinarProgramsTab) allowedTabs.push("webinar_programs");
  if (canManageHLSTab) allowedTabs.push("hls");
  if (canManageSMSTab) allowedTabs.push("melipayamak");
  if (canViewAvanak) allowedTabs.push("avanak");
  if (canManageCommentsTab) allowedTabs.push("comments");
  if (canViewAdminUsers) allowedTabs.push("admin_users");
  if (canViewLicenses) allowedTabs.push("licenses");

  const allowedTabsSignature = allowedTabs.join("|");

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] ?? "profile");
    }
  }, [activeTab, allowedTabsSignature]);

  // Fetch scheduling mode on mount
  useEffect(() => {
    if (!token) return;
    const fetchSchedulingMode = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/appointment-slots/scheduling-mode`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSchedulingMode(data.mode || "manual");
      } catch (err) {
        console.error("Failed to fetch scheduling mode:", err);
      }
    };
    fetchSchedulingMode();
  }, [token, API_URL]);

  // Avanak test function (for SettingsPanel) - use external if provided, otherwise use internal
  const runAvanakTest = onAvanakTest || (async (phone: string, messageId?: number) => {
    if (!token) return;
    const phoneVal = phone.trim();
    const msgVal = messageId || avanakConfig?.message_id || 0;
    if (!phoneVal || !msgVal) {
      alert("شماره و کد آوانک را وارد کنید");
      return;
    }
    setInternalAvanakTestLoading(true);
    try {
      const payload = {
        phone: phoneVal,
        message_id: msgVal,
      };
      const response = await fetch(`${API_URL}/admin/avanak/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        const detail = data?.details || data?.error || "ارسال ناموفق بود";
        setAvanakTestModalContent({
          title: "ارسال ناموفق",
          body: `دلیل: ${detail}\nشماره: ${data?.normalized_phone || payload.phone}\nکد صوت: ${payload.message_id}`,
          status: "error",
        });
        setShowAvanakTestModal(true);
        return;
      }
      setAvanakTestModalContent({
        title: "ارسال موفق",
        body: `تماس آزمایشی با موفقیت ارسال شد.\nشماره: ${data?.normalized_phone || payload.phone}\nکد صوت: ${payload.message_id}`,
        status: "success",
      });
      setShowAvanakTestModal(true);
    } catch (err: any) {
      setAvanakTestModalContent({
        title: "خطا در ارسال",
        body: err?.message || "ارسال ناموفق بود",
        status: "error",
      });
      setShowAvanakTestModal(true);
    } finally {
      setInternalAvanakTestLoading(false);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-0 sm:p-4 animate-fadeIn" dir="rtl">
      <Card className="bg-[#0a0a0a] border border-gray-900 w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] overflow-hidden rounded-none sm:rounded-2xl animate-slideUp">
        {/* Modern Header with Gradient */}
        <CardHeader className="sticky top-0 bg-[#0f0f0f] z-10 border-b border-gray-900 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <div
              className="fp-spine flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0 ps-3"
              style={{ borderInlineStartColor: "var(--fp-glow)" }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-white text-lg sm:text-xl lg:text-2xl font-bold truncate">تنظیمات سیستم</CardTitle>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 truncate">مدیریت و پیکربندی پلتفرم</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/10 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 flex-shrink-0"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </CardHeader>
        
        <div className="overflow-y-auto max-h-[calc(100vh-100px)] sm:max-h-[calc(90vh-120px)]">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Modern Tabs — grouped into labeled sections with dividers
                instead of one flat horizontal-scrolling row of identical
                pills, so related settings sit together. */}
            <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-x-1.5 gap-y-3 sm:gap-x-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                    activeTab === "profile"
                      ? "bg-gradient-to-r from-[#187272] to-[#26fce3] text-white shadow-lg"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">پروفایل من</span>
                  <span className="sm:hidden">پروفایل</span>
                </button>
              </div>

              {(canManageWebinarTab || canManageHLSTab || canManageCommentsTab) && (
                <>
                  <span className="hidden h-8 w-px shrink-0 bg-white/10 sm:block" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {canManageWebinarTab && (
                    <button
                      onClick={() => setActiveTab("webinar")}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                        activeTab === "webinar"
                          ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">زمان‌بندی کارگاه</span>
                      <span className="sm:hidden">کارگاه</span>
                    </button>
                    )}
                    {canManageWebinarProgramsTab && (
                    <button
                      onClick={() => setActiveTab("webinar_programs")}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                        activeTab === "webinar_programs"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">چند وبیناره</span>
                      <span className="sm:hidden">وبینارها</span>
                    </button>
                    )}
                    {canManageHLSTab && (
                    <button
                      onClick={() => setActiveTab("hls")}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                        activeTab === "hls"
                          ? "bg-gradient-to-r from-[#187272] to-[#26fce3] text-white shadow-lg"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      }`}
                    >
                      <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">مدیریت HLS</span>
                      <span className="sm:hidden">HLS</span>
                    </button>
                    )}
                    {canManageCommentsTab && (
                    <button
                      onClick={() => setActiveTab("comments")}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-sm ${
                        activeTab === "comments"
                          ? "bg-gradient-to-r from-orange-600 to-pink-600 text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">مدیریت کامنت‌ها</span>
                      <span className="sm:hidden">کامنت</span>
                    </button>
                    )}
                  </div>
                </>
              )}

              {(canManageSMSTab || canViewAvanak) && (
                <>
                  <span className="hidden h-8 w-px shrink-0 bg-white/10 sm:block" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {canManageSMSTab && (
                    <button
                      onClick={() => setActiveTab("melipayamak")}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                        activeTab === "melipayamak"
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">مدیریت پیام‌های SMS</span>
                      <span className="sm:hidden">SMS</span>
                    </button>
                    )}
                    {canViewAvanak && (
                    <button
                      onClick={() => setActiveTab("avanak")}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                        activeTab === "avanak"
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      }`}
                    >
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">Avanak (تماس صوتی)</span>
                      <span className="sm:hidden">تماس</span>
                    </button>
                    )}
                  </div>
                </>
              )}

              {(hasPermission("workflow.view") || canViewAdminUsers || canViewLicenses) && (
                <>
                  <span className="hidden h-8 w-px shrink-0 bg-white/10 sm:block" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {hasPermission("workflow.view") && (
                      <button
                        onClick={() => window.location.href = '/admin/workflows'}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      >
                        <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">گردش‌کارهای اتوماسیون</span>
                        <span className="sm:hidden">Workflow</span>
                      </button>
                    )}
                    {canViewAdminUsers && (
                      <button
                        onClick={() => setActiveTab("admin_users")}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                          activeTab === "admin_users"
                            ? "bg-gradient-to-r from-[#187272] to-[#26fce3] text-white shadow-lg"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">مدیریت کاربران ادمین</span>
                        <span className="sm:hidden">کاربران</span>
                      </button>
                    )}
                    {canViewLicenses && (
                      <button
                        onClick={() => setActiveTab("licenses")}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                          activeTab === "licenses"
                            ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                        }`}
                      >
                        <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">لایسنس‌ها</span>
                        <span className="sm:hidden">لایسنس</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

          {/* User Profile */}
          {activeTab === "profile" && (
            <div className="space-y-4 animate-fadeIn">
              <UserProfile />
            </div>
          )}

          {/* Webinar Settings */}
          {activeTab === "webinar" && canManageWebinarTab && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <Card className="bg-[#0f0f0f] border border-blue-500/30 rounded-xl sm:rounded-2xl overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                    <CardTitle className="text-white font-bold text-base sm:text-lg lg:text-xl">زمان‌بندی کارگاه</CardTitle>
                </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Appointment Scheduling Manager */}
                <AppointmentSchedulingManager 
                  token={token || ""} 
                  onModeChange={(mode) => {
                    setSchedulingMode(mode);
                  }}
                />
                
                {/* Manual Settings - Only show when in manual mode */}
                {schedulingMode === "manual" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">ساعت شروع (0-23)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={webinarConfig.start_hour ?? 0}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        setWebinarConfig({ ...webinarConfig, start_hour: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-[#0a0a0a] border border-blue-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">دقیقه شروع (0-59)</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={webinarConfig.start_minute ?? 0}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        setWebinarConfig({ ...webinarConfig, start_minute: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-[#0a0a0a] border border-blue-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">ساعت پایان (0-23)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={webinarConfig.end_hour ?? 0}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        setWebinarConfig({ ...webinarConfig, end_hour: isNaN(val) ? 0 : val });
                      }}
                      className="w-full bg-[#0a0a0a] border border-blue-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">مدت زمان (دقیقه)</label>
                    <input
                      type="number"
                      value={webinarConfig.duration_minutes}
                      disabled
                      className="w-full bg-[#0a0a0a] border border-green-500/20 text-gray-400 text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 cursor-not-allowed opacity-60"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                      <span className="leading-relaxed">محاسبه خودکار بر اساس زمان شروع و پایان</span>
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Offset کامنت (ثانیه) - برای همه دستگاه‌ها</label>
                    <input
                      type="number"
                      step="0.1"
                      value={webinarConfig.comment_offset_seconds || 0}
                      onChange={(e) => setWebinarConfig({ ...webinarConfig, comment_offset_seconds: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#0a0a0a] border border-blue-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515]"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">مقدار منفی = کامنت‌ها زودتر، مثبت = کامنت‌ها دیرتر (برای همه دستگاه‌ها یکسان)</p>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3">قیمت اشتراک (تومان)</label>
                    
                    {/* Price Preset Selector */}
                    <div className="mb-3">
                      <label className="block text-gray-400 text-xs font-medium mb-1.5 sm:mb-2">انتخاب از قیمت‌های از پیش تعریف شده:</label>
                      <select
                        value={selectedPricePreset}
                        onChange={(e) => {
                          const presetId = e.target.value;
                          setSelectedPricePreset(presetId);
                          const preset = pricePresets.find(p => p.id === presetId);
                          if (preset) {
                            console.log("🔍 Selected price preset:", preset.label, "Value:", preset.value, "Type:", typeof preset.value);
                            setSubscriptionPrice(preset.value);
                          }
                        }}
                        className="w-full bg-[#0a0a0a] border border-emerald-500/30 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 hover:bg-[#151515]"
                      >
                        {pricePresets.map((preset) => (
                          <option key={preset.id} value={preset.id} className="bg-[#0a0a0a] text-white">
                            {preset.label} - {preset.value.toLocaleString('fa-IR')} تومان
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Manual Price Input */}
                    <div className="mb-3">
                      <label className="block text-gray-400 text-xs font-medium mb-1.5 sm:mb-2">یا وارد کردن قیمت دستی (تومان):</label>
                      <input
                        type="number"
                        value={subscriptionPrice}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : parseInt(value, 10);
                          if (!isNaN(numValue) && numValue >= 0) {
                            console.log("🔍 Manual price input changed:", value, "→", numValue);
                            setSubscriptionPrice(numValue);
                            setSelectedPricePreset("current"); // Reset preset when manually entering
                          }
                        }}
                        min="0"
                        step="1000"
                        className="w-full bg-[#0a0a0a] border border-emerald-500/30 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 hover:bg-[#151515]"
                        placeholder="مثال: 49000"
                      />
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        💡 قیمت را به تومان وارد کنید (بدون کاما یا نقطه)
                      </p>
                    </div>
                    
                    {/* Current Price Display */}
                    <div className="bg-[#151515] border border-emerald-500/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-3">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-gray-400 text-xs sm:text-sm">قیمت انتخاب شده:</span>
                        <span className="text-emerald-400 font-bold text-base sm:text-lg font-mono">
                          {subscriptionPrice.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700/50">
                        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                          <span className="text-gray-500">قیمت فعلی در سیستم:</span>
                          <span className="text-gray-300 font-mono">
                            {currentPrice.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
                
                {/* Price Save Button - Separate */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-700/50">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 mb-2">
                    <p className="text-xs text-blue-300 text-center leading-relaxed">
                      💡 قیمت انتخاب شده: <span className="font-bold font-mono">{subscriptionPrice.toLocaleString('fa-IR')}</span> تومان
                      {subscriptionPrice !== currentPrice && (
                        <span className="block mt-1 text-yellow-300 text-xs">
                          ⚠️ این قیمت با قیمت فعلی ({currentPrice.toLocaleString('fa-IR')} تومان) متفاوت است
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      console.log("🔍 Save price button clicked - subscriptionPrice:", subscriptionPrice, "Type:", typeof subscriptionPrice);
                      console.log("🔍 Selected preset:", selectedPricePreset);
                      console.log("🔍 systemConfig.payment:", systemConfig.payment);
                      console.log("🔍 Current price in system:", currentPrice);
                      
                      // Validate price before sending
                      if (subscriptionPrice <= 0 || isNaN(subscriptionPrice)) {
                        alert("❌ قیمت باید عددی مثبت باشد!");
                        return;
                      }
                      
                      try {
                        console.log("🔍 Calling onUpdatePayment with:", subscriptionPrice, "Type:", typeof subscriptionPrice);
                        const result = await onUpdatePayment(subscriptionPrice);
                        console.log("✅ onUpdatePayment result:", result);
                        
                        // Force refresh - parent will handle it via onUpdatePayment
                        // Just wait a bit for the update to complete
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Broadcast price change to all open pages (including AIPage)
                        window.dispatchEvent(new CustomEvent('subscriptionPriceChanged', { 
                          detail: { price: subscriptionPrice } 
                        }));
                        console.log("📢 Broadcasted subscriptionPriceChanged event from button click with price:", subscriptionPrice);
                        
                        // Update selected preset to "current" after successful save
                        setSelectedPricePreset("current");
                        
                        alert(`✅ قیمت اشتراک با موفقیت به ${subscriptionPrice.toLocaleString('fa-IR')} تومان به‌روزرسانی شد\n\n📢 تغییرات به تمام صفحات باز (از جمله درگاه پرداخت) اعمال شد.`);
                      } catch (err: any) {
                        console.error("❌ Failed to update price:", err);
                        alert("❌ خطا در به‌روزرسانی قیمت: " + (err.message || "خطای ناشناخته"));
                      }
                    }}
                    disabled={saving || subscriptionPrice === currentPrice}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        در حال ذخیره قیمت...
                      </>
                    ) : subscriptionPrice === currentPrice ? (
                      "✅ قیمت فعلی اعمال شده است"
                    ) : (
                      `💰 اعمال قیمت ${subscriptionPrice.toLocaleString('fa-IR')} تومان`
                    )}
                  </Button>
                </div>
                
                {/* ThankYou Display Time Section - Separate from webinar scheduling */}
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                  <div className="bg-gradient-to-r from-[#187272]/10 to-[#26fce3]/10 border border-teal-500/30 rounded-lg sm:rounded-xl p-4 sm:p-5 mb-4">
                    <h3 className="text-white font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-cyan-400" />
                      زمان نمایش در صفحه ThankYou
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4 leading-relaxed">
                      این زمان فقط برای نمایش در صفحه ThankYou و پاپ‌آپ اول استفاده می‌شود و مستقل از زمان‌بندی کارگاه است.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                          زمان نمایش (فرمت: HH:MM)
                        </label>
                        <input
                          type="text"
                          value={thankyouDisplayTime}
                          onChange={(e) => setThankyouDisplayTime(e.target.value)}
                          placeholder="مثال: 19:01"
                          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                          className="w-full bg-[#0a0a0a] border border-teal-500/30 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 hover:bg-[#151515]"
                        />
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          💡 این زمان در صفحه ThankYou و پاپ‌آپ اول نمایش داده می‌شود (مستقل از نوبت‌دهی و زمان‌بندی دستی)
                        </p>
                      </div>
                      <Button
                        onClick={updateThankYouDisplayTime}
                        disabled={savingThankyouTime || !thankyouDisplayTime}
                        className="w-full bg-gradient-to-r from-[#187272] via-[#2a9c96] to-[#26fce3] hover:from-[#2a9c96] hover:via-[#58cac0] hover:to-[#58cac0] text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#26fce3]/20"
                      >
                        {savingThankyouTime ? (
                          <>
                            <Loader2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : (
                          "✨ ذخیره زمان نمایش ThankYou"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Webinar Config Save Button - Separate */}
                <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={async () => {
                    try {
                      // Ensure all required fields have valid values
                      const configToSend = {
                        start_hour: Number(webinarConfig.start_hour) || 0,
                        start_minute: Number(webinarConfig.start_minute) || 0,
                        end_hour: Number(webinarConfig.end_hour) || 0,
                        duration_minutes: Number(webinarConfig.duration_minutes) || 0,
                        comment_offset_seconds: Number(webinarConfig.comment_offset_seconds) || 0,
                      };
                      console.log("📤 Sending webinar config:", configToSend);
                      await onUpdateWebinar(configToSend);
                      alert("✅ تنظیمات کارگاه با موفقیت به‌روزرسانی شد");
                    } catch (err) {
                      const errorMessage = err instanceof Error ? err.message : "خطای ناشناخته";
                      console.error("❌ Failed to update webinar config:", err);
                      alert("❌ خطا: " + errorMessage);
                    }
                  }}
                  disabled={saving}
                    className="w-full bg-gradient-to-r from-[#187272] via-[#2a9c96] to-[#26fce3] hover:from-[#2a9c96] hover:via-[#58cac0] hover:to-[#58cac0] text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    "💾 ذخیره تنظیمات کارگاه"
                  )}
                </Button>
                
                {/* Stop Stream Button */}
                <Button
                  onClick={onStopStream}
                  disabled={saving}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      در حال توقف...
                    </>
                  ) : (
                    "🛑 توقف استریم"
                  )}
                </Button>
              </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* HLS Management Tab */}
          {activeTab === "hls" && canManageHLSTab && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <Card className="bg-[#0f0f0f] border border-teal-500/30 rounded-xl sm:rounded-2xl overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#187272] to-[#2a9c96] flex items-center justify-center flex-shrink-0">
                      <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <CardTitle className="text-white font-bold text-base sm:text-lg lg:text-xl">مدیریت HLS</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {/* HLS Pre-generation Button */}
                  <Button
                    onClick={async () => {
                      if (!token) return;
                      setHlsGenerating(true);
                      try {
                        const response = await fetch(`${API_URL}/admin/config/webinar/pre-generate-hls`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || "خطا در تولید فایل‌های HLS");
                        }
                        
                        const data = await response.json();
                        alert("✅ " + (data.message || "تولید فایل‌های HLS شروع شد. این کار ممکن است چند دقیقه طول بکشد."));
                        
                        // Clear cache when generation starts (so it fetches fresh data)
                        localStorage.removeItem('hls_files_list');
                        localStorage.removeItem('hls_files_show');
                        
                        // Show files list when generation starts (but don't auto-refresh)
                        setShouldShowHLSFiles(true);
                        
                        // Start checking progress immediately and frequently
                        setHlsGenerating(true);
                        await checkHLSStatus();
                        
                        // Keep checking every 2 seconds while generating
                        const progressInterval = setInterval(async () => {
                          await checkHLSStatus();
                          // Check completion status after update
                          const currentStatus = await fetch(`${API_URL}/admin/config/webinar/pre-generate-hls/status`, {
                            headers: { Authorization: `Bearer ${token}` },
                          }).then(r => r.ok ? r.json() : null);
                          
                          if (currentStatus && (currentStatus.has_pre_generated || (currentStatus.progress >= 100))) {
                            clearInterval(progressInterval);
                            setHlsGenerating(false);
                            await checkHLSStatus(); // Final status update
                            
                            // When generation completes, clear cache and trigger refresh
                            localStorage.removeItem('hls_files_list');
                            window.dispatchEvent(new CustomEvent('hlsGenerationComplete'));
                          }
                        }, 2000);
                        
                        // Stop interval after 10 minutes (safety timeout)
                        setTimeout(() => {
                          clearInterval(progressInterval);
                          setHlsGenerating(false);
                        }, 10 * 60 * 1000);
                      } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : "خطای ناشناخته";
                        alert("❌ خطا: " + errorMessage);
                      } finally {
                        setHlsGenerating(false);
                      }
                    }}
                    disabled={hlsGenerating || saving}
                    className="w-full bg-gradient-to-r from-[#187272] to-[#2a9c96] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {hlsGenerating ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        در حال تولید...
                      </>
                    ) : (
                      "🎬 تولید فایل‌های HLS"
                    )}
                  </Button>
                  
                  {/* HLS Status and Progress */}
                  {hlsStatus && (
                    <div className="space-y-2">
                      <div className={`text-xs sm:text-sm px-3 py-2 rounded-lg ${
                        hlsStatus.hasPreGenerated 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}>
                        {hlsStatus.hasPreGenerated ? "✅ " : "⚠️ "}
                        {hlsStatus.message}
                      </div>
                      
                      {/* Progress Bar - Show when generating or has progress */}
                      {(hlsGenerating || (hlsStatus.progress && hlsStatus.progress > 0 && hlsStatus.progress < 100)) && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                            <span>پیشرفت تولید:</span>
                            <span className="font-semibold">{hlsStatus.progress || hlsProgress}%</span>
                          </div>
                          <Progress 
                            value={hlsStatus.progress || hlsProgress} 
                            className="h-2 bg-gray-800"
                          />
                          {hlsStatus.status && (
                            <div className="text-xs text-gray-500 px-1">
                              {hlsStatus.status}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* HLS Files List */}
                  <HLSFilesList 
                    apiUrl={API_URL} 
                    token={token || ""} 
                    shouldShowFiles={shouldShowHLSFiles}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Melipayamak Settings */}
          {activeTab === "melipayamak" && canManageSMSTab && (
            <div className="space-y-4">
              {/* SMS Message Manager */}
              <SMSMessageManager />
              
              {/* Basic Settings */}
              <Card className="bg-[#0f0f0f] border border-green-500/30 rounded-xl sm:rounded-2xl overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <CardTitle className="text-white font-bold text-base sm:text-lg lg:text-xl">تنظیمات پایه Melipayamak</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Username</label>
                    <input
                      type="text"
                      value={melipayamakConfig.username}
                      onChange={(e) => setMelipayamakConfig({ ...melipayamakConfig, username: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-green-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                      placeholder="989103946748"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">API Key</label>
                    <input
                      type="password"
                      value={melipayamakConfig.api_key}
                      onChange={(e) => setMelipayamakConfig({ ...melipayamakConfig, api_key: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-green-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                      placeholder="API Key"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      checked={melipayamakConfig.enabled}
                      onChange={(e) => setMelipayamakConfig({ ...melipayamakConfig, enabled: e.target.checked })}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-teal-600 flex-shrink-0"
                    />
                    <label className="text-gray-300 font-medium text-sm sm:text-base">فعال/غیرفعال</label>
                </div>
                <Button
                  onClick={() => onUpdateMelipayamak(melipayamakConfig)}
                  disabled={saving}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                        <Loader2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                      "💾 ذخیره تنظیمات پایه"
                  )}
                </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Avanak Settings */}
          {activeTab === "avanak" && canViewAvanak && (
            <div className="space-y-4">
              {/* Avanak Message Manager */}
              <AvanakMessageManager />
              
              {/* Basic Settings */}
              <Card className="bg-[#0f0f0f] border border-cyan-500/30 rounded-xl sm:rounded-2xl overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <CardTitle className="text-white font-bold text-base sm:text-lg lg:text-xl">تنظیمات Avanak (تماس صوتی)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Token</label>
                    <input
                      type="password"
                      value={avanakConfig.token}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, token: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-cyan-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-[#151515]"
                      placeholder="Token"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Message ID (کد فایل صوتی)</label>
                    <input
                      type="number"
                      value={avanakConfig.message_id}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, message_id: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0a0a0a] border border-cyan-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-[#151515]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Base URL</label>
                    <input
                      type="text"
                      value={avanakConfig.base_url}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, base_url: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-cyan-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-[#151515]"
                      placeholder="https://portal.avanak.ir/Rest/QuickSend"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      checked={avanakConfig.enabled}
                      onChange={(e) => setAvanakConfig({ ...avanakConfig, enabled: e.target.checked })}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded accent-cyan-600 flex-shrink-0"
                    />
                    <label className="text-gray-300 font-medium text-sm sm:text-base">فعال/غیرفعال</label>
                </div>
                <Button
                  onClick={() => onUpdateAvanak(avanakConfig)}
                  disabled={saving}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                        <Loader2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                      "💾 ذخیره تنظیمات Avanak"
                  )}
                </Button>

                  {/* Quick Test */}
                  <AvanakQuickTestBox
                    defaultMessageId={avanakConfig.message_id}
                    loading={avanakTestLoading}
                    onSend={(phone, mid) => runAvanakTest(phone, mid)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comments Management */}
          {activeTab === "comments" && canManageCommentsTab && (
            <div className="space-y-4">
              <TimedCommentsManager token={localStorage.getItem("admin_token") || ""} />
            </div>
          )}

          {/* Multi-webinar Program Management */}
          {activeTab === "webinar_programs" && canManageWebinarProgramsTab && (
            <div className="space-y-4">
              <WebinarProgramsManager token={localStorage.getItem("admin_token") || ""} />
            </div>
          )}

          {/* Admin Users Management */}
          {activeTab === "admin_users" && canViewAdminUsers && (
            <div className="space-y-4">
              <AdminUsersManager />
            </div>
          )}

          {activeTab === "licenses" && canViewLicenses && (
            <div className="space-y-4">
              <LicenseManager />
            </div>
          )}
        </CardContent>
        </div>
      </Card>

      {/* Avanak Test Result Modal */}
      <Dialog open={showAvanakTestModal} onOpenChange={(open) => setShowAvanakTestModal(open)}>
        <DialogContent className="max-w-xl bg-[#0a0a0a] border border-cyan-600/30 rounded-2xl overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${avanakTestModalContent?.status === "success" ? "text-emerald-300" : "text-red-300"}`}>
              {avanakTestModalContent?.title || "نتیجه تست آوانک"}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm whitespace-pre-line">
              {avanakTestModalContent?.body || "بدون جزئیات"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowAvanakTestModal(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
