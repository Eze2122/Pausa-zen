import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crown } from "phosphor-react-native";

import { useGame, Settings } from "@/src/core/state";
import { purchasesAvailable } from "@/src/purchases/premium";
import { Card, Chunky, Screen, Txt } from "@/src/components/ui";
import { AdBanner } from "@/src/components/AdBanner";
import { AdLifeButton } from "@/src/components/NoLivesModal";
import { useTheme } from "@/src/theme";

export default function SettingsScreen() {
  const { save, t, setSetting, premium, buyPremium, restorePremium, resetAll } = useGame();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [confirm, setConfirm] = useState(false);
  const [pmsg, setPmsg] = useState("");
  const st = save.settings;
  const Row = ({ k, label }: { k: keyof Settings; label: string }) => (
    <View style={s.row}>
      <Txt v="bold" style={{ flex: 1 }}>{label}</Txt>
      <Switch testID={`setting-${k}`} value={!!st[k]} onValueChange={(v) => setSetting(k, v as never)} trackColor={{ true: colors.brand, false: colors.borderStrong }} thumbColor={colors.surfaceSecondary} />
    </View>
  );
  const canBuy = purchasesAvailable();
  return (
    <Screen title={t("settings")} testID="settings-screen">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
        <Card style={{ gap: 12 }}>
          <Txt v="bold">{t("language")}</Txt>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(["es", "en"] as const).map((l) => (
              <Pressable key={l} testID={`lang-${l}`} onPress={() => setSetting("lang", l)} style={[s.seg, { backgroundColor: st.lang === l ? colors.brandSecondary : colors.surfaceTertiary }]}>
                <Txt v="bold" color={st.lang === l ? colors.onBrandSecondary : colors.onSurface}>{l === "es" ? "Español" : "English"}</Txt>
              </Pressable>
            ))}
          </View>
        </Card>
        <Card style={{ gap: 8 }}>
          <Row k="music" label={t("music")} />
          <Row k="sfx" label={t("sfx")} />
          <Row k="vibration" label={t("vibration")} />
          <Txt v="bold">{t("volume")}</Txt>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <Pressable key={v} testID={`volume-${v * 100}`} onPress={() => setSetting("volume", v)} style={[s.seg, { backgroundColor: st.volume === v ? colors.brand : colors.surfaceTertiary }]}>
                <Txt v="bold" color={st.volume === v ? colors.onBrand : colors.onSurface}>{v * 100}%</Txt>
              </Pressable>
            ))}
          </View>
          <Row k="reduceMotion" label={t("reduceMotion")} />
          <Row k="largeText" label={t("largeText")} />
        </Card>
        <Card style={{ gap: 10 }}>
          <AdLifeButton testID="settings-ad-life-button" />
        </Card>
        <Card style={{ gap: 10 }} testID="premium-card">
          <View style={s.rowC}><Crown size={28} weight="fill" color={colors.brandTertiary} /><Txt v="title">{t("premium")}</Txt></View>
          {premium ? <Txt v="bold" color={colors.success} testID="premium-active">{t("premiumActive")}</Txt> : (
            <>
              <Txt v="body" color={colors.muted}>{t("premiumDesc")}</Txt>
              <Chunky testID="buy-premium-button" label={t("buyPremium")} color={colors.brandSecondary} disabled={!canBuy} onPress={async () => { setPmsg(""); const ok = await buyPremium(); if (!ok) setPmsg(""); }} />
              <Chunky testID="restore-premium-button" size="sm" label={t("restore")} color={colors.info} textColor={colors.onInfo} disabled={!canBuy} onPress={async () => { const ok = await restorePremium(); setPmsg(ok ? t("premiumActive") : "—"); }} />
              {!canBuy && <Txt v="caption" color={colors.muted} testID="premium-unavailable">{t("premiumUnavailable")}</Txt>}
              {!!pmsg && <Txt v="caption">{pmsg}</Txt>}
            </>
          )}
        </Card>
        <Card style={{ gap: 6 }}>
          <Txt v="bold">{t("privacy")}</Txt>
          <Txt v="caption" color={colors.muted}>{t("privacyText")}</Txt>
          <Txt v="caption" color={colors.muted}>{t("coinsNote")}</Txt>
        </Card>
        <Chunky testID="reset-progress-button" size="sm" label={confirm ? t("resetConfirm") : t("resetProgress")} color={colors.error}
          onPress={() => { if (confirm) { resetAll(); setConfirm(false); } else setConfirm(true); }} />
        <Txt v="caption" color={colors.muted} style={{ textAlign: "center" }}>PAUSA v1.0.0</Txt>
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom }}>{!premium && <AdBanner />}</View>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 48 },
  rowC: { flexDirection: "row", alignItems: "center", gap: 10 },
  seg: { flex: 1, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
