import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Edit, Trash2, Send, Clock, CalendarDays, CheckCircle, XCircle, Eye, X, RefreshCw, Info, MessageSquare, Users, Mail, Save, Phone } from "lucide-react";
import { formatJalali, toPersianDigits } from '@/utils/jalali';
import { config } from '@/config/environment';
import { usePermissions } from '@/hooks/usePermissions';

interface SMSMessage {
  id?: number;
  name: string;
  pattern_code: number;
  message_text: string;
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

interface SMSMessageLog {
  id: number;
  sms_message_id: number;
  recipient: string;
  status: string;
  error_message: string;
  sent_at: string;
}

// Triggered SMS Message Interfaces
interface TriggeredSMSMessage {
  id?: number;
  name: string;
  trigger_type: string;
  pattern_code: number;
  message_text: string;
  is_active: boolean;
  params: string;
  created_at?: string;
  updated_at?: string;
}

interface TriggeredSMSMessageLog {
  id: number;
  triggered_sms_message_id: number;
  recipient: string;
  status: string;
  error_message: string;
  trigger_data: string;
  sent_at: string;
}

// TriggeredSMSManager Component - Defined before SMSMessageManager
const TriggeredSMSManager: React.FC = () => {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const canViewSMS = hasPermission("sms.view") || hasPermission("settings.sms");
  const canCreate = hasPermission("sms.create");
  const canEdit = hasPermission("sms.edit");
  const canDelete = hasPermission("sms.delete");
  const canSend = hasPermission("sms.send");

  const [messages, setMessages] = useState<TriggeredSMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<TriggeredSMSMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [logs, setLogs] = useState<TriggeredSMSMessageLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [testPhones, setTestPhones] = useState<Record<number, string>>({});
  const [testDataMap, setTestDataMap] = useState<Record<number, string>>({});
  const [testing, setTesting] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!canViewSMS) {
      setLoading(false);
      return;
    }
    fetchMessages();
  }, [canViewSMS]);

  const fetchMessages = async () => {
    if (!canViewSMS) return;
    try {
      const response = await fetch(`${API_URL}/admin/triggered-sms-messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch triggered messages");
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch triggered SMS messages:", error);
      alert("خطا در دریافت پیام‌های تریگر دار");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (messageId: number) => {
    try {
      const response = await fetch(`${API_URL}/admin/triggered-sms-messages/${messageId}/logs`, {
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

  const handleSave = async (message: TriggeredSMSMessage) => {
    setSaving(true);
    try {
      const url = message.id
        ? `${API_URL}/admin/triggered-sms-messages/${message.id}`
        : `${API_URL}/admin/triggered-sms-messages`;
      const method = message.id ? "PUT" : "POST";

      const body: any = {
        name: message.name,
        trigger_type: message.trigger_type,
        pattern_code: message.pattern_code,
        message_text: message.message_text,
        is_active: message.is_active,
        params: message.params,
      };

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

      await fetchMessages();
      setShowAddModal(false);
      setEditingMessage(null);
      alert("✅ پیام با موفقیت ذخیره شد");
    } catch (error: any) {
      console.error("Failed to save triggered message:", error);
      alert("❌ خطا در ذخیره پیام: " + (error.message || "خطای ناشناخته"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این پیام مطمئن هستید؟")) return;

    try {
      const response = await fetch(`${API_URL}/admin/triggered-sms-messages/${id}`, {
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
      console.error("Failed to delete triggered message:", error);
      alert("❌ خطا در حذف پیام: " + (error.message || "خطای ناشناخته"));
    }
  };

  const handleTest = async (messageId: number) => {
    const testPhone = testPhones[messageId] || "";
    const testDataStr = testDataMap[messageId] || "{}";
    
    if (!testPhone) {
      alert("لطفاً شماره تلفن را وارد کنید");
      return;
    }

    let testData: any = {};
    try {
      testData = JSON.parse(testDataStr);
    } catch (e) {
      alert("❌ JSON نامعتبر برای داده تست");
      return;
    }

    setTesting({ ...testing, [messageId]: true });
    try {
      const response = await fetch(`${API_URL}/admin/triggered-sms-messages/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message_id: messageId,
          phone: testPhone,
          test_data: testData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send test SMS");
      }

      alert("✅ پیام تست با موفقیت ارسال شد");
      setTestPhones({ ...testPhones, [messageId]: "" });
      setTestDataMap({ ...testDataMap, [messageId]: "{}" });
    } catch (error: any) {
      console.error("Failed to send test SMS:", error);
      alert("❌ خطا در ارسال پیام تست: " + (error.message || "خطای ناشناخته"));
    } finally {
      setTesting({ ...testing, [messageId]: false });
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case "license_assigned":
        return "پس از صدور لایسنس";
      default:
        return type;
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!canViewSMS) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 text-center text-gray-300 border border-dashed border-gray-900 rounded-2xl bg-[#0a0a0a]" dir="rtl">
        <MessageSquare className="h-12 w-12 text-red-400" />
        <div>
          <p className="text-lg font-semibold text-white">دسترسی غیرمجاز</p>
          <p className="text-sm text-gray-400 mt-1">
            شما مجوز مشاهده پیام‌های تریگر دار را ندارید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">پیام‌های تریگر دار</h3>
            <p className="text-sm text-gray-400 mt-1">پیام‌هایی که با رویدادهای خاص فعال می‌شوند</p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingMessage(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold rounded-xl transition-all duration-300"
          >
            <Plus className="ml-2 h-4 w-4" />
            افزودن پیام جدید
          </Button>
        )}
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card className="bg-[#0a0a0a] border border-teal-500/20 rounded-2xl">
            <CardContent className="p-6 text-center text-gray-400">
              هیچ پیام تریگر داری وجود ندارد
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="bg-[#0f0f0f] border border-teal-500/30 rounded-2xl overflow-hidden hover:border-teal-500/50 transition-all duration-300">
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
                      <div>تریگر: <span className="text-cyan-400 font-medium">{getTriggerTypeLabel(message.trigger_type)}</span></div>
                      <div>کد پترن: {message.pattern_code}</div>
                      {message.message_text && (
                        <div>متن: {message.message_text}</div>
                      )}
                      {message.params && (
                        <div className="mt-2">
                          <div className="text-gray-400 mb-1">پارامترها:</div>
                          <div className="bg-[#0a0a0a] border border-teal-500/20 rounded-lg p-2 font-mono text-xs">
                            <pre className="text-gray-300 whitespace-pre-wrap">{message.params}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {canSend && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchLogs(message.id!)}
                        className="text-blue-400 hover:text-blue-300 border-blue-500/30"
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        لاگ‌ها
                      </Button>
                    )}
                    {canSend && (
                      <div className="flex flex-col gap-2">
                        <Input
                          type="text"
                          placeholder="شماره تست"
                          value={testPhones[message.id!] || ""}
                          onChange={(e) => setTestPhones({ ...testPhones, [message.id!]: e.target.value })}
                          className="bg-[#0a0a0a] border-teal-500/20 text-white text-xs w-32"
                          dir="ltr"
                        />
                        <Input
                          type="text"
                          placeholder='{"user": {"first_name": "علی"}, "license": {"code": "TEST-1234"}}'
                          value={testDataMap[message.id!] || "{}"}
                          onChange={(e) => setTestDataMap({ ...testDataMap, [message.id!]: e.target.value })}
                          className="bg-[#0a0a0a] border-teal-500/20 text-white text-xs w-32 font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(message.id!)}
                          disabled={testing[message.id!]}
                          className="text-cyan-400 hover:text-cyan-300 border-teal-500/30"
                        >
                          {testing[message.id!] ? (
                            <>
                              <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                              تست...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 ml-1" />
                              تست
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMessage(message);
                          setShowAddModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 border-blue-500/30"
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        ویرایش
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(message.id!)}
                        className="text-red-400 hover:text-red-300 border-red-500/30"
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <TriggeredSMSMessageForm
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
        <TriggeredSMSLogsModal
          logs={logs}
          onClose={() => {
            setShowLogs(false);
            setSelectedMessage(null);
          }}
        />
      )}
    </div>
  );
};

// TriggeredSMSMessageForm Component
interface TriggeredSMSMessageFormProps {
  message: TriggeredSMSMessage | null;
  onSave: (message: TriggeredSMSMessage) => void;
  onClose: () => void;
  saving: boolean;
}

const TriggeredSMSMessageForm: React.FC<TriggeredSMSMessageFormProps> = ({ message, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState<TriggeredSMSMessage>({
    name: message?.name || "",
    trigger_type: message?.trigger_type || "license_assigned",
    pattern_code: message?.pattern_code || 0,
    message_text: message?.message_text || "",
    is_active: message?.is_active ?? true,
    params: message?.params || '{"0": "user.first_name", "1": "license.code"}',
  });

  const triggerTypes = [
    { value: "license_assigned", label: "پس از صدور لایسنس" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("لطفاً نام پیام را وارد کنید");
      return;
    }
    if (formData.pattern_code === 0) {
      alert("لطفاً کد پترن را وارد کنید");
      return;
    }
    
    // Validate params JSON
    try {
      JSON.parse(formData.params);
    } catch (e) {
      alert("❌ فرمت JSON پارامترها نامعتبر است");
      return;
    }

    onSave({ ...formData, id: message?.id });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="bg-[#0a0a0a] border border-teal-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex items-center justify-between border-b border-teal-500/20">
          <CardTitle className="text-white">
            {message ? "ویرایش پیام تریگر دار" : "افزودن پیام تریگر دار جدید"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نام پیام *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#0a0a0a] border-teal-500/20 text-white"
                placeholder="مثال: ارسال لایسنس"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نوع تریگر *</label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-teal-500/20 text-white rounded-lg px-4 py-2"
                required
              >
                {triggerTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">کد پترن *</label>
              <Input
                type="number"
                value={formData.pattern_code}
                onChange={(e) => setFormData({ ...formData, pattern_code: parseInt(e.target.value) || 0 })}
                className="bg-[#0a0a0a] border-teal-500/20 text-white"
                placeholder="مثال: 403249"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">متن پیام (مرجع)</label>
              <Textarea
                value={formData.message_text}
                onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                className="bg-[#0a0a0a] border-teal-500/20 text-white"
                placeholder="متن پیام برای مرجع..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                پارامترها (JSON) *
                <span className="text-xs text-gray-500 mr-2">مثال: {"{"}"0": "user.first_name", "1": "license.code"{"}"}</span>
              </label>
              <Textarea
                value={formData.params}
                onChange={(e) => setFormData({ ...formData, params: e.target.value })}
                className="bg-[#0a0a0a] border-teal-500/20 text-white font-mono text-xs"
                placeholder='{"0": "user.first_name", "1": "license.code"}'
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                پارامتر {0} = نام شخص، پارامتر {1} = کد لایسنس
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-teal-500"
              />
              <label htmlFor="is_active" className="text-gray-300 text-sm">فعال</label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-teal-500/20">
              <Button type="button" variant="outline" onClick={onClose} className="text-gray-400">
                انصراف
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0]">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    ذخیره
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

// Faraz SMS Manager Component
const FarazSMSManager: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission("sms.send");
  
  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  const [recipients, setRecipients] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!recipients.trim()) {
      alert("لطفاً حداقل یک شماره تلفن وارد کنید");
      return;
    }

    if (!message.trim()) {
      alert("لطفاً متن پیام را وارد کنید");
      return;
    }

    if (!canSend) {
      alert("شما دسترسی ارسال پیامک ندارید");
      return;
    }

    // Parse recipients (comma or newline separated)
    const recipientList = recipients
      .split(/[,\n]/)
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (recipientList.length === 0) {
      alert("لطفاً حداقل یک شماره تلفن معتبر وارد کنید");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/admin/sms-messages/faraz-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipients: recipientList,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "خطا در ارسال پیامک");
      }

      setResult({
        success: true,
        message: `✅ پیامک با موفقیت به ${data.sent_count || recipientList.length} شماره ارسال شد`,
      });
      
      // Clear form after successful send
      setRecipients("");
      setMessage("");
    } catch (error: any) {
      console.error("Failed to send Faraz SMS:", error);
      setResult({
        success: false,
        message: `❌ خطا: ${error.message || "خطای ناشناخته"}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-[#0f0f0f] border border-orange-500/30 rounded-2xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
          <Phone className="h-5 w-5 text-orange-400" />
          ارسال پیامک با فراز اس ام اس
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipients Input */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            شماره‌های گیرنده <span className="text-red-400">*</span>
          </label>
          <Textarea
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="شماره‌ها را با کاما یا خط جدید جدا کنید&#10;مثال: 09123456789, 09187654321&#10;یا:&#10;09123456789&#10;09187654321"
            className="w-full bg-[#0a0a0a] border border-orange-500/20 text-white rounded-xl px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-mono text-sm"
            dir="ltr"
          />
          <p className="text-gray-400 text-xs mt-1">
            می‌توانید شماره‌ها را با کاما (,) یا خط جدید جدا کنید
          </p>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            متن پیام <span className="text-red-400">*</span>
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="متن پیامک را اینجا وارد کنید..."
            className="w-full bg-[#0a0a0a] border border-orange-500/20 text-white rounded-xl px-4 py-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
            dir="rtl"
          />
          <p className="text-gray-400 text-xs mt-1">
            طول متن: {message.length} کاراکتر
          </p>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`p-4 rounded-xl border ${
              result.success
                ? "bg-green-600/10 border-green-600/30 text-green-400"
                : "bg-red-600/10 border-red-600/30 text-red-400"
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sending || !recipients.trim() || !message.trim()}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              در حال ارسال...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 ml-2" />
              ارسال پیامک
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-300 text-sm space-y-1">
              <div className="font-semibold mb-2">راهنمای استفاده:</div>
              <div>• شماره‌های تلفن را با کاما یا خط جدید جدا کنید</div>
              <div>• شماره‌ها به صورت خودکار به فرمت E.164 تبدیل می‌شوند</div>
              <div>• این سرویس برای ارسال پیامک‌های ساده بدون pattern استفاده می‌شود</div>
              <div>• پس از ارسال موفق، فرم به صورت خودکار پاک می‌شود</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// TriggeredSMSLogsModal Component
interface TriggeredSMSLogsModalProps {
  logs: TriggeredSMSMessageLog[];
  onClose: () => void;
}

const TriggeredSMSLogsModal: React.FC<TriggeredSMSLogsModalProps> = ({ logs, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="bg-[#0a0a0a] border border-teal-500/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex items-center justify-between border-b border-teal-500/20">
          <CardTitle className="text-white">لاگ‌های ارسال</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {logs.length === 0 ? (
            <div className="text-center text-gray-400 py-8">هیچ لاگی وجود ندارد</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border ${
                    log.status === "sent"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.status === "sent" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        }`}>
                          {log.status === "sent" ? "✓ ارسال شد" : "✗ خطا"}
                        </span>
                        <span className="text-white font-mono text-sm">{log.recipient}</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {toPersianDigits(formatJalali(new Date(log.sent_at), 'YYYY/MM/DD HH:mm:ss'))}
                      </div>
                      {log.error_message && (
                        <div className="mt-2 text-sm text-red-400 font-mono bg-black/20 p-2 rounded">
                          {log.error_message}
                        </div>
                      )}
                      {log.trigger_data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-cyan-400 text-sm">نمایش داده تریگر</summary>
                          <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto text-gray-300">
                            {JSON.stringify(JSON.parse(log.trigger_data), null, 2)}
                          </pre>
                        </details>
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

const SMSMessageManager: React.FC = () => {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<SMSMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [logs, setLogs] = useState<SMSMessageLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  // Use a map to store test phone and params for each message separately
  const [testPhones, setTestPhones] = useState<Record<number, string>>({});
  const [testParamsMap, setTestParamsMap] = useState<Record<number, string>>({});
  const [testing, setTesting] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<Record<number, boolean>>({});
  const [showAutoCycleInfo, setShowAutoCycleInfo] = useState<number | null>(null);
  const [autoCycleInfo, setAutoCycleInfo] = useState<any>(null);
  const [loadingCycleInfo, setLoadingCycleInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "bulk-send" | "faraz-sms">("messages");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkSendResult, setBulkSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [bulkSendConfig, setBulkSendConfig] = useState({
    pattern_code: 0,
    registration_time_range: "all" as string,
    registration_start_hour: undefined as number | undefined,
    registration_end_hour: undefined as number | undefined,
    watch_filter: "all" as "all" | "watched" | "not_watched",
  });
  const [bulkSendUserCount, setBulkSendUserCount] = useState<number | null>(null);
  const [loadingUserCount, setLoadingUserCount] = useState(false);
  const [phoneListRaw, setPhoneListRaw] = useState("");
  const [phoneListProcessed, setPhoneListProcessed] = useState<string[]>([]);
  const [phoneListProcessing, setPhoneListProcessing] = useState(false);
  const [instantSending, setInstantSending] = useState(false);
  const [phoneListWithNames, setPhoneListWithNames] = useState<Array<{phone: string; name: string | null}>>([]);
  const [sendProgress, setSendProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
    percentage: number;
    isActive: boolean;
  } | null>(null);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  const canViewSMS = hasPermission("sms.view") || hasPermission("settings.sms");

  useEffect(() => {
    if (!canViewSMS) {
      setLoading(false);
      return;
    }
    fetchMessages();
  }, [canViewSMS]);

  const fetchMessages = async () => {
    if (!canViewSMS) return;
    try {
      const response = await fetch(`${API_URL}/admin/sms-messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch SMS messages:", error);
      alert("خطا در دریافت پیام‌ها");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (messageId: number) => {
    try {
      const response = await fetch(`${API_URL}/admin/sms-messages/${messageId}/logs`, {
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

  const handleSave = async (message: SMSMessage) => {
    setSaving(true);
    try {
      const url = message.id
        ? `${API_URL}/admin/sms-messages/${message.id}`
        : `${API_URL}/admin/sms-messages`;
      const method = message.id ? "PUT" : "POST";

      // Prepare request body
      const body: any = {
        name: message.name,
        pattern_code: message.pattern_code,
        message_text: message.message_text,
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
        // Explicitly include 0 values in JSON body so backend receives them correctly
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
      const response = await fetch(`${API_URL}/admin/sms-messages/${id}`, {
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
    const testParams = testParamsMap[messageId] || "";
    
    if (!testPhone) {
      alert("لطفاً شماره تلفن را وارد کنید");
      return;
    }

    setTesting({ ...testing, [messageId]: true });
    try {
      const response = await fetch(`${API_URL}/admin/sms-messages/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message_id: messageId,
          phone: testPhone,
          params: testParams || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send test SMS");
      }

      alert("✅ پیام تست با موفقیت ارسال شد");
      // Clear test phone and params for this specific message
      setTestPhones({ ...testPhones, [messageId]: "" });
      setTestParamsMap({ ...testParamsMap, [messageId]: "" });
    } catch (error: any) {
      console.error("Failed to send test SMS:", error);
      alert("❌ خطا در ارسال پیام تست: " + (error.message || "خطای ناشناخته"));
    } finally {
      setTesting({ ...testing, [messageId]: false });
    }
  };

  const handleToggleAutoCycle = async (messageId: number) => {
    setToggling({ ...toggling, [messageId]: true });
    try {
      const response = await fetch(`${API_URL}/admin/sms-messages/${messageId}/toggle-auto-cycle`, {
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
      const url = `${API_URL}/admin/sms-messages/${messageId}/auto-cycle-info`;
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
          // Response is not JSON, try to get text
          try {
            const errorText = await response.text();
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
      console.log("data type:", typeof data);
      setAutoCycleInfo(data);
    } catch (error: any) {
      console.error("Failed to fetch auto cycle info:", error);
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("❌ خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
      } else {
        alert("❌ خطا در دریافت اطلاعات چرخه: " + (error.message || "خطای ناشناخته"));
      }
      
      // Keep modal open to show error state
      // Optionally, you might want to close it on network errors
      // setShowAutoCycleInfo(null);
    } finally {
      setLoadingCycleInfo(false);
    }
  };

  const handlePreviewUserCount = async () => {
    if (!bulkSendConfig.pattern_code || bulkSendConfig.pattern_code === 0) {
      alert("لطفاً کد پترن را انتخاب کنید");
      return;
    }

    setLoadingUserCount(true);
    try {
      const params = new URLSearchParams({
        pattern_code: bulkSendConfig.pattern_code.toString(),
        registration_time_range: bulkSendConfig.registration_time_range,
        watch_filter: bulkSendConfig.watch_filter,
      });
      
      if (bulkSendConfig.registration_start_hour !== undefined) {
        params.append("registration_start_hour", bulkSendConfig.registration_start_hour.toString());
      }
      if (bulkSendConfig.registration_end_hour !== undefined) {
        params.append("registration_end_hour", bulkSendConfig.registration_end_hour.toString());
      }

      const response = await fetch(`${API_URL}/admin/sms-messages/bulk-send/preview?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "خطا در دریافت تعداد کاربران");
      }

      const data = await response.json();
      setBulkSendUserCount(data.user_count || 0);
    } catch (error: any) {
      console.error("Failed to preview user count:", error);
      alert("❌ خطا در دریافت تعداد کاربران: " + (error.message || "خطای ناشناخته"));
      setBulkSendUserCount(null);
    } finally {
      setLoadingUserCount(false);
    }
  };

  const handleBulkSend = async () => {
    if (!bulkSendConfig.pattern_code || bulkSendConfig.pattern_code === 0) {
      alert("لطفاً کد پترن را انتخاب کنید");
      return;
    }

    if (!confirm("آیا مطمئن هستید که می‌خواهید این پیام را به گروه انتخاب شده ارسال کنید؟")) {
      return;
    }

    setBulkSending(true);
    setBulkSendResult(null);
    try {
      const body: any = {
        pattern_code: bulkSendConfig.pattern_code,
        registration_time_range: bulkSendConfig.registration_time_range,
        watch_filter: bulkSendConfig.watch_filter,
      };

      if (bulkSendConfig.registration_start_hour !== undefined) {
        body.registration_start_hour = bulkSendConfig.registration_start_hour;
      }
      if (bulkSendConfig.registration_end_hour !== undefined) {
        body.registration_end_hour = bulkSendConfig.registration_end_hour;
      }

      const response = await fetch(`${API_URL}/admin/sms-messages/bulk-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "خطا در ارسال گروهی");
      }

      const data = await response.json();
      setBulkSendResult({
        sent: data.sent_count || 0,
        failed: data.failed_count || 0,
        total: data.total_count || 0,
      });
      alert(`✅ ارسال گروهی انجام شد: ${data.sent_count || 0} ارسال موفق، ${data.failed_count || 0} ارسال ناموفق`);
    } catch (error: any) {
      console.error("Failed to send bulk SMS:", error);
      alert("❌ خطا در ارسال گروهی: " + (error.message || "خطای ناشناخته"));
    } finally {
      setBulkSending(false);
    }
  };

  const processPhoneList = async () => {
    if (!phoneListRaw || !phoneListRaw.trim()) {
      alert("لطفاً لیست شماره‌ها را وارد کنید");
      return;
    }

    setPhoneListProcessing(true);
    try {
      // Split by newlines, commas, spaces, or semicolons
      const lines = phoneListRaw
        .split(/[\n,\s;]+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Normalize and validate phone numbers
      const processed: string[] = [];
      const seen = new Set<string>();

      for (const line of lines) {
        // Remove all non-digit characters except +
        let phone = line.replace(/[^\d+]/g, "");

        // Handle different formats
        if (phone.startsWith("+98")) {
          phone = "0" + phone.substring(3);
        } else if (phone.startsWith("98") && phone.length === 12) {
          phone = "0" + phone.substring(2);
        } else if (phone.startsWith("0098")) {
          phone = "0" + phone.substring(4);
        }

        // Remove leading zeros if more than one
        if (phone.startsWith("00")) {
          phone = phone.substring(1);
        }

        // Ensure it starts with 0 and has 11 digits
        if (!phone.startsWith("0") && phone.length === 10) {
          phone = "0" + phone;
        }

        // Validate: should be 11 digits starting with 0
        if (phone.length === 11 && phone.startsWith("0") && /^0\d{10}$/.test(phone)) {
          // Check for duplicates
          if (!seen.has(phone)) {
            seen.add(phone);
            processed.push(phone);
          }
        }
      }

      setPhoneListProcessed(processed);

      // Fetch user names for processed phone numbers using dedicated endpoint
      if (processed.length > 0) {
        try {
          if (!API_URL || !token) {
            console.warn("API_URL or token is missing, skipping user name fetch");
            setPhoneListWithNames(processed.map(phone => ({ phone, name: null })));
          } else {
            // Use dedicated endpoint that matches phone numbers directly
            const response = await fetch(`${API_URL}/admin/users/by-phones`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                phone_numbers: processed
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const users = data.users || [];
              
              // Create a map of phone -> user info
              const phoneToUserMap = new Map<string, {firstName: string; lastName: string; name: string}>();
              users.forEach((userInfo: any) => {
                if (userInfo && userInfo.phone) {
                  phoneToUserMap.set(userInfo.phone, {
                    firstName: userInfo.first_name || userInfo.firstName || "",
                    lastName: userInfo.last_name || userInfo.lastName || "",
                    name: userInfo.name || ""
                  });
                }
              });

              // Match phone numbers with user names (only first_name)
              const phoneListWithNamesData = processed.map(phone => {
                const user = phoneToUserMap.get(phone);
                if (user && user.firstName) {
                  return {
                    phone,
                    name: user.firstName.trim() // Only first name
                  };
                }
                return {
                  phone,
                  name: null
                };
              });

              setPhoneListWithNames(phoneListWithNamesData);
              
              const foundCount = users.filter((u: any) => u && (u.name || u.first_name || u.firstName)).length;
              if (foundCount > 0) {
                console.log(`✅ Found ${foundCount} users out of ${processed.length} phone numbers`);
              }
            } else {
              const errorText = await response.text().catch(() => "Unknown error");
              console.error("Failed to fetch user names:", response.status, errorText);
              // If API fails, just set phones without names
              setPhoneListWithNames(processed.map(phone => ({ phone, name: null })));
            }
          }
        } catch (error: any) {
          console.error("Failed to fetch user names:", error);
          // Continue without names if API fails
          setPhoneListWithNames(processed.map(phone => ({ phone, name: null })));
        }
      } else {
        setPhoneListWithNames([]);
      }

      if (processed.length === 0) {
        alert("⚠️ هیچ شماره معتبری یافت نشد. لطفاً شماره‌ها را بررسی کنید.");
      } else {
      alert(`✅ پردازش انجام شد: ${processed.length} شماره معتبر و یکتا`);
      }
    } catch (error: any) {
      console.error("Failed to process phone list:", error);
      const errorMessage = error?.message || error?.toString() || "خطای ناشناخته";
      alert("❌ خطا در پردازش لیست شماره‌ها: " + errorMessage);
      // Set empty arrays on error to prevent UI issues
      setPhoneListProcessed([]);
      setPhoneListWithNames([]);
    } finally {
      setPhoneListProcessing(false);
    }
  };

  const handleInstantSend = async () => {
    if (!bulkSendConfig.pattern_code || bulkSendConfig.pattern_code === 0) {
      alert("لطفاً کد پترن را وارد کنید");
      return;
    }

    if (!phoneListProcessed || phoneListProcessed.length === 0) {
      alert("لطفاً ابتدا لیست شماره‌ها را پردازش کنید");
      return;
    }

    if (!API_URL || !token) {
      alert("❌ خطا: اطلاعات احراز هویت یافت نشد. لطفاً دوباره وارد شوید.");
      return;
    }

    if (!confirm(`آیا مطمئن هستید که می‌خواهید این پیام را به ${phoneListProcessed.length} شماره ارسال کنید؟`)) {
      return;
    }

    setInstantSending(true);
    setBulkSendResult(null);
    
    // Initialize progress
    setSendProgress({
      total: phoneListProcessed.length,
      sent: 0,
      failed: 0,
      percentage: 0,
      isActive: true,
    });

    try {
      // Split into batches of 50 for progress tracking
      const batchSize = 50;
      const batches: string[][] = [];
      for (let i = 0; i < phoneListProcessed.length; i += batchSize) {
        batches.push(phoneListProcessed.slice(i, i + batchSize));
      }

      let totalSent = 0;
      let totalFailed = 0;

      // Process batches sequentially with progress updates
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        if (!batch || batch.length === 0) {
          continue;
        }
        
        try {
      const response = await fetch(`${API_URL}/admin/sms-messages/instant-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
            body: JSON.stringify({
              pattern_code: bulkSendConfig.pattern_code,
              phone_numbers: batch,
            }),
      });

      if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            const errorMsg = errorData?.error || "Failed to send SMS";
            console.error(`Batch ${batchIndex + 1} failed:`, errorMsg);
            // Count entire batch as failed
            totalFailed += batch.length;
            // Continue with next batch instead of throwing
            continue;
          }

          const data = await response.json().catch(() => ({}));

      if (data.status === "processing") {
            // For background processing, estimate progress
            totalSent += Math.floor(batch.length * 0.95); // Estimate 95% success
            totalFailed += Math.floor(batch.length * 0.05);
      } else {
            totalSent += data.sent_count || 0;
            totalFailed += data.failed_count || 0;
          }

          // Update progress
          const percentage = Math.round(((totalSent + totalFailed) / phoneListProcessed.length) * 100);
          setSendProgress({
            total: phoneListProcessed.length,
            sent: totalSent,
            failed: totalFailed,
            percentage: Math.min(percentage, 100),
            isActive: batchIndex < batches.length - 1,
          });

          // Small delay between batches
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          console.error(`Failed to send batch ${batchIndex + 1}:`, error);
          totalFailed += batch.length;
          // Continue with next batch instead of stopping
          
          // Update progress even on error
          const percentage = Math.round(((totalSent + totalFailed) / phoneListProcessed.length) * 100);
          setSendProgress({
            total: phoneListProcessed.length,
            sent: totalSent,
            failed: totalFailed,
            percentage: Math.min(percentage, 100),
            isActive: batchIndex < batches.length - 1,
          });
        }
      }

      // Final result
        setBulkSendResult({
        sent: totalSent,
        failed: totalFailed,
        total: phoneListProcessed.length,
      });

      setSendProgress({
        total: phoneListProcessed.length,
        sent: totalSent,
        failed: totalFailed,
        percentage: 100,
        isActive: false,
      });

      if (totalFailed === 0) {
        alert(`✅ همه ${totalSent} پیام با موفقیت ارسال شدند`);
      } else {
        alert(`✅ ارسال انجام شد: ${totalSent} موفق، ${totalFailed} ناموفق از ${phoneListProcessed.length} شماره`);
      }
    } catch (error: any) {
      console.error("Failed to send instant SMS:", error);
      alert("❌ خطا در ارسال فوری: " + (error.message || "خطای ناشناخته"));
    } finally {
      setInstantSending(false);
    }
  };

  const canCreate = hasPermission("sms.create");
  const canEdit = hasPermission("sms.edit");
  const canDelete = hasPermission("sms.delete");
  const canSend = hasPermission("sms.send");

  if (!permissionsLoading && !canViewSMS) {
    return (
      <div className="border border-dashed border-gray-900 rounded-2xl p-10 text-center text-gray-300 bg-[#0a0a0a]" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <MessageSquare className="h-10 w-10 text-cyan-400" />
          <p className="text-lg font-semibold text-white">دسترسی به مدیریت پیام‌های SMS ندارید</p>
          <p className="text-sm text-gray-400 max-w-lg">
            برای مشاهده و مدیریت پیام‌های SMS، لطفاً با مدیر سیستم تماس بگیرید تا دسترسی لازم (sms.view) برای شما فعال شود.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-lg sm:text-xl">مدیریت پیام‌های SMS</h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">مدیریت و پیکربندی پیام‌های خودکار SMS</p>
          </div>
        </div>
        {activeTab === "messages" && canCreate && (
        <Button
          onClick={() => {
            setEditingMessage(null);
            setShowAddModal(true);
          }}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300"
        >
          <Plus className="ml-2 h-4 w-4" />
          <span className="hidden sm:inline">افزودن پیام جدید</span>
          <span className="sm:hidden">افزودن پیام</span>
        </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
            activeTab === "messages"
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
              : "bg-[#0a0a0a] text-gray-400 hover:bg-[#151515] border border-green-500/20"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="hidden sm:inline">پیام‌های خودکار</span>
          <span className="sm:hidden">خودکار</span>
        </button>
        <button
          onClick={() => setActiveTab("bulk-send")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
            activeTab === "bulk-send"
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
              : "bg-[#0a0a0a] text-gray-400 hover:bg-[#151515] border border-green-500/20"
          }`}
        >
          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="hidden sm:inline">ارسال گروهی دستی</span>
          <span className="sm:hidden">گروهی</span>
        </button>
        <button
          onClick={() => setActiveTab("faraz-sms")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
            activeTab === "faraz-sms"
              ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
              : "bg-[#0a0a0a] text-gray-400 hover:bg-[#151515] border border-green-500/20"
          }`}
        >
          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="hidden sm:inline">ارسال با فراز اس ام اس</span>
          <span className="sm:hidden">فراز</span>
        </button>
      </div>

      {/* Messages List */}
      {activeTab === "messages" && (
      <div className="space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <Card className="bg-[#0a0a0a] border border-green-500/20 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-6 text-center text-gray-400 text-sm sm:text-base">
              هیچ پیامی وجود ندارد
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="bg-[#0f0f0f] border border-green-500/30 rounded-xl sm:rounded-2xl overflow-hidden hover:border-green-500/50 transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold text-sm sm:text-base truncate">{message.name}</h4>
                      {message.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                      <div>کد پترن: {message.pattern_code}</div>
                      {message.message_text && (
                        <div>متن: {message.message_text}</div>
                      )}
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
                              console.log("Info button clicked for message:", message.id);
                              fetchAutoCycleInfo(message.id!);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            title="مشاهده جزئیات چرخه خودکار"
                            type="button"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {!message.auto_cycle_enabled && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-gray-800 text-gray-500 border border-gray-700">
                            <Clock className="h-3 w-3" />
                            چرخه خودکار غیرفعال
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    {canEdit && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingMessage(message);
                        setShowAddModal(true);
                      }}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300"
                    >
                      <Edit className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      ویرایش
                    </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => fetchLogs(message.id!)}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300"
                    >
                      <Eye className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      لاگ‌ها
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleToggleAutoCycle(message.id!)}
                      disabled={toggling[message.id!]}
                      className={`flex-1 sm:flex-initial ${
                        message.auto_cycle_enabled
                          ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                          : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                      } text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50`}
                    >
                      {toggling[message.id!] ? (
                        <Loader2 className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden sm:inline">{message.auto_cycle_enabled ? "غیرفعال کردن چرخه" : "فعال کردن چرخه"}</span>
                          <span className="sm:hidden">{message.auto_cycle_enabled ? "غیرفعال" : "فعال"}</span>
                        </>
                      )}
                    </Button>
                    {canDelete && (
                    <Button
                      size="sm"
                      onClick={() => handleDelete(message.id!)}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300"
                    >
                      <Trash2 className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      حذف
                    </Button>
                    )}
                  </div>
                </div>

                {/* Test Section */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-900">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="tel"
                      placeholder="شماره تلفن تست"
                      value={testPhones[message.id!] || ""}
                      onChange={(e) => setTestPhones({ ...testPhones, [message.id!]: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-green-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                    />
                    <Input
                      type="text"
                      placeholder="پارامترها (مثلاً نام کاربر)"
                      value={testParamsMap[message.id!] || ""}
                      onChange={(e) => setTestParamsMap({ ...testParamsMap, [message.id!]: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-green-500/20 text-white text-sm sm:text-base rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleTest(message.id!)}
                      disabled={testing[message.id!] || !testPhones[message.id!]}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {testing[message.id!] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          تست
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
      )}

      {/* Bulk Send Section */}
      {activeTab === "bulk-send" && (
        <BulkSendSection
          messages={messages}
          config={bulkSendConfig}
          onConfigChange={setBulkSendConfig}
          onSend={handleBulkSend}
          sending={bulkSending}
          result={bulkSendResult}
          userCount={bulkSendUserCount}
          loadingUserCount={loadingUserCount}
          onPreviewCount={handlePreviewUserCount}
          phoneListRaw={phoneListRaw}
          onPhoneListRawChange={setPhoneListRaw}
          phoneListProcessed={phoneListProcessed}
          phoneListWithNames={phoneListWithNames}
          onProcessPhoneList={processPhoneList}
          processingPhoneList={phoneListProcessing}
          onInstantSend={handleInstantSend}
          instantSending={instantSending}
          sendProgress={sendProgress}
        />
      )}

      {/* Faraz SMS Section */}
      {activeTab === "faraz-sms" && (
        <FarazSMSManager />
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <SMSMessageForm
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

// SMS Message Form Component
interface SMSMessageFormProps {
  message: SMSMessage | null;
  onSave: (message: SMSMessage) => void;
  onClose: () => void;
  saving: boolean;
}

const SMSMessageForm: React.FC<SMSMessageFormProps> = ({ message, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState<SMSMessage>({
    name: message?.name || "",
    pattern_code: message?.pattern_code || 0,
    message_text: message?.message_text || "",
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

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersInRange, setUsersInRange] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  const fetchUsersInRange = async () => {
    console.log("🔍 fetchUsersInRange called with:", formData.registration_time_range);
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        registration_time_range: formData.registration_time_range,
      });
      
      if (formData.registration_start_hour !== undefined) {
        params.append("registration_start_hour", formData.registration_start_hour.toString());
      }
      if (formData.registration_end_hour !== undefined) {
        params.append("registration_end_hour", formData.registration_end_hour.toString());
      }

      console.log("📡 Fetching users from:", `${API_URL}/admin/stats/users-by-registration-range?${params}`);
      const response = await fetch(`${API_URL}/admin/stats/users-by-registration-range?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📥 Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      console.log("✅ Users received:", data.users?.length || 0, "users");
      setUsersInRange(data.users || []);
      setShowUsersModal(true);
    } catch (error: any) {
      console.error("❌ Failed to fetch users:", error);
      alert("❌ خطا در دریافت لیست کاربران: " + (error.message || "خطای ناشناخته"));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      <Card className="bg-[#0a0a0a] border border-green-500/20 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl animate-slideUp">
        <CardHeader className="sticky top-0 bg-[#0f0f0f] z-10 border-b border-gray-900 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-white text-xl font-bold">
              {message ? "ویرایش پیام" : "افزودن پیام جدید"}
            </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-[#151515] p-3 rounded-xl transition-all duration-300">
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
                className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">کد پترن</label>
              <Input
                type="number"
                value={formData.pattern_code}
                onChange={(e) => setFormData({ ...formData, pattern_code: parseInt(e.target.value) || 0 })}
                required
                className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">متن پیام (مرجع)</label>
              <Textarea
                value={formData.message_text}
                onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] rounded-xl border border-green-500/20">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 accent-green-500"
              />
              <label className="text-gray-300 text-sm font-medium">فعال</label>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">نوع ارسال</label>
              <select
                value={formData.send_type}
                onChange={(e) => setFormData({ ...formData, send_type: e.target.value as "automatic" | "scheduled" })}
                className="w-full bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
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
                    className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
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
                    className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">تاریخ و زمان ارسال</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                />
              </div>
            )}

            <div className="border-t border-gray-900 pt-6">
              <label className="block text-gray-300 text-sm mb-2 font-semibold">بازه زمانی ثبت‌نام</label>
              <p className="text-gray-400 text-xs mb-4">پیام فقط به کسانی ارسال می‌شود که در این بازه زمانی ثبت‌نام کرده‌اند</p>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">بازه تاریخ ثبت‌نام</label>
                <select
                  value={formData.registration_time_range}
                  onChange={(e) => setFormData({ ...formData, registration_time_range: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515] mb-2"
                >
                  <option value="all">همه (بدون محدودیت تاریخ)</option>
                  <option value="today">امروز</option>
                  <option value="yesterday">دیروز</option>
                  <option value="week">این هفته</option>
                  <option value="last_week">هفته گذشته</option>
                  <option value="month">این ماه</option>
                  <option value="last_month">ماه گذشته</option>
                </select>
                <Button
                  type="button"
                  onClick={fetchUsersInRange}
                  disabled={loadingUsers}
                  className="w-full bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title="مشاهده لیست کاربران این بازه"
                >
                  {loadingUsers ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>در حال بارگذاری...</span>
                    </>
                  ) : (
                    <>
                      <Info className="h-4 w-4" />
                      <span>مشاهده کاربران این بازه</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-gray-900 pt-4">
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
                      className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
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
                      className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:bg-[#151515]"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-[#0a0a0a] rounded-xl border border-green-500/20">
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

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-900">
              <Button type="button" onClick={onClose} className="bg-[#0f0f0f] hover:bg-[#151515] border border-green-500/20 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300">
                انصراف
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50">
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

      {/* Users in Range Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <Card className="bg-[#0A0F1E]/95 border border-green-500/20 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl animate-slideUp">
            <CardHeader className="sticky top-0 bg-gradient-to-r from-white/5 to-transparent z-10 border-b border-gray-900 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl font-bold">کاربران در بازه انتخاب شده</CardTitle>
                    <p className="text-sm text-gray-400 mt-1">
                      {formData.registration_time_range === "today" && "امروز"}
                      {formData.registration_time_range === "yesterday" && "دیروز"}
                      {formData.registration_time_range === "week" && "این هفته"}
                      {formData.registration_time_range === "last_week" && "هفته گذشته"}
                      {formData.registration_time_range === "month" && "این ماه"}
                      {formData.registration_time_range === "last_month" && "ماه گذشته"}
                      {formData.registration_time_range === "all" && "همه"}
                      {formData.registration_start_hour !== undefined && formData.registration_end_hour !== undefined && 
                        ` - ساعت ${String(formData.registration_start_hour).padStart(2, "0")}:00 تا ${String(formData.registration_end_hour).padStart(2, "0")}:00`
                      }
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowUsersModal(false)} className="text-gray-400 hover:text-white hover:bg-[#151515] p-3 rounded-xl transition-all duration-300">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {usersInRange.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">هیچ کاربری یافت نشد</p>
                  <p className="text-sm">در این بازه زمانی هیچ کاربری ثبت‌نام نکرده است</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold">
                      <Info className="h-4 w-4" />
                      <span>تعداد کل: {usersInRange.length.toLocaleString('fa-IR')} کاربر</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {usersInRange.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 bg-[#0a0a0a] border border-green-500/20 rounded-xl hover:bg-[#151515] transition-all duration-300"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center text-white font-bold text-sm">
                                {user.first_name?.[0] || user.last_name?.[0] || "?"}
                              </div>
                              <div>
                                <div className="text-white font-semibold">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-gray-400 text-sm font-mono" dir="ltr">
                                  {user.phone}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-gray-300 text-sm font-medium mb-1">تاریخ ثبت‌نام</div>
                            <div className="text-white text-sm">
                              {toPersianDigits(formatJalali(new Date(user.registered_at), 'YYYY/MM/DD HH:mm'))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {usersInRange.length >= 1000 && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm text-center">
                      ⚠️ فقط 1000 کاربر اول نمایش داده شده است. برای مشاهده همه کاربران از بخش Export استفاده کنید.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Logs Modal Component
interface LogsModalProps {
  logs: SMSMessageLog[];
  onClose: () => void;
}

const LogsModal: React.FC<LogsModalProps> = ({ logs, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      <Card className="bg-[#0A0F1E]/95 border border-green-500/20 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl animate-slideUp">
        <CardHeader className="sticky top-0 bg-gradient-to-r from-white/5 to-transparent z-10 border-b border-gray-900 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-white text-xl font-bold">لاگ‌های ارسال</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-[#151515] p-3 rounded-xl transition-all duration-300">
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
      <Card className="bg-[#0A0F1E]/95 border border-green-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl animate-slideUp">
        <CardHeader className="sticky top-0 bg-gradient-to-r from-white/5 to-transparent z-10 border-b border-gray-900 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-white text-xl font-bold">جزئیات چرخه خودکار</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} className="text-gray-400 hover:text-white hover:bg-[#151515] p-3 rounded-xl transition-all duration-300">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-[#151515] p-3 rounded-xl transition-all duration-300">
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
              <Card className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl">
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
                      <div className="max-h-60 overflow-y-auto bg-[#0a0a0a] rounded-xl border border-green-500/20 p-3 space-y-2">
                        {info.current_cycle.pending_users.map((user: any, index: number) => (
                          <div key={user.id || index} className={`flex justify-between items-center py-2 px-3 rounded-xl text-sm ${
                            info.current_cycle.is_sent && user.status === 'sent' 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : info.current_cycle.is_sent && user.status === 'failed'
                              ? 'bg-red-500/10 border border-red-500/30'
                              : 'bg-[#0a0a0a] border border-green-500/20'
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
                      {info.current_cycle.is_sent ? 'هیچ کاربری در این چرخه پیام دریافت نکرد' : 'هنوز کاربری در این چرخه ثبت‌نام نکرده است'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Cycle */}
              <Card className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl">
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
                      <div className="max-h-60 overflow-y-auto bg-[#0a0a0a] rounded-xl border border-green-500/20 p-3 space-y-2">
                        {info.next_cycle.users.map((user: any) => (
                          <div key={user.id} className="flex justify-between items-center py-2 px-3 bg-[#0a0a0a] border border-green-500/20 rounded-xl text-sm">
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
              <Card className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl">
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
                              : "bg-[#0a0a0a] border-gray-900"
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

// Bulk Send Section Component
interface BulkSendSectionProps {
  messages: SMSMessage[];
  config: {
    pattern_code: number;
    registration_time_range: string;
    registration_start_hour?: number;
    registration_end_hour?: number;
    watch_filter: "all" | "watched" | "not_watched";
  };
  onConfigChange: (config: any) => void;
  onSend: () => void;
  sending: boolean;
  result: { sent: number; failed: number; total: number } | null;
  userCount: number | null;
  loadingUserCount: boolean;
  onPreviewCount: () => void;
  phoneListRaw: string;
  onPhoneListRawChange: (value: string) => void;
  phoneListProcessed: string[];
  phoneListWithNames: Array<{phone: string; name: string | null}>;
  onProcessPhoneList: () => void;
  processingPhoneList: boolean;
  onInstantSend: () => void;
  instantSending: boolean;
  sendProgress: {
    total: number;
    sent: number;
    failed: number;
    percentage: number;
    isActive: boolean;
  } | null;
}

const BulkSendSection: React.FC<BulkSendSectionProps> = ({
  messages,
  config: bulkSendConfig,
  onConfigChange,
  onSend,
  sending,
  result,
  userCount,
  loadingUserCount,
  onPreviewCount,
  phoneListRaw,
  onPhoneListRawChange,
  phoneListProcessed,
  phoneListWithNames,
  onProcessPhoneList,
  processingPhoneList,
  onInstantSend,
  instantSending,
  sendProgress,
}) => {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission("sms.send");
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersInRange, setUsersInRange] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const API_URL = config.API_BASE_URL; // This is from @/config/environment
  const token = localStorage.getItem("admin_token");

  const fetchUsersInRange = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        registration_time_range: bulkSendConfig.registration_time_range,
      });
      
      if (bulkSendConfig.registration_start_hour !== undefined) {
        params.append("registration_start_hour", bulkSendConfig.registration_start_hour.toString());
      }
      if (bulkSendConfig.registration_end_hour !== undefined) {
        params.append("registration_end_hour", bulkSendConfig.registration_end_hour.toString());
      }

      const response = await fetch(`${API_URL}/admin/stats/users-by-registration-range?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsersInRange(data.users || []);
      setShowUsersModal(true);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      alert("❌ خطا در دریافت لیست کاربران: " + (error.message || "خطای ناشناخته"));
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <Card className="bg-[#0a0a0a] border-2 border-white/20 rounded-2xl overflow-hidden">
      <CardHeader className="p-6 border-b border-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white text-xl font-bold">ارسال گروهی دستی</CardTitle>
            <p className="text-sm text-gray-400 mt-1">ارسال دستی پیام به گروه کاربران</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Section 1: Send Based on Filters */}
        <Card className="bg-[#0f0f0f] border border-green-500/30 rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg font-bold">ارسال بر اساس فیلتر</CardTitle>
                <p className="text-sm text-gray-400 mt-1">ارسال به کاربران بر اساس فیلترهای ثبت‌نام و تماشا</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Pattern Selection */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">انتخاب پترن</label>
              <select
                value={bulkSendConfig.pattern_code}
                onChange={(e) => onConfigChange({ ...bulkSendConfig, pattern_code: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515]"
              >
                <option value="0">-- انتخاب پترن --</option>
                {messages
                  .filter((msg) => msg.is_active)
                  .map((msg) => (
                    <option key={msg.id} value={msg.pattern_code}>
                      {msg.name} (کد: {msg.pattern_code})
                    </option>
                  ))}
              </select>
            </div>

            {/* Watch Filter */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">فیلتر وضعیت تماشا</label>
              <div className="flex gap-2">
                {[
                  { value: "all", label: "همه کاربران", color: "brand" },
                  { value: "watched", label: "تماشا کرده‌ها", color: "green" },
                  { value: "not_watched", label: "تماشا نکرده‌ها", color: "red" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => onConfigChange({ ...bulkSendConfig, watch_filter: item.value as any })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      bulkSendConfig.watch_filter === item.value
                        ? item.color === "brand"
                          ? "bg-gradient-to-r from-[#187272] to-[#26fce3] text-white"
                          : item.color === "green"
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                          : "bg-gradient-to-r from-red-600 to-rose-600 text-white"
                        : "bg-[#0a0a0a] text-gray-300 hover:bg-[#151515] border border-green-500/20"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Time Range */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">بازه تاریخ ثبت‌نام</label>
              <select
                value={bulkSendConfig.registration_time_range}
                onChange={(e) => onConfigChange({ ...bulkSendConfig, registration_time_range: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515] mb-2"
              >
                <option value="all">همه (بدون محدودیت تاریخ)</option>
                <option value="today">امروز</option>
                <option value="yesterday">دیروز</option>
                <option value="week">این هفته</option>
                <option value="last_week">هفته گذشته</option>
                <option value="month">این ماه</option>
                <option value="last_month">ماه گذشته</option>
              </select>
              <Button
                type="button"
                onClick={fetchUsersInRange}
                disabled={loadingUsers}
                className="w-full bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title="مشاهده لیست کاربران این بازه"
              >
                {loadingUsers ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>در حال بارگذاری...</span>
                  </>
                ) : (
                  <>
                    <Info className="h-4 w-4" />
                    <span>مشاهده کاربران این بازه</span>
                  </>
                )}
              </Button>
            </div>

            {/* Registration Hour Range */}
            <div className="border-t border-gray-900 pt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">بازه ساعت ثبت‌نام (اختیاری)</label>
              <p className="text-gray-400 text-xs mb-3">
                می‌توانید بازه ساعت ثبت‌نام را محدود کنید
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-xs font-medium mb-2">ساعت شروع (0-23)</label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    placeholder="مثلاً 17"
                    value={bulkSendConfig.registration_start_hour ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                      onConfigChange({
                        ...config,
                        registration_start_hour: value === undefined || isNaN(value || 0) ? undefined : Math.max(0, Math.min(23, value || 0)),
                      });
                    }}
                    className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-xs font-medium mb-2">ساعت پایان (0-23)</label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    placeholder="مثلاً 23"
                    value={bulkSendConfig.registration_end_hour ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                      onConfigChange({
                        ...config,
                        registration_end_hour: value === undefined || isNaN(value || 0) ? undefined : Math.max(0, Math.min(23, value || 0)),
                      });
                    }}
                    className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-[#151515]"
                  />
                </div>
              </div>
            </div>

            {/* Preview User Count */}
            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300 font-medium">تعداد کاربران هدف</span>
                </div>
                <Button
                  onClick={onPreviewCount}
                  disabled={loadingUserCount || !bulkSendConfig.pattern_code || bulkSendConfig.pattern_code === 0}
                  className="bg-[#0a0a0a] hover:bg-[#151515] border border-green-500/20 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 text-sm"
                >
                  {loadingUserCount ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      در حال محاسبه...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 ml-2" />
                      پیش‌نمایش تعداد
                    </>
                  )}
                </Button>
              </div>
              {userCount !== null && (
                <div className="text-2xl font-bold text-white">
                  {userCount.toLocaleString('fa-IR')} نفر
                </div>
              )}
              {userCount === null && !loadingUserCount && (
                <div className="text-sm text-gray-400">برای مشاهده تعداد کاربران، دکمه پیش‌نمایش را کلیک کنید</div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-semibold text-white">نتیجه ارسال</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">کل کاربران</div>
                    <div className="text-white font-bold">{result.total.toLocaleString('fa-IR')}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">ارسال موفق</div>
                    <div className="text-green-400 font-bold">{result.sent.toLocaleString('fa-IR')}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">ارسال ناموفق</div>
                    <div className="text-red-400 font-bold">{result.failed.toLocaleString('fa-IR')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-900">
              <Button
                onClick={onSend}
                disabled={sending || !bulkSendConfig.pattern_code || bulkSendConfig.pattern_code === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    ارسال گروهی (بر اساس فیلترها)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Send Based on Phone List */}
        <Card className="bg-[#0f0f0f] border border-green-500/30 rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg font-bold">ارسال بر اساس لیست شماره</CardTitle>
                <p className="text-sm text-gray-400 mt-1">ارسال مستقیم به لیست شماره تلفن‌های مشخص شده</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Pattern Code Input for Instant Send */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">کد پترن</label>
              <Input
                type="number"
                value={bulkSendConfig.pattern_code || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  onConfigChange({ ...bulkSendConfig, pattern_code: value ? parseInt(value) || 0 : 0 });
                }}
                placeholder="مثال: 395323"
                className="w-full bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 hover:bg-[#151515] font-mono text-lg"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-2">
                کد پترن SMS را وارد کنید. نام کاربر به صورت خودکار از لیست پیدا شده و به عنوان متغیر ارسال می‌شود.
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                لیست شماره تلفن‌ها (هر خط یک شماره یا با کاما/فاصله جدا کنید)
              </label>
              <Textarea
                value={phoneListRaw}
                onChange={(e) => onPhoneListRawChange(e.target.value)}
                placeholder="09123456789&#10;09123456790&#10;09123456791&#10;یا: 09123456789, 09123456790, 09123456791"
                rows={6}
                className="bg-[#0a0a0a] border border-green-500/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 hover:bg-[#151515] font-mono text-sm"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-2">
                می‌توانید شماره‌ها را در هر فرمتی وارد کنید (با 0، +98، 0098، و غیره). سیستم به صورت خودکار آن‌ها را اصلاح و تکراری‌ها را حذف می‌کند.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onProcessPhoneList}
                disabled={processingPhoneList || !phoneListRaw.trim()}
                className="bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {processingPhoneList ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 ml-2" />
                    تعیین و پردازش
                  </>
                )}
              </Button>
            </div>

            {phoneListProcessed.length > 0 && (
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-semibold text-white">لیست نهایی پردازش شده</span>
                  </div>
                  <span className="text-sm text-green-400 font-bold">
                    {phoneListProcessed.length.toLocaleString('fa-IR')} شماره
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto bg-[#0a0a0a] rounded-lg border border-green-500/20">
                  <div className="grid grid-cols-2 gap-3 p-3 border-b border-gray-900 bg-[#0a0a0a] sticky top-0 z-10">
                    <div className="text-xs font-semibold text-gray-300">شماره تلفن</div>
                    <div className="text-xs font-semibold text-gray-300">نام کاربر</div>
                  </div>
                  <div className="divide-y divide-white/10">
                    {phoneListWithNames.slice(0, 50).map((item, index) => (
                      <div key={index} className="grid grid-cols-2 gap-3 p-3 hover:bg-[#0a0a0a] transition-colors">
                        <div className="text-sm text-gray-200 font-mono" dir="ltr">
                          {item.phone}
                        </div>
                        <div className="text-sm text-gray-300">
                          {item.name ? (
                            <span className="text-green-400 font-medium">{item.name}</span>
                          ) : (
                            <span className="text-gray-500 italic">کاربر یافت نشد</span>
                          )}
                        </div>
                    </div>
                  ))}
                    {phoneListProcessed.length > 50 && (
                      <div className="text-xs text-gray-400 text-center py-3 border-t border-gray-900">
                        ... و {phoneListProcessed.length - 50} شماره دیگر
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}

            {phoneListProcessed.length > 0 && (
              <div className="space-y-3">
                {(!bulkSendConfig.pattern_code || bulkSendConfig.pattern_code === 0) && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-sm text-yellow-400">
                    ⚠️ لطفاً ابتدا کد پترن را وارد کنید
                  </div>
                )}
                
                {/* Progress Bar */}
                {sendProgress && sendProgress.isActive && (
                  <div className="bg-[#0a0a0a] border border-green-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                        <span className="text-sm font-semibold text-white">در حال ارسال...</span>
                      </div>
                      <span className="text-sm text-gray-300">
                        {sendProgress.percentage}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-[#151515] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 ease-out"
                        style={{ width: `${sendProgress.percentage}%` }}
                      />
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-400">کل</div>
                        <div className="text-white font-semibold">{sendProgress.total.toLocaleString('fa-IR')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400">ارسال شده</div>
                        <div className="text-green-300 font-semibold">{sendProgress.sent.toLocaleString('fa-IR')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400">ناموفق</div>
                        <div className="text-red-300 font-semibold">{sendProgress.failed.toLocaleString('fa-IR')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Result */}
                {sendProgress && !sendProgress.isActive && sendProgress.percentage === 100 && (
                  <div className={`border rounded-xl p-4 ${
                    sendProgress.failed === 0 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {sendProgress.failed === 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-yellow-400" />
                      )}
                      <span className={`text-sm font-semibold ${
                        sendProgress.failed === 0 ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        ارسال تکمیل شد
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-400">کل</div>
                        <div className="text-white font-semibold">{sendProgress.total.toLocaleString('fa-IR')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400">ارسال شده</div>
                        <div className="text-green-300 font-semibold">{sendProgress.sent.toLocaleString('fa-IR')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400">ناموفق</div>
                        <div className="text-red-300 font-semibold">{sendProgress.failed.toLocaleString('fa-IR')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {canSend && (
                <Button
                  onClick={onInstantSend}
                  disabled={instantSending || !bulkSendConfig.pattern_code || bulkSendConfig.pattern_code === 0 || phoneListProcessed.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {instantSending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      در حال ارسال فوری...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-2" />
                      ارسال در لحظه ({phoneListProcessed.length.toLocaleString('fa-IR')} شماره)
                    </>
                  )}
                </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>

      {/* Users in Range Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <Card className="bg-[#0A0F1E]/95 border border-green-500/20 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl animate-slideUp">
            <CardHeader className="sticky top-0 bg-gradient-to-r from-white/5 to-transparent z-10 border-b border-gray-900 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl font-bold">کاربران در بازه انتخاب شده</CardTitle>
                    <p className="text-sm text-gray-400 mt-1">
                      {bulkSendConfig.registration_time_range === "today" && "امروز"}
                      {bulkSendConfig.registration_time_range === "yesterday" && "دیروز"}
                      {bulkSendConfig.registration_time_range === "week" && "این هفته"}
                      {bulkSendConfig.registration_time_range === "last_week" && "هفته گذشته"}
                      {bulkSendConfig.registration_time_range === "month" && "این ماه"}
                      {bulkSendConfig.registration_time_range === "last_month" && "ماه گذشته"}
                      {bulkSendConfig.registration_time_range === "all" && "همه"}
                      {bulkSendConfig.registration_start_hour !== undefined && bulkSendConfig.registration_end_hour !== undefined && 
                        ` - ساعت ${String(bulkSendConfig.registration_start_hour).padStart(2, "0")}:00 تا ${String(bulkSendConfig.registration_end_hour).padStart(2, "0")}:00`
                      }
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowUsersModal(false)} className="text-gray-400 hover:text-white hover:bg-[#151515] p-3 rounded-xl transition-all duration-300">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {usersInRange.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">هیچ کاربری یافت نشد</p>
                  <p className="text-sm">در این بازه زمانی هیچ کاربری ثبت‌نام نکرده است</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold">
                      <Info className="h-4 w-4" />
                      <span>تعداد کل: {usersInRange.length.toLocaleString('fa-IR')} کاربر</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {usersInRange.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 bg-[#0a0a0a] border border-green-500/20 rounded-xl hover:bg-[#151515] transition-all duration-300"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#187272] to-[#26fce3] flex items-center justify-center text-white font-bold text-sm">
                                {user.first_name?.[0] || user.last_name?.[0] || "?"}
                              </div>
                              <div>
                                <div className="text-white font-semibold">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-gray-400 text-sm font-mono" dir="ltr">
                                  {user.phone}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-gray-300 text-sm font-medium mb-1">تاریخ ثبت‌نام</div>
                            <div className="text-white text-sm">
                              {toPersianDigits(formatJalali(new Date(user.registered_at), 'YYYY/MM/DD HH:mm'))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {usersInRange.length >= 1000 && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm text-center">
                      ⚠️ فقط 1000 کاربر اول نمایش داده شده است. برای مشاهده همه کاربران از بخش Export استفاده کنید.
                    </div>
                  )}
                </div>
              )}
      </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default SMSMessageManager;

