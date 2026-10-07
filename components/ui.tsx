"use client";

import { createContext, useContext, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import type { ScoringEvent } from "@/lib/types";
import { TRIBES, asset, friendColor, tierColor, type CastawayM, type FriendM } from "@/lib/model";

export const OUT_BG = "#8f8a83";
export const OUT_INK = "#1d1a16";
const X_RED = "#e5484d";

/** Red "voted out" X: two rotated bars. Never greyscaled. */
export function XMark({ thickness, size }: { thickness: number; size?: number }) {
  const bar: CSSProperties = {
    position: "absolute",
    left: size ? 0 : "-5%",
    top: "50%",
    width: size ?? "110%",
    height: thickness,
    marginTop: -thickness / 2,
    borderRadius: thickness,
    background: X_RED,
    boxShadow: `0 0 0 ${thickness >= 10 ? 2 : 1}px rgba(0,0,0,0.3)`,
  };
  const wrap: CSSProperties = size
    ? { position: "absolute", left: "50%", top: "50%", width: size, height: size, margin: `${-size / 2}px 0 0 ${-size / 2}px` }
    : { position: "absolute", inset: 0 };
  return (
    <div aria-hidden style={{ ...wrap, pointerEvents: "none" }}>
      <div style={{ ...bar, transform: "rotate(45deg)" }} />
      <div style={{ ...bar, transform: "rotate(-45deg)" }} />
    </div>
  );
}

/** The CSS flame mark (a rotated teardrop). */
export function Flame({ size = 13, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50% 0 50% 50%",
        transform: "rotate(-45deg)",
        background: "linear-gradient(200deg,#ffd166,#f0642a)",
        ...style,
      }}
    />
  );
}

function Photo({ src, alt, grey }: { src?: string; alt: string; grey: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ filter: grey ? "grayscale(1)" : "none" }}
    />
  );
}

/** Round castaway avatar with initials fallback, red X when out and optional MVP flame. */
export function CastAvatar({
  c,
  size,
  font,
  x,
  mvp = false,
}: {
  c: CastawayM;
  size: number;
  font: number;
  x: number;
  mvp?: boolean;
}) {
  const out = !!c.votedOutEp;
  const t = TRIBES[c.tribe];
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <div
        className="disp relative flex items-center justify-center overflow-hidden rounded-full font-bold"
        style={{
          width: size,
          height: size,
          fontSize: font,
          lineHeight: 1,
          background: out ? OUT_BG : t.bg,
          color: out ? OUT_INK : t.ink,
          filter: out ? "grayscale(1)" : "none",
          opacity: out ? 0.5 : 1,
        }}
      >
        {c.initials}
        <Photo src={c.photoUrl} alt={c.name} grey={out} />
      </div>
      {mvp && <Flame size={13} style={{ position: "absolute", top: -2, right: 0, boxShadow: "0 0 0 2px var(--s1)" }} />}
      {out && <XMark thickness={x} />}
    </div>
  );
}

/** Square tile / hero photo with striped tribe fallback. */
export function CastPhoto({
  c,
  initialsSize,
  className = "",
  style,
  children,
  stripeGap = 9,
}: {
  c: CastawayM;
  initialsSize: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  stripeGap?: number;
}) {
  const out = !!c.votedOutEp;
  const t = TRIBES[c.tribe];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: out ? OUT_BG : t.bg, ...style }}>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `repeating-linear-gradient(135deg,rgba(255,255,255,0.10) 0 2px,transparent 2px ${stripeGap}px)` }}
      />
      <div
        className="disp absolute inset-0 flex items-center justify-center font-extrabold"
        style={{ fontSize: initialsSize, lineHeight: 1, color: out ? OUT_INK : t.ink, opacity: out ? 0.5 : 0.9 }}
      >
        {c.initials}
      </div>
      <Photo src={c.photoUrl} alt={c.name} grey={out} />
      {children}
    </div>
  );
}

const BADGE = { crown: "👑", poop: "💩" } as const;

type ZoomFriend = Pick<FriendM, "name" | "photoUrl" | "photoLargeUrl">;
/** Opens the full-size photo viewer; provided by LeagueApp. */
export const PhotoZoom = createContext<((f: ZoomFriend) => void) | null>(null);

/** Friend's profile picture (initial fallback) with a crown for first place and poop for last. */
export function FriendAvatar({
  f,
  size,
  font,
  ring,
  zoomable = false,
}: {
  f: Pick<FriendM, "name" | "hue" | "photoUrl" | "photoLargeUrl" | "badge">;
  size: number;
  font: number;
  ring?: string;
  /** Tapping opens the full-size photo (Teams tab only). */
  zoomable?: boolean;
}) {
  const zoom = useContext(PhotoZoom);
  // 15px badge at -8/-7 on a 42px photo, scaled for other sizes.
  const badge = Math.max(12, Math.round(size * 0.36));
  const canZoom = !!(zoomable && zoom && f.photoUrl);
  const open = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    zoom?.(f);
  };
  return (
    <span
      aria-hidden={canZoom ? undefined : true}
      role={canZoom ? "button" : undefined}
      tabIndex={canZoom ? 0 : undefined}
      aria-label={canZoom ? `View ${f.name}'s photo` : undefined}
      onClick={canZoom ? open : undefined}
      onKeyDown={canZoom ? (e) => (e.key === "Enter" || e.key === " ") && open(e) : undefined}
      className={`relative block flex-none rounded-full ${canZoom ? "cursor-zoom-in" : ""}`}
      style={{ width: size, height: size }}
    >
      <span
        className="disp relative flex items-center justify-center overflow-hidden rounded-full font-extrabold"
        style={{
          width: size,
          height: size,
          fontSize: font,
          lineHeight: 1,
          background: friendColor(f.hue),
          color: "#15120f",
          boxShadow: ring ? `0 0 0 3px var(--s1),0 0 0 5px ${ring}` : undefined,
        }}
      >
        {f.name[0]}
        <Photo src={f.photoUrl} alt="" grey={false} />
      </span>
      {f.badge && (
        <span
          className="absolute leading-none"
          style={{
            top: -Math.round(size * 0.19),
            right: -Math.round(size * 0.17),
            fontSize: badge,
            transform: f.badge === "crown" ? "rotate(18deg)" : undefined,
            filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.55))",
          }}
        >
          {BADGE[f.badge]}
        </span>
      )}
    </span>
  );
}

/** Scoring event pill. Tapping opens the matching rule. */
export function EventChip({
  ev,
  onOpen,
  size = "md",
  surface = "var(--s2)",
}: {
  ev: Pick<ScoringEvent, "label" | "points">;
  onOpen: () => void;
  size?: "sm" | "md" | "lg";
  surface?: string;
}) {
  const s = {
    sm: { pad: "4px 4px 4px 10px", font: 12.5, badge: 12, badgePad: "3px 6px", gap: 7 },
    md: { pad: "6px 6px 6px 11px", font: 13, badge: 13, badgePad: "4px 7px", gap: 8 },
    lg: { pad: "4px 5px 4px 12px", font: 13.5, badge: 13, badgePad: "5px 8px", gap: 8 },
  }[size];
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${ev.label}, +${ev.points} points. Show rule`}
      className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-line text-left font-medium text-ink"
      style={{ gap: s.gap, padding: s.pad, fontSize: s.font, background: surface }}
    >
      <span>{ev.label}</span>
      <span
        className="num rounded-full font-bold"
        style={{
          fontSize: s.badge,
          lineHeight: 1,
          padding: s.badgePad,
          color: tierColor(ev.points),
          background: surface === "var(--s2)" ? "var(--bg)" : "var(--s2)",
        }}
      >
        +{ev.points}
      </span>
    </button>
  );
}

export function PageHead({ title, aside, as = "h1" }: { title: string; aside?: ReactNode; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <H className={`disp m-0 font-extrabold leading-none ${as === "h1" ? "text-[32px]" : "text-[22px]"}`}>{title}</H>
      {aside && <div className="text-[13px] text-mut">{aside}</div>}
    </div>
  );
}

export const microLabel = "disp text-[12px] font-semibold leading-none tracking-[0.08em] text-mut";
