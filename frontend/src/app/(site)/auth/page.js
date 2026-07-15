import { Suspense } from "react";
import UnifiedAuthForm from "./_components/UnifiedAuthForm";

export const metadata = {
  title: "ورود یا ثبت‌نام | فیتینو",
  description: "با شماره موبایل وارد شوید یا حساب جدید بسازید",
};

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">در حال بارگذاری...</div>}>
      <UnifiedAuthForm />
    </Suspense>
  );
}
