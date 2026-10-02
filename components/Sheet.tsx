"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Bottom sheet on mobile, right side panel at 900px+. Traps focus, closes on Esc or scrim tap. */
export default function Sheet({
  label,
  onClose,
  z = 40,
  children,
  panelRef,
}: {
  label: string;
  onClose: () => void;
  z?: number;
  children: ReactNode;
  panelRef?: RefObject<HTMLDivElement | null>;
}) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = panelRef ?? ownRef;
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel?.addEventListener("keydown", onKey);
    return () => {
      panel?.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [ref]);

  return (
    <div className="fixed inset-0" style={{ zIndex: z }}>
      <div aria-hidden onClick={onClose} className="absolute inset-0" style={{ background: "var(--scrim)" }} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="sheet-in-up wide:sheet-in-left absolute right-0 bottom-0 left-0 max-h-[90%] overflow-y-auto overscroll-contain rounded-t-[22px] border border-line bg-bg wide:top-0 wide:left-auto wide:max-h-full wide:w-[460px] wide:rounded-none"
        style={{ boxShadow: "0 -20px 60px rgba(0,0,0,0.4)" }}
      >
        {children}
      </div>
    </div>
  );
}
