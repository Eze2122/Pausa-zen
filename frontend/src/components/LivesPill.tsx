import React from "react";
import { View } from "react-native";
import { Heart } from "phosphor-react-native";

import { useGame, useNow } from "@/src/core/state";
import { formatHMS, MAX_LIVES, msToNextLife, recover } from "@/src/core/lives";
import { useTheme } from "@/src/theme";
import { Pill, Txt } from "./ui";

export function useLivesView() {
  const { save } = useGame();
  const n = useNow(1000);
  const l = recover(save.lives, n);
  return { lives: l.lives, ms: msToNextLife(l, n) };
}

export function LivesPill({ showTimer = true }: { showTimer?: boolean }) {
  const { colors } = useTheme();
  const { t } = useGame();
  const { lives, ms } = useLivesView();
  return (
    <Pill testID="lives-pill">
      <Heart size={22} weight="fill" color={colors.brandPrimary} />
      <View>
        <Txt v="bold" testID="lives-count">{lives}/{MAX_LIVES}</Txt>
        {showTimer && lives < MAX_LIVES && (
          <Txt v="caption" color={colors.muted} testID="lives-timer">{formatHMS(ms)}</Txt>
        )}
      </View>
      {showTimer && lives >= MAX_LIVES && <Txt v="caption" color={colors.muted}>{t("livesFull")}</Txt>}
    </Pill>
  );
}
