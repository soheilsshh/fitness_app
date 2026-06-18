"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordModal({ open, onClose, onSuccess, onError }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setSubmitting(false);
    }
  }, [open]);

  const validate = () => {
    if (!current || !next || !confirm) return "همه فیلدها الزامی هستند.";
    if (next.length < 6) return "رمز جدید باید حداقل ۶ کاراکتر باشد.";
    if (next !== confirm) return "رمز جدید با تکرار آن یکسان نیست.";
    if (next === current) return "رمز جدید نباید با رمز فعلی یکسان باشد.";
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      onError?.(err);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/me/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      onSuccess?.("رمز عبور با موفقیت تغییر کرد.");
      onClose?.();
    } catch (e) {
      onError?.(
        e?.response?.data?.error || "خطا در تغییر رمز عبور. دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-start">
            <Lock className="size-4 text-primary" />
            تغییر رمز عبور
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PasswordField
            id="current-password"
            label="رمز فعلی"
            value={current}
            onChange={setCurrent}
          />
          <PasswordField
            id="new-password"
            label="رمز جدید"
            value={next}
            onChange={setNext}
          />
          <PasswordField
            id="confirm-password"
            label="تکرار رمز جدید"
            value={confirm}
            onChange={setConfirm}
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            انصراف
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? "در حال ثبت..." : "تایید"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({ id, label, value, onChange }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
