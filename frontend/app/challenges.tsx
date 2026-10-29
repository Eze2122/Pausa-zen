import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, Fire, Medal, Trophy } from "phosphor-react-native";

import { useGame, useNow } from "@/src/core/state";
import { ACHIEVEMENTS, freshDaily, goalsFor } from "@/src/core/rewards";
import { Card, Chunky, Screen, Txt } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function Challenges() {
  const { save, t, claimGoal } = useGame();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow(60000);
  const d = freshDaily(save.daily, now);
  const goals = goalsFor(d.date);
  const stars = Object.values(save.games).reduce((a, g) => a + g.stars, 0);
  const mins = Math.round(save.stats.seconds / 60);
  return (
    <Screen title={t("challenges")} testID="challenges-screen">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        <Txt v="title">{t("daily")}</Txt>
        {goals.map((g, i) => {
          const prog = Math.min(g.amount, d[g.kind]), claimed = d.claimed.includes(i), ready = prog >= g.amount;
          return (
            <Card key={i} testID={`daily-goal-${i}`} style={{ gap: 8 }}>
              <View style={s.row}>
                <Trophy size={26} weight="fill" color={colors.brandTertiary} />
                <Txt v="bold" style={{ flex: 1 }}>{t(`goal_${g.kind}` as any, { n: g.amount })}</Txt>
                <Txt v="bold" color={colors.onBrandTertiary}>+{g.coins}</Txt>
              </View>
              <View style={[s.bar, { backgroundColor: colors.surfaceTertiary }]}><View style={{ width: `${(prog / g.amount) * 100}%`, height: "100%", backgroundColor: colors.success, borderRadius: 6 }} /></View>
              <View style={s.row}>
                <Txt v="caption" color={colors.muted} style={{ flex: 1 }}>{prog}/{g.amount}</Txt>
                {claimed ? <Txt v="bold" color={colors.success}>{t("claimed")}</Txt> : <Chunky testID={`claim-goal-${i}`} size="sm" label={t("claim")} disabled={!ready} color={colors.success} textColor={colors.onSuccess} onPress={() => claimGoal(i)} style={{ width: 130 }} />}
              </View>
            </Card>
          );
        })}
        <Card style={s.row} testID="streak-card">
          <Fire size={30} weight="fill" color={colors.brandPrimary} />
          <Txt v="bold" style={{ flex: 1 }}>{t("streak")}: {save.streak.count} {t("days")}</Txt>
          <Txt v="caption" color={colors.muted}>Max {save.streak.best}</Txt>
        </Card>
        <Txt v="title">{t("stats")}</Txt>
        <View style={s.stats}>
          {[[t("plays"), save.stats.plays], [t("wins"), save.stats.wins], [t("totalStars"), stars], [t("playTime"), `${mins} min`]].map(([k, v]) => (
            <Card key={String(k)} style={{ width: "48%", alignItems: "center" }}><Txt v="title">{v}</Txt><Txt v="caption" color={colors.muted}>{k}</Txt></Card>
          ))}
        </View>
        <Txt v="title">{t("achievements")}</Txt>
        {ACHIEVEMENTS.map((a) => {
          const got = save.achievements.includes(a.id);
          return (
            <Card key={a.id} testID={`achievement-${a.id}`} style={[s.row, { opacity: got ? 1 : 0.55 }]}>
              {got ? <CheckCircle size={26} weight="fill" color={colors.success} /> : <Medal size={26} weight="regular" color={colors.muted} />}
              <Txt v="bold" style={{ flex: 1 }}>{t(`ach_${a.id}` as any)}</Txt>
              <Txt v="caption" color={colors.muted}>+25</Txt>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  bar: { height: 10, borderRadius: 6, overflow: "hidden" },
  stats: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
});
