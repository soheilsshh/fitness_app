import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, ShieldCheck } from 'lucide-react';
import { adminApi, getAdminToken } from '@/lib/adminApi';
import FitinoBrandMark from '@/components/FitinoBrandMark';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getAdminToken()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await adminApi.login(username, password);
      navigate('/admin', { replace: true });
    } catch {
      setError('نام کاربری یا رمز عبور اشتباه است');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0e0e0e] p-4 text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-blob absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#26fce3]/12 blur-[140px]" />
      </div>

      <div className="glow-card relative z-10 w-full max-w-sm rounded-3xl p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <FitinoBrandMark size={56} pulse={false} />
          <div className="mt-4 flex items-center gap-2 text-lg font-extrabold">
            <ShieldCheck className="h-5 w-5 text-[#26fce3]" />
            پنل مدیریت چالش ۲۱ روزه
          </div>
          <p className="mt-1 text-sm text-muted-foreground">ورود مخصوص مدیران فیتینو</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-[#58cac0]" />
              نام کاربری
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="site-input h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-[#58cac0]" />
              رمز عبور
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="site-input h-12"
              dir="ltr"
            />
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <Button type="submit" variant="ghost" className="btn-cta h-auto hover:bg-transparent" disabled={isSubmitting}>
            {isSubmitting ? 'در حال ورود...' : 'ورود'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
