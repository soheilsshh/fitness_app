import { Suspense } from "react";
import LoginForm from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">در حال بارگذاری...</div>}>
      <LoginForm />
    </Suspense>
  );
}
