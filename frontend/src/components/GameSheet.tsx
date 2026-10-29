import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, Leaf, Lightning, Play, Star } from "phosphor-react-native";

import { GameDef } from "@/src/core/registry";
import { useGame } from "@/src/core/state";
import { worldColors, useTheme } from "@/src/theme";
import { Chunky, Txt } from "./ui";

export function GameCard({ g, onPress }: { g: GameDef; onPress: () => void }) {
  const { colors } = useTheme();
  const { save, toggleFav } = useGame();
  const st = save.games[g.id];
  const fav = save.favorites.includes(g.id);
  const wc = worldColors[g.world - 1];
  return (
    <Pressable testID={`game-card-${g.id}`} onPress={onPress} style={({ pressed }) => [s.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={[s.num, { backgroundColor: wc }]}><Txt v="title" color="#FFFFFF">{g.num}</Txt></View>
      <Txt v="bold" numberOfLines={1} style={{ marginTop: 6 }}>{g.name}</Txt>
      <View style={{ flexDirection: "row", gap: 2 }}>{[0, 1, 2].map((i) => <Star key={i} size={14} weight="fill" color={i < (st?.stars ?? 0) ? colors.brandTertiary : colors.border} />)}</View>
      <Pressable testID={`fav-toggle-${g.id}`} hitSlop={10} onPress={() => toggleFav(g.id)} style={s.fav}>
        <Heart size={22} weight={fav ? "fill" : "regular"} color={fav ? colors.brandPrimary : colors.muted} />
      </Pressable>
    </Pressable>
  );
}

/** Mode picker shown before opening a game. Challenge may be locked; free & relax never are. */
export function GameSheet({ g, onClose, challengeLocked, onNoLives }: { g: GameDef | null; onClose: () => void; challengeLocked?: boolean; onNoLives: () => void }) {
  const { colors } = useTheme();
  const { t, save, livesNow, toggleFav } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (!g) return null;
  const go = (mode: string) => { onClose(); router.push(`/play/${g.id}?mode=${mode}`); };
  const st = save.games[g.id];
  const fav = save.favorites.includes(g.id);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(45,49,66,0.45)" }]} onPress={onClose} />
      <View testID="game-sheet" style={[s.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
        <View style={[s.grab, { backgroundColor: colors.borderStrong }]} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={[s.num, { backgroundColor: worldColors[g.world - 1] }]}><Txt v="title" color="#FFFFFF">{g.num}</Txt></View>
          <View style={{ flex: 1 }}>
            <Txt v="title" testID="game-sheet-title">{g.name}</Txt>
            <Txt v="caption" color={colors.muted}>{t(`w${g.world}` as any)} · {t("plays")}: {st?.plays ?? 0} · {t("score")}: {st?.best ?? 0}</Txt>
          </View>
          <Pressable testID="game-sheet-fav" hitSlop={10} onPress={() => toggleFav(g.id)}><Heart size={30} weight={fav ? "fill" : "regular"} color={colors.brandPrimary} /></Pressable>
        </View>
        <Txt v="body">{g.rules[save.settings.lang]}</Txt>
        <Chunky testID="mode-challenge-button" label={`${t("challenge")} · ${g.target} / ${g.time}s`} color={colors.brandPrimary} disabled={challengeLocked}
          icon={<Lightning size={22} weight="fill" color={colors.onBrandPrimary} />}
          onPress={() => (livesNow() <= 0 ? (onClose(), onNoLives()) : go("challenge"))} />
        {challengeLocked && <Txt v="caption" color={colors.muted}>{t("locked")}</Txt>}
        <Chunky testID="mode-free-button" label={t("freeMode")} color={colors.brand} icon={<Play size={22} weight="fill" color={colors.onBrand} />} onPress={() => go("free")} />
        <Chunky testID="mode-relax-button" label={t("relaxMode")} color={colors.brandSecondary} icon={<Leaf size={22} weight="fill" color={colors.onBrandSecondary} />} onPress={() => go("relax")} />
        <Txt v="caption" color={colors.muted} style={{ textAlign: "center" }}>{t("needLives")}</Txt>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 20, borderWidth: 1, borderBottomWidth: 4, padding: 12, minHeight: 120 },
  num: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  fav: { position: "absolute", top: 10, right: 10 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12 },
  grab: { width: 48, height: 5, borderRadius: 3, alignSelf: "center" },
});
