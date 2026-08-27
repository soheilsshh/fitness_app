
import { useRef, useEffect, useState } from "react";
import { X, Minimize2, MessageCircle, Eye } from "lucide-react";
import LiveChat from "./LiveChat";
import ViewerCounter from "./ViewerCounter";
import StatusChip from "./StatusChip";

interface FullscreenVideoProps {
  onClose: () => void;
  onVideoEnd: () => void;
  videoUrl: string;
}

const FullscreenVideo = ({ onClose, onVideoEnd, videoUrl }: FullscreenVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play();

      const handleEnded = () => {
        onVideoEnd();
      };

      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [onVideoEnd]);

  useEffect(() => {
    // قفل کردن اسکرول و فعال‌سازی فول‌اسکرین واقعی
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    const originalPosition = document.body.style.position;

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';

    // تشخیص تغییر جهت
    const handleOrientationChange = () => {
      setTimeout(() => {
        setIsPortrait(window.innerHeight > window.innerWidth);
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.left = '';

      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';

      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // کنترل ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black w-screen h-screen overflow-hidden">
      {/* Header - کم‌حجم و شفاف، گروه‌بندی‌شده به‌جای ردیف تخت */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent p-2 md:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusChip tone="live" pulse className="border-none bg-red-600/90 px-2.5 py-1 text-white">
              LIVE
            </StatusChip>
            {!isPortrait && (
              <div className="hidden md:flex items-center gap-2 text-white text-sm font-bold">
                <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden />
                <span>Fitino Live Workshop</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <StatusChip
              tone="neutral"
              icon={<Eye size={12} />}
              className="border-white/20 bg-black/60 px-2.5 py-1 text-white backdrop-blur-sm"
            >
              <ViewerCounter showLabel={false} />
            </StatusChip>
            <div className="flex items-center overflow-hidden rounded-full border border-white/20 bg-black/60 backdrop-blur-sm">
              <button
                onClick={onClose}
                className="p-1.5 text-white transition-colors hover:bg-white/10"
              >
                <Minimize2 size={14} />
              </button>
              <span className="h-4 w-px bg-white/20" aria-hidden />
              <button
                onClick={onClose}
                className="p-1.5 text-white transition-colors hover:bg-red-700/80"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video - کاملاً تمام صفحه */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-10"
        autoPlay
        muted={false}
        playsInline
        controlsList="nodownload nofullscreen noremoteplaybook"
        disablePictureInPicture
        style={{ pointerEvents: 'none' }}
      >
        <source src={videoUrl} type="video/mp4" />
        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
      </video>

      {/* دکمه چت شناور */}
      {!isChatVisible && (
        <button
          onClick={() => setIsChatVisible(true)}
          className={`fp-notch-btn fixed z-50 flex items-center gap-1.5 bg-gradient-to-r from-[#187272]/90 to-[#26fce3]/90 backdrop-blur-sm text-white p-3 shadow-2xl border border-white/20 hover:scale-105 transition-all duration-300 ${
            isPortrait
              ? 'bottom-6 right-4'
              : 'bottom-4 right-4'
          }`}
        >
          <MessageCircle size={20} />
        </button>
      )}

      {/* چت شناور - کارت با نوار لهجه و برچسب بادبانی، تطبیق با جهت صفحه */}
      {isChatVisible && (
        <div
          className={`fp-spine fp-notch fixed z-40 overflow-visible bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl ${
            isPortrait
              ? 'bottom-4 left-4 right-4 h-80'
              : 'top-16 right-4 w-80 h-96'
          }`}
        >
          <span className="fp-ribbon !top-[-0.7rem] !text-[0.65rem] !py-1.5 !px-3">
            <MessageCircle className="size-3" aria-hidden />
            چت زنده
          </span>
          <div className="h-full w-full overflow-hidden rounded-[inherit]">
            <LiveChat
              isEnabled={true}
              pinnedMessage=""
              webinarDuration={70 * 60}
              isFullscreen={true}
              onToggleFullscreenChat={() => setIsChatVisible(false)}
              streamTime={0}
              isStreamReady={false}
            />
          </div>
        </div>
      )}

      {/* Footer مینیمال - فقط در دسکتاپ landscape، به‌شکل کارت لهجه‌دار */}
      {!isPortrait && (
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="flex items-center justify-between gap-3">
            <div className="fp-spine bg-black/30 px-3 py-1.5 text-white backdrop-blur-sm" style={{ borderInlineStartColor: 'rgba(168, 85, 247, 0.7)' }}>
              <h3 className="font-bold text-sm mb-0.5">وبینار زنده فیتینو</h3>
              <p className="text-gray-300 text-xs">توسط تیم متخصص Fitino Live</p>
            </div>

            <span className="fp-notch-btn bg-gradient-to-r from-[#187272]/80 to-[#26fce3]/80 text-white px-3 py-1 font-semibold text-xs">
              Full HD
            </span>
          </div>
        </div>
      )}

      {/* تزئینات گوشه‌ها - فقط در landscape */}
      {!isPortrait && (
        <>
          <div className="absolute top-16 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-lg opacity-60"></div>
          <div className="absolute top-16 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-lg opacity-60"></div>
          <div className="absolute bottom-12 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-lg opacity-60"></div>
          <div className="absolute bottom-12 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg opacity-60"></div>
        </>
      )}
    </div>
  );
};

export default FullscreenVideo;
