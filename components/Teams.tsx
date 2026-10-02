"use client";

import { useLeague } from "./LeagueApp";
import { CastPhoto, FriendAvatar, PageHead, XMark } from "./ui";

export default function Teams() {
  const { m, openCast } = useLeague();
  return (
    <>
      <div className="mb-3.5">
        <PageHead title="Teams" aside="Tap a castaway for details" />
      </div>
      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,370px),1fr))]">
        {m.sorted.map((f) => {
          const one = f.rank === 1;
          return (
            <article
              key={f.id}
              data-friend={f.id}
              aria-label={`${f.name}'s team`}
              className="flex flex-col gap-3.5 rounded-[20px] border bg-s1 p-3.5"
              style={{ borderColor: one ? "var(--ambT)" : "var(--line)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="font-display flex h-7 min-w-[38px] items-center justify-center rounded-lg px-2 text-[18px] leading-none font-extrabold"
                  style={{ background: one ? "var(--fire)" : "var(--s2)", color: one ? "#1d1206" : "var(--ink)" }}
                >
                  {(f.tied ? "T" : "") + f.rank}
                </div>
                <FriendAvatar f={f} size={40} font={20} />
                <h2 className="disp m-0 min-w-0 flex-1 text-[24px] leading-none font-bold">{f.name}</h2>
                <div className="text-right">
                  <div className="font-display text-[38px] leading-[0.9] font-extrabold tabular-nums">{f.total}</div>
                  <div className="text-[11.5px] tracking-[0.06em] text-mut uppercase">Team total</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {f.cast.map((c) => {
                  const out = !!c.votedOutEp;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openCast(c.id)}
                      aria-label={`${c.name}, ${c.total} points${out ? ", voted out" : ""}. Show details`}
                      className="flex min-w-0 cursor-pointer flex-col gap-2 border-0 bg-transparent p-0 text-left text-ink"
                    >
                      <CastPhoto c={c} initialsSize={34} className="aspect-square w-full rounded-[14px]">
                        {out && <XMark thickness={6} />}
                      </CastPhoto>
                      <div className="min-w-0">
                        <div className="text-[13.5px] leading-[1.2] font-semibold">{c.short}</div>
                        <div className="mt-0.5 text-[11.5px] leading-[1.3] text-mut">
                          {[c.age, c.occupation].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="text-[11.5px] font-semibold" style={{ color: out ? "var(--embT)" : "var(--mut)" }}>
                        {out ? `Out · Ep ${c.votedOutEp}` : c.tribe}
                      </div>
                      <div className="mt-auto flex items-baseline gap-1 rounded-[10px] bg-s2 px-2 py-1.5">
                        <span className="font-display text-[24px] leading-none font-extrabold tabular-nums">{c.total}</span>
                        <span className="font-display text-[12px] leading-none font-bold tracking-[0.08em] text-mut">PTS</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
