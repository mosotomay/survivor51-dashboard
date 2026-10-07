export type Tribe = "Toka" | "Savu";

export type Friend = { id: string; name: string; hue: number; draftOrder: number; photoUrl?: string; photoLargeUrl?: string };

export type Castaway = {
  id: string;
  name: string;
  short: string;
  resultsName: string;
  tribe: Tribe;
  age?: number;
  occupation: string;
  pick: number;
  draftedBy: string;
  votedOutEp?: number;
  photoUrl?: string;
};

export type ScoringEvent = { castawayId: string; ruleId: string; label: string; points: number };

export type Episode = {
  number: number;
  note?: string;
  sourceImage?: string;
  /** Per-castaway totals as printed by Global TV; the validator checks events sum to these. */
  statedTotals?: Record<string, number>;
  events: ScoringEvent[];
};

export type Rule = { id: string; label: string };

export type Rules = {
  survival: { id: string; preMerge: number; postMerge: number };
  tiers: { points: number; rules: Rule[] }[];
  finale: { third: number; second: number; winner: number; mvpBonus: number };
};

export type LeagueData = {
  league: {
    name: string;
    updatedLabel: string;
    postedEpisodes: number[];
    pendingEpisode: number | null;
    merged: boolean;
    decisions: string[];
  };
  friends: Friend[];
  castaways: Castaway[];
  rules: Rules;
  episodes: Episode[];
};
