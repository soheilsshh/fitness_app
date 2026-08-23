import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Filter,
  LayoutGrid,
  Rows3,
  CheckCircle,
  Clock,
  Hash,
  Flag,
  FileText,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react";
import { UsePermissionsReturn } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { config } from "@/config/environment";
import { formatJalali, toPersianDigits } from "@/utils/jalali";
import PersianDatePicker from "./PersianDatePicker/index";
import AIChat from "./AIChat";

type ContentTaskStatus = "final_ideas" | "writing" | "pre_production" | "recording" | "editing" | "published";
type ContentTaskPriority = "low" | "medium" | "high" | "urgent";

export interface ContentTask {
  id: number;
  title: string;
  description?: string;
  status: ContentTaskStatus;
  priority: ContentTaskPriority;
  tags?: string[];
  creator_id: number;
  creator?: { id: number; username: string };
  due_date?: string | null;
  board_order: number;
  instagram_url?: string | null;
  twitter_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentManagerProps {
  permissions: UsePermissionsReturn;
  onBackToTasks?: () => void;
}

const CONTENT_BOARD_COLUMNS: Array<{ key: ContentTaskStatus; title: string; description: string }> = [
  { key: "final_ideas", title: "ایده‌های نهایی", description: "ایده‌های نهایی شده برای تولید محتوا" },
  { key: "writing", title: "نوشتن متن محتوا", description: "در حال نوشتن متن و محتوای اصلی" },
  { key: "pre_production", title: "تبدیل به سناریو قبل اجرا", description: "تبدیل ایده به سناریو و آماده‌سازی" },
  { key: "recording", title: "ضبط راش‌ها و صدا", description: "در حال ضبط محتوای صوتی و تصویری" },
  { key: "editing", title: "تدوین", description: "در حال تدوین و ویرایش نهایی" },
  { key: "published", title: "انتشار", description: "محتوای آماده و منتشر شده" },
];

const CONTENT_STATUS_FLOW: ContentTaskStatus[] = ["final_ideas", "writing", "pre_production", "recording", "editing", "published"];

const PRIORITY_META: Record<ContentTaskPriority, { label: string; color: string }> = {
  low: { label: "کم", color: "bg-slate-600" },
  medium: { label: "متوسط", color: "bg-blue-600" },
  high: { label: "زیاد", color: "bg-amber-500" },
  urgent: { label: "فوری", color: "bg-rose-600" },
};

const ContentManager: React.FC<ContentManagerProps> = ({ permissions, onBackToTasks }) => {
  const { username } = permissions;

  const [showAIChat, setShowAIChat] = useState(false);
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingTask, setEditingTask] = useState<ContentTask | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | ContentTaskPriority>("all");
  const [statusFilter, setStatusFilter] = useState<ContentTaskStatus | "all">("all");
  const [savingTask, setSavingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ContentTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterQuery, filterPriority, statusFilter]);

  const fetchTasks = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterQuery) params.append("search", filterQuery);
      if (filterPriority !== "all") params.append("priority", filterPriority);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`${API_URL}/admin/content-tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("خطا در دریافت لیست تسک‌های محتوا");
      }
      const data = await response.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err: any) {
      console.error("[ContentTasks] fetch error:", err);
      setError(err.message || "خطا در دریافت لیست تسک‌های محتوا");
    } finally {
      setLoading(false);
    }
  };


  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filterQuery) {
      const query = filterQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description || "").toLowerCase().includes(query),
      );
    }
    if (filterPriority !== "all") {
      result = result.filter((task) => task.priority === filterPriority);
    }
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }
    return result;
  }, [tasks, filterQuery, filterPriority, statusFilter]);

  const groupedByStatus = useMemo(() => {
    return CONTENT_BOARD_COLUMNS.reduce<Record<ContentTaskStatus, ContentTask[]>>((acc, column) => {
      acc[column.key] = filteredTasks.filter((task) => task.status === column.key);
      return acc;
    }, { final_ideas: [], writing: [], pre_production: [], recording: [], editing: [], published: [] });
  }, [filteredTasks]);

  const openCreateDrawer = () => {
    setEditingTask(null);
    setShowDrawer(true);
  };

  const openEditDrawer = (task: ContentTask) => {
    setEditingTask(task);
    setShowDrawer(true);
  };

  const handleSaveTask = async (payload: Record<string, any>) => {
    if (!token) return;
    setSavingTask(true);
    try {
      const isNewTask = !editingTask || !editingTask.id || editingTask.id === 0;
      const method = isNewTask ? "POST" : "PUT";
      const url = isNewTask ? `${API_URL}/admin/content-tasks` : `${API_URL}/admin/content-tasks/${editingTask.id}`;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "خطا در ذخیره تسک محتوا");
      }
      setShowDrawer(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err: any) {
      console.error("[ContentTasks] save error:", err);
      setError(err.message || "خطا در ذخیره تسک محتوا");
    } finally {
      setSavingTask(false);
    }
  };

  const handleStatusChange = async (task: ContentTask, status: ContentTaskStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/admin/content-tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, board_order: Date.now() }),
      });
      if (!res.ok) throw new Error("خطا در بروزرسانی وضعیت");
      fetchTasks();
    } catch (err) {
      console.error("[ContentTasks] status change error:", err);
    }
  };

  const handleDeleteTask = async (task: ContentTask) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete || !token) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/admin/content-tasks/${taskToDelete.id}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMessage = data.error || `خطا در حذف تسک محتوا (کد: ${res.status})`;
        throw new Error(errorMessage);
      }
      
      setTaskToDelete(null);
      fetchTasks();
      alert(`✅ تسک محتوا «${taskToDelete.title}» با موفقیت حذف شد`);
    } catch (err: any) {
      console.error("[ContentTasks] delete error:", err);
      alert(`❌ خطا در حذف تسک محتوا: ${err.message || "خطای ناشناخته"}`);
    } finally {
      setDeleting(false);
    }
  };

  // Show AI Chat if enabled
  if (showAIChat) {
    return <AIChat onBack={() => setShowAIChat(false)} />;
  }

  return (
    <div className="mt-8" dir="rtl">
      <Card className="bg-gradient-to-b from-[#0b1124] via-[#05060a] to-[#010205] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)] rounded-3xl overflow-hidden backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 px-6 py-6">
          <div>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="h-6 w-6 text-cyan-400" />
              حالت محتوا سازی
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2 text-sm leading-relaxed max-w-2xl">
              فضای شخصی شما برای مدیریت و تولید محتوا
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex flex-wrap gap-2 w-full">
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-2xl px-5 py-2.5 border border-white/10 shadow-sm transition-all duration-300 flex-1 sm:flex-none",
                  viewMode === "board"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/30 scale-[1.02]"
                    : "bg-white/5 text-gray-200 hover:bg-white/10",
                )}
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="h-4 w-4" />
                برد
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-2xl px-5 py-2.5 border border-white/10 shadow-sm transition-all duration-300 flex-1 sm:flex-none",
                  viewMode === "table"
                    ? "bg-gradient-to-r from-slate-600 to-slate-900 text-white shadow-slate-700/30 scale-[1.02]"
                    : "bg-white/5 text-gray-200 hover:bg-white/10",
                )}
                onClick={() => setViewMode("table")}
              >
                <Rows3 className="h-4 w-4" />
                لیست
              </Button>
              <Button
                onClick={openCreateDrawer}
                className="gap-2 rounded-2xl px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400 flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                تسک محتوا جدید
              </Button>
              <Button
                onClick={() => setShowAIChat(true)}
                className="gap-2 rounded-2xl px-5 py-2.5 bg-gradient-to-r from-[#187272] to-[#26fce3] text-white shadow-[#26fce3]/20 hover:from-[#2a9c96] hover:to-[#58cac0] flex-1 sm:flex-none"
              >
                <Bot className="h-4 w-4" />
                چت با هوش مصنوعی
              </Button>
            </div>
            {onBackToTasks && (
              <div className="flex gap-2">
                <button
                  onClick={onBackToTasks}
                  className="flex-1 rounded-xl px-3 py-2 text-xs font-medium border border-white/10 transition-all bg-gradient-to-r from-[#187272] to-[#26fce3] text-white shadow shadow-[#26fce3]/20 hover:from-[#2a9c96] hover:to-[#58cac0]"
                >
                  بازگشت به مدیریت تسک‌های تیم
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Filter className="h-4 w-4 text-cyan-400" /> جستجو
              </label>
              <Input
                placeholder="جستجو بین تسک‌های محتوا..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-black/30 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-cyan-500/40"
              />
            </div>
            <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Flag className="h-4 w-4 text-rose-400" /> اولویت
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "low", "medium", "high", "urgent"] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setFilterPriority(priority)}
                    className={cn(
                      "flex-1 min-w-[90px] rounded-xl border border-white/10 px-3 py-2 text-xs font-medium transition-all duration-300",
                      filterPriority === priority
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20"
                        : "bg-white/5 text-gray-200 hover:bg-white/10",
                    )}
                  >
                    {priority === "all" ? "همه" : PRIORITY_META[priority].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Hash className="h-4 w-4 text-teal-300" /> وضعیت
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["all", ...CONTENT_BOARD_COLUMNS.map((c) => c.key)] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-medium border border-white/10 transition-all",
                      statusFilter === status
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow shadow-cyan-500/30"
                        : "bg-white/5 text-gray-200 hover:bg-white/10",
                    )}
                  >
                    {status === "all" ? "همه" : CONTENT_BOARD_COLUMNS.find((c) => c.key === status)?.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">در حال بارگذاری تسک‌های محتوا...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl bg-white/5">
              <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 text-sm">هیچ تسک محتوایی با این فیلترها یافت نشد</p>
              <Button onClick={openCreateDrawer} className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white">
                تسک محتوا جدید اضافه کنید
              </Button>
            </div>
          ) : viewMode === "board" ? (
            <div className="overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-4 min-w-max">
                {CONTENT_BOARD_COLUMNS.map((column) => (
                  <div
                    key={column.key}
                    className="flex flex-col min-w-[280px] max-w-[280px] lg:min-w-0 lg:max-w-none lg:flex-1 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 rounded-3xl p-4 h-[600px] max-h-[600px] snap-start shadow-[0_10px_25px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
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
                      {column.key === "final_ideas" && (
                        <div className="flex-shrink-0">
                          <Button
                            onClick={openCreateDrawer}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 border-0"
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            ایده جدید
                          </Button>
                        </div>
                      )}
                      {groupedByStatus[column.key].length === 0 ? (
                        <div className="flex-shrink-0 text-center text-xs text-gray-500 bg-white/5 border border-white/10 rounded-2xl py-6">
                          {column.key === "final_ideas" ? "هنوز ایده‌ای ثبت نشده" : "تسکی در این ستون نیست"}
                        </div>
                      ) : (
                        groupedByStatus[column.key].map((task) => (
                          <ContentTaskCard
                            key={task.id}
                            task={task}
                            onEdit={() => openEditDrawer(task)}
                            onDelete={() => handleDeleteTask(task)}
                            onStatusChange={handleStatusChange}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/30 shadow-inner">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 text-gray-300 bg-white/5">
                    <TableHead className="text-right">عنوان</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">اولویت</TableHead>
                    <TableHead className="text-right">مهلت</TableHead>
                    <TableHead className="text-right">آخرین بروزرسانی</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id} className="border-white/5 text-gray-200 hover:bg-white/10 transition-colors">
                      <TableCell className="whitespace-pre-line">
                        <div className="font-semibold text-white">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-gray-400 line-clamp-2 mt-1">{task.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-white/10 border-white/10 text-white">
                          {CONTENT_BOARD_COLUMNS.find((col) => col.key === task.status)?.title || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border-0", PRIORITY_META[task.priority].color)}>
                          {PRIORITY_META[task.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 whitespace-nowrap sm:whitespace-normal">
                        {task.due_date ? toPersianDigits(formatJalali(new Date(task.due_date), 'YYYY/MM/DD')) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {toPersianDigits(formatJalali(new Date(task.updated_at), 'YYYY/MM/DD'))}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="text-xs text-white border-white/10 bg-white/5 hover:bg-white/10"
                            onClick={() => openEditDrawer(task)}
                          >
                            ویرایش
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteTask(task)}
                          >
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ContentTaskDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        onSubmit={handleSaveTask}
        saving={savingTask}
        task={editingTask}
      />

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" 
          onClick={() => !deleting && setTaskToDelete(null)}
          dir="rtl"
        >
          <Card 
            className="w-full max-w-md bg-[#0b1124] border border-red-500/30 shadow-2xl shadow-red-500/20 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 flex-shrink-0">
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white text-base sm:text-lg">حذف تسک محتوا</CardTitle>
                  <CardDescription className="text-gray-400 mt-1 text-xs sm:text-sm">
                    این عمل غیرقابل بازگشت است
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-300 mb-2">
                  آیا مطمئن هستید که می‌خواهید این تسک محتوا را حذف کنید؟
                </p>
                <p className="text-white font-semibold text-sm sm:text-base break-words">
                  {taskToDelete.title}
                </p>
                {taskToDelete.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 break-words">
                    {taskToDelete.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={cn("text-xs", PRIORITY_META[taskToDelete.priority].color)}>
                    {PRIORITY_META[taskToDelete.priority].label}
                  </Badge>
                  <Badge className="text-xs bg-white/10 border-white/10 text-white">
                    {CONTENT_BOARD_COLUMNS.find((col) => col.key === taskToDelete.status)?.title || "—"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-gray-300 hover:text-white text-sm sm:text-base h-9 sm:h-10 order-2 sm:order-1"
                  onClick={() => setTaskToDelete(null)}
                  disabled={deleting}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm sm:text-base h-9 sm:h-10 order-1 sm:order-2"
                  onClick={confirmDeleteTask}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 ml-2 animate-spin" />
                      <span className="text-xs sm:text-sm">در حال حذف...</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      <span className="text-xs sm:text-sm">حذف تسک محتوا</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const ContentTaskCard: React.FC<{
  task: ContentTask;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (task: ContentTask, status: ContentTaskStatus) => void;
}> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const index = CONTENT_STATUS_FLOW.indexOf(task.status);
  const prevStatus = index > 0 ? CONTENT_STATUS_FLOW[index - 1] : null;
  const nextStatus = index < CONTENT_STATUS_FLOW.length - 1 ? CONTENT_STATUS_FLOW[index + 1] : null;

  return (
    <div className={cn(
      "w-full bg-gradient-to-b from-[#0c1224] via-[#060912] to-black/60 rounded-2xl p-4 space-y-4 shadow-[0_15px_35px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300",
      task.status === "published" 
        ? "border-2 border-green-500/50 shadow-green-500/20" 
        : "border border-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-semibold text-white line-clamp-2 break-all overflow-hidden">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 break-all overflow-hidden">{task.description}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 transition-colors" onClick={onEdit}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge className={cn("text-xs px-2 py-0.5 border-0", PRIORITY_META[task.priority].color)}>
          {PRIORITY_META[task.priority].label}
        </Badge>
        {task.tags?.map((tag) => (
          <Badge key={tag} className="text-xs bg-white/5 border border-white/10 text-gray-200">
            #{tag}
          </Badge>
        ))}
      </div>
      {task.due_date && (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-300" />
          {toPersianDigits(formatJalali(new Date(task.due_date), 'YYYY/MM/DD'))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-gray-500">
          آخرین بروزرسانی {toPersianDigits(formatJalali(new Date(task.updated_at), 'YYYY/MM/DD'))}
        </div>
        <div className="flex items-center gap-1">
          {prevStatus && (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => onStatusChange(task, prevStatus)}
              title="مرحله قبل"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {nextStatus && (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => onStatusChange(task, nextStatus)}
              title="مرحله بعد"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            onClick={onDelete}
            title="حذف"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ContentTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, any>) => void;
  saving: boolean;
  task: ContentTask | null;
}

const ContentTaskDrawer: React.FC<ContentTaskDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  saving,
  task,
}) => {
  const initialForm = {
    title: "",
    description: "",
    status: "final_ideas" as ContentTaskStatus,
    priority: "medium" as ContentTaskPriority,
    due_date: "",
    tags: "",
    instagram_url: "",
    twitter_url: "",
    tiktok_url: "",
    youtube_url: "",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
        tags: task.tags?.join(", ") || "",
        instagram_url: task.instagram_url || "",
        twitter_url: task.twitter_url || "",
        tiktok_url: task.tiktok_url || "",
        youtube_url: task.youtube_url || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      instagram_url: form.instagram_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
    };
    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto" dir="rtl" onClick={onClose}>
      <Card 
        className="w-full max-w-2xl bg-[#0b1124] border border-white/10 shadow-2xl shadow-black/60 my-auto max-h-[95vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 p-4 sm:p-6">
          <div className="flex-1 min-w-0 pr-2">
            <CardTitle className="text-white text-base sm:text-lg truncate">
              {task ? "ویرایش تسک محتوا" : "تسک محتوا جدید"}
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">
              {task ? "اطلاعات این تسک محتوا را بروزرسانی کنید" : "ایده یا تسک محتوایی جدید برای تولید محتوا تعریف کنید"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white flex-shrink-0" onClick={onClose}>
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-300">عنوان *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="bg-white/5 border-white/10 text-white text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-300">توضیحات</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-white/5 border-white/10 text-white min-h-[80px] sm:min-h-[120px] text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm text-gray-300">وضعیت</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ContentTaskStatus }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base h-9 sm:h-10"
                >
                  {CONTENT_BOARD_COLUMNS.map((col) => (
                    <option key={col.key} value={col.key} className="bg-slate-900 text-white">
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm text-gray-300">اولویت</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as ContentTaskPriority }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base h-9 sm:h-10"
                >
                  {(["low", "medium", "high", "urgent"] as ContentTaskPriority[]).map((priority) => (
                    <option key={priority} value={priority} className="bg-slate-900 text-white">
                      {PRIORITY_META[priority].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-300">مهلت انجام</label>
              <PersianDatePicker
                value={form.due_date ? new Date(form.due_date + 'T00:00:00') : undefined}
                onChange={(date) => {
                  if (date) {
                    const isoString = date.toISOString().split('T')[0];
                    setForm((prev) => ({ ...prev, due_date: isoString }));
                  } else {
                    setForm((prev) => ({ ...prev, due_date: "" }));
                  }
                }}
                placeholder="انتخاب تاریخ مهلت انجام"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-gray-300">برچسب‌ها</label>
              <Input
                placeholder="مثال: ویدیو, پادکست, مقاله"
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                className="bg-white/5 border-white/10 text-white text-sm sm:text-base h-9 sm:h-10"
              />
              <p className="text-xs text-gray-500">برچسب‌ها را با کاما جدا کنید</p>
            </div>
            <div className="space-y-3 sm:space-y-4 pt-2 border-t border-white/10">
              <h3 className="text-sm sm:text-base font-semibold text-gray-300">آدرس‌های شبکه‌های اجتماعی</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm text-gray-300">آدرس اینستاگرام</label>
                  <Input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={form.instagram_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, instagram_url: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm text-gray-300">آدرس توییتر</label>
                  <Input
                    type="url"
                    placeholder="https://twitter.com/..."
                    value={form.twitter_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, twitter_url: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm text-gray-300">آدرس تیک تاک</label>
                  <Input
                    type="url"
                    placeholder="https://tiktok.com/..."
                    value={form.tiktok_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, tiktok_url: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm text-gray-300">آدرس یوتیوب</label>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={form.youtube_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, youtube_url: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                className="text-gray-300 hover:text-white w-full sm:w-auto order-2 sm:order-1 text-sm sm:text-base h-9 sm:h-10"
                onClick={onClose}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base h-9 sm:h-10"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 ml-2 animate-spin" />
                    <span className="text-xs sm:text-sm">در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    <span className="text-xs sm:text-sm">ذخیره تسک محتوا</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentManager;

