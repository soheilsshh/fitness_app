import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { config } from "@/config/environment";
import { TimeRange, TimedComment } from "@/data/timedComments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";

interface TimedCommentsManagerProps {
  token: string;
}

const TimedCommentsManager = ({ token }: TimedCommentsManagerProps) => {
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedRanges, setExpandedRanges] = useState<Set<number>>(new Set());
  const [editingComment, setEditingComment] = useState<{
    rangeIndex: number;
    commentIndex: number;
  } | null>(null);
  const [editingRange, setEditingRange] = useState<number | null>(null);
  const [showAddCommentDialog, setShowAddCommentDialog] = useState<number | null>(null);
  const [showAddRangeDialog, setShowAddRangeDialog] = useState(false);

  const API_URL = config.API_BASE_URL;

  // Parse TypeScript file content to extract time ranges
  // This uses a simple approach: extract the array and use eval in a safe way
  const parseTypeScriptFile = (content: string): TimeRange[] => {
    try {
      // Extract the array content from TypeScript export
      const arrayStart = content.indexOf("export const timedComments: TimeRange[] = [");
      if (arrayStart === -1) {
        throw new Error("Could not find timedComments array");
      }

      const startIdx = content.indexOf("[", arrayStart);
      let bracketCount = 0;
      let inString = false;
      let stringChar = '';
      let arrayContent = "";

      for (let i = startIdx; i < content.length; i++) {
        const char = content[i];
        const prevChar = i > 0 ? content[i - 1] : '';

        // Handle string escaping
        if (prevChar !== '\\') {
          if ((char === '"' || char === "'") && !inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar && inString) {
            inString = false;
            stringChar = '';
          }
        }

        if (!inString) {
          if (char === '[') bracketCount++;
          if (char === ']') {
            bracketCount--;
            if (bracketCount === 0) {
              arrayContent = content.substring(startIdx, i + 1);
              break;
            }
          }
        }
      }

      // Convert TypeScript object syntax to JSON
      // More careful conversion to handle Persian text and special characters
      let jsonContent = arrayContent
        // Replace object keys with quoted keys (but be careful with existing quotes)
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        // Replace single quotes with double quotes (but preserve escaped quotes)
        .replace(/'/g, '"')
        // Replace undefined with null
        .replace(/undefined/g, 'null')
        // Remove trailing commas before closing brackets/braces
        .replace(/,(\s*[}\]])/g, '$1');

      // Parse as JSON
      const parsed = JSON.parse(jsonContent);
      return parsed as TimeRange[];
    } catch (err) {
      console.error("Error parsing TypeScript file:", err);
      console.error("Trying alternative parsing method...");
      
      // Fallback: try to use the file directly by importing it
      // This won't work in runtime, but we can at least show an error
      return [];
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    try {
      // First, try to import the file directly (works in dev, but not in production)
      try {
        const { timedComments } = await import("@/data/timedComments");
        setTimeRanges(timedComments);
        if (timedComments.length > 0) {
          setExpandedRanges(new Set([0]));
        }
        setLoading(false);
        return;
      } catch (importError) {
        console.log("Direct import failed, trying API...", importError);
      }

      // Fallback: fetch from API
      const response = await fetch(`${API_URL}/admin/timed-comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("خطا در دریافت کامنت‌ها");
      }

      const text = await response.text();
      const parsed = parseTypeScriptFile(text);
      
      if (parsed.length === 0) {
        // If parsing failed, try to use the imported file as fallback
        try {
          const { timedComments } = await import("@/data/timedComments");
          setTimeRanges(timedComments);
          if (timedComments.length > 0) {
            setExpandedRanges(new Set([0]));
          }
        } catch (fallbackError) {
          console.error("All parsing methods failed:", fallbackError);
          setError("خطا در خواندن فایل کامنت‌ها");
        }
      } else {
        setTimeRanges(parsed);
        if (parsed.length > 0) {
          setExpandedRanges(new Set([0]));
        }
      }
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      setError(err.message || "خطا در دریافت کامنت‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [token]);

  const saveComments = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/timed-comments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ timeRanges }),
      });

      if (!response.ok) {
        throw new Error("خطا در ذخیره کامنت‌ها");
      }

      alert("✅ کامنت‌ها با موفقیت ذخیره شدند");
      await fetchComments(); // Reload to get updated file
    } catch (err: any) {
      console.error("Error saving comments:", err);
      setError(err.message || "خطا در ذخیره کامنت‌ها");
      alert(`❌ خطا: ${err.message || "خطا در ذخیره کامنت‌ها"}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleRange = (index: number) => {
    const newExpanded = new Set(expandedRanges);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRanges(newExpanded);
  };

  const deleteComment = (rangeIndex: number, commentIndex: number) => {
    const newRanges = [...timeRanges];
    newRanges[rangeIndex].comments.splice(commentIndex, 1);
    setTimeRanges(newRanges);
  };

  const deleteRange = (rangeIndex: number) => {
    if (confirm("آیا مطمئن هستید که می‌خواهید این بازه را حذف کنید؟")) {
      const newRanges = timeRanges.filter((_, i) => i !== rangeIndex);
      setTimeRanges(newRanges);
    }
  };

  const addComment = (rangeIndex: number, comment: TimedComment) => {
    const newRanges = [...timeRanges];
    newRanges[rangeIndex].comments.push(comment);
    setTimeRanges(newRanges);
    setShowAddCommentDialog(null);
  };

  const updateComment = (rangeIndex: number, commentIndex: number, comment: TimedComment) => {
    const newRanges = [...timeRanges];
    newRanges[rangeIndex].comments[commentIndex] = comment;
    setTimeRanges(newRanges);
    setEditingComment(null);
  };

  const addRange = (range: TimeRange) => {
    const newRanges = [...timeRanges, range];
    setTimeRanges(newRanges);
    setShowAddRangeDialog(false);
  };

  const updateRange = (rangeIndex: number, range: Partial<TimeRange>) => {
    const newRanges = [...timeRanges];
    newRanges[rangeIndex] = { ...newRanges[rangeIndex], ...range };
    setTimeRanges(newRanges);
    setEditingRange(null);
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border border-white/10 rounded-2xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
            <div>
                <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                مدیریت کامنت‌های زمان‌بندی شده
              </CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                مدیریت بازه‌های زمانی و کامنت‌های مربوط به هر بازه
              </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddRangeDialog(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300"
                size="sm"
              >
                <Plus className="h-4 w-4 ml-2" />
                افزودن بازه جدید
              </Button>
              <Button onClick={saveComments} disabled={saving} className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {timeRanges.map((range, rangeIndex) => (
              <Collapsible
                key={rangeIndex}
                open={expandedRanges.has(rangeIndex)}
                onOpenChange={() => toggleRange(rangeIndex)}
              >
                <Card className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {expandedRanges.has(rangeIndex) ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <CardTitle className="text-white text-lg font-semibold">
                              بازه {rangeIndex + 1}: {range.start} - {range.end}
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                              {range.comments.length} کامنت
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRange(rangeIndex)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRange(rangeIndex)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-6">
                      {editingRange === rangeIndex ? (
                        <EditRangeForm
                          range={range}
                          onSave={(updated) => updateRange(rangeIndex, updated)}
                          onCancel={() => setEditingRange(null)}
                        />
                      ) : (
                        <>
                          <div className="mb-4 flex justify-end">
                            <Button
                              onClick={() => setShowAddCommentDialog(rangeIndex)}
                              className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 ml-2" />
                              افزودن کامنت
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {range.comments.map((comment, commentIndex) => (
                              <CommentItem
                                key={commentIndex}
                                comment={comment}
                                onEdit={() => setEditingComment({ rangeIndex, commentIndex })}
                                onDelete={() => deleteComment(rangeIndex, commentIndex)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>

          {timeRanges.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              هیچ بازه‌ای تعریف نشده است. برای شروع یک بازه جدید اضافه کنید.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Comment Dialog */}
      {showAddCommentDialog !== null && (
        <AddCommentDialog
          onSave={(comment) => addComment(showAddCommentDialog, comment)}
          onCancel={() => setShowAddCommentDialog(null)}
        />
      )}

      {/* Edit Comment Dialog */}
      {editingComment && (
        <EditCommentDialog
          comment={timeRanges[editingComment.rangeIndex].comments[editingComment.commentIndex]}
          onSave={(comment) =>
            updateComment(editingComment.rangeIndex, editingComment.commentIndex, comment)
          }
          onCancel={() => setEditingComment(null)}
        />
      )}

      {/* Add Range Dialog */}
      {showAddRangeDialog && (
        <AddRangeDialog
          onSave={addRange}
          onCancel={() => setShowAddRangeDialog(false)}
        />
      )}
    </div>
  );
};

// Comment Item Component
const CommentItem = ({
  comment,
  onEdit,
  onDelete,
}: {
  comment: TimedComment;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const timeOffset = comment.timeOffset ?? comment.offsetSeconds ?? 0;
  return (
    <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-white">{comment.username}</span>
          {comment.isAdmin && (
            <span className="text-xs bg-gradient-to-r from-[#187272] to-[#26fce3] text-white px-2 py-1 rounded-lg font-semibold">
              ادمین
            </span>
          )}
          <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
            +{timeOffset.toFixed(2)}s
          </span>
        </div>
        <p className="text-gray-300 mb-2">{comment.message}</p>
        {comment.replyToUsername && (
          <div className="text-xs text-gray-400 bg-white/5 p-2 rounded-lg border border-white/10">
            پاسخ به: {comment.replyToUsername} - {comment.replyToMessage}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl">
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Add Comment Dialog
const AddCommentDialog = ({
  onSave,
  onCancel,
}: {
  onSave: (comment: TimedComment) => void;
  onCancel: () => void;
}) => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [timeOffset, setTimeOffset] = useState("0");
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyToUsername, setReplyToUsername] = useState("");
  const [replyToMessage, setReplyToMessage] = useState("");

  const handleSave = () => {
    if (!username || !message) {
      alert("لطفاً نام کاربری و پیام را وارد کنید");
      return;
    }

    const comment: TimedComment = {
      username,
      message,
      timeOffset: parseFloat(timeOffset) || 0,
      isAdmin: isAdmin || undefined,
    };

    if (replyToUsername) {
      comment.replyToUsername = replyToUsername;
    }
    if (replyToMessage) {
      comment.replyToMessage = replyToMessage;
    }

    onSave(comment);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0F1E] border border-white/10 rounded-3xl" dir="rtl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl font-bold">افزودن کامنت جدید</DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
            کامنت جدید را به این بازه اضافه کنید
          </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">نام کاربری</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">پیام</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="متن کامنت را وارد کنید"
              rows={4}
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">زمان (ثانیه از شروع بازه)</Label>
            <Input
              type="number"
              step="0.01"
              value={timeOffset}
              onChange={(e) => setTimeOffset(e.target.value)}
              placeholder="0"
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
            <Checkbox
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked === true)}
              className="accent-orange-500"
            />
            <Label className="text-gray-300 text-sm font-medium">کامنت ادمین</Label>
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">پاسخ به (نام کاربری)</Label>
            <Input
              value={replyToUsername}
              onChange={(e) => setReplyToUsername(e.target.value)}
              placeholder="اختیاری"
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">پاسخ به (پیام)</Label>
            <Input
              value={replyToMessage}
              onChange={(e) => setReplyToMessage(e.target.value)}
              placeholder="اختیاری"
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="outline" onClick={onCancel} className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300">
            انصراف
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300">
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit Comment Dialog
const EditCommentDialog = ({
  comment,
  onSave,
  onCancel,
}: {
  comment: TimedComment;
  onSave: (comment: TimedComment) => void;
  onCancel: () => void;
}) => {
  const [username, setUsername] = useState(comment.username);
  const [message, setMessage] = useState(comment.message);
  const [timeOffset, setTimeOffset] = useState(
    String(comment.timeOffset ?? comment.offsetSeconds ?? 0)
  );
  const [isAdmin, setIsAdmin] = useState(comment.isAdmin ?? false);
  const [replyToUsername, setReplyToUsername] = useState(comment.replyToUsername ?? "");
  const [replyToMessage, setReplyToMessage] = useState(comment.replyToMessage ?? "");

  const handleSave = () => {
    if (!username || !message) {
      alert("لطفاً نام کاربری و پیام را وارد کنید");
      return;
    }

    const updated: TimedComment = {
      username,
      message,
      timeOffset: parseFloat(timeOffset) || 0,
      isAdmin: isAdmin || undefined,
    };

    if (replyToUsername) {
      updated.replyToUsername = replyToUsername;
    }
    if (replyToMessage) {
      updated.replyToMessage = replyToMessage;
    }

    onSave(updated);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0F1E] border border-white/10 rounded-3xl" dir="rtl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <Edit2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl font-bold">ویرایش کامنت</DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">اطلاعات کامنت را ویرایش کنید</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">نام کاربری</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">پیام</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">زمان (ثانیه از شروع بازه)</Label>
            <Input
              type="number"
              step="0.01"
              value={timeOffset}
              onChange={(e) => setTimeOffset(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
            <Checkbox
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked === true)}
              className="accent-orange-500"
            />
            <Label className="text-gray-300 text-sm font-medium">کامنت ادمین</Label>
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">پاسخ به (نام کاربری)</Label>
            <Input
              value={replyToUsername}
              onChange={(e) => setReplyToUsername(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">پاسخ به (پیام)</Label>
            <Input
              value={replyToMessage}
              onChange={(e) => setReplyToMessage(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="outline" onClick={onCancel} className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300">
            انصراف
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300">
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit Range Form
const EditRangeForm = ({
  range,
  onSave,
  onCancel,
}: {
  range: TimeRange;
  onSave: (range: Partial<TimeRange>) => void;
  onCancel: () => void;
}) => {
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);

  const handleSave = () => {
    if (!start || !end) {
      alert("لطفاً زمان شروع و پایان را وارد کنید");
      return;
    }
    onSave({ start, end });
  };

  return (
    <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300 text-sm font-medium mb-2">زمان شروع (HH:MM:SS:MS)</Label>
          <Input value={start} onChange={(e) => setStart(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10" />
        </div>
        <div>
          <Label className="text-gray-300 text-sm font-medium mb-2">زمان پایان (HH:MM:SS:MS)</Label>
          <Input value={end} onChange={(e) => setEnd(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm" className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300">
          ذخیره
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm" className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300">
          انصراف
        </Button>
      </div>
    </div>
  );
};

// Add Range Dialog
const AddRangeDialog = ({
  onSave,
  onCancel,
}: {
  onSave: (range: TimeRange) => void;
  onCancel: () => void;
}) => {
  const [start, setStart] = useState("00:00:00:00");
  const [end, setEnd] = useState("00:00:00:00");

  const handleSave = () => {
    if (!start || !end) {
      alert("لطفاً زمان شروع و پایان را وارد کنید");
      return;
    }
    onSave({ start, end, comments: [] });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="bg-[#0A0F1E] border border-white/10 rounded-3xl" dir="rtl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl font-bold">افزودن بازه جدید</DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
            یک بازه زمانی جدید برای کامنت‌ها ایجاد کنید
          </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">زمان شروع (HH:MM:SS:MS)</Label>
            <Input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="00:00:00:00"
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-sm font-medium mb-2">زمان پایان (HH:MM:SS:MS)</Label>
            <Input
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="00:00:00:00"
              className="bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 hover:bg-white/10"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="outline" onClick={onCancel} className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300">
            انصراف
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300">
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimedCommentsManager;

