"use client";

import { useRouter } from "next/navigation";
import { Flame, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SHARE_DRAFT_KEY } from "@/app/(panel)/user/community/_components/CommunityClient";

/**
 * Celebratory popup shown when checkStreakMilestone() reports a fresh
 * milestone (roadmap: استریک و پاپ‌آپ تشویقی). Lets the user share the
 * achievement to the community feed with one tap, or just dismiss it.
 */
export default function StreakMilestonePopup({ streak, open, onOpenChange }) {
  const router = useRouter();

  const handleShare = () => {
    try {
      window.sessionStorage.setItem(
        SHARE_DRAFT_KEY,
        JSON.stringify({
          content: `🔥 ${streak} روز پشت‌سرهم فعال بودم! رکورد streak من ادامه داره 💪`,
          category: "record",
        })
      );
    } catch {
      // sessionStorage unavailable — user can still type the post manually
    }
    onOpenChange(false);
    router.push("/user/community");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange-500/10">
            <Flame className="size-8 text-orange-500" />
          </div>
          <DialogTitle className="mt-2 text-xl">
            {streak.toLocaleString("fa-IR")} روز پشت‌سرهم! 🔥
          </DialogTitle>
          <DialogDescription className="text-center">
            آفرین! پیوستگی‌ات داره واقعاً نتیجه می‌ده. همینطوری ادامه بده.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full" onClick={handleShare}>
            <Share2 className="size-4" data-icon="inline-start" />
            اشتراک این رکورد در جامعه
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            بعداً
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
