import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LockSimple, Star } from "phosphor-react-native";

import { useGame } from "@/src/core/state";
import { WORLDS, gamesOfWorld } from "@/src/core/registry";
import { Screen, Txt } from "@/src/components/ui";
import { LivesPill } from "@/src/components/LivesPill";
import { AdBanner } from "@/src/components/AdBanner";
import { worldColors, useTheme } from "@/src/theme";
import { worldStars, worldUnlocked, UNLOCK_STARS } from "@/src/core/progress";

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { save, t } = useGame();
  return (
    <Screen title={t("map")} right={<LivesPill showTimer={false} />} testID="map-screen">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
        {WORLDS.map((w, i) => {
          const st = worldStars(save, w.id), open = worldUnlocked(save, w.id), done = gamesOfWorld(w.id).filter((g) => (save.games[g.id]?.stars ?? 0) > 0).length;
          return (
            <Pressable key={w.id} testID={`map-world-${w.id}`} onPress={() => router.push(`/world/${w.id}`)}
              style={({ pressed }) => [s.card, { backgroundColor: worldColors[w.id - 1], alignSelf: i % 2 ? "flex-end" : "flex-start", transform: [{ scale: pressed ? 0.97 : 1 }, { rotate: i % 2 ? "1.5deg" : "-1.5deg" }] }]}>
              <View style={[s.blob, { right: -30, top: -30 }]} /><View style={[s.blob, { width: 60, height: 60, left: -20, bottom: -20 }]} />
              <Txt v="display" color="#FFFFFF" style={{ fontSize: 44 }}>{w.id}</Txt>
              <Txt v="title" color="#FFFFFF">{t(w.key as any)}</Txt>
              <View style={s.row}>
                <Star size={18} weight="fill" color="#FFFFFF" /><Txt v="bold" color="#FFFFFF" testID={`map-world-${w.id}-stars`}>{st}/30</Txt>
                <Txt v="caption" color="#FFFFFF"> · {done}/10</Txt>
              </View>
              <View style={[s.bar]}><View style={{ width: `${(st / 30) * 100}%`, height: "100%", backgroundColor: "#FFFFFF", borderRadius: 6 }} /></View>
              {!open && (
                <View style={[s.row, { marginTop: 6 }]}><LockSimple size={16} weight="fill" color="#FFFFFF" /><Txt v="caption" color="#FFFFFF">{t("unlockHint", { n: UNLOCK_STARS })}</Txt></View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.surface }}><AdBanner /></View>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { width: "88%", borderRadius: 28, padding: 18, gap: 4, overflow: "hidden", borderBottomWidth: 8, borderColor: "#00000022" },
  blob: { position: "absolute", width: 110, height: 110, borderRadius: 60, backgroundColor: "#FFFFFF33" },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  bar: { height: 10, borderRadius: 6, backgroundColor: "#FFFFFF55", overflow: "hidden", marginTop: 6 },
});
