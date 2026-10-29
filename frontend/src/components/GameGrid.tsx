import React, { useState } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/src/core/state";
import { GameDef } from "@/src/core/registry";
import { levelUnlocked } from "@/src/core/progress";
import { Txt } from "@/src/components/ui";
import { GameCard, GameSheet } from "@/src/components/GameSheet";
import { NoLivesModal } from "@/src/components/NoLivesModal";
import { useTheme } from "@/src/theme";

export function GameGrid({ list, empty }: { list: GameDef[]; empty?: string }) {
  const { save } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [sel, setSel] = useState<GameDef | null>(null);
  const [noLives, setNoLives] = useState(false);
  return (
    <>
      <FlatList data={list} keyExtractor={(g) => g.id} numColumns={2} contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: insets.bottom + 16 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: "50%" }}><GameCard g={item} onPress={() => setSel(item)} /></View>
        )}
        ListEmptyComponent={empty ? <Txt v="body" color={colors.muted} style={{ textAlign: "center", padding: 32 }} testID="grid-empty">{empty}</Txt> : undefined} />
      <GameSheet g={sel} onClose={() => setSel(null)} challengeLocked={sel ? !levelUnlocked(save, sel.world, (sel.num - 1) % 10) : false} onNoLives={() => setNoLives(true)} />
      <NoLivesModal visible={noLives} onClose={() => setNoLives(false)} onRelax={() => setNoLives(false)} onMap={() => { setNoLives(false); router.replace("/map"); }} />
    </>
  );
}

