import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";
import { Heart } from "phosphor-react-native";

import { AdMsg, useGame } from "@/src/core/state";
import { adsLeft } from "@/src/core/rewards";
import { formatHMS, MAX_LIVES } from "@/src/core/lives";
import { useTheme } from "@/src/theme";
import { Chunky, Txt } from "./ui";
import { Mascot } from "./Mascot";
import { useLivesView } from "./LivesPill";

/** Reusable rewarded-ad life button (no interstitials around it). */
export function AdLifeButton({ testID = "ad-life-button", big }: { testID?: string; big?: boolean }) {
  const { grantAdLife, save, now, t } = useGame();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<AdMsg | null>(null);
  const left = adsLeft(save.ads, now());
  return (
    <View style={{ gap: 6 }}>
      <Chunky testID={testID} size={big ? "md" : "sm"} color={colors.brand} disabled={busy || left <= 0}
        label={busy ? t("adLoading") : big ? t("watchAd") : t("getFreeLife")}
        icon={busy ? <ActivityIndicator color={colors.onBrand} /> : <Heart size={20} weight="fill" color={colors.onBrand} />}
        onPress={async () => { setBusy(true); setMsg(null); const r = await grantAdLife(); setMsg(r); setBusy(false); }} />
      <Txt v="caption" color={colors.muted} style={{ textAlign: "center" }} testID="ads-left-text">{t("adsLeft", { n: left })}</Txt>
      {msg && <Txt v="caption" testID="ad-result-message" color={msg === "adOk" ? colors.success : colors.onSurfaceTertiary} style={{ textAlign: "center" }}>{t(msg)}</Txt>}
    </View>
  );
}

export function NoLivesModal({ visible, onRelax, onMap, onClose }: { visible: boolean; onRelax: () => void; onMap: () => void; onClose: () => void }) {
  const { t } = useGame();
  const { colors } = useTheme();
  const { lives, ms } = useLivesView();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[s.wrap, { backgroundColor: "rgba(45,49,66,0.55)" }]}>
        <View testID="no-lives-modal" style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Mascot size={110} mood={lives > 0 ? "happy" : "sad"} />
          <Txt v="title" style={{ fontSize: 28 }}>{lives > 0 ? t("adOk") : t("noLivesTitle")}</Txt>
          <View style={s.hearts}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Heart key={i} size={30} weight={i < lives ? "fill" : "regular"} color={i < lives ? colors.brandPrimary : colors.borderStrong} />
            ))}
          </View>
          <Txt v="bold" testID="no-lives-count">{lives}/{MAX_LIVES}</Txt>
          {lives < MAX_LIVES && <Txt v="body" color={colors.muted} testID="no-lives-timer">{t("nextLife")} {formatHMS(ms)}</Txt>}
          <Txt v="caption" color={colors.muted} style={{ textAlign: "center" }}>{t("noLivesBody")}</Txt>
          <View style={{ alignSelf: "stretch", gap: 10, marginTop: 8 }}>
            {lives < MAX_LIVES && <AdLifeButton testID="no-lives-watch-ad-button" big />}
            {lives > 0 && <Chunky testID="no-lives-continue-button" label={t("resume")} color={colors.brandPrimary} onPress={onClose} />}
            <Chunky testID="no-lives-relax-button" label={t("keepRelax")} color={colors.brandSecondary} size="sm" onPress={onRelax} />
            <Chunky testID="no-lives-map-button" label={t("toMap")} color={colors.brandTertiary} textColor={colors.onBrandTertiary} size="sm" onPress={onMap} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 420, borderRadius: 28, borderWidth: 1, borderBottomWidth: 6, padding: 20, alignItems: "center", gap: 6 },
  hearts: { flexDirection: "row", gap: 6, marginVertical: 4 },
});
