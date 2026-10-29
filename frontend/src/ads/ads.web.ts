// Web preview: AdMob does not exist on web. Nothing is simulated.
export type RewardResult = "earned" | "closed" | "error" | "unavailable" | "offline";
export async function initAds() { return false; }
export const adsAvailable = () => false;
export async function isOnline() { return typeof navigator === "undefined" ? true : navigator.onLine; }
export async function showRewarded(): Promise<RewardResult> { return (await isOnline()) ? "unavailable" : "offline"; }
export async function showInterstitial() { return false; }
export function bannerParts(): null { return null; }
