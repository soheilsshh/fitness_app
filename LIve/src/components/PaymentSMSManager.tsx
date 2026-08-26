import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Plus, Trash2, Edit2, CheckCircle, XCircle, AlertCircle, MessageSquare, History, Clock, RefreshCw } from "lucide-react";
import { config } from '@/config/environment';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentSMSMessage {
  id: number;
  trigger_type: string;
  delay_minutes: number;
  message_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentSMSMessageLog {
  id: number;
  phone: string;
  trigger_type: string;
  message_text: string;
  triggered_at: string;
  scheduled_send_time: string;
  sent_at?: string;
  success: boolean;
  error?: string;
  created_at: string;
}

interface PaymentSMSManagerProps {
  open: boolean;
  onClose: () => void;
  token: string | null;
}

const TRIGGER_TYPES = [
  { value: "clicked_card_to_card", label: "کلیک کارت به کارت" },
  { value: "copied_card_to_card", label: "کپی کارت به کارت" },
  { value: "clicked_installment", label: "کلیک قسطی" },
  { value: "copied_installment_card", label: "کپی کارت قسطی" },
  { value: "clicked_payment_button", label: "کلیک ورود به درگاه" },
  { value: "entered_landing", label: "ورود به لندینگ" },
];

interface LicenseSMSMessage {
  id: number;
  pattern_code: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LicenseSMSMessageLog {
  id: number;
  phone: string;
  full_name: string;
  license_code: string;
  pattern_code: number;
  sent_at: string;
  success: boolean;
  error?: string;
  created_at: string;
}

const PaymentSMSManager: React.FC<PaymentSMSManagerProps> = ({ open, onClose, token }) => {
  const [messages, setMessages] = useState<PaymentSMSMessage[]>([]);
  const [logs, setLogs] = useState<PaymentSMSMessageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    trigger_type: "",
    delay_minutes: 0,
    message_text: "",
    is_active: true,
  });
  
  // License SMS state
  const [licenseSMS, setLicenseSMS] = useState<LicenseSMSMessage | null>(null);
  const [licenseSMSLoading, setLicenseSMSLoading] = useState(false);
  const [licenseSMSLogs, setLicenseSMSLogs] = useState<LicenseSMSMessageLog[]>([]);
  const [licenseSMSLogsLoading, setLicenseSMSLogsLoading] = useState(false);
  const [licenseSMSFormData, setLicenseSMSFormData] = useState({
    pattern_code: 403249,
    is_active: true,
  });

  const API_URL = config.API_BASE_URL;

  useEffect(() => {
    if (open && token) {
      fetchMessages();
      fetchLogs();
      fetchLicenseSMS();
      fetchLicenseSMSLogs();
      // Refresh logs every 10 seconds
      const interval = setInterval(() => {
        if (open && token) {
          fetchLogs();
          fetchLicenseSMSLogs();
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [open, token]);

  const fetchLicenseSMS = async () => {
    if (!token) return;
    setLicenseSMSLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/license-sms-message`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت تنظیمات پیام لایسنس");
      }

      const data = await response.json();
      if (data.message) {
        setLicenseSMS(data.message);
        setLicenseSMSFormData({
          pattern_code: data.message.pattern_code || 403249,
          is_active: data.message.is_active !== undefined ? data.message.is_active : true,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch license SMS:", error);
    } finally {
      setLicenseSMSLoading(false);
    }
  };

  const fetchLicenseSMSLogs = async () => {
    if (!token) return;
    setLicenseSMSLogsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/license-sms-message/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت لاگ‌های پیام لایسنس");
      }

      const data = await response.json();
      setLicenseSMSLogs(data.logs || []);
    } catch (error: any) {
      console.error("Failed to fetch license SMS logs:", error);
    } finally {
      setLicenseSMSLogsLoading(false);
    }
  };

  const handleLicenseSMSSave = async () => {
    if (!token) return;
    setLicenseSMSLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/license-sms-message`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(licenseSMSFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ذخیره تنظیمات");
      }

      alert("✅ تنظیمات پیام لایسنس با موفقیت ذخیره شد");
      await fetchLicenseSMS();
    } catch (error: any) {
      alert(`❌ خطا: ${error.message || "خطای ناشناخته"}`);
    } finally {
      setLicenseSMSLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/payment-sms-messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت پیام‌ها");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error: any) {
      console.error("Failed to fetch payment SMS messages:", error);
      alert(`❌ خطا: ${error.message || "خطای ناشناخته"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.trigger_type || formData.message_text.trim() === "") {
      alert("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    if (formData.delay_minutes < 0) {
      alert("زمان تاخیر نمی‌تواند منفی باشد");
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/admin/payment-sms-messages/${editingId}`
        : `${API_URL}/admin/payment-sms-messages`;
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "خطا در ذخیره پیام");
      }

      await fetchMessages();
      resetForm();
      alert(editingId ? "✅ پیام با موفقیت به‌روزرسانی شد" : "✅ پیام با موفقیت ایجاد شد");
    } catch (error: any) {
      console.error("Failed to save payment SMS message:", error);
      alert(`❌ خطا: ${error.message || "خطای ناشناخته"}`);
    }
  };

  const handleEdit = (message: PaymentSMSMessage) => {
    setEditingId(message.id);
    setFormData({
      trigger_type: message.trigger_type,
      delay_minutes: message.delay_minutes,
      message_text: message.message_text,
      is_active: message.is_active,
    });
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("آیا از حذف این پیام مطمئن هستید؟")) return;

    try {
      const response = await fetch(`${API_URL}/admin/payment-sms-messages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در حذف پیام");
      }

      await fetchMessages();
      alert("✅ پیام با موفقیت حذف شد");
    } catch (error: any) {
      console.error("Failed to delete payment SMS message:", error);
      alert(`❌ خطا: ${error.message || "خطای ناشناخته"}`);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      trigger_type: "",
      delay_minutes: 0,
      message_text: "",
      is_active: true,
    });
  };

  const fetchLogs = async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/payment-sms-messages/logs?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت لاگ‌ها");
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error: any) {
      console.error("Failed to fetch payment SMS logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    return TRIGGER_TYPES.find(t => t.value === triggerType)?.label || triggerType;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0f0f0f] border border-orange-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-400" />
            مدیریت پیام‌های SMS پرداخت
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* License SMS Section */}
          <Card className="bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] border border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                پیام‌های ارسال لایسنس
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 text-sm text-blue-300">
                <p className="mb-2">این پیامک بلافاصله بعد از پرداخت موفق از طریق درگاه ارسال می‌شود.</p>
                <p className="mb-2">ارسال از طریق <strong>ملی پیامک</strong> با کد پترن <strong>403249</strong></p>
                <p>متغیرها: <strong>{'{0}'}</strong> = نام و نام خانوادگی | <strong>{'{1}'}</strong> = کد لایسنس</p>
              </div>

              {licenseSMSLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="license_pattern_code" className="text-gray-300">کد پترن ملی پیامک</Label>
                    <Input
                      id="license_pattern_code"
                      type="number"
                      value={licenseSMSFormData.pattern_code}
                      onChange={(e) => setLicenseSMSFormData({ ...licenseSMSFormData, pattern_code: parseInt(e.target.value) || 403249 })}
                      className="bg-[#0f0f0f] border border-blue-500/20 text-white mt-2"
                      placeholder="403249"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="license_is_active"
                      checked={licenseSMSFormData.is_active}
                      onChange={(e) => setLicenseSMSFormData({ ...licenseSMSFormData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-blue-500/30 bg-[#0f0f0f] text-blue-500"
                    />
                    <Label htmlFor="license_is_active" className="text-gray-300 cursor-pointer">
                      فعال بودن ارسال پیامک لایسنس
                    </Label>
                  </div>

                  <Button
                    onClick={handleLicenseSMSSave}
                    disabled={licenseSMSLoading}
                    className="w-full bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white font-semibold"
                  >
                    {licenseSMSLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 ml-2" />
                        ذخیره تنظیمات
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* License SMS Logs */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-400" />
                    لاگ ارسال‌ها
                  </h3>
                  <Button
                    onClick={fetchLicenseSMSLogs}
                    disabled={licenseSMSLogsLoading}
                    variant="outline"
                    size="sm"
                    className="bg-[#0f0f0f] border border-blue-500/20 text-blue-300 hover:bg-blue-500/10"
                  >
                    <RefreshCw className={`h-4 w-4 ml-2 ${licenseSMSLogsLoading ? 'animate-spin' : ''}`} />
                    بروزرسانی
                  </Button>
                </div>

                {licenseSMSLogsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                ) : licenseSMSLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    هیچ لاگی ثبت نشده است
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {licenseSMSLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`bg-[#0f0f0f] border rounded-lg p-3 ${
                          log.success ? 'border-green-500/30' : 'border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {log.success ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className="text-white font-medium">{log.full_name}</span>
                              <span className="text-gray-400 text-sm">{log.phone}</span>
                            </div>
                            <div className="text-gray-400 text-xs mb-1">
                              لایسنس: <code className="text-blue-400">{log.license_code}</code>
                            </div>
                            <div className="text-gray-500 text-xs">
                              {formatDate(log.sent_at)}
                            </div>
                            {log.error && (
                              <div className="text-red-400 text-xs mt-1">
                                خطا: {log.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="border-t border-gray-800 my-6"></div>
          {/* Form */}
          <Card className="bg-[#0a0a0a] border border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                {editingId ? "ویرایش پیام" : "افزودن پیام جدید"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trigger_type" className="text-gray-300">تریگر</Label>
                    <Select
                      value={formData.trigger_type}
                      onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                    >
                      <SelectTrigger className="bg-[#0f0f0f] border border-orange-500/20 text-white">
                        <SelectValue placeholder="انتخاب تریگر" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f0f0f] border border-orange-500/20">
                        {TRIGGER_TYPES.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value} className="text-white">
                            {trigger.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="delay_minutes" className="text-gray-300">زمان تاخیر (دقیقه)</Label>
                    <Input
                      id="delay_minutes"
                      type="number"
                      min="0"
                      value={formData.delay_minutes}
                      onChange={(e) => setFormData({ ...formData, delay_minutes: parseInt(e.target.value) || 0 })}
                      className="bg-[#0f0f0f] border border-orange-500/20 text-white"
                      placeholder="مثال: 10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message_text" className="text-gray-300">متن پیام</Label>
                  <Textarea
                    id="message_text"
                    value={formData.message_text}
                    onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                    rows={4}
                    className="bg-[#0f0f0f] border border-orange-500/20 text-white"
                    placeholder="متن پیام SMS را وارد کنید..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="text-gray-300">فعال</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-2" />
                        {editingId ? "به‌روزرسانی" : "ذخیره"}
                      </>
                    )}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      onClick={resetForm}
                      className="bg-[#0f0f0f] border border-gray-700/50 text-gray-300 hover:bg-[#1a1a1a] hover:border-gray-600/50 transition-all duration-200"
                    >
                      انصراف
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card className="bg-[#0a0a0a] border border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">لیست پیام‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>هیچ پیامی وجود ندارد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${
                        message.is_active
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-gray-500/10 border-gray-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">
                              {getTriggerLabel(message.trigger_type)}
                            </span>
                            {message.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            تاخیر: {message.delay_minutes} دقیقه
                          </p>
                          <p className="text-white text-sm">{message.message_text}</p>
                        </div>
                        <div className="flex gap-2 mr-4">
                          <Button
                            onClick={() => handleEdit(message)}
                            size="sm"
                            className="bg-[#0f0f0f] border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(message.id)}
                            size="sm"
                            className="bg-[#0f0f0f] border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs Section */}
          <Card className="bg-[#0a0a0a] border border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <History className="h-5 w-5 text-orange-400" />
                تاریخچه ارسال پیامک‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading && logs.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>هیچ لاگی وجود ندارد</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border ${
                        log.success
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">
                              {getTriggerLabel(log.trigger_type)}
                            </span>
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-300 mb-1">
                            <span className="text-gray-400">شماره تماس:</span> {log.phone}
                          </div>
                          <div className="text-sm text-white mb-2 mt-2 p-2 bg-black/30 rounded">
                            {log.message_text}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>زمان تریگر: {formatDate(log.triggered_at)}</span>
                            </div>
                            {log.sent_at && (
                              <div className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                <span>ارسال شده: {formatDate(log.sent_at)}</span>
                              </div>
                            )}
                            {!log.sent_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>زمانبندی شده: {formatDate(log.scheduled_send_time)}</span>
                              </div>
                            )}
                          </div>
                          {log.error && (
                            <div className="mt-2 text-xs text-red-400 bg-red-500/20 p-2 rounded">
                              خطا: {log.error}
                            </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSMSManager;

