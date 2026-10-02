"use client";

import { ruleTarget, TRIBES, type CastawayM } from "@/lib/model";
import type { ScoringEvent } from "@/lib/types";
import { useLeague } from "./LeagueApp";
import Sheet from "./Sheet";
import { CastPhoto, EventChip, Flame, FriendAvatar, OUT_BG, XMark, microLabel } from "./ui";

type Entry = {
  key: string;
  label: string;
  sub: string;
  subColor: string;
  events: ScoringEvent[];
  emptyText?: string;
  dot: string;
  dotBd: string;
};

export default function CastawaySheet({ c, onClose }: { c: CastawayM; onClose: () => void }) {
  const { m, openRule, openTeam } = useLeague();
  const f = m.byId[c.draftedBy];
  const out = !!c.votedOutEp;
  const t = TRIBES[c.tribe];

  // Timeline, newest first, stopping at the elimination episode.
  const list: Entry[] = [];
  if (m.pendingEp != null && !out)
    list.push({
      key: "pending",
      label: `Episode ${m.pendingEp}`,
      sub: "Pending",
      subColor: "var(--ambT)",
      events: [],
      emptyText: "Results not posted yet. Scores update Thursday.",
      dot: "transparent",
      dotBd: "2px dashed var(--ambT)",
    });
  [...m.posted].reverse().forEach((e) => {
    if (c.votedOutEp && e > c.votedOutEp) return;
    const p = c.epPts[e];
    const evs = c.events[e] ?? [];
    list.push({
      key: String(e),
      label: `Episode ${e}${c.votedOutEp === e ? " · Voted out" : ""}`,
      sub: (p > 0 ? "+" : "") + p,
      subColor: p > 0 ? "var(--ink)" : "var(--mut)",
      events: evs,
      emptyText: evs.length ? undefined : c.votedOutEp === e ? "Voted out with no scoring events." : "No scoring events.",
      dot: c.votedOutEp === e ? "var(--mut)" : p > 0 ? "var(--ambT)" : "var(--s2)",
      dotBd: "2px solid var(--bg)",
    });
  });

  return (
    <Sheet label={`${c.name} details`} onClose={onClose}>
      <CastPhoto c={c} initialsSize={110} stripeGap={11} className="h-[250px]">
        <div
          className="absolute bottom-3.5 left-4 font-mono text-[11px] leading-none tracking-[0.08em] opacity-80"
          style={{ color: out ? "#1d1a16" : t.ink, display: c.photoUrl ? "none" : undefined }}
        >
          HEADSHOT · {c.short.toUpperCase()}
        </div>
        <div className="absolute right-0 bottom-0 left-0 h-[90px]" style={{ background: "linear-gradient(180deg,transparent,rgba(0,0,0,0.25))" }} />
        {out && <XMark thickness={10} size={150} />}
      </CastPhoto>
      <button
        type="button"
        data-autofocus
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 z-[2] size-11 cursor-pointer rounded-full border-0 text-[22px] leading-none font-semibold text-[#f4ede3]"
        style={{ background: "rgba(20,16,12,0.75)" }}
      >
        ×
      </button>
      <div aria-hidden className="absolute top-2 left-1/2 -ml-5 h-1 w-10 rounded-sm bg-white/55 wide:hidden" />

      <div className="flex flex-col gap-[18px] px-[18px] pt-[18px] pb-7">
        <div>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {c.mvp && (
              <div className="disp flex items-center gap-1.5 rounded-full bg-fire py-[5px] pr-2.5 pl-2 text-[13px] leading-none font-bold tracking-[0.08em] text-onfire">
                <Flame size={10} style={{ background: "#fff3d6" }} />
                MVP
              </div>
            )}
            <div className="disp flex items-center gap-1.5 rounded-full border border-line px-2.5 py-[5px] text-[13px] leading-none font-bold tracking-[0.08em]">
              <div className="size-[9px] rounded-full" style={{ background: out ? OUT_BG : t.bg }} />
              {c.tribe}
            </div>
            <div
              className="disp rounded-full border border-line px-2.5 py-[5px] text-[13px] leading-none font-bold tracking-[0.08em]"
              style={{ color: out ? "var(--embT)" : "var(--mut)" }}
            >
              {out ? `Voted out · Ep ${c.votedOutEp}` : "Still in the game"}
            </div>
          </div>
          <h2 className="disp m-0 text-[38px] leading-[0.95] font-extrabold text-balance">{c.name}</h2>
          <div className="mt-1.5 text-[14px] text-mut">{[c.age, c.occupation].filter(Boolean).join(" · ")}</div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[14px] border border-line bg-s1 px-3.5 py-3">
            <div className={microLabel}>Season total</div>
            <div className="font-display mt-1.5 text-[46px] leading-none font-extrabold tabular-nums">{c.total}</div>
          </div>
          <button
            type="button"
            onClick={() => openTeam(f.id)}
            aria-label={`Drafted by ${f.name}. Open team`}
            className="flex cursor-pointer flex-col gap-2 rounded-[14px] border border-line bg-s1 px-3.5 py-3 text-left text-ink"
          >
            <div className={microLabel}>Drafted by</div>
            <div className="flex items-center gap-2">
              <FriendAvatar f={f} size={30} font={15} />
              <div className="disp text-[22px] leading-none font-bold">{f.name}</div>
            </div>
            <div className="text-[12.5px] text-mut">
              Pick #{c.pick} · Round {c.round}
              {c.mvp ? " (MVP)" : ""}
            </div>
          </button>
        </div>

        <div>
          <h3 className="disp m-0 mb-3 text-[20px] leading-none font-extrabold">Scoring by episode</h3>
          <ol className="m-0 flex list-none flex-col p-0">
            {list.map((e) => (
              <li key={e.key} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2.5">
                <div className="flex flex-col items-center">
                  <div className="mt-1 size-3 rounded-full" style={{ background: e.dot, border: e.dotBd }} />
                  <div className="mt-1 w-0.5 flex-1 bg-line" />
                </div>
                <div className="flex flex-col gap-2 pb-[18px]">
                  <div className="flex items-baseline justify-between gap-2.5">
                    <div className="disp text-[17px] leading-[1.1] font-bold tracking-[0.04em]">{e.label}</div>
                    <div className="font-display text-[22px] leading-none font-extrabold" style={{ color: e.subColor }}>
                      {e.sub}
                    </div>
                  </div>
                  {e.emptyText && <div className="text-[13px] text-mut">{e.emptyText}</div>}
                  {e.events.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {e.events.map((ev, i) => (
                        <EventChip key={i} ev={ev} size="lg" surface="var(--s1)" onOpen={() => openRule(ruleTarget(m, ev))} />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="text-[12.5px] text-mut">Tap any event to see its rule.</div>
        </div>
      </div>
    </Sheet>
  );
}
