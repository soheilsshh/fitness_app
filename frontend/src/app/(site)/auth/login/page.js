import { Suspense } from "react";
import AuthAliasRedirect from "../_components/AuthAliasRedirect";

export const metadata = {
  title: "ورود | فیتینو",
  description: "ورود به حساب فیتینو",
};

export default function LoginPage() {
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
