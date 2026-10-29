import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Coins, LockSimple } from "phosphor-react-native";

import { useGame } from "@/src/core/state";
import { COSMETICS, CosKind } from "@/src/core/cosmetics";
import { levelInfo } from "@/src/core/rewards";
import { Card, Chunky, Pill, Screen, Txt } from "@/src/components/ui";
import { AdBanner } from "@/src/components/AdBanner";
import { useTheme } from "@/src/theme";

export default function Collection() {
  const { save, t, buyCos, equip } = useGame();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<CosKind>("bg");
  const [msg, setMsg] = useState("");
  const lvl = levelInfo(save.xp).level;
  const tabs: [CosKind, string][] = [["bg", t("backgrounds")], ["mascot", t("characters")], ["fx", t("effects")]];
  return (
    <Screen title={t("collection")} testID="collection-screen" right={<Pill><Coins size={20} weight="fill" color={colors.brandTertiary} /><Txt v="bold" testID="collection-coins">{save.coins}</Txt></Pill>}>
      <View style={{ height: 56 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}>
          {tabs.map(([k, l]) => (
            <Pressable key={k} testID={`collection-tab-${k}`} onPress={() => setKind(k)} style={[s.chip, { backgroundColor: kind === k ? colors.brandSecondary : colors.surfaceSecondary, borderColor: colors.brandSecondary }]}>
              <Txt v="bold" color={kind === k ? colors.onBrandSecondary : colors.onSurface}>{l}</Txt>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: 24 }}>
        {!!msg && <Txt v="bold" color={colors.error} testID="collection-message">{msg}</Txt>}
        <View style={s.grid}>
          {COSMETICS.filter((c) => c.kind === kind).map((c) => {
            const owned = save.owned.includes(c.id), on = save.equipped[c.kind] === c.id, lockedLvl = lvl < c.level;
            return (
              <Card key={c.id} testID={`cosmetic-${c.id}`} style={{ width: "48%", gap: 8, opacity: owned || !lockedLvl ? 1 : 0.6 }}>
                <LinearGradient colors={c.colors.length > 1 ? (c.colors as [string, string, ...string[]]) : [c.colors[0], c.colors[0]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.preview}>
                  {!owned && <LockSimple size={28} weight="fill" color="#2D3142" />}
                </LinearGradient>
                <Txt v="bold" numberOfLines={1}>{c.name[save.settings.lang]}</Txt>
                {owned ? (
                  on ? <Txt v="bold" color={colors.success}>{t("equipped")}</Txt>
                    : <Chunky testID={`equip-${c.id}`} size="sm" label={t("equip")} color={colors.brand} onPress={() => equip(c.id)} />
                ) : lockedLvl ? (
                  <Txt v="caption" color={colors.muted}>{t("needLevel", { n: c.level })} · {c.price}</Txt>
                ) : (
                  <Chunky testID={`buy-${c.id}`} size="sm" label={`${c.price}`} color={colors.brandTertiary} textColor={colors.onBrandTertiary}
                    icon={<Coins size={18} weight="fill" color={colors.onBrandTertiary} />}
                    onPress={() => setMsg(buyCos(c.id) ? "" : t("notEnough"))} />
                )}
              </Card>
            );
          })}
        </View>
        <Txt v="caption" color={colors.muted} style={{ textAlign: "center" }}>{t("coinsNote")}</Txt>
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom }}><AdBanner /></View>
    </Screen>
  );
}

const s = StyleSheet.create({
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, justifyContent: "center", flexShrink: 0 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  preview: { height: 90, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
