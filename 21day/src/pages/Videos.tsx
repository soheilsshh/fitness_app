import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ChevronDown,
  Lock,
  LogOut,
  Play,
  Trophy,
  Zap,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import VideoCountdownTimer from '@/components/VideoCountdownTimer';
import SessionQuiz from '@/components/SessionQuiz';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiService, Video, UserProgress } from '@/lib/api';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';

interface VideoWithProgress extends Video {
  unlocked: boolean;
  completed: boolean;
}

const DEFAULT_VIDEO_URL = 'https://sianacademy.com/wp-content/uploads/2025/06/help.mp4';
const getVideoUrl = (_videoId: number) => DEFAULT_VIDEO_URL;

const padDay = (id: number) => String(id).padStart(2, '0');

const Videos = () => {
  const reduceMotion = useReducedMotion();
  const [videos, setVideos] = useState<VideoWithProgress[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentVideo, setCurrentVideo] = useState<number | null>(null);
  const [quizVideoId, setQuizVideoId] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [payingForAccess, setPayingForAccess] = useState(false);
  const { toast } = useToast();
  const { phone, logout } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [phone]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const videosResponse = await apiService.getVideos();
      let progressList: UserProgress['progress'] = [];
      let progressResponse: UserProgress | null = null;

      if (phone) {
        try {
          progressResponse = await apiService.getUserProgress(phone);
          progressList = progressResponse.progress || [];
        } catch (progressError) {
          console.error('Error loading progress:', progressError);
        }
      }

      const videosWithProgress = videosResponse.videos.map((video) => {
        const progress = progressList.find((p) => p.video_id === video.id);
        const isUnlocked = video.id === 1 ? true : progress?.unlocked || false;
        return {
          ...video,
          unlocked: isUnlocked,
          completed: progress?.completed || false,
        };
      });

      setVideos(videosWithProgress);
      setUserProgress(progressResponse);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطا در بارگذاری اطلاعات',
        description: 'لطفاً صفحه را رفرش کنید',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyFullAccess = async () => {
    if (!phone || payingForAccess) return;
    try {
      setPayingForAccess(true);
      const { payment_url } = await apiService.createPayment(phone);
      window.location.href = payment_url;
    } catch (error) {
      console.error('Error starting payment:', error);
      toast({
        title: 'شروع پرداخت ناموفق بود',
        description: 'دوباره امتحان کن',
        variant: 'destructive',
      });
      setPayingForAccess(false);
    }
  };

  const startQuiz = (videoId: number) => {
    const video = videos.find((v) => v.id === videoId);
    if (!video || video.completed) return;
    setCurrentVideo(videoId);
    setQuizVideoId(videoId);
  };

  const handleCompleteVideo = async (videoId: number) => {
    if (!phone || completing) return;

    try {
      setCompleting(true);
      await apiService.completeVideo(videoId, phone);
      setVideos((prev) =>
        prev.map((video) => (video.id === videoId ? { ...video, completed: true } : video))
      );
      setQuizVideoId(null);
      setCurrentVideo(null);
      await loadData();
      const xp = videos.find((v) => v.id === videoId)?.points ?? 0;
      const hasNext = videos.some((v) => v.id === videoId + 1);
      toast({
        title: 'آفرین! ویدیو تکمیل شد',
        description: hasNext
          ? `${xp} XP گرفتی و روز بعد باز شد`
          : `${xp} XP کسب کردی!`,
      });
    } catch (error) {
      console.error('Error completing video:', error);
      toast({
        title: 'خطا در تکمیل ویدیو',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] text-foreground">
        <LoadingSpinner size="lg" text="در حال بارگذاری مسیر..." />
      </div>
    );
  }

  if (!phone) {
    return null;
  }

  const completedVideos = videos.filter((v) => v.completed).length;
  const progress = userProgress
    ? userProgress.progress_percent
    : videos.length
      ? (completedVideos / videos.length) * 100
      : 0;
  const totalPoints = userProgress
    ? userProgress.total_points
    : videos.filter((v) => v.completed).reduce((sum, v) => sum + v.points, 0);
  const level = userProgress ? userProgress.level : Math.floor(totalPoints / 200) + 1;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0e0e0e] pb-16 text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#26fce3]/35 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-12deg, transparent, transparent 36px, rgba(38,252,227,0.45) 36px, rgba(38,252,227,0.45) 37px)',
          }}
        />
        <div className="absolute -end-24 top-32 h-80 w-80 rounded-full bg-[#187272]/25 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-3 pt-4 sm:px-4 sm:pt-6">
        {/* Command status strip — open layout, not a card/HUD box */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mb-6 overflow-hidden"
          dir="rtl"
        >
          <div
            className="pointer-events-none absolute -inset-x-8 -top-10 h-40 bg-gradient-to-l from-[#187272]/30 via-transparent to-[#26fce3]/10 blur-2xl"
            aria-hidden
          />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-0">
            {/* Brand + logout */}
            <div className="flex flex-1 flex-col justify-between gap-4 lg:pe-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 border-b border-[#26fce3]/40 pb-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#26fce3]" aria-hidden />
                    <span className="text-[10px] font-bold tracking-[0.28em] text-[#58cac0]">
                      LIVE PATH
                    </span>
                  </div>
                  <h1 className="text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">
                    فیتینو
                    <span className="mt-1 block bg-gradient-to-l from-[#187272] via-[#58cac0] to-[#26fce3] bg-clip-text text-transparent">
                      ۲۱ روز
                    </span>
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="خروج"
                  className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border border-white/10 bg-transparent text-white/50 transition-colors duration-200 hover:border-[#26fce3]/40 hover:text-[#26fce3] touch-manipulation"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-white/40">
                مأموریت‌ها را کامل کن؛ XP مستقیم روی لول‌آپت اثر می‌ذارد.
              </p>
            </div>

            {/* Giant XP + level chip — asymmetric metric wall */}
            <div
              className="relative flex flex-1 items-end justify-between gap-4 border-t border-white/10 pt-4 lg:border-t-0 lg:border-s lg:ps-8 lg:pt-0"
              dir="ltr"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Total XP
                </p>
                <p className="font-mono text-5xl font-black leading-none tracking-tighter text-white tabular-nums sm:text-6xl md:text-7xl">
                  <span className="bg-gradient-to-r from-[#26fce3] to-[#58cac0] bg-clip-text text-transparent">
                    {totalPoints}
                  </span>
                </p>
              </div>

              <div className="mb-1 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 border border-[#26fce3]/35 bg-[#187272]/25 px-3 py-2">
                  <Trophy className="h-4 w-4 text-[#26fce3]" aria-hidden />
                  <span className="text-[10px] font-bold text-white/50">LVL</span>
                  <span className="font-mono text-2xl font-black tabular-nums text-white">{level}</span>
                </div>
                <div className="text-right text-[11px] text-white/45">
                  <span className="font-mono font-bold text-[#26fce3]">{completedVideos}</span>
                  <span className="text-white/30"> / {videos.length || 21} روز</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edge runway — progress as floor line, not a bar in a card */}
          <div className="relative mt-6">
            <div className="mb-1 flex justify-between text-[9px] font-semibold tracking-wide text-white/35">
              <span>شروع</span>
              <span>{Math.round(progress)}٪ مسیر</span>
              <span>روز ۲۱</span>
            </div>
            <div className="relative h-[3px] bg-white/10">
              <motion.div
                className="absolute inset-y-0 start-0 bg-gradient-to-l from-[#187272] to-[#26fce3]"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${Math.max(progress, 1)}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
              <span
                className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#26fce3] shadow-[0_0_12px_rgba(38,252,227,0.7)]"
                style={{ insetInlineStart: `calc(${Math.max(progress, 1)}% - 5px)` }}
                aria-hidden
              />
            </div>
          </div>
        </motion.header>

        <VideoCountdownTimer />

        {/* Mission rail — vertical curriculum, not card grid */}
        <section className="mt-2" aria-label="لیست مأموریت‌های ویدیویی">
          <div className="mb-4 flex items-end justify-between gap-3" dir="rtl">
            <div>
              <h2 className="text-sm font-bold text-white">ریل مأموریت</h2>
              <p className="text-[11px] text-white/40">آزمون ۳سؤالی هر روز را بگذران تا روز بعد باز شود</p>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-[#58cac0]">
              {videos.length} DAYS
            </span>
          </div>

          <ol className="relative space-y-0" dir="rtl">
            {/* Spine */}
            <div
              className="pointer-events-none absolute bottom-4 top-4 w-px bg-gradient-to-b from-[#26fce3]/50 via-white/10 to-transparent"
              style={{ insetInlineStart: '1.15rem' }}
              aria-hidden
            />

            {videos.map((video, index) => {
              const active = currentVideo === video.id;
              const locked = !video.unlocked;

              return (
                <motion.li
                  key={video.id}
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(index * 0.02, 0.35) }}
                  className="relative pb-3 ps-10"
                >
                  {/* Day node */}
                  <span
                    className={`absolute start-0 top-3 z-[1] flex h-9 w-9 items-center justify-center border text-[11px] font-black tabular-nums ${
                      video.completed
                        ? 'border-[#26fce3] bg-[#187272] text-[#26fce3]'
                        : video.unlocked
                          ? 'border-[#26fce3]/50 bg-[#0e0e0e] text-white'
                          : 'border-white/15 bg-[#0e0e0e] text-white/30'
                    }`}
                  >
                    {video.completed ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                    ) : locked ? (
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      padDay(video.id)
                    )}
                  </span>

                  <div
                    className={`border transition-colors duration-200 ${
                      active
                        ? 'border-[#26fce3]/45 bg-[#187272]/20'
                        : locked
                          ? 'border-white/5 bg-white/[0.015] opacity-60'
                          : video.completed
                            ? 'border-[#26fce3]/20 bg-[#26fce3]/[0.04]'
                            : 'border-white/10 bg-[#080c0c] hover:border-white/20'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (locked) return;
                        setCurrentVideo(active ? null : video.id);
                      }}
                      className={`flex w-full min-h-[52px] cursor-pointer items-start justify-between gap-3 px-3 py-3 text-right touch-manipulation disabled:cursor-not-allowed sm:px-4 ${
                        locked ? '' : 'hover:bg-white/[0.02]'
                      }`}
                      aria-expanded={active}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-bold tracking-wider text-[#58cac0]">
                            DAY {padDay(video.id)}
                          </span>
                          <span className="text-[10px] text-white/35">{video.duration}</span>
                          <span className="inline-flex items-center gap-1 border border-[#26fce3]/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#26fce3]">
                            <Zap className="h-2.5 w-2.5" aria-hidden />
                            {video.points} XP
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">
                          {video.title}
                        </h3>
                        {!active && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-white/40 sm:text-xs">
                            {video.description}
                          </p>
                        )}
                      </div>
                      {!locked && (
                        <ChevronDown
                          className={`mt-1 h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${
                            active ? 'rotate-180 text-[#26fce3]' : ''
                          }`}
                          aria-hidden
                        />
                      )}
                    </button>

                    {active && video.unlocked && (
                      <div className="border-t border-white/10 px-3 py-4 sm:px-4">
                        <p className="mb-3 text-xs leading-relaxed text-white/50">{video.description}</p>
                        <div className="aspect-video overflow-hidden border border-white/10 bg-black">
                          <video
                            src={getVideoUrl(video.id)}
                            controls
                            className="h-full w-full"
                            onEnded={() => {
                              if (!video.completed) startQuiz(video.id);
                            }}
                          >
                            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                          </video>
                        </div>

                        {video.id === (videos[videos.length - 1]?.id ?? 21) && (
                          <div className="mt-3 border border-[#26fce3]/30 bg-[#26fce3]/[0.06] p-4">
                            <p className="text-sm font-bold text-white">
                              به آخر مسیر رسیدی 🎉
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-white/60">
                              برای ادامه‌ی مسیر فیتینو و دسترسی کامل به برنامه، دسترسی کامل رو فعال کن.
                            </p>
                            <Button
                              type="button"
                              onClick={handleBuyFullAccess}
                              disabled={payingForAccess}
                              className="mt-3 min-h-[44px] w-full cursor-pointer rounded-none border-0 bg-[#26fce3] font-bold text-[#0a1a18] hover:bg-[#7dffe8]"
                            >
                              {payingForAccess ? 'در حال انتقال به درگاه…' : 'فعال‌سازی دسترسی کامل'}
                            </Button>
                          </div>
                        )}

                        {quizVideoId === video.id && !video.completed ? (
                          <SessionQuiz
                            videoId={video.id}
                            sessionTitle={video.title}
                            xpReward={video.points}
                            onPassed={() => handleCompleteVideo(video.id)}
                            onCancel={() => setQuizVideoId(null)}
                          />
                        ) : (
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              onClick={() => startQuiz(video.id)}
                              disabled={video.completed || completing}
                              className="min-h-[44px] flex-1 cursor-pointer rounded-none border-0 bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] font-bold text-[#0e0e0e] hover:opacity-95"
                            >
                              {video.completed
                                ? 'تکمیل شده'
                                : 'اتمام ویدیو · آزمون و دریافت XP'}
                            </Button>
                            {!video.completed && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setQuizVideoId(null);
                                  setCurrentVideo(null);
                                }}
                                className="min-h-[44px] cursor-pointer rounded-none border-white/15 bg-transparent"
                              >
                                بستن پخش
                              </Button>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                    {locked && (
                      <div className="border-t border-white/5 px-3 py-2.5 text-[11px] text-white/35 sm:px-4">
                        ابتدا آزمون ۳سؤالی مأموریت قبلی را کامل کن
                      </div>
                    )}

                    {!locked && !active && !video.completed && (
                      <div className="border-t border-white/5 px-3 py-2 sm:px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#26fce3]">
                          <Play className="h-3 w-3" aria-hidden />
                          برای پخش ضربه بزن
                        </span>
                      </div>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
};

export default Videos;
