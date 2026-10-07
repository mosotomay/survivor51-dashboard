"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/model";
import type { Friend } from "@/lib/types";

export type ViewerPhoto = Pick<Friend, "name" | "photoUrl" | "photoLargeUrl">;

/** Full-size profile picture. Closes on the X, a tap outside the photo, or Esc. */
export default function PhotoViewer({ photo, onClose }: { photo: ViewerPhoto; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === "Tab") {
        // The close button is the only control, so keep focus on it.
        e.preventDefault();
        closeBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      html.style.overflow = prevOverflow;
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, []);

  const src = photo.photoLargeUrl ?? photo.photoUrl;
  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.name}'s photo`}
      onClick={onClose}
      className="sheet-in-up fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(8,6,4,0.82)" }}
    >
      <figure className="relative m-0 flex max-w-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(src)}
          alt={photo.name}
          className="block max-h-[78dvh] w-auto max-w-[min(92vw,640px)] rounded-[20px] border border-line object-contain"
          style={{ boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }}
        />
        <figcaption className="disp text-[24px] leading-none font-bold text-[#f4ede3]">{photo.name}</figcaption>
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="absolute -top-3 -right-3 flex size-11 cursor-pointer items-center justify-center rounded-full border border-line text-[24px] leading-none font-semibold text-[#f4ede3]"
          style={{ background: "rgba(20,16,12,0.9)" }}
        >
          ×
        </button>
      </figure>
    </div>
  );
}
