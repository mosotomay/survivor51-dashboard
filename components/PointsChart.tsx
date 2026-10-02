"use client";

import { useEffect, useRef, useState } from "react";
import { friendLine } from "@/lib/model";
import { useLeague } from "./LeagueApp";

const H = 240, L = 30, R = 92, T = 14, B = 30;

export default function PointsChart() {
  const { m, dark } = useLeague();
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(520);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = Math.max(280, Math.round(w));
  const pending = m.pendingEp != null;
  const all = pending ? [...m.posted, m.pendingEp as number] : m.posted;
  const xs = (e: number) => L + (all.indexOf(e) * (W - L - R)) / Math.max(1, all.length - 1);
  const max = Math.max(...m.friends.map((f) => f.total));
  const maxV = Math.max(10, Math.ceil(max / 10) * 10);
  const step = maxV <= 60 ? 10 : 20;
  const y = (v: number) => T + (1 - v / maxV) * (H - T - B);

  const grid: number[] = [];
  for (let v = 0; v <= maxV; v += step) grid.push(v);

  const lines = [...m.sorted].reverse().map((f) => {
    let cum = 0;
    const pts = m.posted.map((e) => {
      cum += f.epPts[e];
      return [xs(e), y(cum)] as const;
    });
    return { f, pts, col: friendLine(f.hue, dark) };
  });

  // Direct labels at the line ends, pushed apart to a 14px minimum gap.
  const labels = lines.map((l) => ({ f: l.f, col: l.col, y: y(l.f.total) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
  const over = labels.length ? labels[labels.length - 1].y - (H - B) : 0;
  if (over > 0) labels.forEach((l) => (l.y -= over));

  const summary = m.sorted.map((f) => `${f.name} ${f.total}`).join(", ");

  return (
    <div ref={ref} className="min-h-[240px] w-full">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Cumulative points by episode through Episode ${m.lastEp}: ${summary}.`}
        className="block overflow-visible"
      >
        {grid.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" style={{ fill: "var(--mut)", font: "500 11px var(--font-dm)" }}>
              {v}
            </text>
          </g>
        ))}
        {all.map((e) => (
          <text
            key={e}
            x={xs(e)}
            y={H - 8}
            textAnchor="middle"
            style={{ fill: "var(--mut)", font: "600 12px var(--font-barlow)", letterSpacing: "0.06em" }}
          >
            EP {e}
          </text>
        ))}
        {pending && (
          <>
            <line
              x1={xs(m.pendingEp as number)}
              x2={xs(m.pendingEp as number)}
              y1={T}
              y2={H - B}
              stroke="var(--ambT)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <text
              x={xs(m.pendingEp as number) - 6}
              y={T + 10}
              textAnchor="end"
              style={{ fill: "var(--ambT)", font: "600 11px var(--font-dm)" }}
            >
              Pending
            </text>
          </>
        )}
        {lines.map(({ f, pts, col }) => (
          <g key={f.id}>
            <polyline
              points={pts.map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke={col}
              strokeWidth={f.rank === 1 ? 3.5 : 2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4.5 : 3} fill={col} stroke="var(--s1)" strokeWidth={2} />
            ))}
          </g>
        ))}
        {labels.map((l) => (
          <text
            key={l.f.id}
            x={xs(m.lastEp) + 10}
            y={l.y + 4}
            style={{ fill: l.col, font: "700 13px var(--font-barlow)", letterSpacing: "0.03em" }}
          >
            {l.f.name.toUpperCase()} {l.f.total}
          </text>
        ))}
      </svg>
    </div>
  );
}
