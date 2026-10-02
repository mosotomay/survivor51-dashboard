// Weekly score updater, run by a scheduled Claude routine every Friday.
//
// 1. Reads Global TV's Fantasy Tribe page and finds "EPISODE N POINTS" results not yet in
//    data/league.json. Each castaway's official total comes from the image's alt text.
// 2. The per-event breakdown is read from the results image, either by the routine's Claude
//    session (it writes the reading to a JSON file passed as EXTRACTION_FILE) or, if
//    ANTHROPIC_API_KEY is set instead, by a Claude API call made here.
// 3. Merges the episode into league.json only if every check passes (events add up to the
//    official totals, every name and rule is known). Otherwise it exits non-zero and writes
//    nothing, so the live site keeps last week's data.
//
// Usage:
//   --list                 print new episodes (image URL + official totals), the rule catalog and
//                          the extraction format, then exit
//   --slices N             save episode N's image as overlapping slices in /tmp/survivor51/ for
//                          viewing (rows near slice edges appear twice)
//   --episode N            only process episode N
//   --dry-run              print the merged episode, don't write league.json
//   --recheck N            re-read already-posted episode N and compare with the stored data
//   --image U              with --episode N: read a specific image (URL or local path)
// Env: EXTRACTION_FILE (a reading in the --list format) or ANTHROPIC_API_KEY

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { FINALE_RULES, validateLeague } from "./league-checks.mjs";

const PAGE_URL = "https://www.globaltv.com/survivor-51-fantasy-tribe/";
const DATA_PATH = new URL("../data/league.json", import.meta.url);
const TZ = "America/Toronto";
const UA = "Mozilla/5.0 (survivor51-dashboard updater; +https://github.com/mosotomay/survivor51-dashboard)";
const MODEL = "claude-opus-5-5";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const RECHECK = flag("--recheck") ? Number(flag("--recheck")) : null;
const DRY_RUN = args.includes("--dry-run") || RECHECK != null;
const NOW = new Date();

function easternParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric", hour: "numeric", hourCycle: "h23" })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { weekday: parts.weekday, month: parts.month, day: parts.day, hour: Number(parts.hour) };
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "’").replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#039;/g, "'");

/** Finds every "EPISODE N POINTS" heading and the first image after it. */
export function findResults(html) {
  const out = [];
  const heads = [...html.matchAll(/EPISODE\s+(\d+)\s+POINTS/gi)];
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].index : html.length;
    const block = html.slice(h.index, end);
    const img = block.match(/<img\b[^>]*>/i);
    if (!img) return;
    const attr = (n) => img[0].match(new RegExp(`\\s${n}="([^"]*)"`, "i"))?.[1];
    let src = attr("src") || attr("data-src");
    if (!src) return;
    src = decode(src).replace(/-\d+x\d+(\.\w+)$/, "$1"); // full-size original, not a thumbnail
    const totals = {};
    for (const m of decode(attr("alt") ?? "").matchAll(/([^;:]+?)\s+total points:\s*(\d+)/gi)) totals[m[1].trim()] = Number(m[2]);
    out.push({ episode: Number(h[1]), image: src, altTotals: totals });
  });
  return out;
}

const norm = (s) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

/** Name (as printed by Global TV) -> castaway id. */
function nameIndex(d) {
  const idx = new Map();
  for (const c of d.castaways) {
    const nick = c.name.match(/[“"]([^”"]+)[”"]/)?.[1];
    for (const n of [c.resultsName, c.short, c.name, c.short.split(" ")[0], nick]) if (n) idx.set(norm(n), c.id);
  }
  return idx;
}

async function loadImage(src) {
  if (/^https?:/.test(src)) {
    const r = await fetch(src, { headers: { "user-agent": UA } });
    if (!r.ok) throw new Error(`Image download failed (${r.status}): ${src}`);
    return Buffer.from(await r.arrayBuffer());
  }
  return readFileSync(src);
}

/** Splits the tall results image into overlapping slices so small text stays legible. */
async function sliceImage(buf) {
  const { default: sharp } = await import("sharp");
  const img = sharp(buf);
  const { width, height } = await img.metadata();
  const slice = 800, overlap = 120;
  const parts = [];
  for (let top = 0; top < height; top += slice - overlap) {
    const h = Math.min(slice, height - top);
    parts.push(await sharp(buf).extract({ left: 0, top, width, height: h }).jpeg({ quality: 90 }).toBuffer());
    if (top + h >= height) break;
  }
  return parts;
}

function ruleCatalog(d) {
  const lines = [`- ${d.rules.survival.id}: Survived the week (${d.rules.survival.preMerge} pre-merge / ${d.rules.survival.postMerge} post-merge)`];
  d.rules.tiers.forEach((t) => t.rules.forEach((r) => lines.push(`- ${r.id}: ${r.label} (${t.points})`)));
  FINALE_RULES.forEach((r) => lines.push(`- ${r.id}: ${r.label} (${d.rules.finale[r.key]})`));
  return lines.join("\n");
}

async function extractWithClaude(d, episode, imageBuf) {
  if (process.env.EXTRACTION_FILE) return JSON.parse(readFileSync(process.env.EXTRACTION_FILE, "utf8"));
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set EXTRACTION_FILE (a reading of the image) or ANTHROPIC_API_KEY");

  const ruleIds = [d.rules.survival.id, ...d.rules.tiers.flatMap((t) => t.rules.map((r) => r.id)), ...FINALE_RULES.map((r) => r.id)];
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["castaways"],
    properties: {
      castaways: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "total", "left_game", "events"],
          properties: {
            name: { type: "string", description: "Castaway name exactly as printed" },
            total: { type: "integer", description: "Episode total points as printed" },
            left_game: {
              type: "boolean",
              description: "True if this episode's breakdown shows they left the game (voted out, torch snuffed, medevac, quit)",
            },
            events: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "points", "rule_id"],
                properties: {
                  label: { type: "string", description: "Breakdown line text without the points, e.g. 'Won Group Reward'" },
                  points: { type: "integer" },
                  rule_id: { type: "string", enum: ruleIds },
                },
              },
            },
          },
        },
      },
    },
  };

  const slices = await sliceImage(imageBuf);
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: { type: "json_schema", schema } },
    system:
      "You transcribe Survivor fantasy league results images into structured data. Copy what is printed; never guess or invent lines. " +
      "Map each breakdown line to the closest rule id from the catalog, keeping the printed label and points.",
    messages: [
      {
        role: "user",
        content: [
          ...slices.map((s) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.toString("base64") } })),
          {
            type: "text",
            text:
              `These images are consecutive, overlapping slices (top to bottom) of one tall image: Global TV's Survivor 51 "Episode ${episode} points" results. ` +
              `Each castaway row shows a name, an episode total, and a "Points Breakdown" list of lines like "Won Group Reward +5". ` +
              `Rows near slice edges appear twice; list each castaway once. List every breakdown line for every castaway.\n\nRule catalog (id: meaning (points)):\n${ruleCatalog(d)}`,
          },
        ],
      },
    ],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error(`Claude declined the extraction (${msg.stop_details?.category ?? "no category"})`);
  if (msg.stop_reason === "max_tokens") throw new Error("Claude's extraction was cut off (max_tokens)");
  const text = msg.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Claude returned no text");
  return JSON.parse(text);
}

/** Turns the extraction into a league.json episode, plus who left the game. Throws on mismatches. */
function buildEpisode(d, found, extraction) {
  const names = nameIndex(d);
  const problems = [];
  const idFor = (n) => {
    const id = names.get(norm(n));
    if (!id) problems.push(`Unknown castaway name "${n}" (add it as resultsName in league.json)`);
    return id;
  };

  const statedTotals = {};
  for (const [n, t] of Object.entries(found.altTotals)) {
    const id = idFor(n);
    if (id) statedTotals[id] = t;
  }
  const events = [];
  const leftGame = [];
  const seen = new Set();
  for (const c of extraction.castaways) {
    const id = idFor(c.name);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (!(id in statedTotals)) statedTotals[id] = c.total; // alt text missing: fall back to printed total
    else if (statedTotals[id] !== c.total) problems.push(`${c.name}: image total ${c.total} vs page text ${statedTotals[id]}`);
    for (const ev of c.events) events.push({ castawayId: id, ruleId: ev.rule_id, label: ev.label.trim(), points: ev.points });
    if (c.left_game) leftGame.push(id);
  }
  for (const id of Object.keys(statedTotals)) if (!seen.has(id)) problems.push(`${id}: in the page totals but missing from the image`);
  if (problems.length) throw new Error("Extraction problems:\n- " + problems.join("\n- "));

  const order = new Map(d.castaways.map((c, i) => [c.id, i]));
  events.sort((a, b) => order.get(a.castawayId) - order.get(b.castawayId));
  return { episode: { number: found.episode, sourceImage: found.image, statedTotals, events }, leftGame };
}

function label(episode) {
  const p = easternParts(NOW);
  return `Updated through Episode ${episode} · ${p.weekday} ${p.month} ${p.day}`;
}

const EXTRACTION_FORMAT = `{
  "castaways": [
    {
      "name": "BRADY",              // as printed on the image
      "total": 36,                  // episode total as printed
      "left_game": false,           // true if this episode shows them leaving (voted out, torch snuffed, medevac, quit)
      "events": [
        { "label": "Won Group Reward", "points": 5, "rule_id": "group-win" }
      ]
    }
  ]
}`;

async function main() {
  const d = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const posted = new Set(d.league.postedEpisodes);
  const only = flag("--episode") ? Number(flag("--episode")) : null;

  let found;
  if (flag("--image")) {
    found = [{ episode: only, image: flag("--image"), altTotals: {} }];
  } else {
    const r = await fetch(PAGE_URL, { headers: { "user-agent": UA } });
    if (!r.ok) throw new Error(`Fantasy page fetch failed (${r.status})`);
    const all = findResults(await r.text());
    found = RECHECK != null ? all.filter((f) => f.episode === RECHECK) : all.filter((f) => !posted.has(f.episode));
    if (only != null) found = found.filter((f) => f.episode === only);
    found.sort((a, b) => a.episode - b.episode);
    if (RECHECK != null && !found.length) throw new Error(`Episode ${RECHECK} results not found on ${PAGE_URL}`);
  }

  if (args.includes("--list")) {
    if (!found.length) {
      console.log(`NO NEW RESULTS. league.json has episodes ${[...posted].join(", ")}; nothing newer on ${PAGE_URL}`);
      return;
    }
    console.log(`NEW RESULTS: ${found.map((f) => f.episode).join(", ")}\n`);
    for (const f of found) console.log(`Episode ${f.episode}\n  image: ${f.image}\n  official totals: ${JSON.stringify(f.altTotals)}\n`);
    console.log(`Rule catalog (rule_id: meaning (points)):\n${ruleCatalog(d)}\n`);
    console.log(`Write the reading of one episode image as JSON in this format (comments for explanation only):\n${EXTRACTION_FORMAT}`);
    return;
  }

  if (flag("--slices")) {
    const n = Number(flag("--slices"));
    const f = found.find((x) => x.episode === n);
    if (!f) throw new Error(`Episode ${n} is not among the new results`);
    const { mkdirSync } = await import("node:fs");
    mkdirSync("/tmp/survivor51", { recursive: true });
    const parts = await sliceImage(await loadImage(f.image));
    parts.forEach((buf, i) => {
      const out = `/tmp/survivor51/ep${n}-${i + 1}-of-${parts.length}.jpg`;
      writeFileSync(out, buf);
      console.log(out);
    });
    return;
  }

  let changed = false;
  for (const f of found) {
    console.log(`Episode ${f.episode}: reading ${f.image}`);
    const extraction = await extractWithClaude(d, f.episode, await loadImage(f.image));
    const { episode, leftGame } = buildEpisode(d, f, extraction);

    if (RECHECK != null) {
      const key = (e) => `${e.castawayId}|${e.ruleId}|${e.points}`;
      const stored = (d.episodes.find((e) => e.number === f.episode)?.events ?? []).map(key).sort();
      const read = episode.events.map(key).sort();
      const missing = stored.filter((k, i, a) => a.slice(0, i + 1).filter((x) => x === k).length > read.filter((x) => x === k).length);
      const extra = read.filter((k, i, a) => a.slice(0, i + 1).filter((x) => x === k).length > stored.filter((x) => x === k).length);
      if (missing.length || extra.length)
        throw new Error(`Recheck of Episode ${f.episode} differs from stored data.\nMissing: ${missing.join(", ") || "none"}\nExtra: ${extra.join(", ") || "none"}`);
      console.log(`Recheck OK: the reading of Episode ${f.episode} matches the stored data (${read.length} events).`);
      continue;
    }

    d.episodes = d.episodes.filter((e) => e.number !== f.episode).concat(episode).sort((a, b) => a.number - b.number);
    d.league.postedEpisodes = [...new Set([...d.league.postedEpisodes, f.episode])].sort((a, b) => a - b);
    for (const id of leftGame) {
      const c = d.castaways.find((x) => x.id === id);
      if (!c.votedOutEp) c.votedOutEp = f.episode;
    }
    if (d.league.pendingEpisode != null && d.league.pendingEpisode <= f.episode) d.league.pendingEpisode = null;
    d.league.updatedLabel = label(Math.max(...d.league.postedEpisodes));
    changed = true;
    console.log(`Episode ${f.episode}: ${episode.events.length} events, ${Object.keys(episode.statedTotals).length} castaways` + (leftGame.length ? `, left the game: ${leftGame.join(", ")}` : ""));
  }

  if (RECHECK != null) return;
  if (!changed) {
    console.log("No new results on the Fantasy Tribe page.");
    return;
  }
  const errors = validateLeague(d);
  if (errors.length) throw new Error(`Updated data failed validation; nothing was saved:\n- ${errors.join("\n- ")}`);
  if (DRY_RUN) console.log(JSON.stringify({ league: d.league, episodes: d.episodes.slice(-1) }, null, 2));
  else {
    writeFileSync(DATA_PATH, JSON.stringify(d, null, 2) + "\n");
    console.log(`Saved data/league.json: ${d.league.updatedLabel}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
