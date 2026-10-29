import React from "react";
import { useGame } from "@/src/core/state";
import { GAMES } from "@/src/core/registry";
import { Screen } from "@/src/components/ui";
import { GameGrid } from "@/src/components/GameGrid";

export default function Favorites() {
  const { save, t } = useGame();
  const list = save.favorites.map((id) => GAMES.find((g) => g.id === id)!).filter(Boolean);
  return (
    <Screen title={t("favorites")} testID="favorites-screen">
      <GameGrid list={list} empty={t("favEmpty")} />
    </Screen>
  );
}
