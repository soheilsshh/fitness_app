"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Headphones,
  PlayCircle,
  Sparkles,
  VideoIcon,
} from "lucide-react";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import PanelEmptyState from "@/app/(panel)/user/_components/ui/PanelEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAcademy } from "@/lib/api/content";
import {
  coverStyle,
  resolveMediaUrl,
  sortAcademyItems,
} from "@/lib/api/contentHelpers";
import { cn } from "@/lib/utils";

const tabMeta = {
  podcast: { label: "پادکست", icon: Headphones },
  video: { label: "ویدیو آموزشی", icon: VideoIcon },
  text: { label: "متن آموزشی", icon: BookOpenText },
};

function CategoryChips({ categories, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <Button
          key={cat}
          type="button"
          size="sm"
          variant={value === cat ? "default" : "outline"}
          className={cn("rounded-full px-3", value !== cat && "font-iranianSansMedium")}
          onClick={() => onChange(cat)}
        >
          {cat}
        </Button>
      ))}
    </div>
  );
}

function FeaturedSlider({ items, index, onPrev, onNext, onDot, onOpen }) {
  if (!items.length) return null;
  const active = items[index] || items[0];
  const meta = tabMeta[active.type] || tabMeta.text;
  const Icon = meta.icon;
  const heroStyle = coverStyle(active.cover);

  return (
    <Card className="overflow-hidden border-[#187272]/20 dark:border-[#26fce3]/20">
      <CardContent className="p-4 sm:p-5">
        <div
          className="relative overflow-hidden rounded-3xl p-5 text-white sm:p-6"
          style={heroStyle}
        >
          <span className="absolute inset-0 bg-[radial-gradient(100%_80%_at_0%_100%,rgba(255,255,255,0.14),transparent_65%)]" />
          <div className="relative z-[1] flex items-start justify-between gap-3">
            <Badge className="fitino-meta-badge--solid gap-1.5">
              <Sparkles className="size-3.5" />
              ویژه
            </Badge>
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
              {meta.label}
            </Badge>
          </div>

          <div className="relative z-[1] mt-4 flex items-start gap-4">
            <div className="hidden shrink-0 sm:block">
              <div
                className="relative aspect-square w-28 overflow-hidden rounded-2xl ring-1 ring-white/25"
                style={heroStyle}
              >
                <span className="absolute inset-0 bg-black/15" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-white/22 backdrop-blur-sm">
                    <Icon className="size-6 text-white" />
                  </span>
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="font-iranianSansBlack text-xl leading-tight sm:text-2xl">
                {active.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/88">
                {active.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/85">
                <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                  {active.category}
                </Badge>
                {active.duration ? <span>{active.duration}</span> : null}
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onOpen?.(active)}
                >
                  <PlayCircle className="size-4" />
                  {active.type === "text"
                    ? "مطالعه این آموزش"
                    : active.type === "podcast"
                      ? "پخش پادکست"
                      : "پخش ویدیو"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {items.length > 1 ? (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onDot(i)}
                  aria-label={`اسلاید ${i + 1}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    i === index
                      ? "w-6 bg-[#187272] dark:bg-[#6ceade]"
                      : "w-2.5 bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon-sm" onClick={onPrev}>
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={onNext}>
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PodcastPlayerCard({ item }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div
          className="relative overflow-hidden rounded-2xl p-4 text-white"
          style={coverStyle(item.cover)}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Badge className="fitino-meta-badge--solid">پادکست</Badge>
            <span className="text-xs font-iranianSansMedium opacity-90">
              {item.duration}
            </span>
          </div>
          <h3 className="font-iranianSansDemiBold text-sm">{item.title}</h3>
        </div>

        <p className="text-sm font-iranianSansMedium text-muted-foreground">
          {item.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="fitino-meta-badge">
            {item.category}
          </Badge>
          <span>{item.duration}</span>
        </div>
        {item.src ? (
          <audio
            src={resolveMediaUrl(item.src)}
            preload="metadata"
            controls
            controlsList="nodownload noplaybackrate"
            className="w-full rounded-xl"
          />
        ) : (
          <p className="text-xs text-muted-foreground">فایل صوتی هنوز آپلود نشده.</p>
        )}
      </CardContent>
    </Card>
  );
}

function VideoPlayerCard({ item }) {
  const poster = item.cover && !item.cover.includes("gradient")
    ? resolveMediaUrl(item.cover)
    : undefined;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="relative overflow-hidden rounded-2xl">
          {item.src ? (
            <video
              src={resolveMediaUrl(item.src)}
              poster={poster}
              preload="metadata"
              controls
              controlsList="nodownload noplaybackrate"
              className="aspect-video w-full bg-black/80 object-cover"
            />
          ) : (
            <div
              className="flex aspect-video items-center justify-center text-sm text-white/90"
              style={coverStyle(item.cover)}
            >
              فایل ویدیو هنوز آپلود نشده
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 pointer-events-none">
            <Badge className="fitino-meta-badge--solid">ویدیو</Badge>
            <span className="text-xs font-iranianSansMedium text-white/90">
              {item.duration}
            </span>
          </div>
        </div>

        <h3 className="font-iranianSansDemiBold text-sm text-foreground">
          {item.title}
        </h3>
        <p className="text-sm font-iranianSansMedium text-muted-foreground">
          {item.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="fitino-meta-badge">
            {item.category}
          </Badge>
          <span>{item.duration}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TextArticleCard({ article, onRead }) {
  return (
    <Card id={`academy-text-${article.id}`}>
      <CardContent className="space-y-3 p-4">
        <div
          className="relative overflow-hidden rounded-2xl p-4 text-white"
          style={coverStyle(article.cover)}
        >
          <Badge className="fitino-meta-badge--solid mb-2">متن آموزشی</Badge>
          <h3 className="font-iranianSansDemiBold text-sm">{article.title}</h3>
        </div>
        <p className="text-sm font-iranianSansMedium leading-7 text-muted-foreground">
          {article.description}
        </p>
        <Badge variant="outline" className="fitino-meta-badge">
          {article.category}
        </Badge>
        <Button variant="outline" className="w-full" onClick={() => onRead(article)}>
          <BookOpenText className="size-4" />
          مطالعه آموزش
        </Button>
      </CardContent>
    </Card>
  );
}

function AcademyLoading() {
  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <Skeleton className="h-56 w-full rounded-3xl" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export default function AcademyClient() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("podcast");
  const [categoryByTab, setCategoryByTab] = useState({
    podcast: "همه",
    video: "همه",
    text: "همه",
  });
  const [sliderIndex, setSliderIndex] = useState(0);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [readingArticle, setReadingArticle] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getAcademy();
      setItems(sortAcademyItems(res?.items || []));
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byTab = useMemo(
    () => ({
      podcast: items.filter((i) => i.type === "podcast"),
      video: items.filter((i) => i.type === "video"),
      text: items.filter((i) => i.type === "text"),
    }),
    [items]
  );

  const categories = useMemo(() => {
    const list = byTab[tab] || [];
    const unique = Array.from(new Set(list.map((i) => i.category).filter(Boolean)));
    return ["همه", ...unique];
  }, [byTab, tab]);

  const activeCategory = categoryByTab[tab] || "همه";

  const filteredItems = useMemo(() => {
    const list = byTab[tab] || [];
    if (activeCategory === "همه") return list;
    return list.filter((i) => i.category === activeCategory);
  }, [byTab, tab, activeCategory]);

  const globalFeatured = useMemo(
    () => items.filter((i) => i.featured),
    [items]
  );

  useEffect(() => {
    setSliderIndex(0);
  }, [tab, activeCategory]);

  useEffect(() => {
    if (globalFeatured.length < 2) return undefined;
    const timer = setInterval(() => {
      setSliderIndex((v) => (v + 1) % globalFeatured.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [globalFeatured]);

  useEffect(() => {
    if (!pendingTarget) return;
    const el = document.getElementById(pendingTarget);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setPendingTarget(null);
  }, [pendingTarget, tab, activeCategory]);

  function handleOpenFeatured(item) {
    if (!item) return;
    if (item.type === "text") {
      setReadingArticle(item);
      return;
    }
    setTab(item.type);
    setCategoryByTab((prev) => ({ ...prev, [item.type]: "همه" }));
    setPendingTarget(`academy-${item.type}-${item.id}`);
  }

  const countText = useMemo(
    () => items.length.toLocaleString("fa-IR"),
    [items]
  );

  if (loading) return <AcademyLoading />;

  if (error) {
    return (
      <div dir="rtl">
        <PanelEmptyState
          icon={GraduationCap}
          title="بارگذاری آموزش‌ها ناموفق بود"
          description="اتصال به سرور برقرار نشد. دوباره تلاش کنید."
        />
        <div className="mt-4 flex justify-center">
          <Button type="button" onClick={load}>
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <PanelEmptyState
        icon={GraduationCap}
        title="هنوز آموزشی منتشر نشده"
        description="به‌زودی محتوای آموزشی اینجا قرار می‌گیرد."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <FeaturedSlider
        items={globalFeatured}
        index={sliderIndex}
        onPrev={() =>
          setSliderIndex((v) =>
            globalFeatured.length ? (v - 1 + globalFeatured.length) % globalFeatured.length : 0
          )
        }
        onNext={() =>
          setSliderIndex((v) => (globalFeatured.length ? (v + 1) % globalFeatured.length : 0))
        }
        onDot={setSliderIndex}
        onOpen={handleOpenFeatured}
      />

      <PageHeader
        title="آموزش فیتینو"
        description="محتوای آموزشی کاربردی در قالب پادکست، ویدیو و متن برای استفاده بهتر از پنل."
        meta={
          <Badge variant="outline" className="fitino-meta-badge">
            <GraduationCap className="size-3.5" />
            {countText} آموزش
          </Badge>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-1">
        <TabsList className="grid !h-13 w-full grid-cols-3 rounded-2xl border border-[#187272]/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(232,255,250,0.55))] p-1.5 shadow-[0_8px_22px_-16px_rgba(24,114,114,0.45)] dark:border-[#26fce3]/22 dark:bg-[linear-gradient(180deg,rgba(38,252,227,0.12),rgba(16,24,24,0.45))]">
          <TabsTrigger
            value="podcast"
            className="h-10 rounded-xl font-iranianSansDemiBold data-active:!bg-[linear-gradient(165deg,#6ceade_0%,#2a9c96_45%,#187272_100%)] data-active:!text-white"
          >
            پادکست
          </TabsTrigger>
          <TabsTrigger
            value="video"
            className="h-10 rounded-xl font-iranianSansDemiBold data-active:!bg-[linear-gradient(165deg,#6ceade_0%,#2a9c96_45%,#187272_100%)] data-active:!text-white"
          >
            ویدیو آموزشی
          </TabsTrigger>
          <TabsTrigger
            value="text"
            className="h-10 rounded-xl font-iranianSansDemiBold data-active:!bg-[linear-gradient(165deg,#6ceade_0%,#2a9c96_45%,#187272_100%)] data-active:!text-white"
          >
            متن آموزشی
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <CategoryChips
            categories={categories}
            value={activeCategory}
            onChange={(next) =>
              setCategoryByTab((prev) => ({
                ...prev,
                [tab]: next,
              }))
            }
          />
        </div>

        <TabsContent value="podcast" className="mt-4">
          {filteredItems.length === 0 ? (
            <PanelEmptyState title="پادکستی در این دسته نیست" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredItems.map((item) => (
                <div id={`academy-podcast-${item.id}`} key={item.id}>
                  <PodcastPlayerCard item={item} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="video" className="mt-4">
          {filteredItems.length === 0 ? (
            <PanelEmptyState title="ویدیویی در این دسته نیست" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredItems.map((item) => (
                <div id={`academy-video-${item.id}`} key={item.id}>
                  <VideoPlayerCard item={item} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          {filteredItems.length === 0 ? (
            <PanelEmptyState title="متنی در این دسته نیست" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((article) => (
                <TextArticleCard
                  key={article.id}
                  article={article}
                  onRead={setReadingArticle}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!readingArticle} onOpenChange={(open) => !open && setReadingArticle(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
          {readingArticle ? (
            <>
              <SheetHeader className="text-start">
                <SheetTitle className="font-iranianSansBlack text-xl">
                  {readingArticle.title}
                </SheetTitle>
                <SheetDescription>{readingArticle.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <Badge variant="outline" className="fitino-meta-badge">
                  {readingArticle.category}
                </Badge>
                <div className="whitespace-pre-wrap text-sm leading-8 text-foreground">
                  {readingArticle.body || readingArticle.description}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
