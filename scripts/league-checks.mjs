// Shared data checks for data/league.json, used by the build-time validator and the
// Thursday updater. Returns a list of problems; an empty list means the data is safe to publish.

/** Finale placements, scored on the castaway who placed. Ids are fixed; points come from rules.finale. */
export const FINALE_RULES = [
  { id: "place-3rd", key: "third", label: "Finished 3rd" },
  { id: "place-2nd", key: "second", label: "Finished 2nd" },
  { id: "winner", key: "winner", label: "Won the season" },
];

/** ruleId -> allowed point values. */
export function rulePointsIndex(d) {
  const idx = { [d.rules.survival.id]: [d.rules.survival.preMerge, d.rules.survival.postMerge] };
  d.rules.tiers.forEach((t) => t.rules.forEach((r) => (idx[r.id] = [t.points])));
  FINALE_RULES.forEach((r) => (idx[r.id] = [d.rules.finale[r.key]]));
  return idx;
}

export function validateLeague(d) {
  const errors = [];
  const err = (m) => errors.push(m);

  const friendIds = new Set(d.friends.map((f) => f.id));
  if (friendIds.size !== d.friends.length) err("Duplicate friend ids");

  const cast = Object.fromEntries(d.castaways.map((c) => [c.id, c]));
  if (Object.keys(cast).length !== d.castaways.length) err("Duplicate castaway ids");

  const picks = d.castaways.map((c) => c.pick).sort((a, b) => a - b);
  picks.forEach((p, i) => p !== i + 1 && err(`Picks must run 1..${picks.length} with no gaps (found ${p} at position ${i + 1})`));

  for (const c of d.castaways) {
    if (!friendIds.has(c.draftedBy)) err(`${c.id}: drafted by unknown friend "${c.draftedBy}"`);
    if (!["Toka", "Savu"].includes(c.tribe)) err(`${c.id}: unknown tribe "${c.tribe}"`);
  }
  const perFriend = d.friends.map((f) => d.castaways.filter((c) => c.draftedBy === f.id).length);
  if (new Set(perFriend).size > 1) err(`Friends have different team sizes: ${perFriend.join(", ")}`);

  const rulePoints = rulePointsIndex(d);

  const posted = new Set(d.league.postedEpisodes);
  for (const e of posted) if (!d.episodes.some((x) => x.number === e)) err(`Posted episode ${e} has no entry in "episodes"`);
  if (d.league.pendingEpisode != null && posted.has(d.league.pendingEpisode))
    err(`pendingEpisode ${d.league.pendingEpisode} is already posted`);

  for (const ep of d.episodes) {
    const sums = {};
    for (const ev of ep.events) {
      const where = `Ep ${ep.number} ${ev.castawayId} "${ev.label}"`;
      const c = cast[ev.castawayId];
      if (!c) {
        err(`${where}: unknown castaway (check resultsName aliases)`);
        continue;
      }
      if (!rulePoints[ev.ruleId]) err(`${where}: unknown ruleId "${ev.ruleId}"`);
      else if (!rulePoints[ev.ruleId].includes(ev.points)) err(`${where}: ${ev.points} pts does not match rule "${ev.ruleId}"`);
      if (c.votedOutEp && ep.number > c.votedOutEp) err(`${where}: castaway was voted out in Ep ${c.votedOutEp}`);
      sums[c.id] = (sums[c.id] ?? 0) + ev.points;
    }
    if (ep.statedTotals) {
      for (const [id, total] of Object.entries(ep.statedTotals)) {
        if (!cast[id]) err(`Ep ${ep.number} statedTotals: unknown castaway "${id}"`);
        if ((sums[id] ?? 0) !== total) err(`Ep ${ep.number} ${id}: events sum to ${sums[id] ?? 0} but Global TV says ${total}`);
      }
      for (const id of Object.keys(sums))
        if (!(id in ep.statedTotals)) err(`Ep ${ep.number} ${id}: has events but no stated total`);
      for (const c of d.castaways)
        if (!(c.id in ep.statedTotals) && !(c.votedOutEp && c.votedOutEp < ep.number))
          err(`Ep ${ep.number} ${c.id}: still in the game but missing from the results`);
    }
  }
  return errors;
}
