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

## Weekly update (Thursdays)

1. Open the new "EPISODE N POINTS" image on the [Fantasy Tribe page](https://www.globaltv.com/survivor-51-fantasy-tribe/#results).
2. In `data/league.json`, add an entry to `episodes`:
   - `number`, `sourceImage`
   - `statedTotals`: each castaway's total as printed on the image
   - `events`: one row per breakdown line (`castawayId`, `ruleId`, `label`, `points`). `ruleId` must match a rule in `rules` (use `survived` for "Survived the Week").
3. Add `N` to `league.postedEpisodes`, update `league.updatedLabel`, and set `votedOutEp` on anyone voted out.
4. Set `league.pendingEpisode` to the next episode number between airing and results (shows the "not posted yet" banner), and back to `null` once scored.
5. Run `npm run validate`. It fails if events don't add up to Global TV's totals, a castaway or rule is unknown, points don't match a rule, or someone still in the game is missing.

After the merge, set `league.merged` to `true`; survival then scores +3 (the validator accepts 1 or 3).

## Deploy

Live at **https://mosotomay.github.io/survivor51-dashboard/**.

Every push to `main` runs `.github/workflows/deploy.yml`, which validates the data, builds, and publishes to GitHub Pages (about 1 minute). If validation fails, the deploy stops and the previous version stays live. Check runs under the repo's **Actions** tab.

The workflow sets `NEXT_PUBLIC_BASE_PATH` (the `/survivor51-dashboard` subfolder) and `NEXT_PUBLIC_SITE_URL`; local `npm run dev` needs neither.

## Not built yet

The automatic Thursday updater (scheduled job that reads the results image with Claude's vision API and writes `league.json`) is the next phase. `scripts/validate-league.mjs` is already the check it will run before publishing.
