export const ENTITLEMENT_ID = "remove_ads";
export const purchasesAvailable = () => false;
export async function checkPremium() { return false; }
export async function buyPremium() { return { ok: false, error: "unavailable" } as { ok: boolean; cancelled?: boolean; error?: string }; }
export async function restorePremium() { return false; }
