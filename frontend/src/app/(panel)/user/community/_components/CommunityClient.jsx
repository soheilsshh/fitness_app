"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  Send,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { categoryMeta, FEED_FILTERS, POST_TEMPLATES } from "./postCategories";
import ExerciseCountReveal from "./ExerciseCountReveal";

export const SHARE_DRAFT_KEY = "fitino:community:shareDraft";

function timeAgoFa(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days.toLocaleString("fa-IR")} روز پیش`;
}

function CategoryBadge({ category }) {
  const meta = categoryMeta(category);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px]", meta.badgeClass)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

function PostCard({ post, onLike, onOpenComments }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-iranianSansDemiBold text-foreground">
                {post.author?.name || "کاربر فیتینو"}
              </p>
              {post.author?.role === "coach" ? (
                <Badge variant="secondary" className="text-[10px]">
                  مربی
                </Badge>
              ) : null}
              <CategoryBadge category={post.category} />
            </div>
            <span className="text-xs text-muted-foreground">
              {timeAgoFa(post.createdAt)}
            </span>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {post.content}
        </p>
        {post.metadata?.exerciseNames?.length ? (
          <ExerciseCountReveal names={post.metadata.exerciseNames} className="max-w-xs" />
        ) : null}
        {post.imageUrl && post.mediaType === "video" ? (
          <video
            src={apiAssetUrl(post.imageUrl)}
            controls
            className="max-h-96 w-full rounded-lg border bg-black"
          />
        ) : post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={apiAssetUrl(post.imageUrl)}
            alt=""
            className="max-h-96 w-full rounded-lg border object-cover"
          />
        ) : null}
        <div className="flex items-center gap-4 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("gap-1.5", post.liked && "text-red-600 dark:text-red-400")}
            onClick={() => onLike(post)}
          >
            <Heart className={cn("size-4", post.liked && "fill-current")} />
            {(post.likeCount ?? 0).toLocaleString("fa-IR")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => onOpenComments(post)}
          >
            <MessageCircle className="size-4" />
            {(post.commentCount ?? 0).toLocaleString("fa-IR")}
          </Button>
        </div>
        {post._commentsOpen ? (
          <div className="space-y-3 border-t pt-3">
            {post._commentsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (post._comments || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">هنوز کامنتی ثبت نشده</p>
            ) : (
              (post._comments || []).map((c) => (
                <div key={c.id} className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-xs font-iranianSansDemiBold">
                    {c.author?.name || "کاربر"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.content}</p>
                </div>
              ))
            )}
            <NewCommentBox post={post} onOpenComments={onOpenComments} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function NewCommentBox({ post, onOpenComments }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const content = value.trim();
    if (!content) return;
    setSending(true);
    try {
      await api.post(`/me/community/posts/${post.id}/comments`, { content });
      setValue("");
      await onOpenComments(post, { forceRefresh: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || "ارسال کامنت ناموفق بود");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="کامنت بنویسید..."
        rows={1}
        className="min-h-9 resize-none"
      />
      <Button type="button" size="icon" disabled={sending} onClick={submit}>
        <Send className="size-4" />
      </Button>
    </div>
  );
}

function TemplateChips({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {POST_TEMPLATES.map((tpl) => {
        const Icon = tpl.icon;
        const active = selected === tpl.value;
        return (
          <button
            key={tpl.value}
            type="button"
            onClick={() => onSelect(active ? null : tpl.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-iranianSansMedium transition-colors",
              active
                ? cn("border-transparent text-white", "bg-primary")
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {tpl.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterTabs({ value, onChange }) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {FEED_FILTERS.map((f) => {
        const Icon = f.icon;
        const active = value === f.value;
        return (
          <button
            key={f.value}
            type="button"
            disabled={f.comingSoon}
            title={f.comingSoon ? "به‌زودی" : undefined}
            onClick={() => onChange(f.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-iranianSansMedium transition-colors",
              active
                ? "border-transparent bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
              f.comingSoon && "cursor-not-allowed opacity-50 hover:text-muted-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function FeedTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState("forYou");
  const [media, setMedia] = useState(null); // { url, mediaType, previewUrl }
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [shareMetadata, setShareMetadata] = useState(null);
  const draftConsumed = useRef(false);
  const fileInputRef = useRef(null);

  const activeFilter = FEED_FILTERS.find((f) => f.value === filter);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter?.category) params.category = activeFilter.category;
      if (activeFilter?.authorRole) params.authorRole = activeFilter.authorRole;
      const res = await api.get("/me/community/posts", { params });
      const items = res.data?.items || res.data || [];
      setPosts(items.map((p) => ({ ...p })));
    } catch (err) {
      toast.error(err?.response?.data?.error || "بارگذاری فید ناموفق بود");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Pick up a "share to community" draft handed off from the workout/progress
  // share card (roadmap فید UX pass #2), once, on first mount only.
  useEffect(() => {
    if (draftConsumed.current) return;
    draftConsumed.current = true;
    try {
      const raw = window.sessionStorage.getItem(SHARE_DRAFT_KEY);
      if (!raw) return;
      window.sessionStorage.removeItem(SHARE_DRAFT_KEY);
      const draft = JSON.parse(raw);
      if (draft?.content) setNewPost(draft.content);
      if (draft?.category) setSelectedTemplate(draft.category);
      if (draft?.metadata?.exerciseNames?.length) setShareMetadata(draft.metadata);
    } catch {
      // ignore malformed/missing draft
    }
  }, []);

  const handleSelectTemplate = (value) => {
    setSelectedTemplate(value);
    if (!value) return;
    // Only auto-fill the starter line when the composer is still empty, so we
    // never clobber text the user already typed.
    if (!newPost.trim()) {
      const tpl = POST_TEMPLATES.find((t) => t.value === value);
      if (tpl) setNewPost(tpl.starter);
    }
  };

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadingMedia(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/me/community/posts/media", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMedia({
        url: res.data?.url,
        mediaType: res.data?.mediaType,
        previewUrl,
      });
    } catch (err) {
      toast.error(err?.response?.data?.error || "آپلود فایل ناموفق بود");
      URL.revokeObjectURL(previewUrl);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveMedia = () => {
    if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);
    setMedia(null);
  };

  const handleCreatePost = async () => {
    const content = newPost.trim();
    if (!content && !media) return;
    setPosting(true);
    try {
      await api.post("/me/community/posts", {
        content,
        category: selectedTemplate || undefined,
        imageUrl: media?.url || undefined,
        mediaType: media?.mediaType || undefined,
        metadata: shareMetadata || undefined,
      });
      setNewPost("");
      setSelectedTemplate(null);
      setShareMetadata(null);
      handleRemoveMedia();
      toast.success("پست شما منتشر شد");
      await loadFeed();
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت پست ناموفق بود");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (post) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked: !p.liked,
              likeCount: (p.likeCount ?? 0) + (p.liked ? -1 : 1),
            }
          : p
      )
    );
    try {
      await api.post(`/me/community/posts/${post.id}/like`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "ثبت لایک ناموفق بود");
      loadFeed();
    }
  };

  const handleOpenComments = async (post, opts = {}) => {
    const willOpen = opts.forceRefresh ? true : !post._commentsOpen;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, _commentsOpen: willOpen, _commentsLoading: willOpen }
          : p
      )
    );
    if (!willOpen) return;
    try {
      const res = await api.get(`/me/community/posts/${post.id}/comments`);
      const comments = res.data?.items || res.data || [];
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                _comments: comments,
                _commentsLoading: false,
                commentCount: comments.length,
              }
            : p
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.error || "بارگذاری کامنت‌ها ناموفق بود");
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, _commentsLoading: false } : p))
      );
    }
  };

  return (
    <div className="space-y-4">
      <FilterTabs value={filter} onChange={setFilter} />

      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-xs font-iranianSansMedium text-muted-foreground">
            چه چیزی می‌خواهید به اشتراک بگذارید؟
          </p>
          <TemplateChips selected={selectedTemplate} onSelect={handleSelectTemplate} />
          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="چه چیزی می‌خواهید با جامعه فیتینو به اشتراک بگذارید؟"
            rows={3}
          />
          {shareMetadata?.exerciseNames?.length ? (
            <ExerciseCountReveal names={shareMetadata.exerciseNames} className="max-w-xs" />
          ) : null}

          {media ? (
            <div className="relative w-fit">
              {media.mediaType === "video" ? (
                <video
                  src={media.previewUrl}
                  className="max-h-48 rounded-lg border bg-black"
                  controls
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.previewUrl}
                  alt=""
                  className="max-h-48 rounded-lg border object-cover"
                />
              )}
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="absolute -top-2 -left-2 rounded-full shadow"
                onClick={handleRemoveMedia}
                aria-label="حذف رسانه"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handlePickFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingMedia || Boolean(media)}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingMedia ? (
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                ) : (
                  <ImagePlus className="size-4" data-icon="inline-start" />
                )}
                {uploadingMedia ? "در حال آپلود..." : "افزودن عکس یا ویدیو"}
              </Button>
            </div>
            <Button
              type="button"
              disabled={posting || uploadingMedia || (!newPost.trim() && !media)}
              onClick={handleCreatePost}
            >
              انتشار پست
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              {activeFilter?.value === "forYou"
                ? "هنوز پستی در فید نیست — اولین نفری باشید که چیزی می‌نویسد!"
                : "پستی در این دسته پیدا نشد"}
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onOpenComments={handleOpenComments}
          />
        ))
      )}
    </div>
  );
}

export default function CommunityClient() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="اجتماع فیتینو"
        description="با دیگر ورزشکارها در ارتباط باشید"
      />
      <FeedTab />
    </div>
  );
}
