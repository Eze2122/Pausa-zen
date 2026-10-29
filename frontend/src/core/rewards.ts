// Pure progression logic: stars, xp, coins, levels, daily goals, ad limits, achievements.
export type Mode = "free" | "challenge" | "relax";
export const AD_DAILY_LIMIT = 5;
export const INTERSTITIAL_EVERY = 3; // games
export const INTERSTITIAL_MIN_MS = 3 * 60 * 1000;

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function starsFor(mode: Mode, score: number, target: number, won: boolean, timeLeftFrac: number): number {
  if (mode === "challenge") {
    if (!won) return 0;
    return 1 + (timeLeftFrac > 0.25 ? 1 : 0) + (timeLeftFrac > 0.5 ? 1 : 0);
  }
  const r = target > 0 ? score / target : 0;
  return r >= 1 ? 3 : r >= 0.6 ? 2 : r >= 0.25 ? 1 : 0;
}

export function rewardFor(mode: Mode, stars: number, won: boolean): { xp: number; coins: number } {
  if (mode === "relax") return { xp: 5 + stars * 3, coins: stars * 2 };
  if (mode === "challenge") return won ? { xp: 20 + stars * 10, coins: 10 + stars * 5 } : { xp: 5, coins: 0 };
  return { xp: 10 + stars * 5, coins: stars * 3 };
}

export function levelInfo(xp: number): { level: number; cur: number; need: number } {
  let level = 1, rest = Math.max(0, Math.floor(xp)), need = 100;
  while (rest >= need) { rest -= need; level++; need = 100 + (level - 1) * 50; }
  return { level, cur: rest, need };
}

// ---- Ads daily limit
export type AdState = { date: string; count: number; lastInterstitial: number; gamesSinceAd: number };
export function adsLeft(a: AdState, now: number): number {
  return a.date === dayKey(now) ? Math.max(0, AD_DAILY_LIMIT - a.count) : AD_DAILY_LIMIT;
}
export function registerAdReward(a: AdState, now: number): AdState {
  const today = dayKey(now);
  return { ...a, date: today, count: (a.date === today ? a.count : 0) + 1 };
}
export function shouldShowInterstitial(a: AdState, now: number, premium: boolean, mode: Mode): boolean {
  if (premium || mode === "relax") return false;
  return a.gamesSinceAd >= INTERSTITIAL_EVERY && now - a.lastInterstitial >= INTERSTITIAL_MIN_MS;
}

// ---- Daily goals
export type GoalKind = "play" | "stars" | "win" | "relax";
export type Daily = { date: string; play: number; stars: number; win: number; relax: number; claimed: number[] };
export type Goal = { kind: GoalKind; amount: number; coins: number };
const POOL: Goal[] = [
  { kind: "play", amount: 3, coins: 30 }, { kind: "play", amount: 6, coins: 60 },
  { kind: "stars", amount: 5, coins: 40 }, { kind: "stars", amount: 10, coins: 80 },
  { kind: "win", amount: 2, coins: 50 }, { kind: "win", amount: 4, coins: 90 },
  { kind: "relax", amount: 2, coins: 30 },
];
export function goalsFor(date: string): Goal[] {
  let h = 0;
  for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const kinds = new Set<GoalKind>();
  const out: Goal[] = [];
  for (let i = 0; out.length < 3 && i < 20; i++) {
    const g = POOL[(h + i * 3) % POOL.length];
    if (!kinds.has(g.kind)) { kinds.add(g.kind); out.push(g); }
  }
  return out;
}
export function freshDaily(d: Daily | undefined, now: number): Daily {
  const date = dayKey(now);
  if (d && d.date === date) return d;
  return { date, play: 0, stars: 0, win: 0, relax: 0, claimed: [] };
}

// ---- Streak (never punishes: missing days just restarts at 1)
export type Streak = { last: string; count: number; best: number };
export function bumpStreak(s: Streak, now: number): Streak {
  const today = dayKey(now);
  if (s.last === today) return s;
  const yesterday = dayKey(now - 86400000);
  const count = s.last === yesterday ? s.count + 1 : 1;
  return { last: today, count, best: Math.max(s.best, count) };
}

// ---- Achievements
export type AchInput = { plays: number; stars: number; wins: number; level: number; worldsPlayed: number; gamesPlayed: number; coins: number; streak: number };
export const ACHIEVEMENTS: { id: string; check: (s: AchInput) => boolean }[] = [
  { id: "first", check: (s) => s.plays >= 1 },
  { id: "ten", check: (s) => s.plays >= 10 },
  { id: "fifty", check: (s) => s.plays >= 50 },
  { id: "stars25", check: (s) => s.stars >= 25 },
  { id: "stars100", check: (s) => s.stars >= 100 },
  { id: "win5", check: (s) => s.wins >= 5 },
  { id: "level5", check: (s) => s.level >= 5 },
  { id: "worlds", check: (s) => s.worldsPlayed >= 5 },
  { id: "explorer", check: (s) => s.gamesPlayed >= 50 },
  { id: "streak3", check: (s) => s.streak >= 3 },
];
export function newAchievements(have: string[], s: AchInput): string[] {
  return ACHIEVEMENTS.filter((a) => !have.includes(a.id) && a.check(s)).map((a) => a.id);
}
