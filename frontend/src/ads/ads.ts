// Native AdMob wrapper. The native module only exists in a compiled build (APK/AAB);
// in Expo Go every call reports "unavailable" and nothing is simulated.
import Constants, { ExecutionEnvironment } from "expo-constants";

export type RewardResult = "earned" | "closed" | "error" | "unavailable" | "offline";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let lib: any = undefined;
let ready = false;

function getLib(): any {
  if (isExpoGo) return null;
  if (lib !== undefined) return lib;
  try { lib = require("react-native-google-mobile-ads"); } catch { lib = null; }
  return lib;
}

function unit(kind: "banner" | "interstitial" | "rewarded"): string {
  const m = getLib();
  const env = {
    banner: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID,
    interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID,
    rewarded: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID,
  }[kind];
  if (__DEV__ || !env) return kind === "banner" ? m.TestIds.ADAPTIVE_BANNER : kind === "interstitial" ? m.TestIds.INTERSTITIAL : m.TestIds.REWARDED;
  return env;
}

export async function initAds(): Promise<boolean> {
  const m = getLib();
  if (!m) return false;
  if (ready) return true;
  try {
    try { await m.AdsConsent.gatherConsent(); } catch {}
    const info = await m.AdsConsent.getConsentInfo().catch(() => ({ canRequestAds: true }));
    if (!info.canRequestAds) return false;
    await m.default().setRequestConfiguration({ maxAdContentRating: m.MaxAdContentRating.G, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false });
    await m.default().initialize();
    ready = true;
  } catch { ready = false; }
  return ready;
}

export const adsAvailable = () => !!getLib() && ready;

export async function isOnline(): Promise<boolean> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 4000);
    const r = await fetch("https://clients3.google.com/generate_204", { signal: c.signal });
    clearTimeout(t);
    return r.status === 204 || r.ok;
  } catch { return false; }
}

/** Resolves "earned" only after the SDK's EARNED_REWARD event AND the ad closing. Resolves once. */
export async function showRewarded(): Promise<RewardResult> {
  if (!(await isOnline())) return "offline";
  const m = getLib();
  if (!m || !(await initAds())) return "unavailable";
  return new Promise((resolve) => {
    const ad = m.RewardedAd.createForAdRequest(unit("rewarded"));
    let earned = false, shown = false, done = false;
    const subs: (() => void)[] = [];
    const finish = (r: RewardResult) => { if (done) return; done = true; subs.forEach((u) => u()); resolve(r); };
    subs.push(ad.addAdEventListener(m.RewardedAdEventType.LOADED, () => { shown = true; ad.show().catch(() => finish("error")); }));
    subs.push(ad.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => { earned = true; }));
    subs.push(ad.addAdEventListener(m.AdEventType.CLOSED, () => finish(earned ? "earned" : "closed")));
    subs.push(ad.addAdEventListener(m.AdEventType.ERROR, () => finish("error")));
    setTimeout(() => { if (!shown) finish("unavailable"); }, 15000);
    ad.load();
  });
}

export async function showInterstitial(): Promise<boolean> {
  const m = getLib();
  if (!m || !ready) return false;
  return new Promise((resolve) => {
    const ad = m.InterstitialAd.createForAdRequest(unit("interstitial"));
    let done = false, shown = false;
    const subs: (() => void)[] = [];
    const finish = (r: boolean) => { if (done) return; done = true; subs.forEach((u) => u()); resolve(r); };
    subs.push(ad.addAdEventListener(m.AdEventType.LOADED, () => { shown = true; ad.show().catch(() => finish(false)); }));
    subs.push(ad.addAdEventListener(m.AdEventType.CLOSED, () => finish(true)));
    subs.push(ad.addAdEventListener(m.AdEventType.ERROR, () => finish(false)));
    setTimeout(() => { if (!shown) finish(false); }, 8000);
    ad.load();
  });
}

export function bannerParts(): { BannerAd: any; size: any; unitId: string } | null {
  const m = getLib();
  if (!m || !ready) return null;
  return { BannerAd: m.BannerAd, size: m.BannerAdSize.ANCHORED_ADAPTIVE_BANNER, unitId: unit("banner") };
}
