import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export type SoundName = "pop" | "tap" | "swish" | "win" | "unlock" | "fail" | "water" | `note${0 | 1 | 2 | 3 | 4 | 5 | 6}`;

const SRC: Record<string, any> = {
  pop: require("../../assets/sounds/pop.wav"), tap: require("../../assets/sounds/tap.wav"),
  swish: require("../../assets/sounds/swish.wav"), win: require("../../assets/sounds/win.wav"),
  unlock: require("../../assets/sounds/unlock.wav"), fail: require("../../assets/sounds/fail.wav"),
  water: require("../../assets/sounds/water.wav"),
  note0: require("../../assets/sounds/note0.wav"), note1: require("../../assets/sounds/note1.wav"),
  note2: require("../../assets/sounds/note2.wav"), note3: require("../../assets/sounds/note3.wav"),
  note4: require("../../assets/sounds/note4.wav"), note5: require("../../assets/sounds/note5.wav"),
  note6: require("../../assets/sounds/note6.wav"),
};

const cfg = { sfx: true, music: false, vibration: true, volume: 0.8 };
const pools: Record<string, { players: AudioPlayer[]; i: number }> = {};
let ambient: AudioPlayer | null = null;
let ready = false;

function pool(name: string) {
  if (!pools[name]) {
    const n = name === "pop" || name === "tap" ? 3 : 1;
    pools[name] = { players: Array.from({ length: n }, () => createAudioPlayer(SRC[name])), i: 0 };
  }
  return pools[name];
}

export async function initSound() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" });
  } catch {}
}

export function configureFeedback(next: Partial<typeof cfg>) {
  Object.assign(cfg, next);
  syncMusic();
}

export function playSfx(name: SoundName) {
  if (!cfg.sfx || cfg.volume <= 0) return;
  try {
    const p = pool(name);
    const pl = p.players[p.i];
    p.i = (p.i + 1) % p.players.length;
    pl.volume = cfg.volume;
    pl.seekTo(0);
    pl.play();
  } catch {}
}

export function haptic(kind: "light" | "medium" | "heavy" | "success" | "error" = "light") {
  if (!cfg.vibration || Platform.OS === "web") return;
  try {
    if (kind === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(kind === "heavy" ? Haptics.ImpactFeedbackStyle.Heavy : kind === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

function syncMusic() {
  try {
    if (cfg.music && cfg.volume > 0) {
      if (!ambient) {
        ambient = createAudioPlayer(require("../../assets/sounds/ambient.wav"));
        ambient.loop = true;
      }
      ambient.volume = cfg.volume * 0.5;
      ambient.play();
    } else if (ambient) {
      ambient.pause();
    }
  } catch {}
}
