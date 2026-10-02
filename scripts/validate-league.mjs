// Checks data/league.json before every build. Exits non-zero on any problem so a bad
// weekly update never reaches the live site.
import { readFileSync } from "node:fs";
import { validateLeague } from "./league-checks.mjs";

const d = JSON.parse(readFileSync(new URL("../data/league.json", import.meta.url), "utf8"));
const errors = validateLeague(d);

if (errors.length) {
  console.error(`league.json has ${errors.length} problem(s):\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`league.json OK: ${d.friends.length} friends, ${d.castaways.length} castaways, episodes ${d.league.postedEpisodes.join(", ")}`);
