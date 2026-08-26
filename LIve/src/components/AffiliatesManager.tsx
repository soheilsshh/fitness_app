import { useEffect, useState } from "react";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, FileText, Handshake, TrendingUp, LayoutGrid, Rows3, ChevronLeft, ChevronRight, Instagram, AlertCircle, MessageSquare, Send, Phone, MessageCircle, Link as LinkIcon, Search, X, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { config } from "@/config/environment";
import { formatJalali, toPersianDigits } from "@/utils/jalali";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AffiliateStatus = "lead_pool" | "meeting_negotiate" | "waiting_meeting" | "closing_contract" | "follow_up" | "active";

interface StatusNote {
  status: AffiliateStatus;
  note: string;
  created_at: string;
}

interface Affiliate {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  instagram_link?: string;
  telegram_id?: string;
  whatsapp_link?: string;
  follower_count: number;
  required_content: number;
  leads_count: number;
  status: AffiliateStatus;
  notes: string;
  status_notes?: string;
  urgent_follow_up: boolean;
  admin_user_id?: number;
  admin_user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_by_id: number;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

interface AffiliatesManagerProps {
  token: string;
}

const BOARD_COLUMNS: Array<{ key: AffiliateStatus; title: string; description: string }> = [
  { key: "lead_pool", title: "انبار لید", description: "لیدهای احتمالی و در حال بررسی" },
  { key: "meeting_negotiate", title: "مذاکره برای جلسه", description: "در حال مذاکره برای برگزاری جلسه" },
  { key: "waiting_meeting", title: "منتظر برگزاری جلسه", description: "جلسه برنامه‌ریزی شده، در انتظار برگزاری" },
  { key: "closing_contract", title: "بستن قرار داد", description: "در حال بستن و امضای قرارداد" },
  { key: "follow_up", title: "پیگیری شروع همکاری", description: "در حال پیگیری شروع همکاری" },
  { key: "active", title: "افیلیت فعال", description: "افیلیت‌های فعال و در حال همکاری" },
];

const AffiliatesManager = ({ token }: AffiliatesManagerProps) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [adminUsers, setAdminUsers] = useState<Array<{ id: number; username: string; first_name: string; last_name: string }>>([]);
  const [changingStatus, setChangingStatus] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    instagram_link: "",
    telegram_id: "",
    whatsapp_link: "",
    follower_count: 0,
    required_content: 0,
    status: "lead_pool" as AffiliateStatus,
    notes: "",
    status_notes: "",
    urgent_follow_up: false,
    admin_user_id: undefined as number | undefined,
  });

  // Status notes state
  const [statusNotes, setStatusNotes] = useState<StatusNote[]>([]);
  const [newStatusNote, setNewStatusNote] = useState("");
  const [showStatusNotes, setShowStatusNotes] = useState<number | null>(null);

  const API_URL = config.API_BASE_URL;

  useEffect(() => {
    fetchAffiliates();
    fetchAdminUsers();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAffiliates();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  const fetchAffiliates = async () => {
    try {
      const url = `${API_URL}/admin/affiliates`;
      
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
        throw new Error("خطا در دریافت لیست افیلیت‌ها");
      }

      const data = await response.json();
      setAffiliates(data.affiliates || []);
      setError("");
    } catch (err: any) {
      console.error("[AffiliatesManager] Failed to fetch affiliates:", err);
      setError(err.message || "خطا در دریافت لیست افیلیت‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (affiliateId: number, newStatus: AffiliateStatus) => {
    setChangingStatus(affiliateId);
    try {
      const affiliate = affiliates.find(a => a.id === affiliateId);
      if (!affiliate) return;

      // Parse existing status notes
      let statusNotesArray: StatusNote[] = [];
      if (affiliate.status_notes) {
        try {
          statusNotesArray = JSON.parse(affiliate.status_notes);
        } catch (e) {
          // If parsing fails, create new array
          statusNotesArray = [];
        }
      }

      // Add new status note if status changed
      if (affiliate.status !== newStatus) {
        statusNotesArray.push({
          status: newStatus,
          note: `تغییر وضعیت از ${BOARD_COLUMNS.find(c => c.key === affiliate.status)?.title || affiliate.status} به ${BOARD_COLUMNS.find(c => c.key === newStatus)?.title || newStatus}`,
          created_at: new Date().toISOString(),
        });
      }

      const response = await fetch(`${API_URL}/admin/affiliates/${affiliateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: affiliate.first_name,
          last_name: affiliate.last_name,
          phone: affiliate.phone || "",
          email: affiliate.email || "",
          instagram_link: affiliate.instagram_link || "",
          telegram_id: affiliate.telegram_id || "",
          whatsapp_link: affiliate.whatsapp_link || "",
          follower_count: affiliate.follower_count,
          required_content: affiliate.required_content,
          status: newStatus,
          notes: affiliate.notes || "",
          status_notes: JSON.stringify(statusNotesArray),
          urgent_follow_up: affiliate.urgent_follow_up,
          admin_user_id: newStatus === "active" ? affiliate.admin_user_id : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در تغییر وضعیت");
      }

      fetchAffiliates();
    } catch (err: any) {
      alert("❌ خطا: " + (err.message || "خطا در تغییر وضعیت"));
    } finally {
      setChangingStatus(null);
    }
  };

  const handleAddStatusNote = async (affiliateId: number, note: string) => {
    if (!note.trim()) return;

    try {
      const affiliate = affiliates.find(a => a.id === affiliateId);
      if (!affiliate) return;

      // Parse existing status notes
      let statusNotesArray: StatusNote[] = [];
      if (affiliate.status_notes) {
        try {
          statusNotesArray = JSON.parse(affiliate.status_notes);
        } catch (e) {
          statusNotesArray = [];
        }
      }

      // Add new note for current status
      statusNotesArray.push({
        status: affiliate.status,
        note: note.trim(),
        created_at: new Date().toISOString(),
      });

      // Update affiliate with all fields
      const updateData: any = {
        first_name: affiliate.first_name,
        last_name: affiliate.last_name,
        phone: affiliate.phone || "",
        email: affiliate.email || "",
          instagram_link: affiliate.instagram_link || "",
          telegram_id: affiliate.telegram_id || "",
          whatsapp_link: affiliate.whatsapp_link || "",
          follower_count: affiliate.follower_count,
        required_content: affiliate.required_content,
        status: affiliate.status,
        notes: affiliate.notes || "",
        status_notes: JSON.stringify(statusNotesArray),
        urgent_follow_up: affiliate.urgent_follow_up,
      };
      
      if (affiliate.admin_user_id) {
        updateData.admin_user_id = affiliate.admin_user_id;
      }

      const response = await fetch(`${API_URL}/admin/affiliates/${affiliateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در افزودن یادداشت");
      }

      setNewStatusNote("");
      // Refresh the affiliate data to get updated status notes
      await fetchAffiliates();
      
      // Update statusNotes in edit dialog if open - wait a bit for state to update
      setTimeout(() => {
        if (editingAffiliate && editingAffiliate.id === affiliateId) {
          const updatedAffiliate = affiliates.find(a => a.id === affiliateId);
          if (updatedAffiliate && updatedAffiliate.status_notes) {
            try {
              const parsed = JSON.parse(updatedAffiliate.status_notes);
              setStatusNotes(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              setStatusNotes([]);
            }
          }
        }
      }, 200);
    } catch (err: any) {
      alert("❌ خطا: " + (err.message || "خطا در افزودن یادداشت"));
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/admin-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin users:", err);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/affiliates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ایجاد افیلیت");
      }

      setShowCreateDialog(false);
      resetForm();
      fetchAffiliates();
    } catch (err: any) {
      alert("❌ خطا: " + (err.message || "خطا در ایجاد افیلیت"));
    }
  };

  const handleUpdate = async () => {
    if (!editingAffiliate) return;

    try {
      // CRITICAL: Always send ALL fields explicitly, even if empty
      // Backend expects all fields to be present in the request
      // Use formData values directly, ensuring they're never undefined
      const finalUpdateData: any = {
        first_name: formData.first_name || "",
        last_name: formData.last_name || "",
        phone: formData.phone || "",
        email: formData.email || "",
        instagram_link: formData.instagram_link || "",  // CRITICAL: Always send, even if empty
        telegram_id: formData.telegram_id || "",      // CRITICAL: Always send, even if empty
        whatsapp_link: formData.whatsapp_link || "",   // CRITICAL: Always send, even if empty
        follower_count: formData.follower_count || 0,
        required_content: formData.required_content || 0,
        status: formData.status,
        notes: formData.notes || "",                   // CRITICAL: Always send, even if empty
        status_notes: (statusNotes && Array.isArray(statusNotes) && statusNotes.length > 0) 
          ? JSON.stringify(statusNotes) 
          : "",                                        // CRITICAL: Always send, even if empty
        urgent_follow_up: formData.urgent_follow_up || false,
      };

      // Handle admin_user_id - only set if status is active
      if (formData.status === "active" && formData.admin_user_id) {
        finalUpdateData.admin_user_id = formData.admin_user_id;
      } else {
        // Explicitly set to null if status is not active
        finalUpdateData.admin_user_id = null;
      }

      // Debug log to verify all fields are being sent
      console.log("📤 Sending update request with all fields:", {
        instagram_link: finalUpdateData.instagram_link,
        telegram_id: finalUpdateData.telegram_id,
        whatsapp_link: finalUpdateData.whatsapp_link,
        notes: finalUpdateData.notes,
        status_notes: finalUpdateData.status_notes,
        admin_user_id: finalUpdateData.admin_user_id,
      });

      const response = await fetch(`${API_URL}/admin/affiliates/${editingAffiliate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalUpdateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Update error response:", errorData);
        throw new Error(errorData.error || "خطا در به‌روزرسانی افیلیت");
      }

      const result = await response.json();
      console.log("✅ Update successful. Response:", {
        instagram_link: result.affiliate?.instagram_link,
        telegram_id: result.affiliate?.telegram_id,
        whatsapp_link: result.affiliate?.whatsapp_link,
        notes: result.affiliate?.notes,
        status_notes: result.affiliate?.status_notes,
      });

      setShowEditDialog(false);
      setEditingAffiliate(null);
      resetForm();
      await fetchAffiliates();
    } catch (err: any) {
      console.error("❌ Update failed:", err);
      alert("❌ خطا: " + (err.message || "خطا در به‌روزرسانی افیلیت"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("⚠️ آیا مطمئن هستید که می‌خواهید این افیلیت را حذف کنید؟")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/affiliates/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در حذف افیلیت");
      }

      fetchAffiliates();
    } catch (err: any) {
      alert("❌ خطا: " + (err.message || "خطا در حذف افیلیت"));
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      instagram_link: "",
      telegram_id: "",
      whatsapp_link: "",
      follower_count: 0,
      required_content: 0,
      status: "lead_pool",
      notes: "",
      status_notes: "",
      urgent_follow_up: false,
      admin_user_id: undefined,
    });
    setStatusNotes([]);
    setNewStatusNote("");
  };

  const openEditDialog = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    
    // CRITICAL: Ensure all fields are set, even if undefined/null
    // This prevents issues when fields are missing from the API response
    setFormData({
      first_name: affiliate.first_name || "",
      last_name: affiliate.last_name || "",
      phone: affiliate.phone || "",
      email: affiliate.email || "",
      instagram_link: affiliate.instagram_link || "",  // Always set, even if undefined
      telegram_id: affiliate.telegram_id || "",        // Always set, even if undefined
      whatsapp_link: affiliate.whatsapp_link || "",   // Always set, even if undefined
      follower_count: affiliate.follower_count || 0,
      required_content: affiliate.required_content || 0,
      status: affiliate.status,
      notes: affiliate.notes || "",                    // Always set, even if undefined
      status_notes: affiliate.status_notes || "",      // Always set, even if undefined
      urgent_follow_up: affiliate.urgent_follow_up || false,
      admin_user_id: affiliate.admin_user_id,
    });
    
    // Parse status notes - ensure it's always an array
    if (affiliate.status_notes) {
      try {
        const parsed = JSON.parse(affiliate.status_notes);
        setStatusNotes(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.warn("Failed to parse status_notes:", e);
        setStatusNotes([]);
      }
    } else {
      setStatusNotes([]);
    }
    
    console.log("📝 Edit dialog opened with affiliate data:", {
      instagram_link: affiliate.instagram_link || "(empty)",
      telegram_id: affiliate.telegram_id || "(empty)",
      whatsapp_link: affiliate.whatsapp_link || "(empty)",
      notes: affiliate.notes || "(empty)",
      status_notes: affiliate.status_notes || "(empty)",
    });
    
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: AffiliateStatus) => {
    const statusConfig = {
      lead_pool: { label: "انبار لید", icon: Clock, color: "yellow", bg: "bg-yellow-600/30", border: "border-yellow-600/50", text: "text-yellow-300" },
      meeting_negotiate: { label: "مذاکره برای جلسه", icon: Handshake, color: "blue", bg: "bg-blue-600/30", border: "border-blue-600/50", text: "text-blue-300" },
      waiting_meeting: { label: "منتظر برگزاری جلسه", icon: Clock, color: "brand", bg: "bg-teal-600/30", border: "border-teal-600/50", text: "text-cyan-300" },
      closing_contract: { label: "بستن قرار داد", icon: FileText, color: "teal", bg: "bg-teal-600/30", border: "border-teal-600/50", text: "text-teal-300" },
      follow_up: { label: "پیگیری شروع همکاری", icon: TrendingUp, color: "cyan", bg: "bg-cyan-600/30", border: "border-cyan-600/50", text: "text-cyan-300" },
      active: { label: "افیلیت فعال", icon: CheckCircle, color: "green", bg: "bg-green-600/30", border: "border-green-600/50", text: "text-green-300" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} ${config.text} font-medium text-sm border ${config.border} whitespace-nowrap`}>
        <Icon size={16} className="flex-shrink-0" />
        {config.label}
      </span>
    );
  };

  const getStatusCounts = () => {
    return {
      lead_pool: affiliates.filter(a => a.status === "lead_pool").length,
      meeting_negotiate: affiliates.filter(a => a.status === "meeting_negotiate").length,
      waiting_meeting: affiliates.filter(a => a.status === "waiting_meeting").length,
      closing_contract: affiliates.filter(a => a.status === "closing_contract").length,
      follow_up: affiliates.filter(a => a.status === "follow_up").length,
      active: affiliates.filter(a => a.status === "active").length,
    };
  };

  const statusCounts = getStatusCounts();

  // Group affiliates by status for board view
  const groupedByStatus = {
    lead_pool: affiliates.filter(a => a.status === "lead_pool"),
    meeting_negotiate: affiliates.filter(a => a.status === "meeting_negotiate"),
    waiting_meeting: affiliates.filter(a => a.status === "waiting_meeting"),
    closing_contract: affiliates.filter(a => a.status === "closing_contract"),
    follow_up: affiliates.filter(a => a.status === "follow_up"),
    active: affiliates.filter(a => a.status === "active"),
  };

  // Filter affiliates based on statusFilter and searchQuery
  const filteredAffiliates = affiliates.filter((affiliate) => {
    // Status filter
    if (statusFilter !== "all" && affiliate.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const fullName = `${affiliate.first_name} ${affiliate.last_name}`.toLowerCase();
      const phone = affiliate.phone.toLowerCase();
      const email = (affiliate.email || "").toLowerCase();
      
      return (
        fullName.includes(query) ||
        affiliate.first_name.toLowerCase().includes(query) ||
        affiliate.last_name.toLowerCase().includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <Card className="bg-[#0a0a0a] border border-gray-900 rounded-2xl overflow-hidden">
        <CardHeader className="text-right p-6 border-b border-gray-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-white text-right text-2xl font-bold">
              مدیریت افیلیت‌ها
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 border-4 border-teal-600/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-teal-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 text-sm">در حال بارگذاری...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#0a0a0a] border border-gray-900 rounded-2xl overflow-hidden">
        <CardHeader className="text-right p-6 border-b border-gray-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-white text-right text-2xl font-bold">
              مدیریت افیلیت‌ها
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/30 text-red-400 border border-red-600/50">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="fp-card fp-notch overflow-hidden border-teal-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 border-b border-white/8 bg-gradient-to-l from-teal-950/30 via-transparent to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 fp-notch-sm bg-gradient-to-l from-[#187272] to-[#26fce3] flex items-center justify-center shrink-0">
              <Handshake className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-lg sm:text-xl font-bold text-white">افیلیت‌ها</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {toPersianDigits(affiliates.length)} نفر • از لید تا فعال‌سازی
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <div className="hidden lg:flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
              <Button
                onClick={() => setViewMode("board")}
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  viewMode === "board" ? "bg-teal-600 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("table")}
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  viewMode === "table" ? "bg-teal-600 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <Rows3 className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-gradient-to-l from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold text-xs sm:text-sm px-3 py-2 rounded-xl"
            >
              <Plus className="h-4 w-4 sm:ml-1" />
              <span className="hidden sm:inline">افیلیت جدید</span>
            </Button>

            <Button
              onClick={() => {
                const csvContent =
                  "data:text/csv;charset=utf-8," +
                  "نام,نام خانوادگی,شماره تماس,ایمیل,وضعیت\n" +
                  filteredAffiliates
                    .map(
                      (a) =>
                        `"${a.first_name}","${a.last_name}","${a.phone}","${a.email || ""}","${BOARD_COLUMNS.find((c) => c.key === a.status)?.title || a.status}"`
                    )
                    .join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `affiliates_${new Date().toISOString().split("T")[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              variant="outline"
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs sm:text-sm px-3 py-2 rounded-xl"
            >
              <Download className="h-4 w-4 sm:ml-1" />
              <span className="hidden sm:inline">اکسل</span>
            </Button>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-3 border-b border-white/5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "fp-chip whitespace-nowrap transition-all",
                statusFilter === "all" ? "text-cyan-200 border-[#26fce3]/40 bg-[#26fce3]/15" : "text-gray-400 hover:text-white"
              )}
            >
              همه ({toPersianDigits(affiliates.length)})
            </button>
            {BOARD_COLUMNS.map((column) => (
              <button
                key={column.key}
                type="button"
                onClick={() => setStatusFilter(column.key)}
                className={cn(
                  "fp-chip whitespace-nowrap transition-all",
                  statusFilter === column.key ? "text-cyan-200 border-[#26fce3]/40 bg-[#26fce3]/15" : "text-gray-400 hover:text-white"
                )}
              >
                {column.title} ({toPersianDigits(statusCounts[column.key])})
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-b border-white/5">
          <div className="relative max-w-xl ms-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو: نام، موبایل، ایمیل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#26fce3]/40 focus:border-teal-500/40 transition-all placeholder:text-gray-600"
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

        <div className="p-0">
          {affiliates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0f0f0f] border border-gray-900 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">هیچ افیلیتی ثبت نشده است</p>
              </div>
            </div>
          ) : viewMode === "board" ? (
            <div className="overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 sm:mx-0">
              <div className="flex gap-3 sm:gap-4 min-w-max p-4 sm:p-6">
                {BOARD_COLUMNS.map((column) => (
                  <div
                    key={column.key}
                    className="flex flex-col min-w-[260px] sm:min-w-[280px] max-w-[260px] sm:max-w-[280px] lg:min-w-0 lg:max-w-none lg:flex-1 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 h-[500px] sm:h-[600px] max-h-[500px] sm:max-h-[600px] snap-start shadow-[0_10px_25px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <div>
                        <p className="text-white font-semibold">{column.title}</p>
                        <p className="text-xs text-gray-400">{column.description}</p>
                      </div>
                      <Badge className="bg-white/10 text-white border-white/20">
                        {groupedByStatus[column.key].length}
                      </Badge>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pr-1 min-h-0">
                      {groupedByStatus[column.key].length === 0 ? (
                        <div className="flex-shrink-0 text-center text-xs text-gray-500 bg-white/5 border border-white/10 rounded-2xl py-6">
                          افیلیتی در این ستون نیست
                        </div>
                      ) : (
                        groupedByStatus[column.key].map((affiliate) => (
                          <AffiliateCard
                            key={affiliate.id}
                            affiliate={affiliate}
                            onEdit={() => openEditDialog(affiliate)}
                            onDelete={() => handleDelete(affiliate.id)}
                            onStatusChange={(newStatus) => handleStatusChange(affiliate.id, newStatus)}
                            onAddNote={(note) => handleAddStatusNote(affiliate.id, note)}
                            onToggleNotes={() => setShowStatusNotes(showStatusNotes === affiliate.id ? null : affiliate.id)}
                            showNotes={showStatusNotes === affiliate.id}
                            changingStatus={changingStatus === affiliate.id}
                            statusOptions={BOARD_COLUMNS.map(c => c.key)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-right">
                <TableHeader>
                  <TableRow className="bg-[#0f0f0f] border-0 border-transparent hover:bg-[#0f0f0f]">
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">نام و نام خانوادگی</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">شماره تماس</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">تعداد فالوور</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">محتوای مورد نیاز</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">تعداد لید</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">وضعیت</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">کاربر ادمین</TableHead>
                    <TableHead className="text-right text-gray-400 font-semibold py-4 px-6">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((affiliate) => (
                    <TableRow 
                      key={affiliate.id} 
                      className="border-0 border-transparent hover:bg-transparent hover:border hover:border-teal-500 transition-all duration-200"
                    >
                      <TableCell className="py-4 px-6">
                        <div className="text-white font-medium">
                          {affiliate.first_name} {affiliate.last_name}
                        </div>
                        {affiliate.email && (
                          <div className="text-gray-500 text-xs mt-1">{affiliate.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {affiliate.phone ? (
                          <span className="text-gray-400 font-mono text-sm bg-[#0f0f0f] px-3 py-1.5 rounded-lg border border-gray-900">
                            {affiliate.phone}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="text-blue-300 font-bold">
                          {affiliate.follower_count.toLocaleString('fa-IR')}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <span className="text-cyan-300 font-bold">
                          {affiliate.required_content.toLocaleString('fa-IR')}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {affiliate.status === "active" ? (
                          <span className="text-green-300 font-bold text-lg">
                            {affiliate.leads_count.toLocaleString('fa-IR')}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Select
                          value={affiliate.status}
                          onValueChange={(value) => handleStatusChange(affiliate.id, value as AffiliateStatus)}
                          disabled={changingStatus === affiliate.id}
                        >
                          <SelectTrigger className="bg-[#0f0f0f] border-gray-900 text-white w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0f0f0f] border-gray-900">
                            {BOARD_COLUMNS.map((col) => (
                              <SelectItem key={col.key} value={col.key}>
                                {col.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {affiliate.admin_user ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-emerald-300 font-medium text-sm">
                              {affiliate.admin_user.first_name} {affiliate.admin_user.last_name}
                            </span>
                            <span className="text-gray-500 text-xs font-mono">
                              @{affiliate.admin_user.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => openEditDialog(affiliate)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            onClick={() => handleDelete(affiliate.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0a0a0a] border border-gray-900 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold text-white">ثبت افیلیت جدید</DialogTitle>
            <DialogDescription className="text-right text-gray-400">
              اطلاعات افیلیت جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right text-gray-300 mb-2 block">نام</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="نام"
                />
              </div>
              <div>
                <Label className="text-right text-gray-300 mb-2 block">نام خانوادگی</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="نام خانوادگی"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right text-gray-300 mb-2 block">شماره تماس</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-[#0f0f0f] border-gray-900 text-white flex-1"
                    placeholder="09123456789"
                  />
                  {formData.phone && (
                    <Button
                      type="button"
                      onClick={() => window.open(`tel:${formData.phone}`, '_self')}
                      className="bg-green-600 hover:bg-green-500 text-white"
                      title="تماس"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-right text-gray-300 mb-2 block">ایمیل</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">لینک اینستاگرام</Label>
              <Input
                value={formData.instagram_link}
                onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
                className="bg-[#0f0f0f] border-gray-900 text-white"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">آیدی تلگرام</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.telegram_id}
                  onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white flex-1"
                  placeholder="@username یا username"
                  disabled={formData.telegram_id?.startsWith('http')}
                />
                {formData.telegram_id?.startsWith('http') ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      onClick={() => {
                        window.open(formData.telegram_id, '_blank', 'noopener,noreferrer');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
                    >
                      <MessageCircle className="h-4 w-4 ml-1" />
                      ارسال پیام
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Extract username from link
                        const match = formData.telegram_id.match(/t\.me\/(.+)/);
                        if (match) {
                          setFormData({ ...formData, telegram_id: match[1] });
                        } else {
                          setFormData({ ...formData, telegram_id: "" });
                        }
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2"
                      title="ویرایش"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (formData.telegram_id && !formData.telegram_id.startsWith('http')) {
                        const telegramLink = formData.telegram_id.startsWith('@') 
                          ? `https://t.me/${formData.telegram_id.slice(1)}`
                          : `https://t.me/${formData.telegram_id}`;
                        setFormData({ ...formData, telegram_id: telegramLink });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
                    disabled={!formData.telegram_id || formData.telegram_id.startsWith('http')}
                  >
                    <LinkIcon className="h-4 w-4 ml-1" />
                    تبدیل به لینک
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">لینک واتساپ</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white flex-1"
                  placeholder="شماره تماس (مثلا: 989123456789) یا لینک واتساپ"
                  disabled={formData.whatsapp_link?.startsWith('http') || formData.whatsapp_link?.startsWith('wa.me')}
                />
                {formData.whatsapp_link?.startsWith('http') || formData.whatsapp_link?.startsWith('wa.me') ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      onClick={() => {
                        const link = formData.whatsapp_link?.startsWith('http') || formData.whatsapp_link?.startsWith('wa.me')
                          ? formData.whatsapp_link
                          : `https://wa.me/${formData.whatsapp_link.replace(/\D/g, '')}`;
                        window.open(link, '_blank', 'noopener,noreferrer');
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white whitespace-nowrap"
                    >
                      <MessageCircle className="h-4 w-4 ml-1" />
                      ارسال پیام
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Extract phone from link
                        const match = formData.whatsapp_link.match(/wa\.me\/(\d+)/);
                        if (match) {
                          setFormData({ ...formData, whatsapp_link: match[1] });
                        } else {
                          setFormData({ ...formData, whatsapp_link: "" });
                        }
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2"
                      title="ویرایش"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (formData.whatsapp_link && !formData.whatsapp_link.startsWith('http') && !formData.whatsapp_link.startsWith('wa.me')) {
                        const phone = formData.whatsapp_link.replace(/\D/g, ''); // فقط اعداد
                        if (phone) {
                          setFormData({ ...formData, whatsapp_link: `https://wa.me/${phone}` });
                        }
                      }
                    }}
                    className="bg-green-600 hover:bg-green-500 text-white whitespace-nowrap"
                    disabled={!formData.whatsapp_link || formData.whatsapp_link.startsWith('http') || formData.whatsapp_link.startsWith('wa.me')}
                  >
                    <LinkIcon className="h-4 w-4 ml-1" />
                    تبدیل به لینک
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right text-gray-300 mb-2 block">تعداد فالوور</Label>
                <Input
                  type="number"
                  value={formData.follower_count}
                  onChange={(e) => setFormData({ ...formData, follower_count: parseInt(e.target.value) || 0 })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-right text-gray-300 mb-2 block">محتوای مورد نیاز</Label>
                <Input
                  type="number"
                  value={formData.required_content}
                  onChange={(e) => setFormData({ ...formData, required_content: parseInt(e.target.value) || 0 })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">وضعیت</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as AffiliateStatus })}
              >
                <SelectTrigger className="bg-[#0f0f0f] border-gray-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f0f] border-gray-900">
                  <SelectItem value="lead_pool">انبار لید</SelectItem>
                  <SelectItem value="meeting_negotiate">مذاکره برای جلسه</SelectItem>
                  <SelectItem value="waiting_meeting">منتظر برگزاری جلسه</SelectItem>
                  <SelectItem value="closing_contract">بستن قرار داد</SelectItem>
                  <SelectItem value="follow_up">پیگیری شروع همکاری</SelectItem>
                  <SelectItem value="active">افیلیت فعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === "active" && (
              <div>
                <Label className="text-right text-gray-300 mb-2 block">کاربر ادمین (برای افیلیت فعال)</Label>
                <Select
                  value={formData.admin_user_id?.toString() || "none"}
                  onValueChange={(value) => setFormData({ ...formData, admin_user_id: value === "none" ? undefined : parseInt(value) })}
                >
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-900 text-white">
                    <SelectValue placeholder="انتخاب کاربر ادمین" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-gray-900">
                    <SelectItem value="none">بدون انتخاب</SelectItem>
                    {adminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="urgent_follow_up_create"
                checked={formData.urgent_follow_up}
                onChange={(e) => setFormData({ ...formData, urgent_follow_up: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-red-500"
              />
              <label htmlFor="urgent_follow_up_create" className="text-gray-300 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                نیاز به پیگیری فوری
              </label>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">یادداشت کلی</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-gray-900 rounded-lg p-3 text-white min-h-[100px]"
                placeholder="یادداشت‌های کلی..."
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              onClick={() => setShowCreateDialog(false)}
              variant="outline"
              className="bg-[#0f0f0f] border-gray-900 text-gray-300 hover:text-white"
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              ثبت افیلیت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#0a0a0a] border border-gray-900 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold text-white">ویرایش افیلیت</DialogTitle>
            <DialogDescription className="text-right text-gray-400">
              اطلاعات افیلیت را ویرایش کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right text-gray-300 mb-2 block">نام</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="نام"
                />
              </div>
              <div>
                <Label className="text-right text-gray-300 mb-2 block">نام خانوادگی</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="نام خانوادگی"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right text-gray-300 mb-2 block">شماره تماس</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-[#0f0f0f] border-gray-900 text-white flex-1"
                    placeholder="09123456789"
                  />
                  {formData.phone && (
                    <Button
                      type="button"
                      onClick={() => window.open(`tel:${formData.phone}`, '_self')}
                      className="bg-green-600 hover:bg-green-500 text-white"
                      title="تماس"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-right text-gray-300 mb-2 block">ایمیل</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">لینک اینستاگرام</Label>
              <Input
                value={formData.instagram_link}
                onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
                className="bg-[#0f0f0f] border-gray-900 text-white"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">آیدی تلگرام</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.telegram_id}
                  onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white flex-1"
                  placeholder="@username یا username"
                  disabled={formData.telegram_id?.startsWith('http')}
                />
                {formData.telegram_id?.startsWith('http') ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      onClick={() => {
                        window.open(formData.telegram_id, '_blank', 'noopener,noreferrer');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
                    >
                      <MessageCircle className="h-4 w-4 ml-1" />
                      ارسال پیام
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Extract username from link
                        const match = formData.telegram_id.match(/t\.me\/(.+)/);
                        if (match) {
                          setFormData({ ...formData, telegram_id: match[1] });
                        } else {
                          setFormData({ ...formData, telegram_id: "" });
                        }
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2"
                      title="ویرایش"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (formData.telegram_id && !formData.telegram_id.startsWith('http')) {
                        const telegramLink = formData.telegram_id.startsWith('@') 
                          ? `https://t.me/${formData.telegram_id.slice(1)}`
                          : `https://t.me/${formData.telegram_id}`;
                        setFormData({ ...formData, telegram_id: telegramLink });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
                    disabled={!formData.telegram_id || formData.telegram_id.startsWith('http')}
                  >
                    <LinkIcon className="h-4 w-4 ml-1" />
                    تبدیل به لینک
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">لینک واتساپ</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                  className="bg-[#0f0f0f] border-gray-900 text-white flex-1"
                  placeholder="شماره تماس (مثلا: 989123456789) یا لینک واتساپ"
                  disabled={formData.whatsapp_link?.startsWith('http') || formData.whatsapp_link?.startsWith('wa.me')}
                />
                {formData.whatsapp_link?.startsWith('http') || formData.whatsapp_link?.startsWith('wa.me') ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      onClick={() => {
                        const link = formData.whatsapp_link?.startsWith('http') || formData.whatsapp_link?.startsWith('wa.me')
                          ? formData.whatsapp_link
                          : `https://wa.me/${formData.whatsapp_link.replace(/\D/g, '')}`;
                        window.open(link, '_blank', 'noopener,noreferrer');
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white whitespace-nowrap"
                    >
                      <MessageCircle className="h-4 w-4 ml-1" />
                      ارسال پیام
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Extract phone from link
                        const match = formData.whatsapp_link.match(/wa\.me\/(\d+)/);
                        if (match) {
                          setFormData({ ...formData, whatsapp_link: match[1] });
                        } else {
                          setFormData({ ...formData, whatsapp_link: "" });
                        }
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-2"
                      title="ویرایش"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (formData.whatsapp_link && !formData.whatsapp_link.startsWith('http') && !formData.whatsapp_link.startsWith('wa.me')) {
                        const phone = formData.whatsapp_link.replace(/\D/g, ''); // فقط اعداد
                        if (phone) {
                          setFormData({ ...formData, whatsapp_link: `https://wa.me/${phone}` });
                        }
                      }
                    }}
                    className="bg-green-600 hover:bg-green-500 text-white whitespace-nowrap"
                    disabled={!formData.whatsapp_link || formData.whatsapp_link.startsWith('http') || formData.whatsapp_link.startsWith('wa.me')}
                  >
                    <LinkIcon className="h-4 w-4 ml-1" />
                    تبدیل به لینک
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-right text-gray-300 mb-2 block">تعداد فالوور</Label>
                <Input
                  type="number"
                  value={formData.follower_count}
                  onChange={(e) => setFormData({ ...formData, follower_count: parseInt(e.target.value) || 0 })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-right text-gray-300 mb-2 block">محتوای مورد نیاز</Label>
                <Input
                  type="number"
                  value={formData.required_content}
                  onChange={(e) => setFormData({ ...formData, required_content: parseInt(e.target.value) || 0 })}
                  className="bg-[#0f0f0f] border-gray-900 text-white"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">وضعیت</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as AffiliateStatus })}
              >
                <SelectTrigger className="bg-[#0f0f0f] border-gray-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f0f] border-gray-900">
                  <SelectItem value="lead_pool">انبار لید</SelectItem>
                  <SelectItem value="meeting_negotiate">مذاکره برای جلسه</SelectItem>
                  <SelectItem value="waiting_meeting">منتظر برگزاری جلسه</SelectItem>
                  <SelectItem value="closing_contract">بستن قرار داد</SelectItem>
                  <SelectItem value="follow_up">پیگیری شروع همکاری</SelectItem>
                  <SelectItem value="active">افیلیت فعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === "active" && (
              <div>
                <Label className="text-right text-gray-300 mb-2 block">کاربر ادمین (برای افیلیت فعال)</Label>
                <Select
                  value={formData.admin_user_id?.toString() || "none"}
                  onValueChange={(value) => setFormData({ ...formData, admin_user_id: value === "none" ? undefined : parseInt(value) })}
                >
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-900 text-white">
                    <SelectValue placeholder="انتخاب کاربر ادمین" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f0f] border-gray-900">
                    <SelectItem value="none">بدون انتخاب</SelectItem>
                    {adminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="urgent_follow_up_edit"
                checked={formData.urgent_follow_up}
                onChange={(e) => setFormData({ ...formData, urgent_follow_up: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-red-500"
              />
              <label htmlFor="urgent_follow_up_edit" className="text-gray-300 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                نیاز به پیگیری فوری
              </label>
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">یادداشت کلی</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-gray-900 rounded-lg p-3 text-white min-h-[100px]"
                placeholder="یادداشت‌های کلی..."
              />
            </div>
            <div>
              <Label className="text-right text-gray-300 mb-2 block">یادداشت‌های وضعیت</Label>
              <div className="bg-[#0f0f0f] border border-gray-900 rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
                {statusNotes.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">
                    هنوز یادداشتی ثبت نشده
                  </div>
                ) : (
                  statusNotes.map((note, idx) => (
                    <div key={idx} className="text-sm text-gray-300 bg-white/5 rounded-lg p-2 border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {BOARD_COLUMNS.find(c => c.key === note.status)?.title || note.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {toPersianDigits(formatJalali(new Date(note.created_at), 'YYYY/MM/DD'))}
                        </span>
                      </div>
                      <div>{note.note}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newStatusNote}
                  onChange={(e) => setNewStatusNote(e.target.value)}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && editingAffiliate && newStatusNote.trim()) {
                      const noteToSend = newStatusNote;
                      setNewStatusNote("");
                      await handleAddStatusNote(editingAffiliate.id, noteToSend);
                    }
                  }}
                  placeholder="یادداشت جدید برای وضعیت فعلی..."
                  className="flex-1 bg-[#0f0f0f] border-gray-900 text-white"
                />
                <Button
                  onClick={async () => {
                    if (editingAffiliate && newStatusNote.trim()) {
                      const noteToSend = newStatusNote;
                      setNewStatusNote("");
                      await handleAddStatusNote(editingAffiliate.id, noteToSend);
                    }
                  }}
                  disabled={!newStatusNote.trim() || !editingAffiliate}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              onClick={() => {
                setShowEditDialog(false);
                setEditingAffiliate(null);
                resetForm();
                setStatusNotes([]);
                setNewStatusNote("");
              }}
              variant="outline"
              className="bg-[#0f0f0f] border-gray-900 text-gray-300 hover:text-white"
            >
              انصراف
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Affiliate Card Component for Board View
const AffiliateCard: React.FC<{
  affiliate: Affiliate;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: AffiliateStatus) => void;
  onAddNote: (note: string) => void;
  onToggleNotes: () => void;
  showNotes: boolean;
  changingStatus: boolean;
  statusOptions: AffiliateStatus[];
}> = ({ affiliate, onEdit, onDelete, onStatusChange, onAddNote, onToggleNotes, showNotes, changingStatus, statusOptions }) => {
  const [newNote, setNewNote] = useState("");
  const statusNotes: StatusNote[] = affiliate.status_notes ? (() => {
    try {
      return JSON.parse(affiliate.status_notes);
    } catch {
      return [];
    }
  })() : [];

  const currentIndex = statusOptions.indexOf(affiliate.status);
  const prevStatus = currentIndex > 0 ? statusOptions[currentIndex - 1] : null;
  const nextStatus = currentIndex < statusOptions.length - 1 ? statusOptions[currentIndex + 1] : null;

  const handleSendNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote);
      setNewNote("");
    }
  };

  return (
    <div className={cn(
      "w-full bg-gradient-to-b from-[#0c1224] via-[#060912] to-black/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3 shadow-[0_15px_35px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300",
      affiliate.urgent_follow_up 
        ? "border-2 border-red-500/50 hover:border-red-500/70" 
        : "border border-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-semibold text-white line-clamp-2 break-all overflow-hidden">
            {affiliate.first_name} {affiliate.last_name}
          </p>
          {affiliate.email && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{affiliate.email}</p>
          )}
          {affiliate.phone && (
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-gray-500 font-mono">{affiliate.phone}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`tel:${affiliate.phone}`, '_self')}
                className="h-4 w-4 text-green-400 hover:text-green-300 hover:bg-green-600/20 p-0"
                title="تماس"
              >
                <Phone className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-colors h-6 w-6"
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-colors h-6 w-6"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {affiliate.follower_count.toLocaleString('fa-IR')} فالوور
        </Badge>
        <Badge className="text-xs bg-teal-500/20 text-cyan-300 border border-teal-500/30">
          {affiliate.required_content.toLocaleString('fa-IR')} محتوا
        </Badge>
        {affiliate.status === "active" && (
          <Badge className="text-xs bg-green-500/20 text-green-300 border border-green-500/30">
            {affiliate.leads_count.toLocaleString('fa-IR')} لید
          </Badge>
        )}
      </div>

      {affiliate.urgent_follow_up && (
        <div className="flex items-center gap-1 text-xs text-red-300 bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1">
          <AlertCircle className="h-3 w-3" />
          نیاز به پیگیری فوری
        </div>
      )}

      <div className="flex flex-col gap-2">
        {affiliate.instagram_link && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const link = affiliate.instagram_link?.startsWith('http') 
                ? affiliate.instagram_link 
                : `https://${affiliate.instagram_link}`;
              window.open(link, '_blank', 'noopener,noreferrer');
            }}
            className="w-full text-xs h-7 bg-gradient-to-r from-[#187272]/20 to-[#26fce3]/20 hover:from-[#187272]/30 hover:to-[#26fce3]/30 text-cyan-300 hover:text-cyan-200 border border-[#26fce3]/30 hover:border-[#26fce3]/50 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-[#26fce3]/10"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>اینستاگرام</span>
          </Button>
        )}
        {affiliate.telegram_id && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const link = affiliate.telegram_id?.startsWith('http') 
                ? affiliate.telegram_id 
                : affiliate.telegram_id?.startsWith('@')
                ? `https://t.me/${affiliate.telegram_id.slice(1)}`
                : `https://t.me/${affiliate.telegram_id}`;
              window.open(link, '_blank', 'noopener,noreferrer');
            }}
            className="w-full text-xs h-7 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>تلگرام</span>
          </Button>
        )}
        {affiliate.whatsapp_link && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const link = affiliate.whatsapp_link?.startsWith('http') || affiliate.whatsapp_link?.startsWith('wa.me')
                ? affiliate.whatsapp_link
                : `https://wa.me/${affiliate.whatsapp_link.replace(/\D/g, '')}`;
              window.open(link, '_blank', 'noopener,noreferrer');
            }}
            className="w-full text-xs h-7 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-300 hover:text-green-200 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>واتساپ</span>
          </Button>
        )}
      </div>

      {affiliate.admin_user && (
        <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1">
          @{affiliate.admin_user.username}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleNotes}
        className="w-full text-xs h-7 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center gap-1"
      >
        <MessageSquare className="h-3 w-3" />
        یادداشت‌ها ({statusNotes.filter(n => n.status === affiliate.status).length})
      </Button>

      {showNotes && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="max-h-[120px] overflow-y-auto space-y-2">
            {statusNotes
              .filter(n => n.status === affiliate.status)
              .map((note, idx) => (
                <div key={idx} className="text-xs text-gray-300 bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-gray-500 text-[10px] mb-1">
                    {toPersianDigits(formatJalali(new Date(note.created_at), 'YYYY/MM/DD'))}
                  </div>
                  <div>{note.note}</div>
                </div>
              ))}
            {statusNotes.filter(n => n.status === affiliate.status).length === 0 && (
              <div className="text-xs text-gray-500 text-center py-2">
                هنوز یادداشتی ثبت نشده
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendNote()}
              placeholder="یادداشت جدید..."
              className="flex-1 h-7 text-xs bg-white/5 border-white/10 text-white"
            />
            <Button
              size="sm"
              onClick={handleSendNote}
              disabled={!newNote.trim()}
              className="h-7 px-2 bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        {prevStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(prevStatus)}
            disabled={changingStatus}
            className="flex-1 text-xs h-7 text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ChevronRight className="h-3 w-3 ml-1" />
            قبلی
          </Button>
        )}
        {nextStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(nextStatus)}
            disabled={changingStatus}
            className="flex-1 text-xs h-7 text-gray-400 hover:text-white hover:bg-white/10"
          >
            بعدی
            <ChevronLeft className="h-3 w-3 mr-1" />
          </Button>
        )}
        {!prevStatus && !nextStatus && (
          <div className="flex-1 text-center text-xs text-gray-500">
            {changingStatus ? "در حال تغییر..." : "وضعیت نهایی"}
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliatesManager;

