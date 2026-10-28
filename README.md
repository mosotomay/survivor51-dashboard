# Survivor 51 Fantasy League

Scoreboard for our 7-friend Survivor 51 fantasy league. Standings, Teams, Weekly, Draft board and Rules, rebuilt every week when the official scores drop.

**Live at https://mosotomay.github.io/survivor51-dashboard/**

## How the league works

- Each friend drafted 3 castaways. Your first pick is your **MVP**.
- Castaways earn points every episode: +1 for surviving the week (+3 after the merge), plus +5, +10 and +15 events like winning immunity, finding an idol or getting blindsided.
- Each event counts once per castaway per week.
- Finale: +10 for 3rd, +20 for 2nd, +30 for the winner, and **+30 more** if the winner is your MVP.
- No merge picks or swaps; teams stay at 3 castaways.
- No tiebreakers; tied friends share a rank.

The full scoring list is in the app under **Rules**, along with how many times each event has happened this season.

## What's in the app

| Tab | What you'll see |
| --- | --- |
| Standings | Rank, total and week-over-week movement. 👑 for first, 💩 for last |
| Teams | Each friend's 3 castaways, their tribe and points |
| Weekly | Points per episode for everyone (scrolls to the latest week on phones), and every scoring event per episode |
| Draft | The draft board |
| Rules | Scoring rules, event counts, the stakes and league decisions |

## The stakes

💩 **Lowest scorer** dresses up in a costume for a night out with the crew.

👑 **League winner** picks the costume.

---

## For maintainers

### Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # validates data/league.json, then writes the static site to out/
```

### Where things live

| Path | What |
| --- | --- |
| `data/league.json` | All league data: friends, castaways, rules, stakes, decisions and scoring events per episode |
| `public/headshots/` | Official cast headshots (one `<castaway id>.jpg` each) |
| `lib/model.ts` | Derives totals, ranks with ties, movement, highlights |
| `components/` | One file per screen plus the two sheets |
| `scripts/validate-league.mjs` | Data checks that run before every build |

### Weekly update (automatic)

A scheduled **Claude routine** (claude.ai/code/routines) runs every Friday evening:

1. `node scripts/update-scores.mjs --list` finds new "EPISODE N POINTS" results on the [Fantasy Tribe page](https://www.globaltv.com/survivor-51-fantasy-tribe/#results) and prints each castaway's official total (from the image's alt text).
2. `--slices N` cuts the tall results image into readable sections; Claude reads every breakdown line and writes them to a JSON file.
3. `EXTRACTION_FILE=<file> node scripts/update-scores.mjs --episode N` merges the episode only if every castaway's events add up exactly to the official totals and every name and rule is recognized. Eliminations are recorded.
4. The routine commits `data/league.json` and pushes; the push redeploys the site.

If anything doesn't check out, nothing is committed and the site keeps last week's data; the routine's run log says why.

**Fixing data by hand:** edit `data/league.json` and push. `npm run validate` runs the same checks locally. If a name isn't recognized, add it as the castaway's `resultsName`. With an `ANTHROPIC_API_KEY` set, `node scripts/update-scores.mjs` can also read an image through the Claude API itself.

After the merge, set `league.merged` to `true`; survival then scores +3. Finale placements (`place-3rd`, `place-2nd`, `winner`) are scored on the castaway, and the +30 MVP bonus is added automatically to whoever drafted the winner first.

To change the stakes or league decisions, edit `league.stakes` and `league.decisions` in `data/league.json`.

### Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which validates the data, builds, and publishes to GitHub Pages (about 1 minute). If validation fails, the deploy stops and the previous version stays live. Check runs under the repo's **Actions** tab.

The workflow sets `NEXT_PUBLIC_BASE_PATH` (the `/survivor51-dashboard` subfolder) and `NEXT_PUBLIC_SITE_URL`; local `npm run dev` needs neither.
