import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Phone, Clock, CalendarDays, CheckCircle, XCircle, Eye, X, RefreshCw, Info } from "lucide-react";
import PersianDatePicker from './PersianDatePicker/index';
import { formatJalali, toPersianDigits } from '@/utils/jalali';
import { config } from '@/config/environment';

interface AvanakMessage {
  id?: number;
  name: string;
  message_id: number;
  is_active: boolean;
  send_type: "automatic" | "scheduled";
  scheduled_at?: string; // ISO string
  send_hour?: number;
  send_minute?: number;
  registration_time_range: string;
  registration_start_hour?: number;
  registration_end_hour?: number;
  last_sent_at?: string;
  auto_cycle_enabled?: boolean; // فعال بودن چرخه خودکار 24 ساعته
  created_at?: string;
  updated_at?: string;
}

interface AvanakMessageLog {
  id: number;
  avanak_message_id: number;
  recipient: string;
  status: string;
  error_message: string;
  sent_at: string;
}

const AvanakMessageManager: React.FC = () => {
  const [messages, setMessages] = useState<AvanakMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AvanakMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [logs, setLogs] = useState<AvanakMessageLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  // Use a map to store test phone for each message separately
  const [testPhones, setTestPhones] = useState<Record<number, string>>({});
  const [testing, setTesting] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<Record<number, boolean>>({});
  const [showAutoCycleInfo, setShowAutoCycleInfo] = useState<number | null>(null);
  const [autoCycleInfo, setAutoCycleInfo] = useState<any>(null);
  const [loadingCycleInfo, setLoadingCycleInfo] = useState(false);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/avanak-messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch Avanak messages:", error);
      alert("خطا در دریافت پیام‌ها");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (messageId: number) => {
    try {
      const response = await fetch(`${API_URL}/admin/avanak-messages/${messageId}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data.logs || []);
      setSelectedMessage(messageId);
      setShowLogs(true);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      alert("خطا در دریافت لاگ‌ها");
    }
  };

  const handleSave = async (message: AvanakMessage) => {
    setSaving(true);
    try {
      const url = message.id
        ? `${API_URL}/admin/avanak-messages/${message.id}`
        : `${API_URL}/admin/avanak-messages`;
      const method = message.id ? "PUT" : "POST";

      // Prepare request body
      const body: any = {
        name: message.name,
        message_id: message.message_id,
        is_active: message.is_active,
        send_type: message.send_type,
        registration_time_range: message.registration_time_range || "all",
        registration_start_hour: message.registration_start_hour,
        registration_end_hour: message.registration_end_hour,
      };

      if (message.send_type === "scheduled" && message.scheduled_at) {
        body.scheduled_at = message.scheduled_at;
        // Clear automatic fields when using scheduled
        body.send_hour = null;
        body.send_minute = null;
      } else if (message.send_type === "automatic") {
        // Always send send_hour and send_minute, even if they are 0 (0 is valid for midnight)
        if (message.send_hour !== undefined && message.send_hour !== null) {
          body.send_hour = message.send_hour;
        } else {
          body.send_hour = 14; // Default if not provided
        }
        if (message.send_minute !== undefined && message.send_minute !== null) {
          body.send_minute = message.send_minute;
        } else {
          body.send_minute = 0; // Default if not provided
        }
        // Clear scheduled_at when using automatic
        body.scheduled_at = null;
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
        throw new Error(errorData.error || "Failed to save message");
      }

      const savedMessage = await response.json();
      await fetchMessages();
      setShowAddModal(false);
      setEditingMessage(null);
      alert("✅ پیام با موفقیت ذخیره شد");
    } catch (error: any) {
      console.error("Failed to save message:", error);
      alert("❌ خطا در ذخیره پیام: " + (error.message || "خطای ناشناخته"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این پیام مطمئن هستید؟")) return;

    try {
      const response = await fetch(`${API_URL}/admin/avanak-messages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete message");
      }

      await fetchMessages();
      alert("✅ پیام با موفقیت حذف شد");
    } catch (error: any) {
      console.error("Failed to delete message:", error);
      alert("❌ خطا در حذف پیام: " + (error.message || "خطای ناشناخته"));
    }
  };

  const handleTest = async (messageId: number) => {
    const testPhone = testPhones[messageId] || "";
    
    if (!testPhone) {
      alert("لطفاً شماره تلفن را وارد کنید");
      return;
    }

    setTesting({ ...testing, [messageId]: true });
    try {
      const response = await fetch(`${API_URL}/admin/avanak-messages/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message_id: messageId,
          phone: testPhone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send test voice call");
      }

      alert("✅ تماس صوتی تست با موفقیت ارسال شد");
      // Clear test phone for this specific message
      setTestPhones({ ...testPhones, [messageId]: "" });
    } catch (error: any) {
      console.error("Failed to send test voice call:", error);
      alert("❌ خطا در ارسال تماس صوتی تست: " + (error.message || "خطای ناشناخته"));
    } finally {
      setTesting({ ...testing, [messageId]: false });
    }
  };

  const handleToggleAutoCycle = async (messageId: number) => {
    setToggling({ ...toggling, [messageId]: true });
    try {
      const response = await fetch(`${API_URL}/admin/avanak-messages/${messageId}/toggle-auto-cycle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to toggle auto cycle");
      }

      const updatedMessage = await response.json();
      // Update the message in the list
      setMessages(messages.map(msg => msg.id === messageId ? updatedMessage : msg));
      alert(updatedMessage.auto_cycle_enabled ? "✅ چرخه خودکار فعال شد" : "✅ چرخه خودکار غیرفعال شد");
    } catch (error: any) {
      console.error("Failed to toggle auto cycle:", error);
      alert("❌ خطا در تغییر وضعیت چرخه خودکار: " + (error.message || "خطای ناشناخته"));
    } finally {
      setToggling({ ...toggling, [messageId]: false });
    }
  };

  const fetchAutoCycleInfo = async (messageId: number) => {
    if (!messageId) {
      console.error("Message ID is required");
      return;
    }
    
    if (!token) {
      alert("❌ خطا: شما وارد سیستم نشده‌اید. لطفاً دوباره وارد شوید.");
      return;
    }
    
    // Open modal immediately with loading state
    setShowAutoCycleInfo(messageId);
    setAutoCycleInfo(null); // Clear previous data
    setLoadingCycleInfo(true);
    
    try {
      const url = `${API_URL}/admin/avanak-messages/${messageId}/auto-cycle-info`;
      console.log("Fetching auto cycle info from:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text().catch(() => "");
            if (errorText) errorMessage = errorText;
          } catch (textError) {
            // Ignore text parsing error
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Auto cycle info received:", data);
      console.log("auto_cycle_enabled:", data.auto_cycle_enabled);
      setAutoCycleInfo(data);
    } catch (error: any) {
      console.error("Failed to fetch auto cycle info:", error);
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("❌ خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
      } else {
        alert("❌ خطا در دریافت اطلاعات چرخه: " + (error.message || "خطای ناشناخته"));
      }
    } finally {
      setLoadingCycleInfo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Phone className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">مدیریت پیام‌های Avanak (تماس صوتی)</h3>
            <p className="text-sm text-gray-400 mt-1">مدیریت و پیکربندی تماس‌های صوتی خودکار</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingMessage(null);
            setShowAddModal(true);
          }}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300"
        >
          <Plus className="ml-2 h-4 w-4" />
          افزودن پیام جدید
        </Button>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card className="bg-white/5 border border-white/10 rounded-2xl">
            <CardContent className="p-6 text-center text-gray-400">
              هیچ پیامی وجود ندارد
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold">{message.name}</h4>
                      {message.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>شناسه پیام: {message.message_id}</div>
                      <div>
                        نوع ارسال: {message.send_type === "automatic" ? "خودکار" : "زمان‌بندی شده"}
                      </div>
                      {message.send_type === "automatic" && message.send_hour !== null && message.send_minute !== null && (
                        <div>
                          زمان ارسال: {String(message.send_hour).padStart(2, "0")}:
                          {String(message.send_minute).padStart(2, "0")}
                        </div>
                      )}
                      {message.send_type === "scheduled" && message.scheduled_at && (
                        <div>
                          تاریخ ارسال: {toPersianDigits(formatJalali(new Date(message.scheduled_at), 'YYYY/MM/DD HH:mm'))}
                        </div>
                      )}
                      <div className="text-sm">
                        <div className="text-gray-400">بازه تاریخ: <span className="text-white">{message.registration_time_range === "all" ? "همه" : message.registration_time_range === "today" ? "امروز" : message.registration_time_range === "yesterday" ? "دیروز" : message.registration_time_range === "week" ? "این هفته" : message.registration_time_range === "last_week" ? "هفته گذشته" : message.registration_time_range === "month" ? "این ماه" : message.registration_time_range === "last_month" ? "ماه گذشته" : message.registration_time_range}</span></div>
                        {message.registration_start_hour !== undefined && message.registration_end_hour !== undefined && (
                          <div className="text-gray-400 mt-1">
                            بازه ساعت: <span className="text-white">
                              {message.registration_start_hour <= message.registration_end_hour
                                ? `${String(message.registration_start_hour).padStart(2, "0")}:00 - ${String(message.registration_end_hour).padStart(2, "0")}:00`
                                : `${String(message.registration_start_hour).padStart(2, "0")}:00 - ${String(message.registration_end_hour).padStart(2, "0")}:00 (روز بعد)`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      {message.last_sent_at && (
                        <div className="text-gray-400">
                          آخرین ارسال: {toPersianDigits(formatJalali(new Date(message.last_sent_at), 'YYYY/MM/DD HH:mm'))}
                        </div>
                      )}
                      {message.auto_cycle_enabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-900/50 text-green-400 border border-green-700">
                            <RefreshCw className="h-3 w-3" />
                            چرخه خودکار فعال
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              fetchAutoCycleInfo(message.id!);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            title="مشاهده جزئیات چرخه خودکار"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingMessage(message);
                        setShowAddModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      <Edit className="ml-1 h-3 w-3" />
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => fetchLogs(message.id!)}
                      className="bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      <Eye className="ml-1 h-3 w-3" />
                      لاگ‌ها
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(message.id!)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      <Trash2 className="ml-1 h-3 w-3" />
                      حذف
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleToggleAutoCycle(message.id!)}
                      disabled={toggling[message.id!]}
                      className={`${
                        message.auto_cycle_enabled 
                          ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                          : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                      } text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50`}
                    >
                      {toggling[message.id!] ? (
                        <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="ml-1 h-3 w-3" />
                      )}
                      {message.auto_cycle_enabled ? "غیرفعال کردن چرخه" : "فعال کردن چرخه"}
                    </Button>
                  </div>
                </div>

                {/* Test Section */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="شماره تلفن تست"
                      value={testPhones[message.id!] || ""}
                      onChange={(e) => setTestPhones({ ...testPhones, [message.id!]: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleTest(message.id!)}
                      disabled={testing[message.id!] || !testPhones[message.id!]}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {testing[message.id!] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Phone className="ml-1 h-4 w-4" />
                          تست تماس صوتی
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AvanakMessageForm
          message={editingMessage}
          onSave={handleSave}
          onClose={() => {
            setShowAddModal(false);
            setEditingMessage(null);
          }}
          saving={saving}
        />
      )}

      {/* Logs Modal */}
      {showLogs && selectedMessage && (
        <LogsModal
          logs={logs}
          onClose={() => {
            setShowLogs(false);
            setSelectedMessage(null);
          }}
        />
      )}

      {/* Auto Cycle Info Modal */}
      {showAutoCycleInfo && (
        <AutoCycleInfoModal
          messageId={showAutoCycleInfo}
          info={autoCycleInfo}
          loading={loadingCycleInfo}
          onClose={() => {
            setShowAutoCycleInfo(null);
            setAutoCycleInfo(null);
          }}
          onRefresh={() => fetchAutoCycleInfo(showAutoCycleInfo)}
        />
      )}
    </div>
  );
};

// Avanak Message Form Component
interface AvanakMessageFormProps {
  message: AvanakMessage | null;
  onSave: (message: AvanakMessage) => void;
  onClose: () => void;
  saving: boolean;
}

const AvanakMessageForm: React.FC<AvanakMessageFormProps> = ({ message, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState<AvanakMessage>({
    name: message?.name || "",
    message_id: message?.message_id || 0,
    is_active: message?.is_active ?? true,
    send_type: message?.send_type || "automatic",
    scheduled_at: message?.scheduled_at,
    send_hour: message?.send_hour !== undefined && message?.send_hour !== null ? message.send_hour : 14,
    send_minute: message?.send_minute !== undefined && message?.send_minute !== null ? message.send_minute : 0,
    registration_time_range: message?.registration_time_range || "all",
    registration_start_hour: message?.registration_start_hour,
    registration_end_hour: message?.registration_end_hour,
    ...(message?.id && { id: message.id }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      <Card className="bg-[#0A0F1E]/95 border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl animate-slideUp">
        <CardHeader className="sticky top-0 bg-gradient-to-r from-white/5 to-transparent z-10 border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-white text-xl font-bold">
              {message ? "ویرایش پیام" : "افزودن پیام جدید"}
            </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all duration-300">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نام پیام</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">شناسه پیام Avanak (Message ID)</label>
              <Input
                type="number"
                value={formData.message_id}
                onChange={(e) => setFormData({ ...formData, message_id: parseInt(e.target.value) || 0 })}
                required
                className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
              <label className="text-gray-300 text-sm font-medium">فعال</label>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نوع ارسال</label>
              <select
                value={formData.send_type}
                onChange={(e) => setFormData({ ...formData, send_type: e.target.value as "automatic" | "scheduled" })}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
              >
                <option value="automatic">خودکار</option>
                <option value="scheduled">زمان‌بندی شده</option>
              </select>
            </div>

            {formData.send_type === "automatic" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">ساعت ارسال</label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.send_hour ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setFormData({ ...formData, send_hour: isNaN(value) ? 0 : value });
                    }}
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">دقیقه ارسال</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.send_minute ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setFormData({ ...formData, send_minute: isNaN(value) ? 0 : value });
                    }}
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">تاریخ و زمان ارسال</label>
                <PersianDatePicker
                  value={formData.scheduled_at ? new Date(formData.scheduled_at) : null}
                  onChange={(date) => setFormData({ ...formData, scheduled_at: date ? date.toISOString() : undefined })}
                  showTime={true}
                  placeholder="تاریخ و زمان را انتخاب کنید"
                  className="w-full"
                />
              </div>
            )}

            <div className="border-t border-white/10 pt-6">
              <label className="block text-gray-300 text-sm mb-2 font-semibold">بازه زمانی ثبت‌نام</label>
              <p className="text-gray-400 text-xs mb-4">پیام فقط به کسانی ارسال می‌شود که در این بازه زمانی ثبت‌نام کرده‌اند</p>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">بازه تاریخ ثبت‌نام</label>
                <select
                  value={formData.registration_time_range}
                  onChange={(e) => setFormData({ ...formData, registration_time_range: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
                >
                  <option value="all">همه (بدون محدودیت تاریخ)</option>
                  <option value="today">امروز</option>
                  <option value="yesterday">دیروز</option>
                  <option value="week">این هفته</option>
                  <option value="last_week">هفته گذشته</option>
                  <option value="month">این ماه</option>
                  <option value="last_month">ماه گذشته</option>
                </select>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="block text-gray-300 text-sm mb-2 font-semibold">بازه ساعت ثبت‌نام (اختیاری - برای فیلتر دقیق‌تر)</label>
                <p className="text-gray-400 text-xs mb-3">
                  می‌توانید بازه ساعت ثبت‌نام را محدود کنید (مثلاً فقط کسانی که بین 17:00 تا 23:00 ثبت‌نام کرده‌اند)
                  <br />
                  <span className="text-yellow-400">نکته:</span> اگر هر دو فیلد خالی باشد، محدودیت ساعت اعمال نمی‌شود
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-xs font-medium mb-2">ساعت شروع (0-23)</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="مثلاً 17 (5 عصر)"
                      value={formData.registration_start_hour ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                        setFormData({ 
                          ...formData, 
                          registration_start_hour: value === undefined || isNaN(value) ? undefined : Math.max(0, Math.min(23, value || 0))
                        });
                      }}
                      className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs font-medium mb-2">ساعت پایان (0-23)</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="مثلاً 23 (11 شب)"
                      value={formData.registration_end_hour ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                        setFormData({ 
                          ...formData, 
                          registration_end_hour: value === undefined || isNaN(value) ? undefined : Math.max(0, Math.min(23, value || 0))
                        });
                      }}
                      className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:bg-white/10"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-gray-300 text-xs">
                    {formData.registration_start_hour !== undefined && formData.registration_end_hour !== undefined 
                      ? (
                        formData.registration_start_hour <= formData.registration_end_hour
                          ? `✅ ارسال به کسانی که بین ساعت ${String(formData.registration_start_hour).padStart(2, "0")}:00 تا ${String(formData.registration_end_hour).padStart(2, "0")}:00 ثبت‌نام کرده‌اند`
                          : `✅ ارسال به کسانی که بین ساعت ${String(formData.registration_start_hour).padStart(2, "0")}:00 تا ${String(formData.registration_end_hour).padStart(2, "0")}:00 (روز بعد) ثبت‌نام کرده‌اند (بازه از نیمه‌شب عبور می‌کند)`
                      )
                      : formData.registration_start_hour === undefined && formData.registration_end_hour === undefined
                      ? "ℹ️ هیچ محدودیت ساعتی اعمال نمی‌شود - به همه کسانی که در بازه تاریخ انتخاب شده ثبت‌نام کرده‌اند ارسال می‌شود"
                      : "⚠️ لطفاً هر دو فیلد ساعت را پر کنید یا هر دو را خالی بگذارید"
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <Button type="button" onClick={onClose} className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300">
                انصراف
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50">
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  "ذخیره"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Logs Modal Component
interface LogsModalProps {
  logs: AvanakMessageLog[];
  onClose: () => void;
}

const LogsModal: React.FC<LogsModalProps> = ({ logs, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      <Card className="bg-[#0A0F1E]/95 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl animate-slideUp">
        <CardHeader className="sticky top-0 bg-gradient-to-r from-white/5 to-transparent z-10 border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-white text-xl font-bold">لاگ‌های ارسال</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all duration-300">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {logs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">لاگی وجود ندارد</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border ${
                    log.status === "sent" ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">{log.recipient}</span>
                        {log.status === "sent" ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-300">
                        {toPersianDigits(formatJalali(new Date(log.sent_at), 'YYYY/MM/DD HH:mm:ss'))}
                      </div>
                      {log.error_message && (
                        <div className="text-sm text-red-400 mt-1">{log.error_message}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Auto Cycle Info Modal Component
interface AutoCycleInfoModalProps {
  messageId: number;
  info: any;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const AutoCycleInfoModal: React.FC<AutoCycleInfoModalProps> = ({ messageId, info, loading, onClose, onRefresh }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      <Card className="bg-[#0A0F1E]/95 border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl animate-slideUp">
        <CardHeader className="sticky top-0 bg-gradient-to-r from-white/5 to-transparent z-10 border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-white text-xl font-bold">جزئیات چرخه خودکار</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all duration-300">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all duration-300">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : !info ? (
            <div className="text-center py-12 text-gray-400">
              خطا در دریافت اطلاعات چرخه
            </div>
          ) : !info.auto_cycle_enabled ? (
            <div className="space-y-4">
              <Card className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-yellow-400" />
                    چرخه خودکار فعال نیست
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300">
                    <p className="mb-2">{info.message || "چرخه خودکار برای این پیام فعال نیست"}</p>
                    {info.message_info && (
                      <div className="mt-4 text-sm space-y-1">
                        <div>نام پیام: <span className="text-white font-semibold">{info.message_info.name}</span></div>
                        {info.message_info.send_hour !== null && info.message_info.send_minute !== null ? (
                          <div>زمان ارسال: <span className="text-white font-semibold">{String(info.message_info.send_hour).padStart(2, "0")}:{String(info.message_info.send_minute).padStart(2, "0")}</span></div>
                        ) : (
                          <div className="text-yellow-400">⚠️ زمان ارسال تنظیم نشده است</div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Logic Explanation */}
              <Card className="bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-400" />
                    منطق چرخه خودکار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                    {info.logic_explanation}
                  </div>
                </CardContent>
              </Card>

              {/* Current Cycle */}
              <Card className="bg-white/5 border border-white/10 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    {info.current_cycle.is_sent ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-400" />
                    )}
                    چرخه فعلی {info.current_cycle.is_sent ? "(ارسال شده)" : "(در انتظار ارسال)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1">شروع چرخه:</div>
                      <div className="text-white font-mono">{info.current_cycle.cycle_start}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">پایان چرخه:</div>
                      <div className="text-white font-mono">{info.current_cycle.cycle_end}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">وضعیت:</div>
                      <div className={`font-semibold ${info.current_cycle.is_sent ? 'text-green-400' : 'text-yellow-400'}`}>
                        {info.current_cycle.is_sent ? '✅ ارسال شده' : '⏳ در انتظار ارسال'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">تعداد کاربران:</div>
                      <div className="text-white font-bold">{info.current_cycle.sent_count} نفر</div>
                    </div>
                    {info.current_cycle.is_sent && info.current_cycle.sent_at && (
                      <div className="col-span-2">
                        <div className="text-gray-400 mb-1">زمان ارسال:</div>
                        <div className="text-white font-mono">{info.current_cycle.sent_at}</div>
                      </div>
                    )}
                  </div>

                  {/* Users List - Pending or Received */}
                  {info.current_cycle.pending_users && Array.isArray(info.current_cycle.pending_users) && info.current_cycle.pending_users.length > 0 && (
                    <div className="mt-4">
                      <div className="text-gray-300 font-semibold mb-3 text-sm">
                        {info.current_cycle.is_sent ? (
                          <>کاربران دریافت‌کننده ({info.current_cycle.pending_users.length} نفر از {info.current_cycle.total_users_in_cycle || info.current_cycle.pending_users.length} نفر):</>
                        ) : (
                          <>کاربران در صف ارسال ({info.current_cycle.pending_users.length} نفر):</>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto bg-white/5 rounded-xl border border-white/10 p-3 space-y-2">
                        {info.current_cycle.pending_users.map((user: any, index: number) => (
                          <div key={user.id || index} className={`flex justify-between items-center py-2 px-3 rounded-xl text-sm ${
                            info.current_cycle.is_sent && user.status === 'sent' 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : info.current_cycle.is_sent && user.status === 'failed'
                              ? 'bg-red-500/10 border border-red-500/30'
                              : 'bg-white/5 border border-white/10'
                          }`}>
                            <div>
                              <div className="text-white font-medium">{user.first_name} {user.last_name}</div>
                              <div className="text-gray-400 text-xs font-mono" dir="ltr">{user.phone}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-gray-400 text-xs">
                                {toPersianDigits(formatJalali(new Date(user.registered_at), 'YYYY/MM/DD HH:mm'))}
                              </div>
                              {info.current_cycle.is_sent && user.sent_at && (
                                <div className={`text-xs ${user.status === 'sent' ? 'text-green-400' : 'text-red-400'}`}>
                                  {user.status === 'sent' ? '✓ ارسال شد' : '✗ ناموفق'} - {toPersianDigits(formatJalali(new Date(user.sent_at), 'HH:mm:ss'))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!info.current_cycle.pending_users || (Array.isArray(info.current_cycle.pending_users) && info.current_cycle.pending_users.length === 0)) && (
                    <div className="mt-4 text-center text-gray-500 text-sm py-4">
                      {info.current_cycle.is_sent ? 'هیچ کاربری در این چرخه تماس دریافت نکرد' : 'هنوز کاربری در این چرخه ثبت‌نام نکرده است'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Cycle */}
              <Card className="bg-white/5 border border-white/10 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-cyan-400" />
                    چرخه بعدی (آماده‌سازی)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1">شروع چرخه:</div>
                      <div className="text-white font-mono">{info.next_cycle.cycle_start}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">پایان چرخه:</div>
                      <div className="text-white font-mono">{info.next_cycle.cycle_end}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400 mb-1">تعداد کاربران فعلی:</div>
                      <div className="text-white font-bold">{info.next_cycle.users_count} نفر</div>
                    </div>
                  </div>

                  {/* Next Cycle Users */}
                  {info.next_cycle.users && info.next_cycle.users.length > 0 && (
                    <div className="mt-4">
                      <div className="text-gray-300 font-semibold mb-3 text-sm">
                        کاربران این چرخه ({info.next_cycle.users.length} نفر):
                      </div>
                      <div className="max-h-60 overflow-y-auto bg-white/5 rounded-xl border border-white/10 p-3 space-y-2">
                        {info.next_cycle.users.map((user: any) => (
                          <div key={user.id} className="flex justify-between items-center py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-sm">
                            <div>
                              <div className="text-white font-medium">{user.first_name} {user.last_name}</div>
                              <div className="text-gray-400 text-xs font-mono" dir="ltr">{user.phone}</div>
                            </div>
                            <div className="text-gray-400 text-xs">
                              {toPersianDigits(formatJalali(new Date(user.registered_at), 'YYYY/MM/DD HH:mm'))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cycle History */}
              <Card className="bg-white/5 border border-white/10 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-400" />
                    تاریخچه چرخه‌ها (آخرین 10 چرخه)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {info.cycle_history && info.cycle_history.length > 0 ? (
                    <div className="space-y-3">
                      {info.cycle_history.map((cycle: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border ${
                            cycle.is_current
                              ? "bg-yellow-500/10 border-yellow-500/30"
                              : cycle.is_completed
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">چرخه #{info.cycle_history.length - index}</span>
                              {cycle.is_current && (
                                <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">فعلی</span>
                              )}
                              {cycle.is_completed && !cycle.is_current && (
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">تمام شده</span>
                              )}
                              {!cycle.is_completed && !cycle.is_current && (
                                <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">در انتظار</span>
                              )}
                            </div>
                            <div className="text-gray-300 text-sm">
                              {cycle.sent_count} نفر
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                            <div>
                              <div className="text-gray-400 text-xs mb-1">شروع:</div>
                              <div className="text-white font-mono text-xs">{cycle.cycle_start}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs mb-1">پایان:</div>
                              <div className="text-white font-mono text-xs">{cycle.cycle_end}</div>
                            </div>
                            {cycle.sent_at && (
                              <div className="col-span-2">
                                <div className="text-gray-400 text-xs mb-1">زمان ارسال:</div>
                                <div className="text-white font-mono text-xs">{cycle.sent_at}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      هنوز چرخه‌ای ثبت نشده است
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AvanakMessageManager;

