// RevenueCat "remove ads" lifetime entitlement. Premium is ONLY granted from RevenueCat's
// verified customerInfo, never from a locally stored flag.
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export const ENTITLEMENT_ID = "remove_ads";
export const PRODUCT_ID = "remove_ads_lifetime";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let P: any = undefined;
let configured = false;

function lib(): any {
  if (isExpoGo || Platform.OS !== "android") return null;
  if (P !== undefined) return P;
  try { P = require("react-native-purchases").default; } catch { P = null; }
  return P;
}

export function purchasesAvailable(): boolean {
  return !!lib() && !!process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
}

async function configure(): Promise<boolean> {
  const p = lib();
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!p || !apiKey) return false;
  if (!configured) { p.configure({ apiKey }); configured = true; }
  return true;
}

const active = (info: any) => !!info?.entitlements?.active?.[ENTITLEMENT_ID];

export async function checkPremium(): Promise<boolean> {
  try { if (!(await configure())) return false; return active(await lib().getCustomerInfo()); } catch { return false; }
}

export async function buyPremium(): Promise<{ ok: boolean; cancelled?: boolean; error?: string }> {
  try {
    if (!(await configure())) return { ok: false, error: "unavailable" };
    const offerings = await lib().getOfferings();
    const pkg = offerings.current?.availablePackages?.find((x: any) => x.product.identifier === PRODUCT_ID) ?? offerings.current?.availablePackages?.[0];
    if (!pkg) return { ok: false, error: "no_product" };
    const { customerInfo } = await lib().purchasePackage(pkg);
    return { ok: active(customerInfo) };
  } catch (e: any) {
    return { ok: false, cancelled: !!e?.userCancelled, error: e?.message };
  }
}

export async function restorePremium(): Promise<boolean> {
  try { if (!(await configure())) return false; return active(await lib().restorePurchases()); } catch { return false; }
}
