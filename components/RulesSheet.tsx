"use client";

import { useEffect, useRef } from "react";
import { tierColor } from "@/lib/model";
import { useLeague } from "./LeagueApp";
import Sheet from "./Sheet";
import { Flame } from "./ui";

const sectionLabel = "disp mb-2.5 text-[13px] leading-none font-bold tracking-[0.1em] text-mut";
const card = "rounded-[14px] border border-line bg-s1";

/** Scoring reference. `rule` deep-links to a rule id (or a "tier-N" header) and highlights it. */
export default function RulesSheet({ rule, onClose }: { rule: string | null; onClose: () => void }) {
  const { m } = useLeague();
  const R = m.data.rules;
  const stakes = m.data.league.stakes;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = panelRef.current;
    if (!box) return;
    const raf = requestAnimationFrame(() => {
      const el = rule ? box.querySelector<HTMLElement>(`[data-rule="${rule}"]`) : null;
      box.scrollTop = el ? Math.max(0, el.offsetTop - box.clientHeight / 3) : 0;
    });
    return () => cancelAnimationFrame(raf);
  }, [rule]);

  // How often each rule has been hit across posted episodes.
  const hits: Record<string, number> = {};
  m.cast.forEach((c) => m.posted.forEach((e) => c.events[e].forEach((ev) => (hits[ev.ruleId] = (hits[ev.ruleId] ?? 0) + 1))));

  const ring = (id: string) => (rule === id ? { outline: "2px solid var(--ambT)" } : undefined);

  return (
    <Sheet label="Scoring rules" onClose={onClose} z={50} panelRef={panelRef}>
      <div className="sticky top-0 z-[2] flex items-center gap-3 border-b border-line bg-bg px-[18px] py-3">
        <div className="flex-1">
          <h2 className="disp m-0 text-[28px] leading-none font-extrabold">Scoring rules</h2>
          <div className="mt-1 text-[12.5px] text-mut">Each event counts once per castaway per week. Numbers show times hit this season.</div>
        </div>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close rules"
          className="size-11 cursor-pointer rounded-full border border-line bg-s1 text-[22px] leading-none font-semibold"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-[22px] px-[18px] pt-4 pb-8">
        <section data-rule={R.survival.id} className="rounded-2xl p-0.5" style={{ ...ring(R.survival.id), outlineOffset: 2 }}>
          <h3 className={sectionLabel}>Survive the week</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className={`${card} px-3.5 py-3`}>
              <div className="num text-[30px] leading-none font-bold">+{R.survival.preMerge}</div>
              <div className="text-[13px] text-mut">Pre-merge</div>
            </div>
            <div className={`${card} px-3.5 py-3`}>
              <div className="num text-[30px] leading-none font-bold">+{R.survival.postMerge}</div>
              <div className="text-[13px] text-mut">Post-merge</div>
            </div>
          </div>
        </section>

        {R.tiers.map((t) => {
          const key = "tier-" + t.points;
          const color = tierColor(t.points);
          const top = Math.max(0, ...t.rules.map((r) => hits[r.id] ?? 0));
          // Most frequent first; ties keep the rulebook order.
          const rules = t.rules.map((r, i) => ({ ...r, i, n: hits[r.id] ?? 0 })).sort((a, b) => b.n - a.n || a.i - b.i);
          return (
            <section key={key} data-rule={key} className="rounded-2xl" style={{ ...ring(key), outlineOffset: 6 }}>
              <div className="mb-2.5 flex items-baseline gap-2.5">
                <div className="num text-[27px] leading-none font-bold" style={{ color }}>
                  +{t.points}
                </div>
                <h3 className="disp m-0 text-[15px] leading-none font-bold tracking-[0.08em]">{t.points}-point events</h3>
                <div className="ml-auto text-[12px] text-mut">
                  {t.rules.length} events · hit {t.rules.reduce((s, r) => s + (hits[r.id] ?? 0), 0)}×
                </div>
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {rules.map((r) => {
                  const on = rule === r.id;
                  const most = top > 0 && r.n === top;
                  return (
                    <li
                      key={r.id}
                      data-rule={r.id}
                      aria-current={on ? "true" : undefined}
                      aria-label={`${r.label}, ${r.n} ${r.n === 1 ? "time" : "times"} this season${most ? ", most common" : ""}`}
                      className="flex items-center gap-2 rounded-full py-[7px] pr-[7px] pl-[11px] text-[13.5px]"
                      style={{
                        border: on ? "2px solid var(--ambT)" : most ? `1px solid color-mix(in srgb, ${color} 45%, transparent)` : "1px solid var(--line)",
                        background: on ? "var(--firesoft)" : most ? `color-mix(in srgb, ${color} 16%, var(--s1))` : "var(--s1)",
                      }}
                    >
                      {r.label}
                      <span
                        aria-hidden
                        className="num min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[12px] leading-none font-semibold"
                        style={{
                          background: most ? color : "var(--s2)",
                          color: most ? "var(--bg)" : r.n ? "var(--ink)" : "var(--mut)",
                        }}
                      >
                        {r.n}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <section data-rule="finale" className="rounded-2xl" style={{ ...ring("finale"), outlineOffset: 6 }}>
          <h3 className={sectionLabel}>Finale</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              [R.finale.third, "3rd place"],
              [R.finale.second, "2nd place"],
              [R.finale.winner, "Winner"],
            ].map(([p, l]) => (
              <div key={l} className={`${card} p-3`}>
                <div className="num text-[23px] leading-none font-bold">+{p}</div>
                <div className="text-[13px] text-mut">{l}</div>
              </div>
            ))}
          </div>
          <div
            className="mt-2 flex items-center gap-3 rounded-[14px] border border-line px-3.5 py-3"
            style={{ background: "linear-gradient(135deg,var(--firesoft),var(--s1))" }}
          >
            <Flame size={14} />
            <div className="flex-1 text-[13.5px]">
              <b>MVP bonus.</b> +{R.finale.mvpBonus} more if the winner is your MVP (your first draft pick).
            </div>
            <div className="num text-[22px] leading-none font-bold text-amb">+{R.finale.mvpBonus}</div>
          </div>
        </section>

        <section>
          <h3 className={sectionLabel}>League decisions</h3>
          <div className="flex flex-col gap-2">
            {stakes && (
              <div
                className="rounded-[14px] border-2 px-3.5 py-3.5"
                style={{ borderColor: "var(--ambT)", background: "linear-gradient(135deg,var(--firesoft),var(--s1))" }}
              >
                <div className="disp mb-2.5 text-[20px] leading-none font-extrabold tracking-[0.04em] text-amb">The stakes</div>
                <div className="flex flex-col gap-2 text-[15px] leading-snug">
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden className="text-[20px] leading-none">💩</span>
                    <span className="font-semibold">{stakes.last}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden className="text-[20px] leading-none">👑</span>
                    <span className="font-semibold">{stakes.first}</span>
                  </div>
                </div>
              </div>
            )}
            {m.data.league.decisions.map((d) => (
              <div key={d} className={`${card} px-3.5 py-3 text-[14px]`}>
                {d}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
