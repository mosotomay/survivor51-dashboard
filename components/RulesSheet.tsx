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

  const ring = (id: string) => (rule === id ? { outline: "2px solid var(--ambT)" } : undefined);

  return (
    <Sheet label="Scoring rules" onClose={onClose} z={50} panelRef={panelRef}>
      <div className="sticky top-0 z-[2] flex items-center gap-3 border-b border-line bg-bg px-[18px] py-3">
        <div className="flex-1">
          <h2 className="disp m-0 text-[28px] leading-none font-extrabold">Scoring rules</h2>
          <div className="mt-1 text-[12.5px] text-mut">Each event counts once per castaway per week.</div>
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
              <div className="font-display text-[38px] leading-none font-extrabold">+{R.survival.preMerge}</div>
              <div className="text-[13px] text-mut">Pre-merge</div>
            </div>
            <div className={`${card} px-3.5 py-3`}>
              <div className="font-display text-[38px] leading-none font-extrabold">+{R.survival.postMerge}</div>
              <div className="text-[13px] text-mut">Post-merge</div>
            </div>
          </div>
        </section>

        {R.tiers.map((t) => {
          const key = "tier-" + t.points;
          return (
            <section key={key} data-rule={key} className="rounded-2xl" style={{ ...ring(key), outlineOffset: 6 }}>
              <div className="mb-2.5 flex items-baseline gap-2.5">
                <div className="font-display text-[34px] leading-none font-extrabold" style={{ color: tierColor(t.points) }}>
                  +{t.points}
                </div>
                <h3 className="disp m-0 text-[15px] leading-none font-bold tracking-[0.08em]">{t.points}-point events</h3>
                <div className="ml-auto text-[12px] text-mut">{t.rules.length} events</div>
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {t.rules.map((r) => {
                  const on = rule === r.id;
                  return (
                    <li
                      key={r.id}
                      data-rule={r.id}
                      aria-current={on ? "true" : undefined}
                      className="rounded-full px-[11px] py-[7px] text-[13.5px]"
                      style={{
                        border: on ? "2px solid var(--ambT)" : "1px solid var(--line)",
                        background: on ? "var(--firesoft)" : "var(--s1)",
                      }}
                    >
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <section>
          <h3 className={sectionLabel}>Finale</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              [R.finale.third, "3rd place"],
              [R.finale.second, "2nd place"],
              [R.finale.winner, "Winner"],
            ].map(([p, l]) => (
              <div key={l} className={`${card} p-3`}>
                <div className="font-display text-[30px] leading-none font-extrabold">+{p}</div>
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
            <div className="font-display text-[28px] leading-none font-extrabold text-amb">+{R.finale.mvpBonus}</div>
          </div>
        </section>

        <section>
          <h3 className={sectionLabel}>League decisions</h3>
          <div className="flex flex-col gap-2">
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
