import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FitinoBrandMark from "@/components/FitinoBrandMark";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0c0c] px-6 text-[#f8fafc]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden style={{
        backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="relative z-10 flex max-w-md flex-col items-center gap-6 text-center">
        <FitinoBrandMark size={44} />
        <CheckCircle2 className="h-16 w-16 text-[#26fce3]" strokeWidth={1.5} aria-hidden />
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">پرداخت موفق بود</h1>
        <p className="text-white/70">
          دسترسی کامل چالش ۲۱ روزه برات فعال شد. برو سراغ ویدیوها.
        </p>
        <Button
          size="lg"
          onClick={() => navigate("/videos")}
          className="h-14 w-full rounded-none bg-[#26fce3] px-8 text-base font-extrabold text-[#0a1a18] hover:bg-[#7dffe8]"
        >
          رفتن به ویدیوها
          <ArrowLeft className="me-1 h-5 w-5" aria-hidden />
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
