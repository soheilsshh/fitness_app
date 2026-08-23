import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, XCircle } from "lucide-react";
import { config } from "@/config/environment";
import FitinoBrandMark from "@/components/FitinoBrandMark";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ورود");
      }

      // Save token to localStorage
      localStorage.setItem("admin_token", data.token);

      // Navigate to admin panel
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "خطا در ورود. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fitino-landing relative min-h-screen overflow-x-hidden bg-[#0e0e0e]" dir="rtl">
      {/* Ambient pulse rings */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: '-1.5s' }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Card className="fp-card fp-notch overflow-hidden shadow-2xl">
            <CardHeader className="text-right p-6 sm:p-8 border-b border-white/8">
              <div className="flex flex-col items-center gap-4">
                <FitinoBrandMark size={56} pulse={false} />

                <div className="text-center">
                  <CardTitle className="text-white text-center text-2xl sm:text-3xl font-bold">
                    ورود به پنل
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="bg-red-600/15 border-red-600/40">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-right text-red-300 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    dir="ltr"
                    placeholder="username"
                    className="h-12 text-right"
                  />
                </div>

                <div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    dir="ltr"
                    placeholder="password"
                    className="h-12 text-right"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      در حال ورود...
                    </>
                  ) : (
                    <>
                      ورود به پنل ادمین
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
