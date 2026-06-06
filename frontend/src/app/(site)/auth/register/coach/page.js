import CoachRegisterForm from "./_components/CoachRegisterForm";

export const metadata = {
  title: "ثبت‌نام مربی | FitPro",
};

export default function CoachRegisterPage() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-extrabold text-white">ثبت‌نام مربی</h1>
        <p className="mt-2 text-sm text-zinc-400">
          حساب مربی بسازید و پروفایل عمومی خود را تکمیل کنید.
        </p>
      </div>
      <CoachRegisterForm />
    </div>
  );
}
