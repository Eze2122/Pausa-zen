// Pure lives logic (no React / RN imports) so it can be unit tested with a fake clock.
export const MAX_LIVES = 5;
export const LIFE_MS = (2 * 60 + 24) * 60 * 1000; // 2h24m -> 5 lives in 12h
const CLOCK_TOLERANCE = 60 * 1000;

export type LivesState = { lives: number; nextAt: number | null; lastSeen: number };

export function initialLives(now: number): LivesState {
  return { lives: MAX_LIVES, nextAt: null, lastSeen: now };
}

export function sanitizeLives(raw: any, now: number): LivesState {
  if (!raw || typeof raw !== "object") return initialLives(now);
  let lives = Number.isFinite(raw.lives) ? Math.round(raw.lives) : MAX_LIVES;
  lives = Math.max(0, Math.min(MAX_LIVES, lives));
  let nextAt: number | null = Number.isFinite(raw.nextAt) ? raw.nextAt : null;
  const lastSeen = Number.isFinite(raw.lastSeen) ? raw.lastSeen : now;
  if (lives >= MAX_LIVES) nextAt = null;
  else if (nextAt === null) nextAt = now + LIFE_MS;
  // A pending life can never be further away than one full interval.
  if (nextAt !== null && nextAt > Math.max(now, lastSeen) + LIFE_MS) nextAt = Math.max(now, lastSeen) + LIFE_MS;
  return { lives, nextAt, lastSeen };
}

/** Applies all recoveries that correspond to elapsed time. Survives app restarts. */
export function recover(s: LivesState, now: number): LivesState {
  let { lives, nextAt, lastSeen } = s;
  // Clock moved backwards: do not let the wait grow beyond one interval.
  if (now < lastSeen - CLOCK_TOLERANCE) {
    if (nextAt !== null) nextAt = Math.min(nextAt, now + LIFE_MS);
    lastSeen = now;
  }
  if (lives >= MAX_LIVES) return { lives: MAX_LIVES, nextAt: null, lastSeen: Math.max(lastSeen, now) };
  if (nextAt === null) nextAt = now + LIFE_MS;
  if (now >= nextAt) {
    const gained = 1 + Math.floor((now - nextAt) / LIFE_MS);
    lives = Math.min(MAX_LIVES, lives + gained);
    nextAt = lives >= MAX_LIVES ? null : nextAt + gained * LIFE_MS;
  }
  return { lives, nextAt, lastSeen: Math.max(lastSeen, now) };
}

export function consumeLife(s: LivesState, now: number): { ok: boolean; state: LivesState } {
  const cur = recover(s, now);
  if (cur.lives <= 0) return { ok: false, state: cur };
  return { ok: true, state: { lives: cur.lives - 1, nextAt: cur.nextAt ?? now + LIFE_MS, lastSeen: cur.lastSeen } };
}

export function addLife(s: LivesState, now: number): { ok: boolean; state: LivesState } {
  const cur = recover(s, now);
  if (cur.lives >= MAX_LIVES) return { ok: false, state: cur };
  const lives = cur.lives + 1;
  return { ok: true, state: { lives, nextAt: lives >= MAX_LIVES ? null : cur.nextAt, lastSeen: cur.lastSeen } };
}

export function msToNextLife(s: LivesState, now: number): number {
  if (s.lives >= MAX_LIVES || s.nextAt === null) return 0;
  return Math.max(0, s.nextAt - now);
}

export function formatHMS(ms: number): string {
  const t = Math.ceil(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(sec)}`;
}
