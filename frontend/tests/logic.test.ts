// Run: node --experimental-strip-types --test tests/logic.test.ts   (from /app/frontend)
// Pure-logic tests with a simulated clock: no real 12h waits.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LIFE_MS, MAX_LIVES, addLife, consumeLife, initialLives, recover, sanitizeLives, msToNextLife, formatHMS } from "../src/core/lives.ts";
import { AD_DAILY_LIMIT, adsLeft, registerAdReward, starsFor, rewardFor, levelInfo, goalsFor, bumpStreak, shouldShowInterstitial, freshDaily, dayKey } from "../src/core/rewards.ts";
import { GAMES } from "../src/core/registry.ts";

const T0 = Date.UTC(2026, 5, 1, 8, 0, 0);
const H = 3600 * 1000;

test("new user starts 5/5 with no timer", () => {
  const s = initialLives(T0);
  assert.equal(s.lives, 5); assert.equal(s.nextAt, null);
});

test("interval is 2h24m and 0->5 takes exactly 12h", () => {
  assert.equal(LIFE_MS, 144 * 60 * 1000);
  let s = initialLives(T0);
  for (let i = 0; i < 5; i++) s = consumeLife(s, T0).state;
  assert.equal(s.lives, 0);
  assert.equal(recover(s, T0 + 12 * H - 1000).lives, 4);
  assert.equal(recover(s, T0 + 12 * H).lives, 5);
  assert.equal(recover(s, T0 + 100 * H).lives, MAX_LIVES); // never above max
  assert.equal(recover(s, T0 + 100 * H).nextAt, null);
});

test("recovers all elapsed lives while app closed, keeps partial progress", () => {
  let s = initialLives(T0);
  for (let i = 0; i < 3; i++) s = consumeLife(s, T0).state; // 2 lives, nextAt T0+LIFE
  const later = T0 + LIFE_MS * 2 + 10 * 60 * 1000;
  const r = recover(s, later);
  assert.equal(r.lives, 4);
  assert.equal(r.nextAt, T0 + LIFE_MS * 3);
  assert.equal(msToNextLife(r, later), LIFE_MS - 10 * 60 * 1000);
});

test("consuming a life keeps the running timer (does not reset it)", () => {
  let s = consumeLife(initialLives(T0), T0).state; // 4, nextAt T0+LIFE
  s = consumeLife(s, T0 + H).state; // 3
  assert.equal(s.nextAt, T0 + LIFE_MS);
});

test("cannot consume at 0; add life never exceeds 5", () => {
  let s = initialLives(T0);
  for (let i = 0; i < 5; i++) s = consumeLife(s, T0).state;
  assert.equal(consumeLife(s, T0).ok, false);
  const a = addLife(s, T0); assert.equal(a.ok, true); assert.equal(a.state.lives, 1);
  assert.equal(addLife(initialLives(T0), T0).ok, false);
});

test("clock moved backwards cannot extend the wait beyond one interval", () => {
  let s = consumeLife(initialLives(T0), T0).state;
  const back = T0 - 48 * H;
  const r = recover(s, back);
  assert.ok(r.nextAt! <= back + LIFE_MS);
});

test("sanitize clamps corrupt states", () => {
  assert.equal(sanitizeLives({ lives: 99 }, T0).lives, 5);
  assert.equal(sanitizeLives({ lives: -3, nextAt: T0 + 999 * H }, T0).lives, 0);
  assert.ok(sanitizeLives({ lives: 2, nextAt: T0 + 999 * H, lastSeen: T0 }, T0).nextAt! <= T0 + LIFE_MS);
  assert.equal(sanitizeLives("garbage", T0).lives, 5);
  assert.equal(formatHMS(LIFE_MS - 1000), "02:23:59");
});

test("rewarded ads: 5 per day, resets next day", () => {
  let a = { date: "", count: 0, lastInterstitial: 0, gamesSinceAd: 0 };
  for (let i = 0; i < AD_DAILY_LIMIT; i++) { assert.ok(adsLeft(a, T0) > 0); a = registerAdReward(a, T0); }
  assert.equal(adsLeft(a, T0), 0);
  assert.equal(adsLeft(a, T0 + 24 * H), 5);
});

test("interstitial frequency cap, never in relax or premium", () => {
  const a = { date: "", count: 0, lastInterstitial: T0, gamesSinceAd: 3 };
  assert.equal(shouldShowInterstitial(a, T0 + 60000, false, "free"), false);
  assert.equal(shouldShowInterstitial(a, T0 + 4 * 60000, false, "free"), true);
  assert.equal(shouldShowInterstitial(a, T0 + 4 * 60000, false, "relax"), false);
  assert.equal(shouldShowInterstitial(a, T0 + 4 * 60000, true, "challenge"), false);
});

test("stars, coins, xp and levels", () => {
  assert.equal(starsFor("challenge", 10, 10, false, 0.9), 0);
  assert.equal(starsFor("challenge", 10, 10, true, 0.9), 3);
  assert.equal(starsFor("challenge", 10, 10, true, 0.1), 1);
  assert.equal(starsFor("free", 6, 10, true, 0), 2);
  assert.deepEqual(rewardFor("challenge", 0, false), { xp: 5, coins: 0 });
  assert.equal(levelInfo(0).level, 1); assert.equal(levelInfo(100).level, 2); assert.equal(levelInfo(250).level, 3);
});

test("daily goals are deterministic, 3 distinct kinds; streak never negative", () => {
  const g = goalsFor("2026-06-01");
  assert.equal(g.length, 3); assert.equal(new Set(g.map((x) => x.kind)).size, 3);
  assert.deepEqual(goalsFor("2026-06-01"), g);
  let st = bumpStreak({ last: "", count: 0, best: 0 }, T0);
  st = bumpStreak(st, T0 + 24 * H); assert.equal(st.count, 2);
  st = bumpStreak(st, T0 + 24 * H * 5); assert.equal(st.count, 1); assert.equal(st.best, 2);
  assert.equal(freshDaily({ date: dayKey(T0), play: 3, stars: 0, win: 0, relax: 0, claimed: [] }, T0 + 24 * H).play, 0);
});

test("registry: 50 unique activities, 10 per world, each with a component", () => {
  assert.equal(GAMES.length, 50);
  assert.equal(new Set(GAMES.map((g) => g.id)).size, 50);
  for (let w = 1; w <= 5; w++) assert.equal(GAMES.filter((g) => g.world === w).length, 10);
  const idx = readFileSync(new URL("../src/games/index.ts", import.meta.url), "utf8");
  for (const g of GAMES) {
    assert.ok(idx.includes(`"${g.id}":`), `missing component for ${g.id}`);
    assert.ok(g.target > 0 && g.time > 0 && g.rules.es && g.rules.en);
  }
  // Each component name is distinct (no game reused under different names)
  const comps = [...idx.matchAll(/":\s*W\d\.(\w+)/g)].map((m) => m[1]);
  assert.equal(new Set(comps).size, 50);
});
