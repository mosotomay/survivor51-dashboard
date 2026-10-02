"use client";

import { useState } from "react";
import { ruleTarget } from "@/lib/model";
import { useLeague } from "./LeagueApp";
import { CastAvatar, EventChip, FriendAvatar, PageHead, microLabel } from "./ui";

type Sel = "season" | number;

export default function Weekly() {
  const { m } = useLeague();
  const [sel, setSel] = useState<Sel>("season");
  const pending = m.pendingEp != null;
  const eps = pending ? [...m.posted, m.pendingEp as number] : m.posted;
  const epMax: Record<number, number> = {};
  m.posted.forEach((e) => (epMax[e] = Math.max(...m.friends.map((f) => f.epPts[e]))));
  const cols = `minmax(108px,1.5fr) repeat(${eps.length},minmax(52px,1fr)) minmax(56px,0.8fr)`;
  const isPendingSel = sel !== "season" && sel > m.lastEp;

  const chips: { key: Sel; label: string; pending?: boolean }[] = [
    { key: "season", label: "Season" },
    ...eps.map((e) => ({ key: e, label: "Ep " + e, pending: e > m.lastEp })),
  ];

  return (
    <>
      <div className="mb-3">
        <PageHead title="Weekly" aside="Points per episode" />
      </div>
      <div role="tablist" aria-label="Episode" className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {chips.map((c) => {
          const a = sel === c.key;
          return (
            <button
              key={String(c.key)}
              type="button"
              role="tab"
              aria-selected={a}
              onClick={() => setSel(c.key)}
              className="disp flex min-h-10 flex-none cursor-pointer items-center gap-2 rounded-full border px-4 text-[16px] leading-none font-bold tracking-[0.04em]"
              style={{
                borderColor: a ? "var(--ink)" : c.pending ? "var(--ambT)" : "var(--line)",
                background: a ? "var(--ink)" : "var(--s1)",
                color: a ? "var(--bg)" : "var(--ink)",
              }}
            >
              {c.label}
              {c.pending && <span className="font-sans text-[11px] leading-none font-semibold tracking-normal normal-case opacity-85">Pending</span>}
            </button>
          );
        })}
      </div>

      {sel === "season" && (
        <>
          <div className="overflow-x-auto rounded-[18px] border border-line bg-s1 px-2 pt-1.5 pb-2">
            <div role="table" aria-label="Points per friend per episode">
              <div role="row" className={`grid items-center gap-1 px-1.5 py-2 ${microLabel}`} style={{ gridTemplateColumns: cols }}>
                <div role="columnheader">Player</div>
                {eps.map((e) => (
                  <div role="columnheader" key={e} className="text-center">
                    <button
                      type="button"
                      onClick={() => setSel(e)}
                      className="disp cursor-pointer border-0 bg-transparent px-0 py-1.5 text-[12px] leading-none font-semibold tracking-[0.08em] text-mut underline decoration-line underline-offset-[3px]"
                    >
                      Ep {e}
                    </button>
                  </div>
                ))}
                <div role="columnheader" className="pr-1.5 text-right">
                  Total
                </div>
              </div>
              {m.sorted.map((f) => (
                <div
                  role="row"
                  key={f.id}
                  className="grid items-center gap-1 border-t border-line px-1.5 py-1"
                  style={{ gridTemplateColumns: cols }}
                >
                  <div role="rowheader" className="flex min-w-0 items-center gap-2 py-1.5">
                    <div className="size-2.5 flex-none rounded-full" style={{ background: `oklch(0.76 0.13 ${f.hue})` }} />
                    <div className="disp truncate text-[18px] leading-none font-bold">{f.name}</div>
                  </div>
                  {eps.map((e) => {
                    if (e > m.lastEp)
                      return (
                        <div
                          role="cell"
                          key={e}
                          aria-label="Pending"
                          className="font-display flex h-[42px] items-center justify-center rounded-[10px] border border-dashed border-line text-[22px] font-extrabold text-mut"
                        >
                          —
                        </div>
                      );
                    const v = f.epPts[e];
                    const hi = v === epMax[e] && v > 0;
                    return (
                      <div
                        role="cell"
                        key={e}
                        className="font-display flex h-[42px] flex-col items-center justify-center gap-px rounded-[10px] text-[22px] leading-none font-extrabold tabular-nums"
                        style={{ background: hi ? "var(--fire)" : "var(--s2)", color: hi ? "#1d1206" : "var(--ink)" }}
                      >
                        {v}
                        {hi && <span className="font-sans text-[9px] leading-none font-bold tracking-[0.1em]">TOP</span>}
                      </div>
                    );
                  })}
                  <div role="cell" className="font-display pr-1.5 text-right text-[26px] leading-none font-extrabold tabular-nums">
                    {f.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2.5 text-[12.5px] text-mut">
            Highlighted cell = that episode&apos;s top scorer. Tap an episode to see every event.
          </div>
        </>
      )}

      {isPendingSel && (
        <div className="flex flex-col items-center gap-2.5 rounded-[18px] border border-dashed border-line bg-s1 px-5 py-10 text-center">
          <div aria-hidden className="flex size-11 flex-col items-center justify-center gap-0.5 rounded-full bg-s2">
            <div className="h-[7px] w-2.5 rounded bg-[#6f665b]" />
            <div className="h-3 w-[3px] rounded-sm bg-mut" />
          </div>
          <div className="disp text-[24px] leading-none font-extrabold">Episode {sel} results not posted yet</div>
          <div className="max-w-[320px] text-[14px] text-mut">Scores update every Thursday. Check back after the episode is scored.</div>
        </div>
      )}

      {sel !== "season" && !isPendingSel && <EpisodeView ep={sel} />}
    </>
  );
}

function EpisodeView({ ep }: { ep: number }) {
  const { m, openCast, openRule } = useLeague();
  const s = [...m.friends].sort((a, b) => b.epPts[ep] - a.epPts[ep] || a.draftOrder - b.draftOrder);
  const mx = s[0].epPts[ep];
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,400px),1fr))]">
      {s.map((f) => {
        const pts = f.epPts[ep];
        const firstIdx = s.findIndex((g) => g.epPts[ep] === pts);
        const tied = s.filter((g) => g.epPts[ep] === pts).length > 1;
        const top = mx > 0 && pts === mx;
        return (
          <div
            key={f.id}
            className="flex flex-col gap-3 rounded-[18px] border bg-s1 p-3.5"
            style={{ borderColor: top ? "var(--ambT)" : "var(--line)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="font-display min-w-7 text-[20px] leading-none font-extrabold text-mut">
                {(tied ? "T" : "") + (firstIdx + 1)}
              </div>
              <FriendAvatar f={f} size={34} font={17} />
              <div className="disp flex-1 text-[21px] leading-none font-bold">{f.name}</div>
              {top && (
                <div className="disp rounded-full bg-fire px-2 py-1 text-[12px] leading-none font-bold tracking-[0.08em] text-onfire">
                  Top scorer
                </div>
              )}
              <div className="font-display text-[32px] leading-none font-extrabold tabular-nums">{pts}</div>
            </div>
            {f.cast.map((c) => {
              const evs = c.events[ep] ?? [];
              const goneBefore = !!c.votedOutEp && c.votedOutEp < ep;
              const noneText = goneBefore
                ? `Voted out Episode ${c.votedOutEp}`
                : c.votedOutEp === ep
                  ? "Voted out this episode · no points"
                  : "No scoring events";
              const p = c.epPts[ep];
              return (
                <div key={c.id} className="flex gap-2.5 border-t border-line pt-2.5">
                  <button
                    type="button"
                    onClick={() => openCast(c.id)}
                    aria-label={`${c.name}. Show details`}
                    className="size-11 flex-none cursor-pointer rounded-full border-0 bg-transparent p-0"
                  >
                    <CastAvatar c={c} size={44} font={15} x={3.5} />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[14px] font-semibold">{c.short}</div>
                      <div className="font-display text-[20px] leading-none font-extrabold">
                        {goneBefore ? "" : (p > 0 ? "+" : "") + p}
                      </div>
                    </div>
                    {evs.length === 0 && <div className="text-[12.5px] text-mut">{noneText}</div>}
                    {evs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {evs.map((ev, i) => (
                          <EventChip key={i} ev={ev} size="sm" onOpen={() => openRule(ruleTarget(m, ev))} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
