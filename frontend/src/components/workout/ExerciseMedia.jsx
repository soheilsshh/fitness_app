"use client";

import { cn } from "@/lib/utils";
import { exercisePreviewUrl, isVideoMedia, mediaUrl } from "./mediaUrl";

export default function ExerciseMedia({
  exercise,
  className,
  emptyClassName,
  alt,
  autoPlay = true,
}) {
  const gif = mediaUrl(exercise?.gifUrl);
  const image = mediaUrl(exercise?.imageUrl);
  const src = gif || image;
  const name = alt || exercise?.name || "exercise";

  if (!src) {
    return (
      <div
        className={cn(
          "flex h-48 items-center justify-center text-sm text-muted-foreground",
          emptyClassName,
          className
        )}
      >
        انیمیشن در دسترس نیست
      </div>
    );
  }

  if (isVideoMedia(exercise?.gifUrl) || isVideoMedia(src)) {
    return (
      <video
        src={src}
        className={cn("mx-auto max-h-64 w-full object-contain", className)}
        autoPlay={autoPlay}
        loop
        muted
        playsInline
        controls
        aria-label={name}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={cn("mx-auto max-h-64 w-full object-contain", className)}
    />
  );
}

export { exercisePreviewUrl };
