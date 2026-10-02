import raw from "@/data/league.json";
import type { Castaway, Friend, LeagueData, ScoringEvent } from "./types";

export const data = raw as LeagueData;

/** Finale placement rule ids; must match scripts/league-checks.mjs. */
const WINNER_RULE = "winner";
const FINALE_RULE_IDS = ["place-3rd", "place-2nd", WINNER_RULE];

/** Prefixes a public file path with the site's base path (set when hosted under a subfolder). */
export const asset = (path: string) => (process.env.NEXT_PUBLIC_BASE_PATH || "") + path;

export type CastawayM = Castaway & {
  events: Record<number, ScoringEvent[]>;
  epPts: Record<number, number>;
  total: number;
  mvp: boolean;
  round: number;
  initials: string;
};

export type FriendM = Friend & {
  cast: CastawayM[];
  epPts: Record<number, number>;
  total: number;
  rank: number;
  tied: boolean;
  /** Places gained since the previous episode; null when there is no prior week to compare. */
  move: number | null;
};

const initials = (short: string) => {
  const parts = short.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : short.slice(0, 2)).toUpperCase();
};

/** Competition ranking (1,2,3,4,4,6,7); ties keep draft order for display. */
function rankBy(friends: FriendM[], score: (f: FriendM) => number) {
  const sorted = [...friends].sort((a, b) => score(b) - score(a) || a.draftOrder - b.draftOrder);
  const rank: Record<string, number> = {};
  sorted.forEach((f, i) => {
    rank[f.id] = i > 0 && score(sorted[i - 1]) === score(f) ? rank[sorted[i - 1].id] : i + 1;
  });
  return { sorted, rank };
}

export function buildModel(d: LeagueData = data) {
  const posted = [...d.league.postedEpisodes].sort((a, b) => a - b);
  const lastEp = posted[posted.length - 1];
  const pendingEp = d.league.pendingEpisode;

  const eventsByEp: Record<number, ScoringEvent[]> = {};
  d.episodes.forEach((e) => (eventsByEp[e.number] = e.events));

  const cast: CastawayM[] = d.castaways.map((c) => {
    const events: Record<number, ScoringEvent[]> = {};
    const epPts: Record<number, number> = {};
    posted.forEach((e) => {
      events[e] = (eventsByEp[e] || []).filter((x) => x.castawayId === c.id);
      epPts[e] = events[e].reduce((s, x) => s + x.points, 0);
    });
    return {
      ...c,
      events,
      epPts,
      total: posted.reduce((s, e) => s + epPts[e], 0),
      mvp: c.pick <= d.friends.length,
      round: Math.ceil(c.pick / d.friends.length),
      initials: initials(c.short),
    };
  });
  const castById = Object.fromEntries(cast.map((c) => [c.id, c]));

  const friends: FriendM[] = [...d.friends]
    .sort((a, b) => a.draftOrder - b.draftOrder)
    .map((f) => {
      const fc = cast.filter((c) => c.draftedBy === f.id).sort((a, b) => a.pick - b.pick);
      const epPts: Record<number, number> = {};
      posted.forEach((e) => {
        // League rule: +MVP bonus when the friend's MVP (first pick) wins the season.
        const mvpWon = fc.some((c) => c.mvp && c.events[e].some((x) => x.ruleId === WINNER_RULE));
        epPts[e] = fc.reduce((s, c) => s + c.epPts[e], 0) + (mvpWon ? d.rules.finale.mvpBonus : 0);
      });
      const total = posted.reduce((s, e) => s + epPts[e], 0);
      return { ...f, cast: fc, epPts, total, rank: 0, tied: false, move: null };
    });

  const cur = rankBy(friends, (f) => f.total);
  const prevTotal = (f: FriendM) => posted.slice(0, -1).reduce((s, e) => s + f.epPts[e], 0);
  const hasPrev = friends.some((f) => prevTotal(f) > 0);
  const prev = rankBy(friends, prevTotal);
  friends.forEach((f) => {
    f.rank = cur.rank[f.id];
    f.tied = friends.filter((g) => g.total === f.total).length > 1;
    f.move = hasPrev ? prev.rank[f.id] - f.rank : null;
  });
  const byId = Object.fromEntries(friends.map((f) => [f.id, f]));

  // Highlights for the latest posted episode.
  const topFriend = [...friends].sort((a, b) => b.epPts[lastEp] - a.epPts[lastEp] || a.draftOrder - b.draftOrder)[0];
  const topCast = [...cast].sort((a, b) => b.epPts[lastEp] - a.epPts[lastEp] || a.pick - b.pick)[0];
  const candidates = cast.flatMap((c) => c.events[lastEp].map((ev) => ({ c, ev })));
  // Prefer a castaway other than the top castaway so the strip shows a different story.
  candidates.sort((a, b) => b.ev.points - a.ev.points || Number(a.c.id === topCast.id) - Number(b.c.id === topCast.id));
  const bigEvent = candidates[0] ?? null;

  const ruleIndex: Record<string, { label: string; points: number }> = {
    [d.rules.survival.id]: { label: "Survive the week", points: d.rules.survival.preMerge },
  };
  d.rules.tiers.forEach((t) => t.rules.forEach((r) => (ruleIndex[r.id] = { label: r.label, points: t.points })));
  FINALE_RULE_IDS.forEach((id) => (ruleIndex[id] = { label: "Finale", points: 0 }));

  return {
    data: d,
    posted,
    lastEp,
    pendingEp,
    cast,
    castById,
    friends,
    byId,
    sorted: cur.sorted,
    highlights: { topFriend, topCast, bigEvent },
    ruleIndex,
  };
}

export type Model = ReturnType<typeof buildModel>;

/** Where an event chip deep-links in the Rules sheet: the rule itself, else its tier header. */
export function ruleTarget(m: Model, ev: ScoringEvent) {
  if (FINALE_RULE_IDS.includes(ev.ruleId)) return "finale";
  if (m.ruleIndex[ev.ruleId]) return ev.ruleId;
  return "tier-" + (ev.points >= 15 ? 15 : ev.points >= 10 ? 10 : 5);
}

export const tierColor = (p: number) =>
  p >= 15 ? "var(--junT)" : p >= 10 ? "var(--embT)" : p >= 5 ? "var(--ambT)" : "var(--mut)";

export const friendColor = (hue: number) => `oklch(0.76 0.13 ${hue})`;
export const friendLine = (hue: number, dark: boolean) => (dark ? `oklch(0.76 0.13 ${hue})` : `oklch(0.55 0.15 ${hue})`);

export const TRIBES = {
  Toka: { bg: "#e3b02a", ink: "#1d1405" },
  Savu: { bg: "#7c55c7", ink: "#ffffff" },
} as const;
