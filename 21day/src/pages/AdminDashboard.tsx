import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  Trophy,
  TrendingUp,
  LogOut,
  Search,
  Download,
  ChevronRight,
  ChevronLeft,
  Loader2,
  BookOpen,
  BarChart3,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi, AdminUnauthorizedError, getAdminToken } from '@/lib/adminApi';
import FitinoBrandMark from '@/components/FitinoBrandMark';

type AdminTab = 'overview' | 'users' | 'guide';

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
};

const formatDayLabel = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
};

const StatCard = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="bento-tile p-5">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#187272]/25">{icon}</div>
    <div className="mt-4 text-2xl font-extrabold tabular-nums">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    {hint && <div className="mt-1 text-xs text-muted-foreground/70">{hint}</div>}
  </div>
);

const PAGE_SIZE = 15;

const SUPPORT_ROWS = [
  {
    problem: 'ثبت‌نام کرده ولی ویدیو نمی‌بیند',
    check: 'وجود userPhone در مرورگر · ثبت‌نام مجدد · ردیف در تب کاربران',
  },
  {
    problem: 'جلسه بعدی باز نمی‌شود',
    check: 'قبولی کوییز ۳/۳ جلسه قبل · ستون پیشرفت در لیست کاربران',
  },
  {
    problem: 'XP نگرفته',
    check: 'قبولی کوییز ۳/۳ · ستون XP / سطح در پنل',
  },
  {
    problem: 'می‌گوید SMS نیامده',
    check: 'شماره نرمال‌شده +98 · الگوهای SMS در config بک‌اند ۲۱روز',
  },
  {
    problem: 'آمار عجیب',
    check: 'نرخ شروع vs تکمیل · قیف هر روز · خروجی CSV',
  },
] as const;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleUnauthorized = () => {
    navigate('/admin/login', { replace: true });
  };

  const hasToken = Boolean(getAdminToken());

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    retry: false,
    enabled: hasToken,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers({ page, pageSize: PAGE_SIZE, search }),
    retry: false,
    enabled: hasToken,
  });

  useEffect(() => {
    const err = statsQuery.error || usersQuery.error;
    if (err instanceof AdminUnauthorizedError) {
      handleUnauthorized();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsQuery.error, usersQuery.error]);

  const handleLogout = async () => {
    await adminApi.logout();
    navigate('/admin/login', { replace: true });
  };

  const handleExport = async () => {
    try {
      await adminApi.downloadUsersCsv();
    } catch (err) {
      if (err instanceof AdminUnauthorizedError) handleUnauthorized();
    }
  };

  const stats = statsQuery.data;
  const users = usersQuery.data;
  const totalPages = users ? Math.max(1, Math.ceil(users.total / PAGE_SIZE)) : 1;
  const videoFunnel = stats?.funnel.filter((f) => f.video_id !== undefined) ?? [];
  const registrationStage = stats?.funnel.find((f) => f.video_id === undefined);
  const funnelMax = Math.max(registrationStage?.count ?? 0, 1);

  const tabs: { id: AdminTab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'آمار و قیف', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'users', label: 'کاربران', icon: <Users className="h-4 w-4" /> },
    { id: 'guide', label: 'راهنما', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="relative min-h-screen bg-[#0e0e0e] text-foreground" dir="rtl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-blob absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#26fce3]/10 blur-[140px]" />
      </div>

      <header className="relative z-10 border-b border-white/8 bg-[#0e0e0e]/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <FitinoBrandMark size={30} pulse={false} />
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold">پنل مدیریت چالش ۲۱ روزه</div>
              <div className="text-[10px] text-muted-foreground">دیتابیس اختصاصی ۲۱day · پورت API 8081</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                void statsQuery.refetch();
                void usersQuery.refetch();
              }}
              className="h-9 w-9 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
              aria-label="بروزرسانی"
            >
              <RefreshCw className={`h-4 w-4 ${statsQuery.isFetching || usersQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="cursor-pointer gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container relative z-10 mx-auto px-4 pt-4">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.02] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-[#187272]/40 text-[#26fce3]'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container relative z-10 mx-auto space-y-8 px-4 py-6">
        {tab === 'overview' && (
          <>
            {statsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال بارگذاری آمار...
              </div>
            ) : statsQuery.isError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-300">
                خطا در دریافت آمار. دوباره تلاش کن.
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <StatCard
                    icon={<Users className="h-5 w-5 text-[#26fce3]" />}
                    label="کل ثبت‌نام‌ها"
                    value={stats.total_registrations.toLocaleString('fa-IR')}
                    hint={`${stats.registrations_today.toLocaleString('fa-IR')} امروز`}
                  />
                  <StatCard
                    icon={<UserCheck className="h-5 w-5 text-[#58cac0]" />}
                    label="نرخ شروع"
                    value={`${stats.engagement_rate.toLocaleString('fa-IR')}٪`}
                    hint={`${stats.not_started_users.toLocaleString('fa-IR')} نفر شروع نکردن`}
                  />
                  <StatCard
                    icon={<Trophy className="h-5 w-5 text-yellow-400" />}
                    label="نرخ تکمیل دوره"
                    value={`${stats.completion_rate.toLocaleString('fa-IR')}٪`}
                    hint={`${stats.completed_all_users.toLocaleString('fa-IR')} نفر کامل کردن`}
                  />
                  <StatCard
                    icon={<TrendingUp className="h-5 w-5 text-primary" />}
                    label="میانگین پیشرفت"
                    value={`${stats.avg_progress_percent.toLocaleString('fa-IR')}٪`}
                  />
                  <StatCard
                    icon={<Users className="h-5 w-5 text-[#26fce3]" />}
                    label="ثبت‌نام این هفته"
                    value={stats.registrations_week.toLocaleString('fa-IR')}
                    hint={`${stats.total_videos.toLocaleString('fa-IR')} جلسه در مسیر`}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                  <div className="glow-card rounded-3xl p-6">
                    <h3 className="mb-4 text-sm font-bold text-muted-foreground">ثبت‌نام‌های روزانه (۱۴ روز اخیر)</h3>
                    <div className="h-64" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.registrations_by_day} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDayLabel}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={28}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                            contentStyle={{
                              background: '#0e0e0e',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                            labelFormatter={(v) => formatDayLabel(String(v))}
                          />
                          <Bar dataKey="count" fill="#26fce3" radius={[6, 6, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glow-card rounded-3xl p-6">
                    <h3 className="mb-4 text-sm font-bold text-muted-foreground">قیف پیشرفت چالش (۲۱ روز)</h3>
                    <div className="max-h-[22rem] space-y-3 overflow-y-auto pe-1">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-semibold">ثبت‌نام</span>
                          <span className="tabular-nums text-muted-foreground">
                            {registrationStage?.count?.toLocaleString('fa-IR') ?? 0}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full gradient-bg" style={{ width: '100%' }} />
                        </div>
                      </div>
                      {videoFunnel.map((stage) => {
                        const pct = ((stage.reached ?? 0) / funnelMax) * 100;
                        return (
                          <div key={stage.video_id}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                              <span className="truncate font-semibold">
                                <span className="me-1.5 font-mono text-[10px] text-[#58cac0]">
                                  D{String(stage.video_id).padStart(2, '0')}
                                </span>
                                {stage.stage}
                              </span>
                              <span className="shrink-0 tabular-nums text-muted-foreground">
                                {(stage.reached ?? 0).toLocaleString('fa-IR')} /{' '}
                                {(stage.completed ?? 0).toLocaleString('fa-IR')}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full gradient-bg" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[10px] text-muted-foreground">رسیده / کامل — نسبت به کل ثبت‌نام‌ها</p>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}

        {tab === 'users' && (
          <div className="glow-card rounded-3xl p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold text-muted-foreground">لیست کاربران ثبت‌نام‌شده</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="جست‌وجوی نام یا شماره..."
                    className="site-input h-10 w-56 pe-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={handleExport}
                  className="cursor-pointer gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                >
                  <Download className="h-4 w-4" />
                  خروجی CSV
                </Button>
              </div>
            </div>

            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال بارگذاری...
              </div>
            ) : usersQuery.isError ? (
              <div className="py-10 text-center text-red-300">خطا در دریافت لیست کاربران</div>
            ) : users && users.users.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">کاربری پیدا نشد</div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-white/8">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/8 hover:bg-transparent">
                        <TableHead className="text-right">نام</TableHead>
                        <TableHead className="text-right" dir="ltr">
                          شماره
                        </TableHead>
                        <TableHead className="text-right">تاریخ ثبت‌نام</TableHead>
                        <TableHead className="text-right">پیشرفت</TableHead>
                        <TableHead className="text-right">XP</TableHead>
                        <TableHead className="text-right">سطح</TableHead>
                        <TableHead className="text-right">آخرین فعالیت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.users.map((u) => (
                        <TableRow key={u.id} className="border-white/8">
                          <TableCell className="font-medium">
                            {u.first_name} {u.last_name}
                          </TableCell>
                          <TableCell className="tabular-nums" dir="ltr">
                            {u.phone}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-2">
                              <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#26fce3]">
                                {u.completed_videos.toLocaleString('fa-IR')}/{u.total_videos.toLocaleString('fa-IR')}
                              </span>
                              <span className="text-xs text-muted-foreground">{u.progress_percent}٪</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 font-mono text-sm tabular-nums text-[#58cac0]">
                              <Zap className="h-3 w-3" />
                              {u.total_points.toLocaleString('fa-IR')}
                            </span>
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{u.level}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(u.last_activity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {users?.total.toLocaleString('fa-IR')} کاربر — صفحه {page.toLocaleString('fa-IR')} از{' '}
                    {totalPages.toLocaleString('fa-IR')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 w-8 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 w-8 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'guide' && (
          <div className="space-y-6">
            <div className="glow-card rounded-3xl p-6">
              <h3 className="mb-2 text-lg font-extrabold">فلو ادمین</h3>
              <ol className="list-decimal space-y-2 pe-5 text-sm text-muted-foreground">
                <li>ورود از ‎/admin/login‎ با اعتبارنامهٔ config.yaml</li>
                <li>مشاهده آمار، نمودار ۱۴روزه و قیف ۲۱ جلسه</li>
                <li>جست‌وجو / صفحه‌بندی کاربران و در صورت نیاز خروجی CSV</li>
                <li>خروج امن از هدر پنل</li>
              </ol>
            </div>

            <div className="glow-card rounded-3xl p-6">
              <h3 className="mb-2 text-lg font-extrabold">فلو کاربر (خلاصه)</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                ثبت‌نام در لندینگ → Thank You → آکادمی ویدیو → تماشا → آزمون ۳/۳ → XP + باز شدن روز بعد. کد انتهای ویدیو حذف شده؛ آنلاک فقط با قبولی کوییز است.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { t: 'ثبت‌نام', d: 'نام + موبایل → SMS خوش‌آمد' },
                  { t: '۲۱ روز', d: 'کوییز ۳سؤالی گیت XP' },
                  { t: '۷۲ ساعت', d: 'مهلت تماشا از اولین ورود' },
                ].map((item) => (
                  <div key={item.t} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="font-bold text-[#26fce3]">{item.t}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glow-card rounded-3xl p-6">
              <h3 className="mb-4 text-lg font-extrabold">چک‌لیست پشتیبانی</h3>
              <div className="overflow-x-auto rounded-2xl border border-white/8">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/8 hover:bg-transparent">
                      <TableHead className="text-right">مشکل کاربر</TableHead>
                      <TableHead className="text-right">کجا چک کنید</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SUPPORT_ROWS.map((row) => (
                      <TableRow key={row.problem} className="border-white/8">
                        <TableCell className="font-medium">{row.problem}</TableCell>
                        <TableCell className="text-muted-foreground">{row.check}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                مستند کامل: <code className="text-[#58cac0]">docs/ADMIN_UI_AND_FLOWS.md</code>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
