"use client";

import { useLeague } from "./LeagueApp";
import { CastAvatar, FriendAvatar, PageHead } from "./ui";

export default function Draft() {
  const { m, openCast, openTeam } = useLeague();
  const n = m.friends.length;
  const rounds = Array.from({ length: Math.max(...m.cast.map((c) => c.round)) }, (_, i) => i + 1);
  const cols = `76px repeat(${n},minmax(112px,1fr))`;

  return (
    <>
      <div className="mb-1.5">
        <PageHead title="Draft board" aside="Snake draft · 3 rounds · Round 1 = MVPs" />
      </div>
      <div className="mb-3.5 text-[12.5px] text-mut">Columns in draft order. Swipe sideways on mobile.</div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1.5">
        <div className="flex min-w-[900px] flex-col gap-2">
          <div className="grid gap-2" style={{ gridTemplateColumns: cols }}>
            <div />
            {m.friends.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => openTeam(f.id)}
                aria-label={`${f.name}. Open team`}
                className="flex cursor-pointer items-center gap-2 border-0 bg-transparent px-0.5 py-1 text-left text-ink"
              >
                <FriendAvatar f={f} size={24} font={13} />
                <span className="disp text-[17px] leading-none font-bold">{f.name}</span>
              </button>
            ))}
          </div>
          {rounds.map((r) => (
            <div key={r} className="grid gap-2" style={{ gridTemplateColumns: cols }}>
              <div className="flex flex-col justify-center gap-1">
                <div className="disp text-[20px] leading-none font-extrabold">Round {r}</div>
                <div className="text-[12px] font-semibold" style={{ color: r === 1 ? "var(--ambT)" : "var(--mut)" }}>
                  {r === 1 ? "MVPs" : `Picks ${(r - 1) * n + 1}–${r * n}`}
                </div>
                <div aria-hidden className="text-[18px] leading-none font-bold text-mut">
                  {r % 2 ? "→" : "←"}
                </div>
              </div>
              {m.friends.map((f) => {
                const c = f.cast[r - 1];
                if (!c) return <div key={f.id} />;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => openCast(c.id)}
                    aria-label={`Pick ${c.pick}: ${c.name} by ${f.name}, ${c.total} points${c.mvp ? ", MVP" : ""}${c.votedOutEp ? ", voted out" : ""}`}
                    className="relative flex cursor-pointer flex-col items-center gap-[7px] rounded-2xl border px-2 pt-2.5 pb-3 text-center text-ink"
                    style={{
                      borderColor: r === 1 ? "rgba(245,165,36,0.45)" : "var(--line)",
                      background: r === 1 ? "linear-gradient(180deg,var(--firesoft),var(--s1))" : "var(--s1)",
                    }}
                  >
                    <div className="num absolute top-[9px] left-[9px] text-[11px] leading-none font-bold text-mut">
                      #{c.pick}
                    </div>
                    <div className="mt-2">
                      <CastAvatar c={c} size={52} font={19} x={4} mvp={c.mvp} />
                    </div>
                    <div className="min-h-[31px] text-[13px] leading-[1.2] font-semibold">{c.short}</div>
                    <div className="num text-[19px] leading-none font-semibold">{c.total}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
