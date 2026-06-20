import { Suspense } from "react";
import RegisterForm from "./_components/RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">در حال بارگذاری...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
