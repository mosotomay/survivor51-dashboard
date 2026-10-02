// Checks data/league.json before every build. Exits non-zero on any problem so a bad
// weekly update never reaches the live site.
import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync(new URL("../data/league.json", import.meta.url), "utf8"));
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

const rulePoints = { [d.rules.survival.id]: [d.rules.survival.preMerge, d.rules.survival.postMerge] };
d.rules.tiers.forEach((t) => t.rules.forEach((r) => (rulePoints[r.id] = [t.points])));

const posted = new Set(d.league.postedEpisodes);
for (const e of posted) if (!d.episodes.some((x) => x.number === e)) err(`Posted episode ${e} has no entry in "episodes"`);

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

if (errors.length) {
  console.error(`league.json has ${errors.length} problem(s):\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`league.json OK: ${d.friends.length} friends, ${d.castaways.length} castaways, episodes ${[...posted].join(", ")}`);
