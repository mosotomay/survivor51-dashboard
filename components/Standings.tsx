"use client";

import type { FriendM } from "@/lib/model";
import { ruleTarget } from "@/lib/model";
import { useLeague } from "./LeagueApp";
import PointsChart from "./PointsChart";
import { CastAvatar, EventChip, FriendAvatar, PageHead, microLabel } from "./ui";

const MEDAL: Record<number, string> = { 1: "linear-gradient(90deg,#f7b733,#f0642a)", 2: "#cfc6b8", 3: "#c07a45" };
const PLACE = ["1st", "2nd", "3rd"];

const rankLabel = (f: FriendM) => (f.tied ? "T" : "") + f.rank;

export default function Standings() {
  const { m, openTeam, openCast, openRule } = useLeague();
  const pending = m.pendingEp != null;
  const weekPts = (f: FriendM) => (pending ? "—" : "+" + f.epPts[m.lastEp]);
  const [first, second, third] = m.sorted;
  const podium = [second, first, third];
  const { topFriend, topCast, bigEvent } = m.highlights;

  return (
    <div className="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr))]">
      <section aria-labelledby="standings-h" className="flex flex-col gap-3.5">
        <div id="standings-h">
          <PageHead title="Standings" aside={`After Episode ${m.lastEp}`} />
        </div>

        <ol className="m-0 grid list-none grid-cols-3 items-end gap-2 p-0">
          {podium.map((f) => {
            const one = f.rank === 1;
            return (
              <li key={f.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => openTeam(f.id)}
                  aria-label={`${PLACE[f.rank - 1] ?? f.rank + "th"} place: ${f.name}, ${f.total} points. Open team`}
                  className="relative flex w-full cursor-pointer flex-col items-center gap-1.5 overflow-hidden rounded-[18px] border px-1.5 pb-3 text-center text-ink"
                  style={{
                    paddingTop: one ? 26 : f.rank === 2 ? 16 : 12,
                    borderColor: one ? "var(--ambT)" : "var(--line)",
                    background: one ? "linear-gradient(180deg,var(--firesoft),var(--s1) 75%)" : "var(--s1)",
                  }}
                >
                  <div className="absolute top-0 right-0 left-0 h-1" style={{ background: MEDAL[f.rank] ?? "var(--line)" }} />
                  <div className="disp text-[13px] leading-none font-bold tracking-[0.08em] text-mut">
                    {f.tied ? "T" : ""}
                    {PLACE[f.rank - 1] ?? f.rank + "th"}
                  </div>
                  <FriendAvatar f={f} size={46} font={22} ring={one ? "var(--ambT)" : "transparent"} />
                  <div className="disp max-w-full truncate text-[19px] leading-none font-bold">{f.name}</div>
                  <div className="font-display text-[46px] leading-[0.9] font-extrabold tabular-nums">{f.total}</div>
                  <div className="text-[12px] font-medium text-mut">
                    {pending ? `Ep ${m.pendingEp} pending` : `+${f.epPts[m.lastEp]} this week`}
                  </div>
                  <div className="mt-1 flex gap-1">
                    {f.cast.map((c) => (
                      <CastAvatar key={c.id} c={c} size={26} font={11} x={2.5} />
                    ))}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="overflow-hidden rounded-[18px] border border-line bg-s1">
          <div
            className={`grid grid-cols-[34px_36px_minmax(0,1fr)_52px_56px] gap-2.5 border-b border-line px-3.5 py-2.5 ${microLabel}`}
          >
            <div>Rank</div>
            <div />
            <div>Player</div>
            <div className="text-right">Ep {pending ? m.pendingEp : m.lastEp}</div>
            <div className="text-right">Total</div>
          </div>
          {m.sorted.slice(3).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => openTeam(f.id)}
              aria-label={`Rank ${rankLabel(f)}: ${f.name}, ${f.total} points. Open team`}
              className="grid w-full cursor-pointer grid-cols-[34px_36px_minmax(0,1fr)_52px_56px] items-center gap-2.5 border-0 border-b border-line bg-transparent px-3.5 py-3 text-left text-ink"
            >
              <div className="flex flex-col gap-[3px]">
                <div className="font-display text-[22px] leading-none font-extrabold">{rankLabel(f)}</div>
                <Move f={f} />
              </div>
              <FriendAvatar f={f} size={36} font={18} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="disp text-[20px] leading-none font-bold">{f.name}</span>
                  {f.tied && (
                    <span className="rounded-full border border-line px-1.5 py-[3px] text-[10.5px] leading-none font-semibold tracking-[0.04em] text-mut uppercase">
                      Tied
                    </span>
                  )}
                </div>
                <div className="flex gap-[5px]">
                  {f.cast.map((c) => (
                    <CastAvatar key={c.id} c={c} size={24} font={10} x={2.5} />
                  ))}
                </div>
              </div>
              <div className="font-display text-right text-[18px] leading-none font-bold text-mut tabular-nums">{weekPts(f)}</div>
              <div className="font-display text-right text-[34px] leading-none font-extrabold tabular-nums">{f.total}</div>
            </button>
          ))}
          <div className="flex flex-wrap gap-3.5 px-3.5 py-2.5 text-[12px] text-mut">
            <div className="flex items-center gap-1.5">
              <div aria-hidden className="relative size-3">
                <div className="absolute top-[5px] -left-px h-[2.5px] w-3.5 rotate-45 rounded-sm bg-[#e5484d]" />
                <div className="absolute top-[5px] -left-px h-[2.5px] w-3.5 -rotate-45 rounded-sm bg-[#e5484d]" />
              </div>
              Voted out
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-[#e3b02a]" />
              Toka
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-[#7c55c7]" />
              Savu
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="rounded-[18px] border border-line bg-s1 px-3.5 pt-4 pb-2.5">
          <div className="mb-2.5">
            <PageHead as="h2" title="Cumulative points" aside="By episode" />
          </div>
          <PointsChart />
        </div>

        <div className="mt-1.5">
          <PageHead as="h2" title="Week's highlights" aside={`Episode ${m.lastEp}`} />
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
          <div
            className="flex shrink-0 grow basis-[190px] snap-start flex-col gap-2.5 rounded-2xl border border-line p-3.5"
            style={{ background: "linear-gradient(160deg,var(--firesoft),var(--s1) 65%)" }}
          >
            <div className="disp text-[12px] leading-none font-bold tracking-[0.1em] text-amb">Top player</div>
            <div className="flex items-center gap-2.5">
              <FriendAvatar f={topFriend} size={38} font={19} />
              <div className="disp text-[22px] leading-none font-bold">{topFriend.name}</div>
            </div>
            <div className="font-display text-[40px] leading-[0.9] font-extrabold">+{topFriend.epPts[m.lastEp]}</div>
          </div>

          <button
            type="button"
            onClick={() => openCast(topCast.id)}
            className="flex shrink-0 grow basis-[190px] cursor-pointer snap-start flex-col gap-2.5 rounded-2xl border border-line bg-s1 p-3.5 text-left text-ink"
          >
            <div className="disp text-[12px] leading-none font-bold tracking-[0.1em] text-amb">Top castaway</div>
            <div className="flex items-center gap-2.5">
              <CastAvatar c={topCast} size={38} font={15} x={3} />
              <div className="min-w-0">
                <div className="disp text-[19px] leading-[1.05] font-bold">{topCast.short}</div>
                <div className="text-[12px] text-mut">
                  {m.byId[topCast.draftedBy].name}&apos;s pick #{topCast.pick}
                </div>
              </div>
            </div>
            <div className="font-display text-[40px] leading-[0.9] font-extrabold">+{topCast.epPts[m.lastEp]}</div>
          </button>

          {bigEvent && (
            <div className="flex shrink-0 grow basis-[210px] snap-start flex-col gap-2.5 rounded-2xl border border-line bg-s1 p-3.5">
              <div className="disp text-[12px] leading-none font-bold tracking-[0.1em] text-amb">Biggest single event</div>
              <div className="self-start">
                <EventChip ev={bigEvent.ev} onOpen={() => openRule(ruleTarget(m, bigEvent.ev))} />
              </div>
              <div className="text-[13px] text-mut">
                {bigEvent.c.name} · {m.byId[bigEvent.c.draftedBy].name}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Move({ f }: { f: FriendM }) {
  const mv = f.move;
  const color = mv && mv > 0 ? "var(--junT)" : mv && mv < 0 ? "var(--embT)" : "var(--mut)";
  const text = mv == null || mv === 0 ? "–" : (mv > 0 ? "▲" : "▼") + Math.abs(mv);
  const label = mv == null || mv === 0 ? "No change" : mv > 0 ? `Up ${mv}` : `Down ${-mv}`;
  return (
    <div className="text-[11px] leading-none font-semibold" style={{ color }} aria-label={label}>
      {text}
    </div>
  );
}
