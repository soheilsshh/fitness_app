import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowRight, User, Phone, Radio } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { normalizePhoneNumber } from "@/utils/phoneUtils";
import FitinoBrandMark from "@/components/FitinoBrandMark";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RegisterModal = ({ open, onOpenChange, onSuccess }: RegisterModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccessful, setRegistrationSuccessful] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone) return;

    setIsSubmitting(true);

    try {
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(formData.phone);

      // First, try to find existing user by phone number
      const findResult = await apiService.findUserByPhone(normalizedPhone);

      if (findResult.found && findResult.user) {
        // User found - activate existing user (no new registration)
        localStorage.setItem('registrationData', JSON.stringify({
          firstName: findResult.user.first_name,
          lastName: findResult.user.last_name,
          phone: findResult.user.phone,
          registrationTime: findResult.user.registered_at,
          userId: findResult.user.id
        }));

        toast({
          title: "ورود موفق",
          description: "به کارگاه خوش آمدید!",
        });

        // Mark registration as successful to allow modal to close
        setRegistrationSuccessful(true);

        // Close modal and call onSuccess callback
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }

        // Reset form
        setFormData({
          firstName: "",
          phone: ""
        });
        return;
      }

      // User not found - show error
      toast({
        title: "کاربر یافت نشد",
        description: findResult.error || "با شماره ای ثبت نام کرده اید وارد شوید",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "خطا در ورود",
        description: "لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing modal - user must register to continue
      // Modal will only close after successful registration (handled in handleSubmit)
      if (!newOpen && !registrationSuccessful) {
        return; // Don't allow closing unless registration was successful
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent
        className="fitino-landing max-w-lg overflow-hidden p-0 sm:max-w-2xl [&>button]:hidden"
        dir="rtl"
        style={{ unicodeBidi: 'embed' }}
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing on outside click
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevent closing on ESC
      >
        {/* Asymmetric two-panel composition: a decorative brand panel (desktop
            only) beside the actual form panel, instead of a generic centered
            stacked dialog. */}
        <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-gradient-to-br from-[var(--fp-deep)] via-[var(--fp-brand)] to-[var(--fp-mid)] p-7 text-primary-foreground sm:flex">
            <div className="fp-pulse-ring absolute -bottom-16 -start-16 h-52 w-52 border-white/25" aria-hidden />
            <div className="fp-pulse-ring absolute -bottom-16 -start-16 h-52 w-52 border-white/25" style={{ animationDelay: '-2s' }} aria-hidden />
            <FitinoBrandMark size={52} pulse={false} className="relative" />
            <div className="relative">
              <span className="fp-chip bg-white/10 text-primary-foreground" style={{ color: '#fff' }}>
                <Radio className="size-3.5" aria-hidden />
                کارگاه زنده فیتینو
              </span>
              <h2 className="mt-4 text-2xl font-extrabold leading-snug">
                وارد کارگاه شو 👇
              </h2>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/80">
                اطلاعات ثبت‌نام خود را وارد کنید
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <DialogHeader className="items-center text-center sm:hidden">
              <FitinoBrandMark size={48} pulse={false} className="mb-2" />
              <DialogTitle className="text-xl font-bold">
                وارد کارگاه شو 👇
              </DialogTitle>
              <DialogDescription>
                اطلاعات ثبت‌نام خود را وارد کنید
              </DialogDescription>
            </DialogHeader>
            <DialogTitle className="mb-1 hidden text-lg font-bold sm:block">
              ورود سریع
            </DialogTitle>
            <DialogDescription className="mb-5 hidden sm:block">
              با شماره‌ای که ثبت‌نام کردید وارد شوید
            </DialogDescription>

            <form onSubmit={handleSubmit} className="mt-4 space-y-5 sm:mt-0">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-right text-sm font-semibold text-foreground/85">
                  <User className="h-4 w-4 text-secondary" aria-hidden />
                  نام
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="نام شما"
                  className="text-right"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-right text-sm font-semibold text-foreground/85">
                  <Phone className="h-4 w-4 text-secondary" aria-hidden />
                  شماره تماس
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                  className="text-right"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !formData.firstName || !formData.phone}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    در حال ورود...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    ورود به کارگاه
                    <ArrowRight size={18} />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
