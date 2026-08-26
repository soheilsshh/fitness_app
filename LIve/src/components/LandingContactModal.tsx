import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Phone, Radio } from "lucide-react";
import { apiService } from "@/services/api";
import { normalizePhoneNumber } from "@/utils/phoneUtils";
import FitinoBrandMark from "@/components/FitinoBrandMark";

interface LandingContactModalProps {
  open: boolean;
  onSuccess: (data: { firstName: string; lastName: string; phone: string }) => void;
}

const LandingContactModal: React.FC<LandingContactModalProps> = ({ open, onSuccess }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if fields are filled
    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    
    if (!trimmedFullName || !trimmedPhone) {
      setError("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    // Validate phone number
    const normalizedPhone = normalizePhoneNumber(trimmedPhone);
    if (normalizedPhone.length < 10) {
      setError("شماره تماس معتبر نیست");
      return;
    }

    // Split full name into first and last name
    const nameParts = trimmedFullName.split(/\s+/).filter(p => p.length > 0);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    if (!firstName) {
      setError("لطفاً حداقل نام خود را وارد کنید");
      return;
    }

    setSubmitting(true);

    try {
      // Register user (this will create a User record and allow tracking)
      // IMPORTANT: Send registration-success SMS via Melipayamak (do NOT skip)
      const response = await apiService.registerUser({
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone,
      }, false); // skipSMS = false

      // Save to localStorage for tracking
      localStorage.setItem('registrationData', JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        phone: normalizedPhone,
        registrationTime: new Date().toISOString(),
        userId: response.user.id,
      }));

      // Track landing entry
      await apiService.trackLandingActivity(
        normalizedPhone,
        'entered_landing',
        firstName,
        lastName
      );

      // Call success callback
      onSuccess({
        firstName: firstName,
        lastName: lastName,
        phone: normalizedPhone,
      });

      // Reset form
      setFullName("");
      setPhone("");
    } catch (err: any) {
      console.error('Failed to register user:', err);
      setError(err.message || "خطا در ثبت اطلاعات. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="fitino-landing max-w-sm overflow-visible border-none bg-transparent p-0 shadow-none [&>button]:hidden"
        dir="rtl"
      >
        {/* Compact centered card instead of a generic dark glass box — brand
            mark + pennant tag up top, spine-accented error state below. */}
        <div className="fp-card fp-notch relative overflow-visible p-6 pt-9 text-center sm:p-7 sm:pt-10">
          <span className="fp-ribbon">
            <Radio className="size-3" aria-hidden />
            کارگاه زنده فیتینو
          </span>

          <FitinoBrandMark size={44} pulse={false} className="mx-auto mb-3" />

          <DialogHeader className="items-center">
            <DialogTitle className="text-center text-lg font-bold text-foreground">
              برای ادامه لطفا اطلاعات خود را وارد کنید
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-right">
            <div className="space-y-2">
              <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-foreground/85">
                <User className="h-4 w-4 text-secondary" aria-hidden />
                نام و نام خانوادگی
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  // Allow all characters including spaces - no filtering
                  setFullName(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter in name field
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="نام و نام خانوادگی"
                className="text-right"
                disabled={submitting}
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-foreground/85">
                <Phone className="h-4 w-4 text-secondary" aria-hidden />
                شماره تماس
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="شماره تماس"
                dir="ltr"
                disabled={submitting}
              />
            </div>

            {error && (
              <div
                className="fp-spine rounded-lg bg-destructive/10 p-2.5 text-center text-xs text-destructive"
                style={{ borderInlineStartColor: "hsl(var(--destructive))" }}
              >
                {error}
              </div>
            )}

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  در حال ثبت...
                </span>
              ) : (
                "ادامه"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LandingContactModal;

