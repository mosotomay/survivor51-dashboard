"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { asset, buildModel, type Model } from "@/lib/model";
import Standings from "./Standings";
import Teams from "./Teams";
import Weekly from "./Weekly";
import Draft from "./Draft";
import CastawaySheet from "./CastawaySheet";
import RulesSheet from "./RulesSheet";
import PhotoViewer, { type ViewerPhoto } from "./PhotoViewer";
import { PhotoZoom } from "./ui";

export type Tab = "standings" | "teams" | "weekly" | "draft";
const TABS: { key: Tab; label: string }[] = [
  { key: "standings", label: "Standings" },
  { key: "teams", label: "Teams" },
  { key: "weekly", label: "Weekly" },
  { key: "draft", label: "Draft" },
];

type Actions = {
  m: Model;
  dark: boolean;
  go: (t: Tab) => void;
  openCast: (id: string) => void;
  openRule: (id: string | null) => void;
  openTeam: (friendId: string) => void;
};
const Ctx = createContext<Actions | null>(null);
export const useLeague = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLeague outside LeagueApp");
  return v;
};

const isTab = (s: string): s is Tab => TABS.some((t) => t.key === s);

export default function LeagueApp() {
  const m = useMemo(() => buildModel(), []);
  const [tab, setTab] = useState<Tab>("standings");
  const [cast, setCast] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rule, setRule] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [photo, setPhoto] = useState<ViewerPhoto | null>(null);

  // Read the current theme and hash-linked tab after hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from browser-only state after hydration */
    setDark(document.documentElement.dataset.theme !== "light");
    const h = location.hash.slice(1);
    if (isTab(h)) setTab(h);
    /* eslint-enable react-hooks/set-state-in-effect */
    const onHash = () => {
      const k = location.hash.slice(1);
      if (isTab(k)) setTab(k);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("s51-theme", next);
    } catch {}
    setDark(!dark);
  };

  const go = useCallback((t: Tab) => {
    setTab(t);
    history.replaceState(null, "", t === "standings" ? location.pathname : "#" + t);
    window.scrollTo({ top: 0 });
  }, []);

  const openTeam = useCallback(
    (id: string) => {
      setCast(null);
      go("teams");
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(`[data-friend="${id}"]`);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120 });
      }, 30);
    },
    [go],
  );

  const actions: Actions = {
    m,
    dark,
    go,
    openTeam,
    openCast: setCast,
    openRule: (id) => {
      setRule(id);
      setRulesOpen(true);
    },
  };

  const pending = m.pendingEp != null;

  return (
    <Ctx.Provider value={actions}>
      <PhotoZoom.Provider value={setPhoto}>
        <div className="min-h-dvh">
          <header className="sticky top-0 z-20 border-b border-line bg-bg">
            <div className="woven pointer-events-none absolute inset-0" />
            <div className="relative mx-auto flex max-w-[1280px] items-center gap-5 px-4 pt-3 pb-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("/alien.svg")} alt="" width={40} height={40} className="size-10 flex-none rounded-[11px] border border-line" />
                <div className="min-w-0">
                  <div className="disp text-[21px] leading-[1.05] font-extrabold tracking-[0.01em] text-balance">
                    Survivor <span className="text-amb">51</span> Fantasy League
                  </div>
                  <div className="mt-1 text-[12.5px] text-mut">{m.data.league.updatedLabel}</div>
                </div>
              </div>
              <nav aria-label="Sections" className="hidden items-center gap-0.5 wide:flex">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => go(t.key)}
                    aria-current={tab === t.key ? "page" : undefined}
                    className={`disp cursor-pointer rounded-[10px] border-0 px-4 py-2.5 text-[17px] leading-none font-bold tracking-[0.04em] ${
                      tab === t.key ? "bg-s2 text-ink" : "bg-transparent text-mut"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => actions.openRule(null)}
                  className="disp ml-2 cursor-pointer rounded-[10px] border border-line bg-s1 px-4 py-[9px] text-[17px] leading-none font-bold tracking-[0.04em] text-ink"
                >
                  Rules
                </button>
              </nav>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                title="Switch light / dark"
                className="flex size-10 flex-none cursor-pointer items-center justify-center rounded-full border border-line bg-s1"
              >
                <div
                  className="size-4 rounded-full border-2 border-ink"
                  style={{ background: "linear-gradient(90deg,var(--ink) 50%,transparent 50%)" }}
                />
              </button>
            </div>
            <nav aria-label="Sections" className="relative grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr] px-1.5 wide:hidden">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => go(t.key)}
                  aria-current={tab === t.key ? "page" : undefined}
                  className={`disp relative h-[46px] cursor-pointer border-0 bg-transparent p-0 text-[15px] leading-none font-bold tracking-[0.04em] ${
                    tab === t.key ? "text-ink" : "text-mut"
                  }`}
                >
                  {t.label}
                  <div
                    className="absolute right-2 bottom-0 left-2 h-[3px] rounded-t-[3px]"
                    style={{ background: tab === t.key ? "var(--fire)" : "transparent" }}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => actions.openRule(null)}
                className="flex h-[46px] cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              >
                <span className="disp rounded-full border border-line bg-s1 px-2.5 py-1.5 text-[15px] leading-none font-bold tracking-[0.04em] text-ink">
                  Rules
                </span>
              </button>
            </nav>
          </header>

          {pending && (
            <div className="mx-auto max-w-[1280px] px-4 pt-3.5">
              <div role="status" className="flex items-center gap-3 rounded-[14px] border border-dashed border-amb bg-s1 px-3.5 py-3">
                <div className="size-2.5 flex-none rounded-full bg-amb" style={{ boxShadow: "0 0 0 4px var(--firesoft)" }} />
                <div>
                  <div className="font-semibold">Episode {m.pendingEp} results not posted yet</div>
                  <div className="text-[13px] text-mut">Standings show Episode {m.lastEp}. Scores update Thursday.</div>
                </div>
              </div>
            </div>
          )}

          <main className="mx-auto max-w-[1280px] px-4 pt-[18px] pb-8">
            {tab === "standings" && <Standings />}
            {tab === "teams" && <Teams />}
            {tab === "weekly" && <Weekly />}
            {tab === "draft" && <Draft />}
          </main>
        </div>

        {cast && m.castById[cast] && <CastawaySheet c={m.castById[cast]} onClose={() => setCast(null)} />}
        {rulesOpen && (
          <RulesSheet
            rule={rule}
            onClose={() => {
              setRulesOpen(false);
              setRule(null);
            }}
          />
        )}
        {photo && <PhotoViewer photo={photo} onClose={() => setPhoto(null)} />}
      </PhotoZoom.Provider>
    </Ctx.Provider>
  );
}
