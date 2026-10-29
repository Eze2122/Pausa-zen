import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";
import { LockSimple, Star } from "phosphor-react-native";

import { useGame } from "@/src/core/state";
import { GameDef, gamesOfWorld } from "@/src/core/registry";
import { levelUnlocked, worldStars } from "@/src/core/progress";
import { Screen, Txt } from "@/src/components/ui";
import { LivesPill } from "@/src/components/LivesPill";
import { GameSheet } from "@/src/components/GameSheet";
import { NoLivesModal } from "@/src/components/NoLivesModal";
import { worldColors, useTheme } from "@/src/theme";

function Node({ g, i, x, y, open, stars, color, onPress, reduce }: { g: GameDef; i: number; x: number; y: number; open: boolean; stars: number; color: string; onPress: () => void; reduce: boolean }) {
  const { colors } = useTheme();
  const sc = useSharedValue(reduce ? 1 : 0);
  useEffect(() => { if (!reduce) sc.value = withDelay(i * 60, withSpring(1, { damping: 9 })); }, [sc, i, reduce]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[{ position: "absolute", left: x - 44, top: y - 44, width: 88, alignItems: "center" }, a]}>
      <Pressable testID={`level-node-${g.id}`} onPress={onPress} style={({ pressed }) => [s.node, { backgroundColor: open ? color : colors.surfaceSecondary, borderColor: open ? "#00000022" : colors.borderStrong, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
        {open ? <Txt v="title" color="#FFFFFF">{g.num}</Txt> : <LockSimple size={24} weight="fill" color={colors.muted} />}
      </Pressable>
      <View style={{ flexDirection: "row", marginTop: 2 }}>{[0, 1, 2].map((k) => <Star key={k} size={14} weight="fill" color={k < stars ? colors.brandTertiary : colors.border} />)}</View>
      <Txt v="caption" numberOfLines={1} style={{ textAlign: "center" }}>{g.name}</Txt>
    </Animated.View>
  );
}

export default function WorldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const w = Math.max(1, Math.min(5, Number(id) || 1));
  const { save, t } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const games = gamesOfWorld(w);
  const color = worldColors[w - 1];
  const [sel, setSel] = useState<GameDef | null>(null);
  const [noLives, setNoLives] = useState(false);
  const STEP = 130, H = games.length * STEP + 60;
  const pos = games.map((_, i) => ({ x: width / 2 + Math.sin(i * 1.1) * (width * 0.28), y: 70 + i * STEP }));
  const path = pos.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `Q${(pos[i - 1].x + p.x) / 2 + (i % 2 ? 60 : -60)} ${(pos[i - 1].y + p.y) / 2} ${p.x} ${p.y}`)).join(" ");
  return (
    <Screen title={t(`w${w}` as any)} right={<LivesPill showTimer={false} />} testID="world-screen">
      <View style={s.head}>
        <Star size={20} weight="fill" color={color} /><Txt v="bold" testID="world-stars">{worldStars(save, w)}/30 {t("stars")}</Txt>
      </View>
      <ScrollView contentContainerStyle={{ height: H + insets.bottom }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: 0.1 }]} />
        <Svg width={width} height={H} style={{ position: "absolute" }}>
          <Path d={path} stroke={color} strokeOpacity={0.35} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray="2 22" />
        </Svg>
        {games.map((g, i) => (
          <Node key={g.id} g={g} i={i} x={pos[i].x} y={pos[i].y} open={levelUnlocked(save, w, i)} stars={save.games[g.id]?.stars ?? 0} color={color} reduce={save.settings.reduceMotion} onPress={() => setSel(g)} />
        ))}
      </ScrollView>
      <GameSheet g={sel} onClose={() => setSel(null)} challengeLocked={sel ? !levelUnlocked(save, w, games.indexOf(sel)) : false} onNoLives={() => setNoLives(true)} />
      <NoLivesModal visible={noLives} onClose={() => setNoLives(false)} onRelax={() => { setNoLives(false); router.push("/free"); }} onMap={() => { setNoLives(false); router.replace("/map"); }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
  node: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", borderWidth: 2, borderBottomWidth: 7 },
});
