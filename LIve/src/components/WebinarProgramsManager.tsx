import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Edit2, X, Save } from "lucide-react";
import { config } from "@/config/environment";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebinarProgram {
  id: number;
  slug: string;
  title: string;
  video_url: string;
  start_at: string; // ISO
  end_at: string; // ISO
  is_selling_enabled: boolean;
  buy_button_reveal_at: string | null;
  price: number;
  comments_json: string;
  is_active: boolean;
}

interface WebinarProgramsManagerProps {
  token: string;
}

const emptyForm = {
  slug: "",
  title: "",
  video_url: "",
  start_at: "",
  end_at: "",
  is_selling_enabled: false,
  buy_button_reveal_at: "",
  price: 0,
  comments_json: "[]",
  is_active: true,
};

// datetime-local inputs need "YYYY-MM-DDTHH:mm", ISO strings from the API
// have seconds/timezone — trim to what the input understands.
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

const WebinarProgramsManager = ({ token }: WebinarProgramsManagerProps) => {
  const [programs, setPrograms] = useState<WebinarProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<WebinarProgram | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const API_URL = config.API_BASE_URL;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/webinar-programs`, { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrograms(data.programs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری وبینارها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (p: WebinarProgram) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      video_url: p.video_url,
      start_at: toLocalInput(p.start_at),
      end_at: toLocalInput(p.end_at),
      is_selling_enabled: p.is_selling_enabled,
      buy_button_reveal_at: toLocalInput(p.buy_button_reveal_at),
      price: p.price,
      comments_json: p.comments_json || "[]",
      is_active: p.is_active,
    });
    setShowDialog(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      // Validate comments_json before sending — a typo here shouldn't
      // corrupt a saved program.
      try {
        JSON.parse(form.comments_json || "[]");
      } catch {
        throw new Error("کامنت‌ها JSON معتبر نیست");
      }

      const body = {
        slug: form.slug,
        title: form.title,
        video_url: form.video_url,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        is_selling_enabled: form.is_selling_enabled,
        buy_button_reveal_at: form.buy_button_reveal_at
          ? new Date(form.buy_button_reveal_at).toISOString()
          : null,
        price: Number(form.price) || 0,
        comments_json: form.comments_json || "[]",
        is_active: form.is_active,
      };

      const url = editing
        ? `${API_URL}/admin/webinar-programs/${editing.id}`
        : `${API_URL}/admin/webinar-programs`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setShowDialog(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: WebinarProgram) => {
    if (!window.confirm(`وبینار «${p.title}» حذف بشه؟`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/webinar-programs/${p.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در حذف");
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">مدیریت چند وبیناره</CardTitle>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> وبینار جدید
        </Button>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-white/50">
          هر وبینار زمان پخش، ویدیو، وضعیت فروش و «زمان طلایی» دکمه خرید خودش
          رو داره. سیستم استریم خودکار هر وبینار رو دقیقاً سر زمانش پخش می‌کنه.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          </div>
        ) : programs.length === 0 ? (
          <p className="py-8 text-center text-white/40">هنوز وبیناری ثبت نشده.</p>
        ) : (
          <div className="space-y-3">
            {programs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.title}</span>
                    <span className="text-xs text-white/40">/{p.slug}</span>
                    {!p.is_active && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/50">غیرفعال</span>
                    )}
                    {p.is_selling_enabled && (
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">فروش فعال</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {new Date(p.start_at).toLocaleString("fa-IR")} تا {new Date(p.end_at).toLocaleString("fa-IR")}
                    {p.is_selling_enabled && ` · قیمت: ${p.price.toLocaleString("fa-IR")} تومان`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش وبینار" : "وبینار جدید"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Slug (یکتا، بدون فاصله)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="webinar-1" />
              </div>
              <div>
                <Label>عنوان</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="وبینار شماره ۱" />
              </div>
            </div>

            <div>
              <Label>مسیر ویدیو (روی سرور، مثل ./videos/webinar1.mp4)</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="./videos/video1.mp4" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>شروع پخش</Label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div>
                <Label>پایان پخش</Label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.is_selling_enabled}
                onCheckedChange={(v) => setForm({ ...form, is_selling_enabled: Boolean(v) })}
              />
              <Label>فروش توی این وبینار فعال باشه</Label>
            </div>

            {form.is_selling_enabled && (
              <div className="grid grid-cols-2 gap-3 border-r-2 border-purple-500/30 pr-3">
                <div>
                  <Label>زمان طلایی (وقتی دکمه خرید ظاهر بشه)</Label>
                  <Input
                    type="datetime-local"
                    value={form.buy_button_reveal_at}
                    onChange={(e) => setForm({ ...form, buy_button_reveal_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>قیمت (تومان)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: Boolean(v) })} />
              <Label>وبینار فعال باشه (خاموش = هیچ‌وقت پخش نمی‌شه)</Label>
            </div>

            <div>
              <Label>کامنت‌های مارکتینگ (JSON — همون فرمت TimeRange[] قدیمی)</Label>
              <Textarea
                rows={6}
                className="font-mono text-xs"
                value={form.comments_json}
                onChange={(e) => setForm({ ...form, comments_json: e.target.value })}
                placeholder='[{"start":"00:00:00:000","end":"00:01:00:000","comments":[{"username":"علی","message":"سلام"}]}]'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="ms-1 h-4 w-4" /> انصراف
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="ms-1 h-4 w-4 animate-spin" /> : <Save className="ms-1 h-4 w-4" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default WebinarProgramsManager;
