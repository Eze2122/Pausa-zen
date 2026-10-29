import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useGame } from "@/src/core/state";
import { GAMES } from "@/src/core/registry";
import { Screen, Txt } from "@/src/components/ui";
import { GameGrid } from "@/src/components/GameGrid";
import { worldColors, useTheme } from "@/src/theme";

export default function FreeScreen() {
  const { t } = useGame();
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const list = w ? GAMES.filter((g) => g.world === w) : GAMES;
  return (
    <Screen title={`${t("freeMode")} · ${t("allGames")}`} testID="free-screen">
      <View style={{ height: 56 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <Pressable key={k} testID={`world-filter-${k}`} onPress={() => setW(k)} style={[s.chip, { backgroundColor: w === k ? (k ? worldColors[k - 1] : colors.onSurface) : colors.surfaceSecondary, borderColor: k ? worldColors[k - 1] : colors.onSurface }]}>
              <Txt v="bold" color={w === k ? "#FFFFFF" : colors.onSurface}>{k ? t(`w${k}` as any) : t("all")}</Txt>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <GameGrid list={list} />
    </Screen>
  );
}

const s = StyleSheet.create({ chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, justifyContent: "center", flexShrink: 0 } });
