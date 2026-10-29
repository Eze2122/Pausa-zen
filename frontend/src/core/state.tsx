import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { storage } from "@/src/utils/storage";
import { deviceLang, Lang, translate, TKey } from "./i18n";
import { LivesState, sanitizeLives, recover, consumeLife, addLife, initialLives, MAX_LIVES } from "./lives";
import {
  AdState, adsLeft, registerAdReward, Daily, freshDaily, goalsFor, Streak, bumpStreak, levelInfo, rewardFor, Mode,
  newAchievements, shouldShowInterstitial,
} from "./rewards";
import { GAMES, getGame } from "./registry";
import { COSMETICS, getCos } from "./cosmetics";
import { configureFeedback, initSound, playSfx } from "./sound";
import { initAds, showRewarded, showInterstitial } from "@/src/ads/ads";
import { checkPremium, buyPremium as rcBuy, restorePremium as rcRestore } from "@/src/purchases/premium";

const KEY = "pausa_save_v1";

export type GameStat = { best: number; stars: number; plays: number; wins: number };
export type Settings = { lang: Lang; music: boolean; sfx: boolean; vibration: boolean; volume: number; reduceMotion: boolean; largeText: boolean };
export type Save = {
  settings: Settings; lives: LivesState; coins: number; xp: number; games: Record<string, GameStat>;
  favorites: string[]; recent: string[]; owned: string[]; equipped: { bg: string; mascot: string; fx: string };
  achievements: string[]; daily: Daily; streak: Streak; ads: AdState;
  stats: { plays: number; wins: number; fails: number; seconds: number; stars: number }; offset: number;
};

const num = (v: any, d: number, min = 0, max = 1e12) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);
const ids = new Set(GAMES.map((g) => g.id));

export function defaultSave(now: number): Save {
  return {
    settings: { lang: deviceLang(), music: false, sfx: true, vibration: true, volume: 0.8, reduceMotion: false, largeText: false },
    lives: initialLives(now), coins: 0, xp: 0, games: {}, favorites: [], recent: [],
    owned: COSMETICS.filter((c) => c.price === 0).map((c) => c.id), equipped: { bg: "bg-cream", mascot: "m-teal", fx: "fx-confetti" },
    achievements: [], daily: freshDaily(undefined, now), streak: { last: "", count: 0, best: 0 },
    ads: { date: "", count: 0, lastInterstitial: 0, gamesSinceAd: 0 }, stats: { plays: 0, wins: 0, fails: 0, seconds: 0, stars: 0 }, offset: 0,
  };
}

/** Validates any persisted value to avoid corrupt states (e.g. lives > 5, negative coins). */
export function sanitizeSave(raw: any, now: number): Save {
  const d = defaultSave(now);
  if (!raw || typeof raw !== "object") return d;
  const s = raw.settings ?? {};
  const games: Record<string, GameStat> = {};
  for (const [k, v] of Object.entries<any>(raw.games ?? {})) {
    if (!ids.has(k) || !v) continue;
    games[k] = { best: num(v.best, 0), stars: num(Math.round(v.stars), 0, 0, 3), plays: num(v.plays, 0), wins: num(v.wins, 0) };
  }
  const owned = Array.isArray(raw.owned) ? raw.owned.filter((x: any) => COSMETICS.some((c) => c.id === x)) : [];
  const eq = raw.equipped ?? {};
  const fixEq = (id: any, kind: string, def: string) => (typeof id === "string" && owned.includes(id) && getCos(id).kind === kind ? id : def);
  const allOwned = Array.from(new Set([...d.owned, ...owned]));
  return {
    settings: {
      lang: s.lang === "en" || s.lang === "es" ? s.lang : d.settings.lang,
      music: !!s.music, sfx: s.sfx !== false, vibration: s.vibration !== false, volume: num(s.volume, 0.8, 0, 1),
      reduceMotion: !!s.reduceMotion, largeText: !!s.largeText,
    },
    lives: sanitizeLives(raw.lives, now), coins: Math.floor(num(raw.coins, 0)), xp: Math.floor(num(raw.xp, 0)), games,
    favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((x: any) => ids.has(x)) : [],
    recent: Array.isArray(raw.recent) ? raw.recent.filter((x: any) => ids.has(x)).slice(0, 8) : [],
    owned: allOwned,
    equipped: { bg: fixEq(eq.bg, "bg", "bg-cream"), mascot: fixEq(eq.mascot, "mascot", "m-teal"), fx: fixEq(eq.fx, "fx", "fx-confetti") },
    achievements: Array.isArray(raw.achievements) ? raw.achievements.filter((x: any) => typeof x === "string") : [],
    daily: raw.daily && typeof raw.daily.date === "string" ? freshDaily({ ...d.daily, ...raw.daily, claimed: Array.isArray(raw.daily.claimed) ? raw.daily.claimed : [] }, now) : d.daily,
    streak: { last: String(raw.streak?.last ?? ""), count: num(raw.streak?.count, 0), best: num(raw.streak?.best, 0) },
    ads: { date: String(raw.ads?.date ?? ""), count: num(raw.ads?.count, 0, 0, 5), lastInterstitial: num(raw.ads?.lastInterstitial, 0), gamesSinceAd: num(raw.ads?.gamesSinceAd, 0) },
    stats: { plays: num(raw.stats?.plays, 0), wins: num(raw.stats?.wins, 0), fails: num(raw.stats?.fails, 0), seconds: num(raw.stats?.seconds, 0), stars: num(raw.stats?.stars, 0) },
    offset: num(raw.offset, 0, -1e11, 1e11),
  };
}

export type ResultInput = { id: string; mode: Mode; score: number; stars: number; won: boolean; seconds: number };
export type ResultOut = { xp: number; coins: number; newAch: string[]; levelUp: boolean; newBest: boolean };
export type AdMsg = "adOk" | "adNoNet" | "adUnavailable" | "adNotDone" | "adLimit" | "livesMax";

type Ctx = {
  save: Save; loaded: boolean; premium: boolean; now: () => number;
  t: (k: TKey, v?: Record<string, string | number>) => string;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  recordResult: (r: ResultInput) => ResultOut;
  loseLife: () => void; livesNow: () => number;
  grantAdLife: () => Promise<AdMsg>;
  toggleFav: (id: string) => void; pushRecent: (id: string) => void;
  buyCos: (id: string) => boolean; equip: (id: string) => void; claimGoal: (i: number) => void;
  maybeInterstitial: (mode: Mode) => Promise<void>;
  buyPremium: () => Promise<boolean>; restorePremium: () => Promise<boolean>; resetAll: () => void;
};

const C = createContext<Ctx | null>(null);
export const useGame = () => {
  const c = useContext(C);
  if (!c) throw new Error("GameProvider missing");
  return c;
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [save, setSave] = useState<Save>(() => defaultSave(Date.now()));
  const [loaded, setLoaded] = useState(false);
  const [premium, setPremium] = useState(false);
  const ref = useRef(save);
  ref.current = save;
  const saveTimer = useRef<any>(null);
  const adBusy = useRef(false);

  const now = useCallback(() => Date.now() + ref.current.offset, []);

  const persist = useCallback((s: Save) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => storage.setItem(KEY, JSON.stringify(s)), 250);
  }, []);

  const update = useCallback((fn: (s: Save) => Save) => {
    const next = fn(ref.current);
    ref.current = next;
    setSave(next);
    persist(next);
  }, [persist]);

  // Load once
  useEffect(() => {
    (async () => {
      const raw = await storage.getItem(KEY, null);
      let parsed: any = null;
      try { parsed = typeof raw === "string" ? JSON.parse(raw) : null; } catch { parsed = null; }
      const s = sanitizeSave(parsed, Date.now() + (parsed?.offset ?? 0));
      s.lives = recover(s.lives, Date.now() + s.offset);
      ref.current = s;
      setSave(s);
      setLoaded(true);
      initSound();
      // Server time (when online) reduces device clock manipulation; offline keeps the stored offset.
      try {
        const t0 = Date.now();
        const c = new AbortController();
        const to = setTimeout(() => c.abort(), 4000);
        const r = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/time`, { signal: c.signal });
        clearTimeout(to);
        const j = await r.json();
        const t1 = Date.now();
        if (Number.isFinite(j?.now)) update((p) => ({ ...p, offset: Math.round(j.now - (t0 + t1) / 2) }));
      } catch {}
      initAds().then(() => checkPremium().then(setPremium));
    })();
  }, [update]);

  useEffect(() => { configureFeedback(save.settings); }, [save.settings]);

  // Periodic lives recovery (state only; display uses its own 1s clock).
  useEffect(() => {
    const tick = () => {
      const cur = ref.current.lives;
      const r = recover(cur, now());
      if (r.lives !== cur.lives || r.nextAt !== cur.nextAt) update((p) => ({ ...p, lives: r }));
    };
    const iv = setInterval(tick, 10000);
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") { tick(); checkPremium().then(setPremium); configureFeedback(ref.current.settings); }
      else { storage.setItem(KEY, JSON.stringify(ref.current)); configureFeedback({ ...ref.current.settings, music: false }); }
    });
    return () => { clearInterval(iv); sub.remove(); };
  }, [now, update]);

  const t = useCallback((k: TKey, v?: Record<string, string | number>) => translate(save.settings.lang, k, v), [save.settings.lang]);

  const value = useMemo<Ctx>(() => ({
    save, loaded, premium, now, t,
    setSetting: (k, v) => update((p) => ({ ...p, settings: { ...p.settings, [k]: v } })),
    livesNow: () => recover(ref.current.lives, now()).lives,
    loseLife: () => update((p) => ({ ...p, lives: consumeLife(p.lives, now()).state })),
    recordResult: (r) => {
      const p = ref.current;
      const ts = now();
      const { xp, coins } = rewardFor(r.mode, r.stars, r.won);
      const prev = p.games[r.id] ?? { best: 0, stars: 0, plays: 0, wins: 0 };
      const newBest = r.score > prev.best && prev.plays > 0;
      const gs = { ...p.games, [r.id]: { best: Math.max(prev.best, r.score), stars: r.mode === "challenge" ? Math.max(prev.stars, r.stars) : prev.stars, plays: prev.plays + 1, wins: prev.wins + (r.won ? 1 : 0) } };
      const daily = freshDaily(p.daily, ts);
      const nd = { ...daily, play: daily.play + 1, stars: daily.stars + r.stars, win: daily.win + (r.won ? 1 : 0), relax: daily.relax + (r.mode === "relax" ? 1 : 0) };
      const streak = bumpStreak(p.streak, ts);
      const stats = { plays: p.stats.plays + 1, wins: p.stats.wins + (r.won ? 1 : 0), fails: p.stats.fails + (r.mode === "challenge" && !r.won ? 1 : 0), seconds: p.stats.seconds + Math.round(r.seconds), stars: p.stats.stars + r.stars };
      const nxp = p.xp + xp;
      const levelUp = levelInfo(nxp).level > levelInfo(p.xp).level;
      const totalStars = Object.values(gs).reduce((a, g) => a + g.stars, 0);
      const worldsPlayed = new Set(Object.keys(gs).map((id) => getGame(id)?.world)).size;
      const newAch = newAchievements(p.achievements, { plays: stats.plays, stars: totalStars, wins: stats.wins, level: levelInfo(nxp).level, worldsPlayed, gamesPlayed: Object.keys(gs).length, coins: p.coins + coins, streak: streak.count });
      update(() => ({ ...p, xp: nxp, coins: p.coins + coins + newAch.length * 25, games: gs, daily: nd, streak, stats, achievements: [...p.achievements, ...newAch], ads: { ...p.ads, gamesSinceAd: p.ads.gamesSinceAd + 1 } }));
      return { xp, coins: coins + newAch.length * 25, newAch, levelUp, newBest };
    },
    grantAdLife: async () => {
      if (adBusy.current) return "adUnavailable";
      const ts = now();
      if (adsLeft(ref.current.ads, ts) <= 0) return "adLimit";
      if (recover(ref.current.lives, ts).lives >= MAX_LIVES) return "livesMax";
      adBusy.current = true;
      try {
        const res = await showRewarded();
        if (res === "offline") return "adNoNet";
        if (res !== "earned") return res === "closed" ? "adNotDone" : "adUnavailable";
        let granted = false;
        update((p) => {
          const r = addLife(p.lives, now());
          granted = r.ok;
          return r.ok ? { ...p, lives: r.state, ads: registerAdReward(p.ads, now()) } : p;
        });
        if (granted) playSfx("unlock");
        return granted ? "adOk" : "livesMax";
      } finally {
        adBusy.current = false;
      }
    },
    toggleFav: (id) => update((p) => ({ ...p, favorites: p.favorites.includes(id) ? p.favorites.filter((x) => x !== id) : [id, ...p.favorites] })),
    pushRecent: (id) => update((p) => ({ ...p, recent: [id, ...p.recent.filter((x) => x !== id)].slice(0, 8) })),
    buyCos: (id) => {
      const c = getCos(id);
      const p = ref.current;
      if (p.owned.includes(id) || p.coins < c.price || levelInfo(p.xp).level < c.level) return false;
      update((s) => ({ ...s, coins: s.coins - c.price, owned: [...s.owned, id] }));
      playSfx("unlock");
      return true;
    },
    equip: (id) => {
      const c = getCos(id);
      if (!ref.current.owned.includes(id)) return;
      update((p) => ({ ...p, equipped: { ...p.equipped, [c.kind]: id } }));
    },
    claimGoal: (i) => {
      const p = ref.current;
      const d = freshDaily(p.daily, now());
      const g = goalsFor(d.date)[i];
      if (!g || d.claimed.includes(i) || d[g.kind] < g.amount) return;
      update((s) => ({ ...s, coins: s.coins + g.coins, daily: { ...d, claimed: [...d.claimed, i] } }));
      playSfx("unlock");
    },
    maybeInterstitial: async (mode) => {
      if (!shouldShowInterstitial(ref.current.ads, now(), premium, mode)) return;
      const shown = await showInterstitial();
      if (shown) update((p) => ({ ...p, ads: { ...p.ads, lastInterstitial: now(), gamesSinceAd: 0 } }));
    },
    buyPremium: async () => { const r = await rcBuy(); if (r.ok) setPremium(true); return r.ok; },
    restorePremium: async () => { const ok = await rcRestore(); setPremium(ok); return ok; },
    resetAll: () => update((p) => ({ ...defaultSave(now()), settings: p.settings, offset: p.offset })),
  }), [save, loaded, premium, now, t, update]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

/** 1-second clock for countdowns; isolated so the whole tree does not re-render. */
export function useNow(ms = 1000) {
  const { now } = useGame();
  const [n, setN] = useState(now());
  useEffect(() => {
    const iv = setInterval(() => setN(now()), ms);
    return () => clearInterval(iv);
  }, [now, ms]);
  return n;
}
