# PAUSA — Build, AdMob, Billing & Google Play guide

## Status (honest)
- 50 activities implemented (src/games/world1..5.tsx), registered in src/core/registry.ts.
- Verified in the WEB PREVIEW and with logic unit tests only. Not yet verified on a physical Android device.
- AdMob and RevenueCat are native modules: they DO NOT work in Expo Go or web. There, the app shows "no ads available" and never grants rewards. Real test ads appear only in an installed build (APK/AAB).
- Nothing is published. Purchases are NOT active until the Play Console + RevenueCat setup below is done.

## Run unit tests
```
cd frontend && node --experimental-strip-types --test tests/logic.test.ts
```
Covers lives (simulated clock, 12h refill, clock rollback, corrupt state), ad daily limit, interstitial cap, stars/xp/coins/levels, daily goals, streak, and the 50-activity registry.

## Build APK / AAB
Use the Emergent **Publish** button (top right) → generate Android build. Package: `com.emergent.pausazen.k7sbsi`.

## AdMob
1. Create the app in https://apps.admob.com (Android) and 3 ad units: Banner, Interstitial, Rewarded.
2. Replace the TEST App ID in `app.json` (plugin `react-native-google-mobile-ads` → `androidAppId`).
3. Add env vars: `EXPO_PUBLIC_ADMOB_BANNER_ID`, `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID`, `EXPO_PUBLIC_ADMOB_REWARDED_ID`. Without them (or in dev) Google test IDs are used.
4. Publish a UMP consent message in AdMob → Privacy & messaging (EEA/UK).
5. Content rating is set to G (general audience).
Placement rules in code: banners only on Map/Collection/Settings; interstitial only after leaving a result screen, every ≥3 games and ≥3 min, never in Relax mode, never for premium; rewarded only on user tap (max 5/day, +1 life only after EARNED_REWARD + close).

## Premium (RevenueCat, Emergent managed)
1. Play Console: one-time product `remove_ads_lifetime`.
2. RevenueCat: entitlement `remove_ads`, attach product, current offering, restore behavior "Transfer".
3. Set `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (public SDK key). Premium is granted only from RevenueCat `customerInfo`, never from local storage.
4. Test with a license tester on an internal test track.

## Google Play checklist
- App name PAUSA, icon (replace assets/images/icon.png & adaptive-icon.png with final art).
- Permissions: INTERNET, VIBRATE, AD_ID (microphone blocked).
- Data safety: no account; progress stored on-device; AdMob collects device identifiers for ads.
- Target audience: general / all ages (not "designed for children" unless you enable Families ads policy).
- Privacy policy: see PRIVACY.md (host it on a public URL).
