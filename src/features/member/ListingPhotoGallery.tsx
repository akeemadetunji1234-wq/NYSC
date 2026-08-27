"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ListingPhotoGalleryProps {
  images: string[];
  name: string;
}

export function ListingPhotoGallery({ images, name }: ListingPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const totalImages = images.length;
  const activeImage = images[activeIndex] || images[0];

  const goTo = (index: number) => {
    if (!totalImages) return;
    setActiveIndex((index + totalImages) % totalImages);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isLightboxOpen]);

  if (!totalImages || !activeImage) return null;

  return (
    <section aria-label={`${name} photos`} className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-slate-950/5 shadow-sm">
        <div className="relative aspect-[4/3] min-h-[280px] w-full sm:aspect-[16/10] sm:min-h-[380px] lg:min-h-[480px]">
          <Image
            src={activeImage}
            alt={`${name} photo ${activeIndex + 1} of ${totalImages}`}
            fill
            priority={activeIndex === 0}
            sizes="(min-width: 1024px) 960px, 100vw"
            className="object-contain"
          />
        </div>

        {totalImages > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous property photo"
              onClick={() => goTo(activeIndex - 1)}
              className="na-focus-ring absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition hover:bg-black/75"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next property photo"
              onClick={() => goTo(activeIndex + 1)}
              className="na-focus-ring absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition hover:bg-black/75"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="Open property photo full screen"
          onClick={() => setIsLightboxOpen(true)}
          className="na-focus-ring absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-black/80"
        >
          <Expand className="h-4 w-4" />
          View full image
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground" aria-live="polite">
          Photo {activeIndex + 1} of {totalImages}
        </p>
        <p className="text-xs text-muted-foreground">Use the arrows or select a thumbnail</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Property photo thumbnails">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            role="listitem"
            aria-label={`Show photo ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => goTo(index)}
            className={`na-focus-ring relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-secondary transition sm:h-20 sm:w-28 ${activeIndex === index ? "border-[var(--na-brand)] ring-2 ring-[var(--na-brand)]/20" : "border-transparent opacity-75 hover:opacity-100"}`}
          >
            <Image
              src={image}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} full-screen photo viewer`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            aria-label="Close full-screen photo viewer"
            onClick={() => setIsLightboxOpen(false)}
            className="na-focus-ring absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative h-[min(86vh,800px)] w-[min(94vw,1200px)]" onClick={(event) => event.stopPropagation()}>
            <Image
              src={activeImage}
              alt={`${name} photo ${activeIndex + 1} of ${totalImages}`}
              fill
              sizes="94vw"
              className="object-contain"
            />
            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous property photo"
                  onClick={() => goTo(activeIndex - 1)}
                  className="na-focus-ring absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:left-4"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next property photo"
                  onClick={() => goTo(activeIndex + 1)}
                  className="na-focus-ring absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-4"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
