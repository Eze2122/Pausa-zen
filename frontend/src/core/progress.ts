import type { Save } from "./state";
import { gamesOfWorld } from "./registry";

export const UNLOCK_STARS = 10;
export const worldStars = (s: Save, w: number) => gamesOfWorld(w).reduce((a, g) => a + (s.games[g.id]?.stars ?? 0), 0);
/** Worlds guide challenge progression only; free & relax modes are always open. */
export const worldUnlocked = (s: Save, w: number) => w === 1 || worldStars(s, w - 1) >= UNLOCK_STARS;
export const levelUnlocked = (s: Save, w: number, i: number) => worldUnlocked(s, w) && (i === 0 || (s.games[gamesOfWorld(w)[i - 1].id]?.stars ?? 0) > 0);
