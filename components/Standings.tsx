"use client";

import type { CastawayM, FriendM } from "@/lib/model";
import { asset, ruleTarget, TRIBES } from "@/lib/model";
import { useLeague } from "./LeagueApp";
import PointsChart from "./PointsChart";
import { CastAvatar, EventChip, FriendAvatar, PageHead, XMark } from "./ui";

const ROW = "grid grid-cols-[28px_60px_minmax(0,1fr)_46px] items-center gap-2 px-3.5";
const HEAD = "disp text-[12px] leading-none font-semibold tracking-[0.1em] text-mut";
const SEP = "1px solid var(--row-line)";
const OUT_RING = "#5a5248";

const rankLabel = (f: FriendM) => (f.tied ? "T" : "") + f.rank;
/** "Thien An Nguyen" -> "Thien An"; single names stay as they are. */
const firstName = (short: string) => {
  const parts = short.split(" ");
  return parts.length > 1 ? parts.slice(0, -1).join(" ") : short;
};

export default function Standings() {
  const { m, openTeam, openCast, openRule } = useLeague();
  const { topFriend, topCast, bigEvent } = m.highlights;

  return (
    <div className="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr))]">
      <section aria-labelledby="standings-h" className="flex flex-col gap-3.5">
        <div id="standings-h">
          <PageHead title="Standings" aside={`After Episode ${m.lastEp}`} />
        </div>

        <div className="-mx-4 wide:mx-auto wide:w-full wide:max-w-[720px]">
          <div className={`${ROW} py-2.5`} style={{ borderBottom: SEP }}>
            <div className={HEAD}>#</div>
            <div className={`${HEAD} text-center`}>Player</div>
            <div className={`${HEAD} text-center`}>Team</div>
            <div className={`${HEAD} text-right`}>Pts</div>
          </div>
          {m.sorted.map((f) => {
            const one = f.rank === 1;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => openTeam(f.id)}
                aria-label={`Rank ${rankLabel(f)}: ${f.name}, ${f.total} points. Open team`}
                className={`${ROW} w-full cursor-pointer border-0 py-2 text-left text-ink`}
                style={{
                  borderBottom: SEP,
                  background: one ? "linear-gradient(90deg,rgba(245,173,58,0.14),rgba(245,173,58,0.02))" : "transparent",
                }}
              >
                <div className="flex flex-col gap-1">
                  <div className="num text-[17px] leading-none font-semibold" style={{ color: one ? "var(--ambT)" : undefined }}>
                    {rankLabel(f)}
                  </div>
                  <Move f={f} />
                </div>
                <div className="flex min-w-0 flex-col items-center gap-1.5">
                  <FriendAvatar f={f} size={42} font={20} />
                  <div className="disp w-full truncate text-center text-[13px] leading-none font-bold">{f.name}</div>
                </div>
                <div className="grid min-w-0 grid-cols-3 gap-0.5">
                  {f.cast.map((c) => (
                    <TeamCast key={c.id} c={c} />
                  ))}
                </div>
                <div className="num text-right text-[22px] leading-none font-semibold">{f.total}</div>
              </button>
            );
          })}
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
          <button
            type="button"
            onClick={() => openTeam(topFriend.id)}
            aria-label={`Top player: ${topFriend.name}, +${topFriend.epPts[m.lastEp]}. Open team`}
            className="flex shrink-0 grow basis-[190px] cursor-pointer snap-start flex-col gap-2.5 rounded-2xl border border-line p-3.5 text-left text-ink"
            style={{ background: "linear-gradient(160deg,var(--firesoft),var(--s1) 65%)" }}
          >
            <div className="disp text-[12px] leading-none font-bold tracking-[0.1em] text-amb">Top player</div>
            <div className="flex items-center gap-2.5">
              <FriendAvatar f={topFriend} size={38} font={19} />
              <div className="disp text-[22px] leading-none font-bold">{topFriend.name}</div>
            </div>
            <div className="num text-[31px] leading-none font-bold">+{topFriend.epPts[m.lastEp]}</div>
          </button>

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
            <div className="num text-[31px] leading-none font-bold">+{topCast.epPts[m.lastEp]}</div>
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

/** Change in place since the previous episode: +5 / −1 / ±0; nothing before there is a prior week. */
function Move({ f }: { f: FriendM }) {
  const mv = f.move;
  if (mv == null) return null;
  const color = mv > 0 ? "var(--junT)" : mv < 0 ? "var(--embT)" : "var(--mut)";
  const text = mv > 0 ? `+${mv}` : mv < 0 ? `\u2212${-mv}` : "\u00b10";
  const label = mv > 0 ? `Up ${mv}` : mv < 0 ? `Down ${-mv}` : "No change";
  return (
    <div className="num text-[11px] leading-none font-semibold" style={{ color }} aria-label={label}>
      {text}
    </div>
  );
}

/** 36px castaway photo ringed in tribe colour, first name below; greyed with a red X once voted out. */
function TeamCast({ c }: { c: CastawayM }) {
  const out = !!c.votedOutEp;
  const t = TRIBES[c.tribe];
  return (
    <div className="flex min-w-0 flex-col items-center gap-[5px]">
      <div className="relative size-9 rounded-full" style={{ boxShadow: `0 0 0 2px ${out ? OUT_RING : t.bg}` }}>
        <div
          className="disp flex size-9 items-center justify-center overflow-hidden rounded-full text-[13px] leading-none font-bold"
          style={{ background: t.bg, color: t.ink, opacity: out ? 0.45 : 1 }}
        >
          {c.initials}
          {c.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset(c.photoUrl)} alt="" loading="lazy" className="absolute inset-0 size-full rounded-full object-cover" />
          )}
        </div>
        {out && <XMark thickness={2} />}
      </div>
      <div className="w-full truncate text-center text-[11px] leading-none font-medium" style={{ color: out ? "#8a7f70" : undefined }}>
        {firstName(c.short)}
      </div>
    </div>
  );
}
