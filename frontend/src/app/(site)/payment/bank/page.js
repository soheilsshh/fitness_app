export default function BankGatewayPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-xl font-extrabold text-white">درگاه بانکی (دمو)</div>
        <div className="mt-2 text-sm text-zinc-300">
          این صفحه صرفاً شبیه‌سازی درگاه پرداخت است.
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/30 p-5 text-sm text-zinc-200">
          در نسخه واقعی، اینجا به URL بانک redirect می‌شوید.
        </div>
      </div>
    </div>
  );
}
