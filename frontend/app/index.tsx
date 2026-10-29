import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Coins, GearSix, Heart, Medal, Play, SpeakerHigh, SpeakerSlash, Sparkle, Star, InfinityIcon as Inf } from "phosphor-react-native";

import { useGame } from "@/src/core/state";
import { levelInfo } from "@/src/core/rewards";
import { getGame, WORLDS } from "@/src/core/registry";
import { Background, Chunky, IconBtn, Pill, Txt } from "@/src/components/ui";
import { LivesPill, useLivesView } from "@/src/components/LivesPill";
import { AdLifeButton } from "@/src/components/NoLivesModal";
import { Logo, Mascot } from "@/src/components/Mascot";
import { worldColors, spacing, useTheme } from "@/src/theme";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { save, t, setSetting } = useGame();
  const { lives } = useLivesView();
  const lv = levelInfo(save.xp);
  const soundOn = save.settings.sfx || save.settings.music;
  return (
    <View testID="home-screen" style={{ flex: 1, backgroundColor: colors.surface }}>
      <Background />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.lg }}>
        <View style={s.top}>
          <LivesPill />
          <Pill testID="coins-pill"><Coins size={22} weight="fill" color={colors.brandTertiary} /><Txt v="bold" testID="coins-count">{save.coins}</Txt></Pill>
          <View style={{ flex: 1 }} />
          <IconBtn testID="sound-toggle-button" onPress={() => { setSetting("sfx", !soundOn); if (soundOn) setSetting("music", false); }}>
            {soundOn ? <SpeakerHigh size={22} weight="fill" color={colors.brand} /> : <SpeakerSlash size={22} weight="fill" color={colors.muted} />}
          </IconBtn>
        </View>
        <View testID="level-bar" style={[s.level, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={[s.lvBadge, { backgroundColor: colors.brandSecondary }]}><Txt v="title" color={colors.onBrandSecondary}>{lv.level}</Txt></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="bold">{t("level")} {lv.level}</Txt>
            <View style={[s.bar, { backgroundColor: colors.surfaceTertiary }]}><View style={{ width: `${(lv.cur / lv.need) * 100}%`, height: "100%", borderRadius: 8, backgroundColor: colors.brandSecondary }} /></View>
          </View>
          <Txt v="caption" color={colors.muted}>{lv.cur}/{lv.need} XP</Txt>
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Logo size={58} />
          <Txt v="bold" color={colors.muted}>{t("subtitle")}</Txt>
          <Mascot size={150} testID="home-mascot" />
        </View>
        <Chunky testID="home-play-button" label={t("play")} size="lg" icon={<Play size={30} weight="fill" color={colors.onBrandPrimary} />} onPress={() => router.push("/map")} />
        {lives < 5 && <AdLifeButton testID="home-free-life-button" />}
        <View style={s.grid}>
          {[
            { k: "collection", to: "/collection", c: colors.brandSecondary, I: Sparkle },
            { k: "favorites", to: "/favorites", c: colors.brandPrimary, I: Heart },
            { k: "challenges", to: "/challenges", c: colors.brandTertiary, I: Medal },
            { k: "settings", to: "/settings", c: colors.info, I: GearSix },
          ].map(({ k, to, c, I }) => (
            <Chunky key={k} testID={`home-${k}-button`} size="sm" label={t(k as any)} color={c} textColor={c === colors.brandTertiary ? colors.onBrandTertiary : "#FFFFFF"}
              icon={<I size={18} weight="fill" color={c === colors.brandTertiary ? colors.onBrandTertiary : "#FFFFFF"} />} style={{ width: "48%" }} onPress={() => router.push(to as any)} />
          ))}
        </View>
        <Chunky testID="home-free-mode-button" size="md" label={`${t("freeMode")} · ${t("allGames")}`} color={colors.brand} icon={<Inf size={22} weight="bold" color={colors.onBrand} />} onPress={() => router.push("/free")} />
        <Txt v="title">{t("worlds")}</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {WORLDS.map((w) => {
            const stars = Object.entries(save.games).filter(([id]) => getGame(id)?.world === w.id).reduce((a, [, g]) => a + g.stars, 0);
            return (
              <Pressable key={w.id} testID={`home-world-${w.id}`} onPress={() => router.push(`/world/${w.id}`)} style={[s.world, { backgroundColor: worldColors[w.id - 1] }]}>
                <Txt v="display" color="#FFFFFF" style={{ fontSize: 34 }}>{w.id}</Txt>
                <Txt v="bold" color="#FFFFFF" numberOfLines={2}>{t(w.key as any)}</Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Star size={14} weight="fill" color="#FFFFFF" /><Txt v="caption" color="#FFFFFF">{stars}/30</Txt></View>
              </Pressable>
            );
          })}
        </ScrollView>
        {save.recent.length > 0 && (
          <>
            <Txt v="title">{t("recent")}</Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {save.recent.map((id) => { const g = getGame(id)!; return (
                <Pressable key={id} testID={`recent-${id}`} onPress={() => router.push(`/play/${id}?mode=free`)} style={[s.recent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <View style={[s.dot, { backgroundColor: worldColors[g.world - 1] }]}><Txt v="bold" color="#FFFFFF">{g.num}</Txt></View>
                  <Txt v="bold" numberOfLines={1} style={{ maxWidth: 110 }}>{g.name}</Txt>
                </Pressable>); })}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  level: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 20, borderWidth: 1, borderBottomWidth: 4 },
  lvBadge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  bar: { height: 12, borderRadius: 8, overflow: "hidden" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  world: { width: 130, height: 140, borderRadius: 24, padding: 12, justifyContent: "space-between", borderBottomWidth: 6, borderColor: "#00000022" },
  recent: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, paddingRight: 14, borderRadius: 999, borderWidth: 1, borderBottomWidth: 3 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
