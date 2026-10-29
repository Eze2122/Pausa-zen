import React from "react";
import { View } from "react-native";

import { bannerParts } from "@/src/ads/ads";
import { useGame } from "@/src/core/state";

/** Banner only for non-interactive screens (map, collection, settings). Hidden for premium. */
export function AdBanner() {
  const { premium, loaded } = useGame();
  const parts = loaded && !premium ? bannerParts() : null;
  if (!parts) return null;
  const { BannerAd, size, unitId } = parts;
  return (
    <View testID="ad-banner" style={{ alignItems: "center" }}>
      <BannerAd unitId={unitId} size={size} requestOptions={{ requestNonPersonalizedAdsOnly: false }} />
    </View>
  );
}
