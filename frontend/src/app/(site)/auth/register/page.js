import { Suspense } from "react";
import AuthAliasRedirect from "../_components/AuthAliasRedirect";

export const metadata = {
  title: "ثبت‌نام | فیتینو",
  description: "ساخت حساب فیتینو",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted-foreground">
          در حال انتقال…
        </div>
      }
    >
      <AuthAliasRedirect />
    </Suspense>
  );
}
