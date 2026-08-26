import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, ArrowRight, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config/environment";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onBack: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = config.API_BASE_URL;
  const token = localStorage.getItem("admin_token");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !token) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Prepare messages for API (include conversation history)
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const chatUrl = `${API_URL}/admin/groq/chat`;
      console.log("[AIChat] Sending request to:", chatUrl);

      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: "llama-3.3-70b-versatile",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `خطا در ارتباط با API (کد: ${response.status})`);
      }

      const data = await response.json();

      // Extract assistant message from response
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.choices[0].message.content || "پاسخ دریافت نشد.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("فرمت پاسخ API معتبر نیست");
      }
    } catch (err: any) {
      console.error("[AIChat] send message error:", err);
      setError(err.message || "خطا در ارسال پیام");
      // Remove the user message on error so user can retry
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Group consecutive messages from the same role together so the thread
  // reads as clustered exchanges instead of one bubble per turn.
  const groupedMessages: Message[][] = [];
  messages.forEach((message) => {
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup[0].role === message.role) {
      lastGroup.push(message);
    } else {
      groupedMessages.push([message]);
    }
  });

  return (
    <div className="mt-8" dir="rtl">
      <Card className="bg-gradient-to-b from-[#0b1124] via-[#05060a] to-[#010205] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)] rounded-3xl overflow-hidden backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-white/5 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/20">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">چت با هوش مصنوعی</CardTitle>
              <p className="text-gray-400 text-sm mt-1">دستیار هوشمند شما برای تولید محتوا</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                onClick={clearChat}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"
              >
                پاک کردن چت
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onBack}
              className="gap-2 rounded-xl px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <ArrowRight className="h-4 w-4" />
              بازگشت به مدیریت محتوا
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="h-[600px] overflow-y-auto px-6 py-6 space-y-6 bg-[#0a0a0a]"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(168, 85, 247, 0.2) transparent",
            }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="fp-notch max-w-sm border border-white/5 bg-white/[0.02] px-8 py-10 text-center">
                  <div className="p-4 bg-white/5 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center border border-white/5">
                    <Bot className="h-10 w-10 text-gray-600 opacity-50" />
                  </div>
                  <p className="text-gray-400 text-lg">خوش آمدید! سوال خود را بپرسید</p>
                  <p className="text-gray-600 text-sm mt-2">من می‌توانم در تولید محتوا به شما کمک کنم</p>
                </div>
              </div>
            ) : (
              groupedMessages.map((group, groupIdx) => {
                const isUser = group[0].role === "user";
                return (
                  <div
                    key={groupIdx}
                    className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        isUser
                          ? "bg-gradient-to-br from-cyan-600 to-blue-600"
                          : "bg-gradient-to-br from-purple-600 to-pink-600"
                      )}
                    >
                      {isUser ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={cn("flex-1 flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
                      {group.map((message, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "fp-spine max-w-[85%] rounded-2xl px-4 py-3",
                            isUser
                              ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-br-sm"
                              : "bg-[#151515] text-gray-100 border border-white/5 rounded-bl-sm"
                          )}
                          style={{
                            borderInlineStartColor: isUser ? "#67e8f9" : "#c084fc",
                          }}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-2",
                              isUser ? "text-white/60" : "text-gray-500"
                            )}
                          >
                            {message.timestamp.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex gap-3 flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-right">
                  <div
                    className="fp-spine bg-[#151515] text-gray-100 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 inline-block"
                    style={{ borderInlineStartColor: "#c084fc" }}
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="fp-spine mx-6 mb-4 rounded-xl bg-red-600/10 backdrop-blur-sm px-4 py-3 text-sm text-red-300" style={{ borderInlineStartColor: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-white/5 bg-[#0f0f0f] backdrop-blur-xl">
            <div className="flex gap-3 items-end">
              <Textarea
                placeholder="سوال خود را بنویسید..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className="flex-1 bg-[#0a0a0a] border-white/10 text-white placeholder:text-gray-500 min-h-[80px] max-h-[200px] focus-visible:ring-2 focus-visible:ring-purple-600/50 focus-visible:border-purple-600/50 resize-none rounded-xl text-sm py-3 px-4"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="lg"
                className="fp-notch-btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 h-[80px] shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-purple-500/20"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    ارسال
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChat;
