# PAUSA — PRD

## Original problem statement (summary)
PAUSA — anti-stress Android game (Expo/React Native/TypeScript) with 50 real minigames in 5 worlds, lives (5 max, 1 every 2h24m → 12h full, persistent, offline), free/challenge/relax modes, favorites, recent, collection, map, XP/coins/stars/achievements/daily goals/streak, sounds/vibration/accessibility, ES/EN, AdMob (banner, interstitial, rewarded +1 life max 5/day), premium remove-ads purchase, offline local save, tests, build docs.

## User choices
- AdMob real with test ads (works only in native build)
- Premium via Emergent-managed RevenueCat
- Default language = device language

## Architecture
- frontend/src/core: lives.ts (pure), rewards.ts (pure), registry.ts (50 games), cosmetics.ts, progress.ts, i18n.ts, sound.ts (expo-audio + haptics), state.tsx (GameProvider, sanitized local persistence, server time offset)
- frontend/src/games: kit.tsx (engine helpers), world1..5.tsx (50 components), index.ts (id→component)
- frontend/src/ads (native/web), src/purchases (native/web)
- frontend/app: index (home), map, world/[id], play/[id] (game shell: intro/play/pause/result, timer, back handler), free, favorites, challenges, collection, settings
- backend: GET /api/time
- tests: frontend/tests/logic.test.ts (node test runner, simulated clock) — 12 pass
- Docs: /app/BUILD_AND_PUBLISH.md, /app/PRIVACY.md

## Implemented (2026-06)
- All 50 minigames playable (web-verified by testing agent: all open, render, no crashes)
- Lives system + countdown + no-lives modal; free/relax never consume lives
- Rewarded/interstitial/banner wrappers (unavailable in Expo Go/web, nothing simulated)
- RevenueCat premium wrapper (needs EXPO_PUBLIC_REVENUECAT_ANDROID_KEY + Play product)
- Progression, cosmetics, daily goals, achievements, stats, streak, settings, i18n
- Original synthesized sounds + ambient loop; original SVG mascot "Pau"

## Not verified / backlog
- P0: Test on a real Android build (APK) — ads, purchases, haptics, audio
- P0: RevenueCat key + Play Console product `remove_ads_lifetime`; real AdMob IDs
- P1: Final app icon/splash art; cosmetic rewarded ad
- P1: Retest coin purchase/equip & daily claim flows
- P2: More levels per game, cloud sync (keeping local mode)
