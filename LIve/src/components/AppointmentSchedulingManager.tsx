import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Calendar, Clock, Plus, Edit2, Trash2, CheckCircle2, XCircle, Users, Eye, ShoppingCart, UserCheck, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { config } from "@/config/environment";
import { formatJalali, getJalaliDate, getJalaliDayName, getJalaliMonthName, toPersianDigits } from "@/utils/jalali";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface AppointmentSlot {
  id: number;
  persian_year: number;
  persian_month: number;
  persian_day: number;
  start_date_time: string;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  comment_offset: number;
  is_completed: boolean;
}

interface SlotUser {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  registered_at: string;
  has_watched: boolean;
  first_join_at?: string;
  total_watch_seconds: number;
  purchase_status: string;
  license_code?: string;
}

interface SlotStats {
  total_users: number;
  watched_count: number;
  not_watched_count: number;
  purchase_count: number;
  full_purchase_count: number;
  installment_purchase_count: number;
  no_purchase_count: number;
}

interface SlotStatsResponse {
  slot: AppointmentSlot;
  stats: SlotStats & {
    actual_attendees_count?: number;
  };
  users: SlotUser[];
  actual_attendees?: SlotUser[];
  time_range: {
    start_time: string;
    end_time: string;
    registration_window?: {
      start: string;
      end: string;
    };
  };
}

interface MinutePresenceData {
  minute: number;
  count: number;
}

interface SlotPresenceResponse {
  slot: AppointmentSlot;
  minute_data: MinutePresenceData[];
  duration_minutes: number;
  time_range: {
    start_time: string;
    end_time: string;
  };
}

interface AppointmentSchedulingManagerProps {
  token: string;
  onModeChange?: (mode: "manual" | "appointment") => void;
}

const AppointmentSchedulingManager = ({ token, onModeChange }: AppointmentSchedulingManagerProps) => {
  const [schedulingMode, setSchedulingMode] = useState<"manual" | "appointment">("manual");
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AppointmentSlot | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentViewYear, setCurrentViewYear] = useState<number | null>(null);
  const [currentViewMonth, setCurrentViewMonth] = useState<number | null>(null);
  const [createFormData, setCreateFormData] = useState({
    persian_year: 0,
    persian_month: 0,
    start_hour: 19,
    start_minute: 52,
  });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [slotStats, setSlotStats] = useState<SlotStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [presenceData, setPresenceData] = useState<SlotPresenceResponse | null>(null);
  const [loadingPresence, setLoadingPresence] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [fixingDateTime, setFixingDateTime] = useState(false);
  const [showCreateSlotsDialog, setShowCreateSlotsDialog] = useState(false);
  const [pendingModeChange, setPendingModeChange] = useState<"manual" | "appointment" | null>(null);
  const [createSlotsDialogData, setCreateSlotsDialogData] = useState<{
    persian_year: number;
    persian_month: number;
    error_type: "no_slots_for_month" | "no_slot_for_today";
  } | null>(null);

  const checkSystemStatus = async () => {
    setCheckingStatus(true);
    try {
      // Check scheduling mode
      const modeResponse = await fetch(`${API_URL}/admin/appointment-slots/scheduling-mode`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!modeResponse.ok) {
        throw new Error(`Failed to fetch scheduling mode: ${modeResponse.status} ${modeResponse.statusText}`);
      }
      
      const modeText = await modeResponse.text();
      let modeData;
      try {
        modeData = JSON.parse(modeText);
      } catch (e) {
        console.error("Failed to parse mode response:", modeText);
        throw new Error(`Invalid JSON from scheduling mode endpoint: ${modeText.substring(0, 100)}`);
      }
      
      // Check today's slot
      const slotResponse = await fetch(`${API_URL}/admin/appointment-slots/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!slotResponse.ok) {
        throw new Error(`Failed to fetch today's slot: ${slotResponse.status} ${slotResponse.statusText}`);
      }
      
      const slotText = await slotResponse.text();
      let slotData;
      try {
        slotData = JSON.parse(slotText);
      } catch (e) {
        console.error("Failed to parse slot response:", slotText);
        throw new Error(`Invalid JSON from today slot endpoint: ${slotText.substring(0, 100)}`);
      }
      
      // Also check all slots to see what exists in database
      const allSlotsResponse = await fetch(`${API_URL}/admin/appointment-slots/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let allSlotsData: any = null;
      if (allSlotsResponse.ok) {
        const allSlotsText = await allSlotsResponse.text();
        try {
          allSlotsData = JSON.parse(allSlotsText);
        } catch (e) {
          console.warn("Failed to parse all slots response:", allSlotsText.substring(0, 100));
        }
      }
      
      // Check webinar info (public endpoint - no auth needed)
      // Use /api/webinar (not /webinar/info)
      const webinarResponse = await fetch(`${API_URL}/webinar`, {
        // No auth header - this is a public endpoint
        method: 'GET',
      });
      
      let webinarData: any = null;
      if (webinarResponse.ok) {
        const webinarText = await webinarResponse.text();
        try {
          webinarData = JSON.parse(webinarText);
        } catch (e) {
          console.warn("Failed to parse webinar response:", webinarText.substring(0, 100));
          // Don't throw - webinar info is optional
        }
      } else {
        console.warn(`Webinar info endpoint returned ${webinarResponse.status}`);
      }
      
      setDebugInfo({
        scheduling_mode: modeData.mode,
        today_slot: slotData,
        all_slots: allSlotsData,
        webinar_info: webinarData ? {
          start_time: webinarData.start_time,
          end_time: webinarData.end_time,
          scheduling_mode: webinarData.scheduling_mode,
        } : null,
        timestamp: new Date().toISOString(),
      });
      
      console.log("🔍 System Status Check:", {
        scheduling_mode: modeData.mode,
        today_slot: slotData,
        all_slots: allSlotsData,
        webinar_info: webinarData,
      });
      
      // Show alert with summary
      if (modeData.mode === "appointment") {
        if (slotData.found || slotData.non_completed_found || slotData.found_by_datetime) {
          const startTime = slotData.start_time || slotData.slot?.start_date_time || "نامشخص";
          const foundMethod = slotData.found_by_datetime ? " (پیدا شده با StartDateTime)" : "";
          alert(`✅ حالت نوبت‌دهی فعال است\n✅ نوبت امروز پیدا شد${foundMethod}\n📅 زمان شروع: ${startTime}\n\nجزئیات کامل در console نمایش داده شده است.`);
        } else {
          const allSlotsCount = allSlotsData?.count || 0;
          const yearMonthSummary = allSlotsData?.year_month_summary || {};
          let summaryText = "";
          if (Object.keys(yearMonthSummary).length > 0) {
            summaryText = "\n\nنوبت‌های موجود در دیتابیس:\n" + Object.entries(yearMonthSummary).map(([key, count]) => `  ${key}: ${count} نوبت`).join("\n");
          }
          alert(`⚠️ حالت نوبت‌دهی فعال است اما نوبت امروز پیدا نشد!\n\nتعداد کل نوبت‌های امروز: ${slotData.all_slots_count || 0}\nتعداد کل نوبت‌های ماه: ${slotData.month_slots_count || 0}\nتعداد کل نوبت‌ها در دیتابیس: ${allSlotsCount}${summaryText}\n\nلطفاً نوبت‌های این ماه را ایجاد کنید.\n\nجزئیات کامل در console نمایش داده شده است.`);
        }
      } else {
        alert(`ℹ️ حالت تنظیم دستی فعال است\n\nجزئیات کامل در console نمایش داده شده است.`);
      }
    } catch (err: any) {
      console.error("Failed to check system status:", err);
      const errorMessage = err?.message || "خطای ناشناخته";
      alert(`خطا در بررسی وضعیت سیستم:\n\n${errorMessage}\n\nلطفاً console را بررسی کنید.`);
    } finally {
      setCheckingStatus(false);
    }
  };

  const API_URL = config.API_BASE_URL;

  // Helper function to check if a slot is today (current appointment)
  const isSlotToday = (slot: AppointmentSlot): boolean => {
    const now = dayjs().tz("Asia/Tehran");
    const jalaliNow = getJalaliDate(now.toDate());
    if (!jalaliNow) return false;
    
    return (
      slot.persian_year === jalaliNow.year &&
      slot.persian_month === jalaliNow.month &&
      slot.persian_day === jalaliNow.day
    );
  };
  
  // Helper function to check if a slot is currently active (within stream window)
  const isSlotActive = (slot: AppointmentSlot): boolean => {
    if (!isSlotToday(slot)) return false;
    if (slot.is_completed) return false;
    
    const nowIran = dayjs().tz("Asia/Tehran");
    const jalaliNow = getJalaliDate(nowIran.toDate());
    if (!jalaliNow) return false;
    
    // Construct start time directly from today's date and slot's hour/minute
    // This is more reliable than parsing start_date_time
    const startTime = nowIran
      .hour(slot.start_hour)
      .minute(slot.start_minute)
      .second(0)
      .millisecond(0);
    
    // Calculate end time: start time + 1 hour 42 minutes (102 minutes)
    const endTime = startTime.add(1, 'hour').add(42, 'minute');
    
    // Slot is active if current time is between start and end time (inclusive of start, exclusive of end)
    const isAfterStart = nowIran.isAfter(startTime) || nowIran.isSame(startTime, 'minute');
    const isBeforeEnd = nowIran.isBefore(endTime);
    
    const isActive = isAfterStart && isBeforeEnd;
    
    // Debug logging for today's slot
    if (isSlotToday(slot)) {
      console.log(`🔍 Slot ${slot.persian_day} - Active check (direct):`, {
        now: nowIran.format("YYYY-MM-DD HH:mm:ss"),
        start: startTime.format("YYYY-MM-DD HH:mm:ss"),
        end: endTime.format("YYYY-MM-DD HH:mm:ss"),
        isAfterStart,
        isBeforeEnd,
        isActive,
        timeDiff: nowIran.diff(startTime, 'minute'),
        timeToEnd: endTime.diff(nowIran, 'minute'),
      });
    }
    
    return isActive;
  };

  // Helper function to check if a slot is past (completed or date passed)
  const isSlotPast = (slot: AppointmentSlot): boolean => {
    if (slot.is_completed) return true;
    
    const now = new Date();
    const jalaliNow = getJalaliDate(now);
    if (!jalaliNow) return false;
    
    // Compare dates: if slot date is before today, it's past
    if (slot.persian_year < jalaliNow.year) return true;
    if (slot.persian_year === jalaliNow.year && slot.persian_month < jalaliNow.month) return true;
    if (
      slot.persian_year === jalaliNow.year &&
      slot.persian_month === jalaliNow.month &&
      slot.persian_day < jalaliNow.day
    ) return true;
    
    // If it's today, check if the END time has passed (not start time)
    // A slot is "past" only if the stream window has completely ended
    // Stream duration is 1 hour 42 minutes (102 minutes) from start time
    if (isSlotToday(slot)) {
      const nowIran = dayjs().tz("Asia/Tehran");
      const jalaliNow = getJalaliDate(nowIran.toDate());
      if (!jalaliNow) return false;
      
      // Construct start time directly from today's date and slot's hour/minute
      const startTime = nowIran
        .hour(slot.start_hour)
        .minute(slot.start_minute)
        .second(0)
        .millisecond(0);
      
      // Calculate end time: start time + 1 hour 42 minutes
      const endTime = startTime.add(1, 'hour').add(42, 'minute');
      
      // Slot is past only if end time has passed
      if (nowIran.isAfter(endTime) || nowIran.isSame(endTime, 'minute')) {
        return true;
      }
      
      // If we're before start time, it's not past (it's future)
      // If we're between start and end time, it's current (not past)
      return false;
    }
    
    return false;
  };

  // Get current Persian date and restore saved view
  useEffect(() => {
    const now = new Date();
    const jalali = getJalaliDate(now);
    if (jalali) {
      setCreateFormData(prev => ({
        ...prev,
        persian_year: jalali.year,
        persian_month: jalali.month,
      }));
    }
    
    // Restore saved view from localStorage
    const savedYear = localStorage.getItem('appointment_view_year');
    const savedMonth = localStorage.getItem('appointment_view_month');
    if (savedYear && savedMonth) {
      const year = parseInt(savedYear, 10);
      const month = parseInt(savedMonth, 10);
      setCurrentViewYear(year);
      setCurrentViewMonth(month);
    }
  }, []);

  // Fetch scheduling mode
  useEffect(() => {
    fetchSchedulingMode();
  }, []);

  // Fetch slots when in appointment mode
  useEffect(() => {
    if (schedulingMode === "appointment") {
      // First try to restore from localStorage
      const savedYear = localStorage.getItem('appointment_view_year');
      const savedMonth = localStorage.getItem('appointment_view_month');
      
      if (savedYear && savedMonth) {
        const year = parseInt(savedYear, 10);
        const month = parseInt(savedMonth, 10);
        setCurrentViewYear(year);
        setCurrentViewMonth(month);
        fetchSlotsForMonth(year, month);
      } else if (currentViewYear && currentViewMonth) {
        // If we have state but no localStorage, use state
        fetchSlotsForMonth(currentViewYear, currentViewMonth);
      } else {
        // Otherwise fetch current month
        fetchCurrentMonthSlots();
      }
    }
  }, [schedulingMode]);

  const fetchSchedulingMode = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/appointment-slots/scheduling-mode`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const mode = data.mode || "manual";
      setSchedulingMode(mode);
      if (onModeChange) {
        onModeChange(mode);
      }
      // If mode is appointment, fetch slots (using localStorage if available)
      if (mode === "appointment") {
        const savedYear = localStorage.getItem('appointment_view_year');
        const savedMonth = localStorage.getItem('appointment_view_month');
        
        if (savedYear && savedMonth) {
          const year = parseInt(savedYear, 10);
          const month = parseInt(savedMonth, 10);
          setCurrentViewYear(year);
          setCurrentViewMonth(month);
          fetchSlotsForMonth(year, month);
        } else {
          fetchCurrentMonthSlots();
        }
      }
    } catch (err) {
      console.error("Failed to fetch scheduling mode:", err);
    }
  };

  const updateSchedulingMode = async (mode: "manual" | "appointment") => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/appointment-slots/scheduling-mode`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: responseText || "خطای ناشناخته" };
      }

      if (response.ok) {
        setSchedulingMode(mode);
        if (onModeChange) {
          onModeChange(mode);
        }
        if (mode === "appointment") {
          // Try to restore from localStorage first
          const savedYear = localStorage.getItem('appointment_view_year');
          const savedMonth = localStorage.getItem('appointment_view_month');
          
          if (savedYear && savedMonth) {
            const year = parseInt(savedYear, 10);
            const month = parseInt(savedMonth, 10);
            setCurrentViewYear(year);
            setCurrentViewMonth(month);
            fetchSlotsForMonth(year, month);
          } else {
            fetchCurrentMonthSlots();
          }
        }
      } else {
        // Handle validation errors from backend
        if (responseData.error === "no_slots_for_month" || responseData.error === "no_slot_for_today") {
          // Show dialog to create slots instead of just alert
          const now = dayjs().tz("Asia/Tehran");
          const jalaliNow = getJalaliDate(now.toDate());
          
          // Set dialog data with the month that needs slots
          setCreateSlotsDialogData({
            persian_year: responseData.persian_year || (jalaliNow?.year || 1403),
            persian_month: responseData.persian_month || (jalaliNow?.month || 1),
            error_type: responseData.error,
          });
          
          // Pre-fill form with current month data
          setCreateFormData(prev => ({
            ...prev,
            persian_year: responseData.persian_year || (jalaliNow?.year || 1403),
            persian_month: responseData.persian_month || (jalaliNow?.month || 1),
          }));
          
          // Store pending mode change to retry after creating slots
          setPendingModeChange(mode);
          
          // Show the create slots dialog
          setShowCreateSlotsDialog(true);
          
          console.log("📋 Showing create slots dialog for:", {
            year: responseData.persian_year || jalaliNow?.year,
            month: responseData.persian_month || jalaliNow?.month,
            error_type: responseData.error,
          });
        } else {
          const errorMsg = responseData.message || responseData.error || "خطا در تغییر حالت زمان‌بندی";
          alert(`❌ ${errorMsg}`);
        }
        console.error("Failed to update scheduling mode:", responseData);
      }
    } catch (err: any) {
      console.error("Failed to update scheduling mode:", err);
      alert(`❌ خطا در تغییر حالت زمان‌بندی: ${err.message || "خطای اتصال به سرور"}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMonthSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/appointment-slots/current-month`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("📅 Fetched slots:", data);
      setSlots(data.slots || []);
      
      // CRITICAL: Check if no slots exist and we're in appointment mode
      if (schedulingMode === "appointment" && (!data.slots || data.slots.length === 0)) {
        const now = dayjs().tz("Asia/Tehran");
        const jalaliNow = getJalaliDate(now.toDate());
        alert(`⚠️ هشدار:\n\nهیچ نوبتی برای ماه ${jalaliNow ? `${jalaliNow.year}/${jalaliNow.month}` : 'جاری'} یافت نشد.\n\nلطفاً نوبت‌های این ماه را ایجاد کنید تا استریم بتواند شروع شود.`);
      }
      
      // Save the current view year/month
      if (data.persian_year && data.persian_month) {
        setCurrentViewYear(data.persian_year);
        setCurrentViewMonth(data.persian_month);
        // Also save to localStorage for persistence across page refreshes
        localStorage.setItem('appointment_view_year', data.persian_year.toString());
        localStorage.setItem('appointment_view_month', data.persian_month.toString());
      }
    } catch (err) {
      console.error("Failed to fetch slots:", err);
      setSlots([]);
      // Show error if in appointment mode
      if (schedulingMode === "appointment") {
        alert("❌ خطا در دریافت نوبت‌ها. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotsForMonth = async (year: number, month: number) => {
    setLoading(true);
    try {
      console.log(`🔍 fetchSlotsForMonth - Requesting slots for Persian year=${year}, month=${month}`);
      const now = dayjs().tz("Asia/Tehran");
      const jalaliNow = getJalaliDate(now.toDate());
      console.log(`🔍 fetchSlotsForMonth - Current time (Iran TZ): ${now.format("YYYY-MM-DD HH:mm:ss")}, Current Persian date: ${jalaliNow ? `${jalaliNow.year}/${jalaliNow.month}/${jalaliNow.day}` : "N/A"}`);
      
      const response = await fetch(`${API_URL}/admin/appointment-slots?persian_year=${year}&persian_month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("📅 fetchSlotsForMonth - Response received:", {
        slotsCount: data.slots?.length || 0,
        slots: data.slots,
        requestedYear: year,
        requestedMonth: month,
      });
      setSlots(data.slots || []);
      
      // CRITICAL: Check if this is the current month and no slots exist (and we're in appointment mode)
      if (schedulingMode === "appointment" && jalaliNow && 
          year === jalaliNow.year && month === jalaliNow.month && 
          (!data.slots || data.slots.length === 0)) {
        alert(`⚠️ هشدار:\n\nهیچ نوبتی برای ماه جاری (${year}/${month}) یافت نشد.\n\nلطفاً نوبت‌های این ماه را ایجاد کنید تا استریم بتواند شروع شود.`);
      }
      
      // Save the current view year/month so we can restore it after refresh
      setCurrentViewYear(year);
      setCurrentViewMonth(month);
      // Also save to localStorage for persistence across page refreshes
      localStorage.setItem('appointment_view_year', year.toString());
      localStorage.setItem('appointment_view_month', month.toString());
    } catch (err) {
      console.error("❌ fetchSlotsForMonth - Failed to fetch slots for month:", err);
      setSlots([]);
      // Show error if in appointment mode and this is current month
      const now = dayjs().tz("Asia/Tehran");
      const jalaliNow = getJalaliDate(now.toDate());
      if (schedulingMode === "appointment" && jalaliNow && year === jalaliNow.year && month === jalaliNow.month) {
        alert("❌ خطا در دریافت نوبت‌ها. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      setLoading(false);
    }
  };

  const createSlotsForMonth = async () => {
    if (!createFormData.persian_year || !createFormData.persian_month) {
      alert("لطفاً سال و ماه را انتخاب کنید");
      return;
    }

    setCreating(true);
    try {
      const requestBody = {
        persian_year: createFormData.persian_year,
        persian_month: createFormData.persian_month,
        start_hour: createFormData.start_hour,
        start_minute: createFormData.start_minute,
      };
      console.log("🔍 createSlotsForMonth - Request body:", requestBody);
      const now = dayjs().tz("Asia/Tehran");
      const jalaliNow = getJalaliDate(now.toDate());
      console.log(`🔍 createSlotsForMonth - Current time (Iran TZ): ${now.format("YYYY-MM-DD HH:mm:ss")}, Current Persian date: ${jalaliNow ? `${jalaliNow.year}/${jalaliNow.month}/${jalaliNow.day}` : "N/A"}`);
      
      const response = await fetch(`${API_URL}/admin/appointment-slots/create-month`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ createSlotsForMonth - Response received:", result);
        console.log(`📅 Created slots for year ${result.year}, month ${result.month}, verified count: ${result.verified_count || result.count}`);
        
        // Use the year and month from the response (not from form data which might be stale)
        const createdYear = result.year;
        const createdMonth = result.month;
        
        // Close form/dialog first
        setShowCreateForm(false);
        setShowCreateSlotsDialog(false);
        
        // Fetch slots for the month we just created (not current month)
        console.log(`🔄 Fetching slots for year ${createdYear}, month ${createdMonth}`);
        
        // Wait a bit for DB to be fully updated, then fetch
        setTimeout(async () => {
          await fetchSlotsForMonth(createdYear, createdMonth);
          
          // CRITICAL: If there was a pending mode change, retry it now
          if (pendingModeChange === "appointment") {
            console.log("🔄 Retrying mode change to appointment after creating slots...");
            const pendingMode = pendingModeChange;
            setPendingModeChange(null);
            // Retry the mode change
            await updateSchedulingMode(pendingMode);
          } else {
            // Show success message after fetch
            alert(`✅ نوبت‌های ماه با موفقیت ایجاد شدند (${result.count || 30} نوبت)`);
          }
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error("❌ createSlotsForMonth - Failed to create slots - Response status:", response.status);
        console.error("❌ createSlotsForMonth - Response body:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "خطای ناشناخته" };
        }
        alert(`❌ خطا در ایجاد نوبت‌ها: ${errorData.error || "خطای ناشناخته"}`);
      }
    } catch (err: any) {
      console.error("❌ createSlotsForMonth - Exception:", err);
      alert(`❌ خطا در ایجاد نوبت‌ها: ${err.message || "خطای ناشناخته"}`);
    } finally {
      setCreating(false);
    }
  };

  const fixSlotsStartDateTime = async () => {
    if (!confirm("⚠️ آیا مطمئن هستید که می‌خواهید تاریخ StartDateTime تمام نوبت‌ها را اصلاح کنید؟\n\nاین عمل تاریخ تمام نوبت‌ها را با فرمول جدید دوباره محاسبه می‌کند.")) {
      return;
    }

    setFixingDateTime(true);
    try {
      console.log("🔧 fixSlotsStartDateTime - Requesting to fix StartDateTime for all appointment slots");
      
      const response = await fetch(`${API_URL}/admin/appointment-slots/fix-start-datetime`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ fixSlotsStartDateTime - Response received:", result);
        console.log(`🔧 Fixed ${result.fixed_count || 0} slots, ${result.already_correct || 0} already correct, ${result.error_count || 0} errors`);
        
        // Refresh slots after fixing
        if (currentViewYear && currentViewMonth) {
          await fetchSlotsForMonth(currentViewYear, currentViewMonth);
        } else {
          await fetchCurrentMonthSlots();
        }
        
        alert(`✅ تاریخ نوبت‌ها با موفقیت اصلاح شد\n\nاصلاح شده: ${result.fixed_count || 0}\nقبلاً درست بود: ${result.already_correct || 0}\nخطا: ${result.error_count || 0}`);
      } else {
        const errorText = await response.text();
        console.error("❌ fixSlotsStartDateTime - Failed to fix slots - Response status:", response.status);
        console.error("❌ fixSlotsStartDateTime - Response body:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "خطای ناشناخته" };
        }
        alert(`❌ خطا در اصلاح تاریخ نوبت‌ها: ${errorData.error || "خطای ناشناخته"}`);
      }
    } catch (err: any) {
      console.error("❌ fixSlotsStartDateTime - Exception:", err);
      alert(`❌ خطا در اصلاح تاریخ نوبت‌ها: ${err.message || "خطای ناشناخته"}`);
    } finally {
      setFixingDateTime(false);
    }
  };

  const deleteAllSlots = async () => {
    if (!confirm("⚠️ آیا مطمئن هستید که می‌خواهید تمام نوبت‌های موجود در دیتابیس را حذف کنید؟\n\nاین عمل قابل بازگشت نیست!")) {
      return;
    }

    setLoading(true);
    try {
      console.log("🗑️ deleteAllSlots - Requesting to delete ALL appointment slots");
      const now = dayjs().tz("Asia/Tehran");
      const jalaliNow = getJalaliDate(now.toDate());
      console.log(`🔍 deleteAllSlots - Current time (Iran TZ): ${now.format("YYYY-MM-DD HH:mm:ss")}, Current Persian date: ${jalaliNow ? `${jalaliNow.year}/${jalaliNow.month}/${jalaliNow.day}` : "N/A"}`);
      
      const response = await fetch(`${API_URL}/admin/appointment-slots/all`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ deleteAllSlots - Response received:", result);
        console.log(`🗑️ Deleted ${result.count || 0} appointment slots`);
        
        // Clear current slots
        setSlots([]);
        setCurrentViewYear(null);
        setCurrentViewMonth(null);
        
        alert(`✅ تمام نوبت‌ها با موفقیت حذف شدند (${result.count || 0} نوبت)`);
      } else {
        const errorText = await response.text();
        console.error("❌ deleteAllSlots - Failed to delete slots - Response status:", response.status);
        console.error("❌ deleteAllSlots - Response body:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "خطای ناشناخته" };
        }
        alert(`❌ خطا در حذف نوبت‌ها: ${errorData.error || "خطای ناشناخته"}`);
      }
    } catch (err: any) {
      console.error("❌ deleteAllSlots - Exception:", err);
      alert(`❌ خطا در حذف نوبت‌ها: ${err.message || "خطای ناشناخته"}`);
    } finally {
      setLoading(false);
    }
  };

  const updateSlotTime = async (slotId: number, startHour: number, startMinute: number) => {
    try {
      console.log(`📤 Updating slot ${slotId} with time ${startHour}:${startMinute}`);
      const response = await fetch(`${API_URL}/admin/appointment-slots/${slotId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_hour: startHour,
          start_minute: startMinute,
        }),
      });

      const responseText = await response.text();
      console.log(`📥 Response status: ${response.status}, body:`, responseText);

      if (response.ok) {
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log("✅ Slot updated successfully:", responseData);
        } catch (e) {
          console.error("❌ Failed to parse response:", e);
        }

        // Show success message
        alert("✅ زمان نوبت با موفقیت به‌روزرسانی شد");

        // After updating a slot, refetch the current view (not necessarily current month)
        const savedYear = localStorage.getItem('appointment_view_year');
        const savedMonth = localStorage.getItem('appointment_view_month');
        
        if (savedYear && savedMonth) {
          const year = parseInt(savedYear, 10);
          const month = parseInt(savedMonth, 10);
          console.log(`🔄 Refetching slots for year ${year}, month ${month}`);
          await fetchSlotsForMonth(year, month);
        } else if (currentViewYear && currentViewMonth) {
          console.log(`🔄 Refetching slots for year ${currentViewYear}, month ${currentViewMonth}`);
          await fetchSlotsForMonth(currentViewYear, currentViewMonth);
        } else {
          console.log(`🔄 Refetching current month slots`);
          await fetchCurrentMonthSlots();
        }
        setEditingSlot(null);
      } else {
        let errorMessage = "خطا در به‌روزرسانی نوبت";
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use default message
        }
        console.error("❌ Failed to update slot:", response.status, errorMessage);
        alert(`❌ ${errorMessage}`);
      }
    } catch (err) {
      console.error("❌ Failed to update slot:", err);
      alert("خطا در به‌روزرسانی نوبت");
    }
  };

  const fetchSlotStats = async (slot: AppointmentSlot) => {
    setLoadingStats(true);
    setLoadingPresence(true);
    setSelectedSlot(slot);
    setShowStatsModal(true);
    
    try {
      // Fetch stats
      const statsResponse = await fetch(`${API_URL}/admin/appointment-slots/${slot.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!statsResponse.ok) {
        throw new Error(`HTTP error! status: ${statsResponse.status}`);
      }
      
      const statsData: SlotStatsResponse = await statsResponse.json();
      setSlotStats(statsData);

      // Fetch presence data
      const presenceResponse = await fetch(`${API_URL}/admin/appointment-slots/${slot.id}/presence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (presenceResponse.ok) {
        const presenceData: SlotPresenceResponse = await presenceResponse.json();
        setPresenceData(presenceData);
      }
    } catch (err) {
      console.error("Failed to fetch slot stats:", err);
      alert("خطا در دریافت آمار نوبت");
      setShowStatsModal(false);
    } finally {
      setLoadingStats(false);
      setLoadingPresence(false);
    }
  };

  const now = new Date();
  const currentJalali = getJalaliDate(now);

  return (
    <div className="space-y-4 mb-6">
      {/* Mode Toggle */}
      <Card className="bg-[#0f0f0f] border border-blue-500/30 rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg sm:text-xl font-bold">نوع زمان‌بندی</CardTitle>
            <Button
              onClick={checkSystemStatus}
              disabled={checkingStatus}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
              title="بررسی وضعیت سیستم و اطمینان از فعال بودن حالت نوبت‌دهی"
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  بررسی وضعیت
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            <Button
              onClick={() => updateSchedulingMode("manual")}
              disabled={loading || schedulingMode === "manual"}
              className={`flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all ${
                schedulingMode === "manual"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  : "bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 border border-gray-700"
              }`}
            >
              تنظیم دستی
            </Button>
            <Button
              onClick={() => updateSchedulingMode("appointment")}
              disabled={loading || schedulingMode === "appointment"}
              className={`flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all ${
                schedulingMode === "appointment"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  : "bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 border border-gray-700"
              }`}
            >
              تنظیم بر اساس نوبت‌دهی
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            حالت فعلی: <span className="font-semibold text-blue-400">{schedulingMode === "manual" ? "تنظیم دستی" : "نوبت‌دهی"}</span>
          </p>
          {debugInfo && (
            <div className="mt-4 p-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-xs">
              <div className="text-gray-300 mb-2 font-semibold">📊 وضعیت سیستم:</div>
              <div className="text-gray-400 space-y-1">
                <div>حالت: <span className="text-blue-400">{debugInfo.scheduling_mode}</span></div>
                {debugInfo.today_slot?.found || debugInfo.today_slot?.found_by_datetime ? (
                  <div className="text-green-400">
                    ✅ نوبت امروز پیدا شد
                    {debugInfo.today_slot?.found_by_datetime && (
                      <span className="text-yellow-400 text-xs block mt-1">
                        (پیدا شده با StartDateTime - ممکن است تاریخ شمسی مطابقت نداشته باشد)
                      </span>
                    )}
                    {debugInfo.today_slot?.slot?.id && (
                      <span className="block mt-1">ID: {debugInfo.today_slot.slot.id}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-red-400">
                    ❌ نوبت امروز پیدا نشد (تعداد کل: {debugInfo.today_slot?.all_slots_count || 0})
                    {debugInfo.today_slot?.month_slots_count !== undefined && (
                      <span className="block mt-1 text-xs">
                        تعداد کل نوبت‌های ماه: {debugInfo.today_slot.month_slots_count}
                      </span>
                    )}
                    {debugInfo.all_slots?.count !== undefined && (
                      <span className="block mt-1 text-xs">
                        تعداد کل نوبت‌ها در دیتابیس: {debugInfo.all_slots.count}
                      </span>
                    )}
                    {debugInfo.all_slots?.year_month_summary && Object.keys(debugInfo.all_slots.year_month_summary).length > 0 && (
                      <div className="mt-2 text-xs">
                        <div className="font-semibold mb-1">نوبت‌های موجود:</div>
                        {Object.entries(debugInfo.all_slots.year_month_summary).map(([key, count]: [string, any]) => (
                          <div key={key} className="text-yellow-400">  {key}: {count} نوبت</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div>زمان شروع API: <span className="text-yellow-400">{debugInfo.webinar_info?.start_time}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Slots Management */}
      {schedulingMode === "appointment" && (
        <Card className="bg-[#0f0f0f] border border-blue-500/30 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                مدیریت نوبت‌های ماه
              </CardTitle>
              <div className="flex items-center gap-2">
                {slots.length > 0 && (
                  <>
                    <Button
                      onClick={fixSlotsStartDateTime}
                      disabled={loading || fixingDateTime}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                      title="اصلاح تاریخ StartDateTime برای تمام نوبت‌ها (در صورت نیاز)"
                    >
                      {fixingDateTime ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          در حال اصلاح...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          اصلاح تاریخ نوبت‌ها
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={deleteAllSlots}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          در حال حذف...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          حذف تمام نوبت‌ها
                        </>
                      )}
                    </Button>
                  </>
                )}
              {slots.length === 0 && !showCreateForm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  ایجاد نوبت‌های این ماه
                </Button>
              )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">در حال بارگذاری...</p>
                </div>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 mb-4 text-base">نوبت‌ها تموم شد</p>
                {showCreateForm ? (
                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5 space-y-4">
                    <h4 className="text-white font-semibold text-base mb-4">ایجاد نوبت‌های ماه جدید</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">سال شمسی</label>
                        <input
                          type="number"
                          value={createFormData.persian_year}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              persian_year: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">ماه شمسی (1-12)</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={createFormData.persian_month}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              persian_month: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">ساعت شروع (0-23)</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={createFormData.start_hour}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              start_hour: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">دقیقه شروع (0-59)</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={createFormData.start_minute}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              start_minute: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={createSlotsForMonth}
                        disabled={creating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            در حال ایجاد...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 ml-2" />
                            ایجاد 30 نوبت
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowCreateForm(false)}
                        className="bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border border-gray-700 font-semibold py-2.5"
                      >
                        انصراف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 items-center">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      ایجاد نوبت‌های این ماه
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Month Navigation and Actions */}
                {(currentViewYear && currentViewMonth) && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
                    <div className="text-white font-semibold">
                      {toPersianDigits(currentViewYear.toString())} / {getJalaliMonthName(currentViewMonth)}
                    </div>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      ایجاد نوبت‌های ماه جدید
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {slots.map((slot) => {
                    const isToday = isSlotToday(slot);
                    const isActive = isSlotActive(slot);
                    const isPast = isSlotPast(slot);
                    
                    // Determine border and background colors
                    let borderColor = "border-gray-700";
                    let bgColor = "bg-[#1a1a1a]";
                    let statusText = "";
                    
                    if (editingSlot?.id === slot.id) {
                      borderColor = "border-blue-500/50";
                      bgColor = "bg-blue-500/5";
                    } else if (isActive) {
                      // Currently active (within stream window) - GREEN
                      borderColor = "border-green-500";
                      bgColor = "bg-green-500/10";
                      statusText = "فعلی";
                    } else if (isToday && !isPast) {
                      // Today but not yet started - YELLOW/ORANGE
                      borderColor = "border-yellow-500/70";
                      bgColor = "bg-yellow-500/10";
                      statusText = "امروز";
                    } else if (isPast || slot.is_completed) {
                      // Past or completed - RED
                      borderColor = "border-red-500/70";
                      bgColor = "bg-red-500/10";
                      statusText = slot.is_completed ? "برگزار شده" : "گذشته";
                    }
                    
                    return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (editingSlot?.id !== slot.id) {
                          fetchSlotStats(slot);
                        }
                      }}
                      className={`${bgColor} rounded-xl p-4 border-2 ${borderColor} transition-all hover:shadow-lg ${
                        editingSlot?.id === slot.id ? "" : "hover:border-opacity-80 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">
                            {toPersianDigits(slot.persian_day.toString())}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {getJalaliMonthName(slot.persian_month)}
                          </span>
                        </div>
                        {isActive ? (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-green-400 font-semibold">فعلی</span>
                          </div>
                        ) : isPast || slot.is_completed ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-red-400" />
                            <span className="text-xs text-red-400 font-semibold">{statusText}</span>
                          </div>
                        ) : isToday ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-semibold">{statusText}</span>
                          </div>
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {editingSlot?.id === slot.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={editingSlot.start_hour}
                              onChange={(e) =>
                                setEditingSlot({
                                  ...editingSlot,
                                  start_hour: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={editingSlot.start_minute}
                              onChange={(e) =>
                                setEditingSlot({
                                  ...editingSlot,
                                  start_minute: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                updateSlotTime(
                                  editingSlot.id,
                                  editingSlot.start_hour,
                                  editingSlot.start_minute
                                )
                              }
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 font-semibold"
                            >
                              ذخیره
                            </Button>
                            <Button
                              onClick={() => setEditingSlot(null)}
                              className="bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border border-gray-700 text-xs py-1.5"
                            >
                              انصراف
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="font-semibold">
                              {toPersianDigits(
                                `${slot.start_hour.toString().padStart(2, "0")}:${slot.start_minute.toString().padStart(2, "0")}`
                              )}
                            </span>
                          </div>
                          {!isPast && !slot.is_completed && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSlot(slot);
                              }}
                              className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border border-gray-700 text-xs py-1.5 font-medium flex items-center justify-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              ویرایش زمان
                            </Button>
                          )}
                          {(isPast || slot.is_completed) && (
                            <div className="text-xs text-red-400 font-medium text-center py-1.5">
                              {slot.is_completed ? "برگزار شده" : "گذشته"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Modal */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="bg-[#0a0a0a] border border-gray-900 rounded-2xl max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-900 pb-4 mb-4">
            <DialogTitle className="text-white text-right text-2xl font-bold flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-400" />
              آمار نوبت {selectedSlot && `${toPersianDigits(selectedSlot.persian_day.toString())} ${getJalaliMonthName(selectedSlot.persian_month)}`}
            </DialogTitle>
            {selectedSlot && (
              <div className="text-sm text-gray-400 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {toPersianDigits(
                      `${selectedSlot.start_hour.toString().padStart(2, "0")}:${selectedSlot.start_minute.toString().padStart(2, "0")}`
                    )} - {toPersianDigits(`${selectedSlot.end_hour.toString().padStart(2, "0")}:00`)}
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : slotStats ? (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-[#1a1a1a] border border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      <span className="text-gray-400 text-sm">کل کاربران</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {toPersianDigits(slotStats.stats.total_users.toString())}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-green-400" />
                      <span className="text-gray-400 text-sm">تماشا کرده</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {toPersianDigits(slotStats.stats.watched_count.toString())}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {slotStats.stats.total_users > 0
                        ? toPersianDigits(
                            Math.round((slotStats.stats.watched_count / slotStats.stats.total_users) * 100).toString()
                          ) + "%"
                        : "0%"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-5 w-5 text-yellow-400" />
                      <span className="text-gray-400 text-sm">خرید کرده</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {toPersianDigits(slotStats.stats.purchase_count.toString())}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {slotStats.stats.total_users > 0
                        ? toPersianDigits(
                            Math.round((slotStats.stats.purchase_count / slotStats.stats.total_users) * 100).toString()
                          ) + "%"
                        : "0%"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-5 w-5 text-cyan-400" />
                      <span className="text-gray-400 text-sm">خرید کامل</span>
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {toPersianDigits(slotStats.stats.full_purchase_count.toString())}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      قسطی: {toPersianDigits(slotStats.stats.installment_purchase_count.toString())}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actual Attendees Section */}
              {slotStats.actual_attendees && slotStats.actual_attendees.length > 0 && (
                <Card className="bg-[#1a1a1a] border border-green-500/30">
                  <CardHeader className="border-b border-gray-800 pb-3">
                    <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-400" />
                      حضور واقعی در استریم ({toPersianDigits(slotStats.stats.actual_attendees_count?.toString() || "0")})
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                      کاربرانی که واقعاً در استریم حاضر بودند و آن را تماشا کردند (حتی یک ثانیه)
                    </p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[#0a0a0a] border-b border-gray-800">
                            <tr>
                              <th className="text-right p-3 text-sm font-semibold text-gray-300">نام</th>
                              <th className="text-right p-3 text-sm font-semibold text-gray-300">شماره تماس</th>
                              <th className="text-right p-3 text-sm font-semibold text-gray-300">زمان ورود</th>
                              <th className="text-center p-3 text-sm font-semibold text-gray-300">زمان تماشا</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slotStats.actual_attendees.map((user) => (
                              <tr
                                key={user.id}
                                className="border-b border-gray-800 hover:bg-[#252525] transition-colors"
                              >
                                <td className="p-3 text-white">
                                  {user.first_name} {user.last_name}
                                </td>
                                <td className="p-3 text-gray-300">{toPersianDigits(user.phone)}</td>
                                <td className="p-3 text-gray-400 text-sm">
                                  {user.first_join_at
                                    ? formatJalali(new Date(user.first_join_at), "YYYY/MM/DD HH:mm:ss")
                                    : "-"}
                                </td>
                                <td className="p-3 text-center text-green-400 text-sm font-semibold">
                                  {user.total_watch_seconds > 0
                                    ? toPersianDigits(
                                        Math.floor(user.total_watch_seconds / 60).toString()
                                      ) + " دقیقه"
                                    : "کمتر از ۱ دقیقه"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Minute-by-Minute Presence Chart */}
              {loadingPresence ? (
                <Card className="bg-[#1a1a1a] border border-gray-800">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              ) : presenceData && presenceData.minute_data.length > 0 ? (
                <Card className="bg-[#1a1a1a] border border-gray-800">
                  <CardHeader className="border-b border-gray-800 pb-3">
                    <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      نمودار حضور لحظه‌ای در استریم
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                      تعداد افراد حاضر در هر دقیقه از استریم (مدت کل: {toPersianDigits(presenceData.duration_minutes.toString())} دقیقه)
                    </p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={presenceData.minute_data}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorPresence" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="minute"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(value) => toPersianDigits(value.toString())}
                            label={{ value: "دقیقه", position: "insideBottom", offset: -5, style: { fill: "#9ca3af" } }}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(value) => toPersianDigits(value.toString())}
                            label={{ value: "تعداد افراد", angle: -90, position: "insideLeft", style: { fill: "#9ca3af" } }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a1a",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                            formatter={(value: number) => [toPersianDigits(value.toString()) + " نفر", "حضور"]}
                            labelFormatter={(label) => `دقیقه ${toPersianDigits(label.toString())}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPresence)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Users List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  لیست کاربران ({toPersianDigits(slotStats.users.length.toString())})
                </h3>
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0f0f0f] border-b border-gray-800">
                        <tr>
                          <th className="text-right p-3 text-sm font-semibold text-gray-300">نام</th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-300">شماره تماس</th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-300">زمان ثبت‌نام</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-300">وضعیت</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-300">خرید</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-300">زمان تماشا</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slotStats.users.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-gray-500">
                              هیچ کاربری در این نوبت ثبت‌نام نکرده است
                            </td>
                          </tr>
                        ) : (
                          slotStats.users.map((user) => (
                            <tr
                              key={user.id}
                              className="border-b border-gray-800 hover:bg-[#252525] transition-colors"
                            >
                              <td className="p-3 text-white">
                                {user.first_name} {user.last_name}
                              </td>
                              <td className="p-3 text-gray-300">{toPersianDigits(user.phone)}</td>
                              <td className="p-3 text-gray-400 text-sm">
                                {formatJalali(new Date(user.registered_at), "YYYY/MM/DD HH:mm")}
                              </td>
                              <td className="p-3 text-center">
                                {user.has_watched ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                    <Eye className="h-3 w-3" />
                                    تماشا کرده
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">
                                    تماشا نکرده
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {user.purchase_status === "full" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/20 text-cyan-400 text-xs">
                                    کامل
                                  </span>
                                ) : user.purchase_status === "installment" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                                    قسطی
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs">
                                    ندارد
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center text-gray-400 text-sm">
                                {user.total_watch_seconds > 0
                                  ? toPersianDigits(
                                      Math.floor(user.total_watch_seconds / 60).toString()
                                    ) + " دقیقه"
                                  : "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Slots Dialog - Shows when trying to switch to appointment mode without slots */}
      <Dialog open={showCreateSlotsDialog} onOpenChange={(open) => {
        setShowCreateSlotsDialog(open);
        if (!open) {
          // Reset pending mode change when dialog is closed
          setPendingModeChange(null);
          setCreateSlotsDialogData(null);
        }
      }}>
        <DialogContent className="bg-[#0a0a0a] border border-gray-900 rounded-2xl max-w-2xl">
          <DialogHeader className="border-b border-gray-900 pb-4 mb-4">
            <DialogTitle className="text-white text-right text-xl font-bold flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
              ایجاد نوبت‌های ماه
            </DialogTitle>
            <p className="text-sm text-gray-400 mt-2 text-right">
              {createSlotsDialogData?.error_type === "no_slots_for_month" 
                ? "هیچ نوبتی برای ماه جاری ایجاد نشده است. لطفاً نوبت‌های این ماه را ایجاد کنید تا بتوانید حالت نوبت‌دهی را فعال کنید."
                : "نوبتی برای امروز یافت نشد. لطفاً نوبت‌های این ماه را ایجاد یا به‌روزرسانی کنید."}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5 space-y-4">
              <h4 className="text-white font-semibold text-base mb-4">ایجاد 30 نوبت برای ماه {createSlotsDialogData ? `${createSlotsDialogData.persian_year}/${createSlotsDialogData.persian_month}` : ''}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">سال شمسی</label>
                  <input
                    type="number"
                    value={createFormData.persian_year}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        persian_year: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">ماه شمسی (1-12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={createFormData.persian_month}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        persian_month: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">ساعت شروع (0-23)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={createFormData.start_hour}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        start_hour: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">دقیقه شروع (0-59)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={createFormData.start_minute}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        start_minute: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={createSlotsForMonth}
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      در حال ایجاد...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 ml-2" />
                      ایجاد 30 نوبت
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateSlotsDialog(false);
                    setPendingModeChange(null);
                    setCreateSlotsDialogData(null);
                  }}
                  className="bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 border border-gray-700 font-semibold py-2.5"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentSchedulingManager;
