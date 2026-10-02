# Survivor 51 Fantasy League

Static Next.js site for our 7-friend league: Standings, Teams, Weekly, Draft board and Rules. Built from the Claude Design handoff in `../design_handoff_survivor51_league`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # validates data/league.json, then writes the static site to out/
```

## Where things live

| Path | What |
| --- | --- |
| `data/league.json` | All league data: friends, castaways, rules, and scoring events per episode |
| `public/headshots/` | Official cast headshots (one `<castaway id>.jpg` each) |
| `lib/model.ts` | Derives totals, ranks with ties, movement, highlights |
| `components/` | One file per screen plus the two sheets |
| `scripts/validate-league.mjs` | Data checks that run before every build |

## Weekly update (automatic)

`.github/workflows/update-scores.yml` runs `scripts/update-scores.mjs` on a schedule (Eastern time):

| When | What happens |
| --- | --- |
| Thu ~9 am | Marks the next episode "results not posted yet" (banner on the site) |
| Thu 5 pm to Fri noon, every 2 hours | Checks the [Fantasy Tribe page](https://www.globaltv.com/survivor-51-fantasy-tribe/#results) for a new "EPISODE N POINTS" image. If found: official totals come from the image's alt text, per-event breakdowns are read from the image by Claude, eliminations are recorded, everything is validated, committed, and the site redeploys |
| Fri 11 am | If results still haven't appeared, the run fails and GitHub emails the repo owner |

Nothing is published unless every castaway's events add up exactly to Global TV's totals and every name and rule is recognized. Any failure leaves last week's data live and triggers GitHub's failed-workflow email.

**Setup:** the repo needs an `ANTHROPIC_API_KEY` secret (Settings → Secrets and variables → Actions). Each scored episode costs roughly $0.20–0.50 in API usage (Claude Opus 5.5); runs that find nothing new make no API call. Run it on demand from the **Actions** tab → **Update scores** → **Run workflow**.

**Fixing data by hand:** edit `data/league.json` and push. `npm run validate` runs the same checks locally. If a name isn't recognized, add it as the castaway's `resultsName`. To re-read an episode image locally: `ANTHROPIC_API_KEY=... node scripts/update-scores.mjs --dry-run --episode 3 --image <image URL>`.

After the merge, set `league.merged` to `true`; survival then scores +3. Finale placements (`place-3rd`, `place-2nd`, `winner`) are scored on the castaway, and the +30 MVP bonus is added automatically to whoever drafted the winner first.

## Deploy

Live at **https://mosotomay.github.io/survivor51-dashboard/**.

Every push to `main` runs `.github/workflows/deploy.yml`, which validates the data, builds, and publishes to GitHub Pages (about 1 minute). If validation fails, the deploy stops and the previous version stays live. Check runs under the repo's **Actions** tab.

The workflow sets `NEXT_PUBLIC_BASE_PATH` (the `/survivor51-dashboard` subfolder) and `NEXT_PUBLIC_SITE_URL`; local `npm run dev` needs neither.
