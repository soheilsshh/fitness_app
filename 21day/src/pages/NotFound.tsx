import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import FitinoBrandMark from "@/components/FitinoBrandMark";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] text-foreground px-4">
      <div className="text-center space-y-4">
        <FitinoBrandMark size={64} />
        <h1 className="text-4xl font-extrabold">۴۰۴</h1>
        <p className="text-muted-foreground">این صفحه پیدا نشد</p>
        <a href="/" className="btn-cta mx-auto max-w-xs">
          بازگشت به فیتینو
        </a>
      </div>
    </div>
  );
};

export default NotFound;
