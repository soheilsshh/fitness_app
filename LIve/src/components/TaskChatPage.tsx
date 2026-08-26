import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, BellRing, Send, ArrowRight, Users, CheckSquare, MessageSquare } from "lucide-react";
import { UsePermissionsReturn } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { config } from "@/config/environment";
import { useNavigate } from "react-router-dom";

interface ChatParticipant {
  id: number;
  username: string;
  is_manager: boolean;
  unread_count?: number;
}

interface Task {
  id: number;
  title: string;
}

interface ManagerChatMessage {
  id: number;
  user_id: number;
  sender_id: number;
  sender?: { id: number; username: string };
  task_id?: number | null;
  task?: { id: number; title: string } | null;
  topic?: string;
  body: string;
  is_from_manager: boolean;
  created_at: string;
  read_by_manager_at?: string | null;
  read_by_user_at?: string | null;
}

interface TaskChatPageProps {
  permissions: UsePermissionsReturn;
}

const TaskChatPage: React.FC<TaskChatPageProps> = ({ permissions }) => {
  const { hasPermission, username } = permissions;
  const canManage = hasPermission("tasks.manage");
  const canCollaborate = hasPermission("tasks.collaborate") || canManage;
  const navigate = useNavigate();

  const [chatMessages, setChatMessages] = useState<ManagerChatMessage[]>([]);
  const [chatParticipants, setChatParticipants] = useState<ChatParticipant[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatTopic, setChatTopic] = useState("");
  const [sendSMSNotification, setSendSMSNotification] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const chatListRef = useRef<HTMLDivElement>(null);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!canCollaborate) return;
    fetchChatParticipants();
    fetchChatUnreadCount();
    fetchChatMessages();
    fetchTasks();
    const interval = setInterval(() => {
      fetchChatMessages();
      fetchChatUnreadCount();
    }, 3000);
    return () => clearInterval(interval);
  }, [canCollaborate, canManage, selectedChatUser]);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchChatParticipants = async () => {
    if (!token || !canManage) return;
    try {
      const res = await fetch(`${API_URL}/admin/task-messages/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: ChatParticipant[] = Array.isArray(data.users) ? data.users : [];
      setChatParticipants(list);
      if (!selectedChatUser && list.length) {
        const firstCollaborator = list.find((user) => !user.is_manager);
        setSelectedChatUser(firstCollaborator?.id ?? list[0].id ?? null);
      }
    } catch (err) {
      console.error("[TaskChat] fetch participants error:", err);
    }
  };

  const fetchTasks = async () => {
    if (!token || !canCollaborate) return;
    try {
      const res = await fetch(`${API_URL}/admin/tasks?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: Task[] = Array.isArray(data.tasks) ? data.tasks.map((t: any) => ({ id: t.id, title: t.title })) : [];
      setTasks(list);
    } catch (err) {
      console.error("[TaskChat] fetch tasks error:", err);
    }
  };

  const fetchChatUnreadCount = async () => {
    if (!token || !canCollaborate) return;
    try {
      const res = await fetch(`${API_URL}/admin/task-messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setChatUnreadCount(Number(data.unread_count) || 0);
    } catch (err) {
      console.error("[TaskChat] fetch unread count error:", err);
    }
  };

  const fetchChatMessages = async (targetUser?: number | null) => {
    if (!token || !canCollaborate) return;
    const effectiveTarget = typeof targetUser === "number" ? targetUser : selectedChatUser;
    if (canManage && !effectiveTarget) {
      setChatMessages([]);
      return;
    }
    try {
      setChatLoading(true);
      setChatError(null);
      const params = new URLSearchParams();
      if (canManage && effectiveTarget) {
        params.append("user_id", String(effectiveTarget));
      }
      const url = params.toString()
        ? `${API_URL}/admin/task-messages?${params.toString()}`
        : `${API_URL}/admin/task-messages`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("خطا در دریافت پیام‌ها");
      }
      const data = await res.json();
      const list: ManagerChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
      setChatMessages(list);
      fetchChatUnreadCount();
    } catch (err: any) {
      console.error("[TaskChat] fetch messages error:", err);
      setChatError(err.message || "خطا در دریافت پیام‌ها");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!token || !chatInput.trim()) return;
    if (canManage && !selectedChatUser) {
      setChatError("برای ارسال پیام، یک کاربر انتخاب کنید.");
      return;
    }
    try {
      setChatError(null);
      const payload: Record<string, any> = {
        topic: chatTopic,
        body: chatInput.trim(),
        send_sms_notification: canManage && sendSMSNotification, // فقط برای مدیران
      };
      if (canManage && selectedChatUser) {
        payload.user_id = selectedChatUser;
      }
      if (selectedTask) {
        payload.task_id = selectedTask;
      }
      const res = await fetch(`${API_URL}/admin/task-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در ارسال پیام");
      }
      setChatInput("");
      setChatTopic("");
      setSendSMSNotification(false);
      setSelectedTask(null);
      fetchChatMessages(canManage ? selectedChatUser : null);
      fetchChatUnreadCount();
    } catch (err: any) {
      console.error("[TaskChat] send message error:", err);
      setChatError(err.message || "خطا در ارسال پیام");
    }
  };

  if (!canCollaborate) {
    return null;
  }

  const chatHeaderTitle = canManage ? "ارسال پیام به تیم" : "پیام‌های مدیر";
  const chatInputPlaceholder = canManage
    ? "پیام خود را برای تیم بنویسید..."
    : "پیام خود را برای مدیر بنویسید...";
  const chatIsDisabled = canManage && !selectedChatUser;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col" dir="rtl">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-[#0f0f0f] backdrop-blur-xl border-b border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3 lg:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-600/20 to-pink-600/20 rounded-xl border border-teal-500/20">
                  <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6 text-cyan-400" />
                </div>
                <CardTitle className="text-lg lg:text-2xl font-bold text-white">
                  {chatHeaderTitle}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchChatMessages();
                  fetchChatUnreadCount();
                }}
                className="border-white/10 bg-black/30 text-gray-300 hover:bg-white/5 hover:border-white/20 hover:text-white rounded-xl text-xs lg:text-sm transition-all"
              >
                <BellRing className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">به‌روزرسانی</span>
                {chatUnreadCount > 0 && (
                  <span className="mr-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-lg">
                    {chatUnreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Container - Flexible */}
      <div className="flex-1 flex flex-col min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex-1 flex flex-col min-h-0 bg-[#111111] backdrop-blur-xl rounded-3xl border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden">

          {/* Error Message */}
          {chatError && (
            <div className="flex-shrink-0 mx-4 lg:mx-6 mt-4 lg:mt-6 rounded-xl border border-red-600/40 bg-red-600/10 backdrop-blur-sm px-4 py-3 text-sm text-red-300 shadow-lg">
              {chatError}
            </div>
          )}

          {/* Messages Area - Scrollable */}
          <div
            ref={chatListRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4 space-y-4 bg-[#0a0a0a]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(168, 85, 247, 0.2) transparent'
            }}
          >
            {chatLoading && chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-teal-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-400 text-sm lg:text-base">در حال بارگذاری پیام‌ها...</p>
                </div>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="p-4 bg-white/5 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center border border-white/5">
                    <MessageCircle className="h-10 w-10 text-gray-600 opacity-50" />
                  </div>
                  <p className="text-gray-400 text-base lg:text-lg">هنوز پیامی ارسال نشده است</p>
                  <p className="text-gray-600 text-sm mt-2">اولین پیام را ارسال کنید</p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isFromManager = msg.is_from_manager;
                // پیام خود کاربر باید سمت راست باشد (outgoing)
                // برای مدیر: پیام خودش = isFromManager
                // برای تیم: پیام خودش = !isFromManager
                const isOutgoing = canManage ? isFromManager : !isFromManager;
                const isManagerMessage = canManage && isFromManager; // پیام مدیر به تیم
                const isUnread = canManage
                  ? !msg.read_by_manager_at && !isFromManager
                  : !msg.read_by_user_at && isFromManager;
                const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                const showSenderInfo = !prevMsg || 
                  prevMsg.sender_id !== msg.sender_id || 
                  new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000; // 5 minutes
                
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      isOutgoing ? "items-start" : "items-end",
                    )}
                  >
                    {showSenderInfo && !isOutgoing && (
                      <div className="text-xs text-gray-600 px-2 mb-1 font-medium">
                        {msg.sender?.username || "کاربر"}
                      </div>
                    )}
                    {msg.task && (
                      <div className="text-xs text-cyan-400 px-2 mb-1 font-medium flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        <span>تسک: {msg.task.title}</span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl lg:rounded-3xl p-3 lg:p-4 shadow-xl transition-all",
                        isOutgoing && isManagerMessage
                          ? "bg-gradient-to-br from-teal-900/90 to-teal-800/90 text-white rounded-br-sm border border-teal-700/50 shadow-teal-900/30"
                          : isOutgoing && !isManagerMessage
                          ? "bg-gradient-to-br from-[#187272] to-[#26fce3] text-white rounded-br-sm border border-teal-500/30"
                          : "bg-[#151515] text-gray-100 border border-white/5 rounded-bl-sm",
                        isUnread && "ring-2 ring-amber-500/50 shadow-amber-500/20",
                      )}
                    >
                      {msg.topic && (
                        <div className={cn(
                          "text-xs lg:text-sm font-semibold mb-2 flex items-center gap-1.5 pb-2 border-b",
                          isOutgoing && isManagerMessage
                            ? "border-cyan-400/30 text-white/90"
                            : isOutgoing && !isManagerMessage
                            ? "border-white/20 text-white/90"
                            : "border-white/5 text-gray-300"
                        )}>
                          <span>📌</span>
                          <span>{msg.topic}</span>
                        </div>
                      )}
                      <div className={cn(
                        "text-sm lg:text-base leading-relaxed whitespace-pre-wrap break-words",
                        isOutgoing ? "text-white" : "text-gray-200"
                      )}>
                        {msg.body}
                      </div>
                      <div className={cn(
                        "text-xs mt-2 flex items-center gap-2",
                        isOutgoing && isManagerMessage
                          ? "text-cyan-200/70"
                          : isOutgoing && !isManagerMessage
                          ? "text-white/60"
                          : "text-gray-500"
                      )}>
                        <span>{new Date(msg.created_at).toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })}</span>
                        {isUnread && (
                          <span className="text-amber-400 font-bold">●</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area - Fixed */}
          <div className="flex-shrink-0 p-4 lg:p-6 border-t border-white/5 bg-[#0f0f0f] backdrop-blur-xl relative z-50 overflow-visible rounded-b-3xl">
            <div className="space-y-3">
              {/* First Row: Topic (Manager) + User Selector (Manager) + Task Selector */}
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                {/* Topic Input - Only for Managers */}
                {canManage && (
                  <div className="flex-none lg:w-64">
                    <Input
                      placeholder="موضوع پیام (اختیاری)"
                      value={chatTopic}
                      onChange={(e) => setChatTopic(e.target.value)}
                      className="w-full bg-[#0a0a0a] border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-teal-600/50 focus-visible:border-teal-600/50 rounded-xl text-sm lg:text-base"
                    />
                  </div>
                )}
                
                {/* User Selector - Only for Managers */}
                {canManage && (
                  <div className="flex items-center gap-3 relative flex-1">
                    <Users className="h-4 w-4 lg:h-5 lg:w-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 relative">
                      <select
                        value={selectedChatUser || ""}
                        onChange={(e) => {
                          const userId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedChatUser(userId);
                          fetchChatMessages(userId);
                        }}
                        className="w-full bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-2.5 lg:py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600/50 transition-all appearance-none cursor-pointer pr-10"
                        style={{ zIndex: 1000 }}
                      >
                        <option value="" className="bg-[#0a0a0a]">همه اعضای تیم</option>
                        {chatParticipants.map((user) => (
                          <option key={user.id} value={user.id} className="bg-[#0a0a0a] text-white">
                            {user.username}
                            {user.unread_count && user.unread_count > 0 && ` (${user.unread_count} پیام خوانده نشده)`}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Task Selector - For Everyone */}
                <div className="flex items-center gap-3 relative flex-1">
                  <CheckSquare className="h-4 w-4 lg:h-5 lg:w-5 text-cyan-400 flex-shrink-0" />
                  <div className="flex-1 relative">
                    <select
                      value={selectedTask || ""}
                      onChange={(e) => setSelectedTask(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full bg-[#0a0a0a] border-white/10 text-white placeholder:text-gray-500 rounded-xl px-4 py-2.5 lg:py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600/50 transition-all appearance-none cursor-pointer pr-10"
                      style={{ zIndex: 1000 }}
                    >
                      <option value="" className="bg-[#0a0a0a]">انتخاب تسک (اختیاری)</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id} className="bg-[#0a0a0a] text-white">
                          {task.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* SMS Notification Checkbox - Only for Managers */}
              {canManage && (
                <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="sms_notification"
                    checked={sendSMSNotification}
                    onChange={(e) => setSendSMSNotification(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-teal-500 focus:ring-2 focus:ring-teal-600/50 cursor-pointer"
                  />
                  <label htmlFor="sms_notification" className="text-gray-300 text-sm cursor-pointer flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                    <span>اطلاع‌رسانی از طریق SMS</span>
                  </label>
                </div>
              )}

              {/* Second Row: Message Input + Send Button */}
              <div className="flex gap-2 lg:gap-3 items-end">
                <Textarea
                  placeholder={chatInputPlaceholder}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  className="flex-1 bg-[#0a0a0a] border-white/10 text-white placeholder:text-gray-500 min-h-[60px] lg:min-h-[80px] max-h-[200px] focus-visible:ring-2 focus-visible:ring-teal-600/50 focus-visible:border-teal-600/50 resize-none rounded-xl text-sm lg:text-base py-3 px-4"
                />
                <Button
                  onClick={handleSendChatMessage}
                  disabled={chatIsDisabled || !chatInput.trim()}
                  size="lg"
                  className="bg-gradient-to-r from-[#187272] to-[#26fce3] hover:from-[#2a9c96] hover:to-[#58cac0] text-white px-4 lg:px-6 h-[60px] lg:h-[80px] rounded-xl shadow-lg shadow-[#26fce3]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-teal-500/20"
                >
                  <Send className="h-5 w-5 lg:h-6 lg:w-6" />
                  <span className="hidden sm:inline mr-2">ارسال</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskChatPage;


