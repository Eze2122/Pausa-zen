import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, BackHandler, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowCounterClockwise, Pause, Star, Timer, X } from "phosphor-react-native";

import { GAMES, getGame } from "@/src/core/registry";
import { GAME_COMPONENTS } from "@/src/games";
import { ResultOut, useGame } from "@/src/core/state";
import { Mode, starsFor } from "@/src/core/rewards";
import { haptic, playSfx } from "@/src/core/sound";
import { Chunky, IconBtn, Pill, Txt } from "@/src/components/ui";
import { NoLivesModal } from "@/src/components/NoLivesModal";
import { Confetti } from "@/src/components/Confetti";
import { Mascot } from "@/src/components/Mascot";
import { gameColors, worldColors, spacing, useTheme } from "@/src/theme";
import type { GameApi } from "@/src/games/kit";

type Phase = "intro" | "play" | "pause" | "result";

export default function PlayScreen() {
  const { id, mode: m } = useLocalSearchParams<{ id: string; mode?: string }>();
  const mode: Mode = m === "challenge" || m === "relax" ? m : "free";
  const def = getGame(String(id));
  const Comp = def ? GAME_COMPONENTS[def.id] : undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, save, pushRecent, livesNow, loseLife, recordResult, maybeInterstitial } = useGame();

  const [phase, setPhase] = useState<Phase>("intro");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(def?.time ?? 60);
  const [round, setRound] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [noLives, setNoLives] = useState(false);
  const [res, setRes] = useState<(ResultOut & { stars: number; won: boolean; lostLife: boolean; score: number }) | null>(null);
  const scoreRef = useRef(0), timeRef = useRef(def?.time ?? 60), startAt = useRef(0), finished = useRef(false), phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;

  useEffect(() => { if (def) pushRecent(def.id); }, [def?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback((won: boolean) => {
    if (!def || finished.current) return;
    finished.current = true;
    const sc = scoreRef.current;
    const w = mode === "challenge" ? won : sc > 0;
    const stars = starsFor(mode, sc, def.target, w, timeRef.current / def.time);
    const lostLife = mode === "challenge" && !won;
    if (lostLife) loseLife();
    const out = recordResult({ id: def.id, mode, score: sc, stars, won: mode === "challenge" ? won : false, seconds: (Date.now() - startAt.current) / 1000 });
    setRes({ ...out, stars, won: w, lostLife, score: sc });
    setPhase("result");
    playSfx(w ? "win" : "fail");
    haptic(w ? "success" : "error");
  }, [def, mode, loseLife, recordResult]);

  const begin = useCallback(() => {
    if (!def) return;
    if (mode === "challenge" && livesNow() <= 0) { setNoLives(true); return; }
    finished.current = false; scoreRef.current = 0; timeRef.current = def.time; startAt.current = Date.now();
    setScore(0); setTimeLeft(def.time); setRes(null); setRound((r) => r + 1); setPhase("play");
  }, [def, mode, livesNow]);

  // Restart from pause: never consumes a life.
  const restart = () => { finished.current = false; scoreRef.current = 0; timeRef.current = def?.time ?? 60; setScore(0); setTimeLeft(def?.time ?? 60); setRound((r) => r + 1); setPhase("play"); };

  // Challenge timer
  useEffect(() => {
    if (phase !== "play" || mode !== "challenge") return;
    const iv = setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - 0.25);
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) finish(false);
    }, 250);
    return () => clearInterval(iv);
  }, [phase, mode, finish]);

  const api = useMemo<GameApi>(() => ({
    score: (n = 1) => {
      if (phaseRef.current !== "play" || finished.current) return;
      scoreRef.current = Math.max(0, scoreRef.current + n);
      setScore(scoreRef.current);
      if (mode === "challenge" && def && scoreRef.current >= def.target) finish(true);
    },
    fail: () => { if (mode === "challenge" && phaseRef.current === "play") finish(false); },
    sfx: playSfx, haptic, reduce: save.settings.reduceMotion, mode, t, lang: save.settings.lang,
  }), [mode, def, finish, save.settings.reduceMotion, save.settings.lang, t]);

  // Android back: playing -> pause menu; otherwise default navigation.
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (phaseRef.current === "play") { setPhase("pause"); return true; }
      return false;
    });
    return () => sub.remove();
  }, []));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => { if (s !== "active" && phaseRef.current === "play") setPhase("pause"); });
    return () => sub.remove();
  }, []);

  const exitGame = () => (router.canGoBack() ? router.back() : router.replace(def ? `/world/${def.world}` : "/map"));
  const leave = async (to: () => void) => { await maybeInterstitial(mode); to(); };
  const next = def ? GAMES.find((g) => g.num === def.num + 1 && g.world === def.world) : undefined;

  if (!def || !Comp) {
    return <View style={[s.center, { backgroundColor: colors.surface }]}><Txt v="title">404</Txt><Chunky label={t("toMap")} onPress={() => router.replace("/map")} /></View>;
  }
  const wc = worldColors[def.world - 1];

  return (
    <View testID="play-screen" style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: wc, opacity: 0.12 }]} />
      {/* HUD */}
      <View style={s.hud}>
        <IconBtn testID="game-exit-button" onPress={exitGame}><X size={22} weight="bold" color={colors.onSurface} /></IconBtn>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Txt v="bold" numberOfLines={1}>{def.name}</Txt>
          <Txt v="caption" color={colors.muted}>{t(mode)}</Txt>
        </View>
        {phase === "play" || phase === "pause" ? (
          <>
            <IconBtn testID="game-restart-button" onPress={restart}><ArrowCounterClockwise size={22} weight="bold" color={colors.onSurface} /></IconBtn>
            <IconBtn testID="game-pause-button" onPress={() => setPhase(phase === "pause" ? "play" : "pause")}><Pause size={22} weight="fill" color={colors.onSurface} /></IconBtn>
          </>
        ) : <View style={{ width: 104 }} />}
      </View>
      <View style={s.stats}>
        <Pill testID="game-score"><Star size={18} weight="fill" color={colors.brandTertiary} /><Txt v="bold">{score}{mode === "challenge" ? ` / ${def.target}` : ""}</Txt></Pill>
        {mode === "challenge" && <Pill testID="game-timer"><Timer size={18} weight="fill" color={timeLeft < 10 ? colors.error : colors.brand} /><Txt v="bold" color={timeLeft < 10 ? colors.error : undefined}>{Math.ceil(timeLeft)}s</Txt></Pill>}
        {mode !== "challenge" && phase === "play" && <Chunky testID="game-finish-button" size="sm" label={t("finish")} color={colors.brand} onPress={() => finish(true)} style={{ minWidth: 120 }} />}
      </View>
      {/* Board */}
      <View style={{ flex: 1, marginHorizontal: spacing.lg }} onLayout={(e) => setSize({ w: Math.floor(e.nativeEvent.layout.width), h: Math.floor(e.nativeEvent.layout.height) })}>
        {size && phase !== "intro" && <Comp key={round} w={size.w} h={size.h} paused={phase !== "play"} api={api} />}
        {phase === "pause" && (
          <View testID="pause-overlay" style={[StyleSheet.absoluteFill, s.overlay, { backgroundColor: colors.surface }]}>
            <Mascot size={110} mood="calm" />
            <Txt v="title" style={{ fontSize: 30 }}>{t("paused")}</Txt>
            <Chunky testID="pause-resume-button" label={t("resume")} onPress={() => setPhase("play")} style={s.btn} />
            <Chunky testID="pause-restart-button" label={t("restart")} size="sm" color={colors.brandSecondary} onPress={restart} style={s.btn} />
            <Chunky testID="pause-exit-button" label={t("exit")} size="sm" color={colors.brandTertiary} textColor={colors.onBrandTertiary} onPress={exitGame} style={s.btn} />
          </View>
        )}
        {phase === "intro" && (
          <View testID="game-intro" style={[StyleSheet.absoluteFill, s.overlay]}>
            <View style={[s.badge, { backgroundColor: wc }]}><Txt v="display" color="#FFFFFF">{def.num}</Txt></View>
            <Txt v="title" style={{ fontSize: 30 }}>{def.name}</Txt>
            <Txt v="bold" color={colors.muted}>{t("rules")}</Txt>
            <Txt v="body" style={{ textAlign: "center", paddingHorizontal: 12 }} testID="game-rules">{def.rules[save.settings.lang]}</Txt>
            {mode === "challenge" && <Txt v="bold" testID="game-goal">{t("goal")}: {def.target} · {t("time")}: {def.time}s</Txt>}
            <Txt v="caption" color={colors.muted}>{mode === "challenge" ? t("challengeDesc") : mode === "relax" ? t("relaxDesc") : t("freeDesc")}</Txt>
            <Chunky testID="game-start-button" label={t("start")} size="lg" onPress={begin} style={s.btn} />
          </View>
        )}
      </View>
      {/* Result */}
      {phase === "result" && res && (
        <View testID="result-overlay" style={[StyleSheet.absoluteFill, s.center, { backgroundColor: "rgba(45,49,66,0.6)" }]}>
          {res.stars > 0 && <Confetti />}
          <View style={[s.result, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Txt v="title" style={{ fontSize: 28 }} testID="result-title">{mode === "challenge" ? (res.won ? t("won") : t("lost")) : t("done")}</Txt>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {[0, 1, 2].map((i) => <Star key={i} size={i === 1 ? 64 : 50} weight="fill" color={i < res.stars ? gameColors[2] : colors.border} />)}
            </View>
            <Txt v="bold" testID="result-score">{t("score")}: {res.score}</Txt>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pill><Txt v="bold" color={colors.brandSecondary}>+{res.xp} {t("xp")}</Txt></Pill>
              <Pill><Txt v="bold" color={colors.onBrandTertiary}>+{res.coins} {t("coins")}</Txt></Pill>
            </View>
            {res.newBest && <Txt v="bold" color={colors.success}>{t("newBest")}</Txt>}
            {res.levelUp && <Txt v="bold" color={colors.brandSecondary}>{t("levelUp")}</Txt>}
            {res.newAch.map((a) => <Txt key={a} v="caption" color={colors.success}>{t("unlocked")} {t(`ach_${a}` as any)}</Txt>)}
            {res.lostLife && <Txt v="bold" color={colors.error} testID="result-life-lost">{t("lifeLost")} ({livesNow()}/5)</Txt>}
            <Chunky testID="result-again-button" label={t("again")} onPress={() => leave(begin)} style={s.btn} />
            {next && (mode !== "challenge" || res.won) && <Chunky testID="result-next-button" label={t("next")} size="sm" color={colors.brand} onPress={() => leave(() => router.replace(`/play/${next.id}?mode=${mode}`))} style={s.btn} />}
            <Chunky testID="result-map-button" label={t("toMap")} size="sm" color={colors.brandTertiary} textColor={colors.onBrandTertiary} onPress={() => leave(() => router.replace(`/world/${def.world}`))} style={s.btn} />
          </View>
        </View>
      )}
      <NoLivesModal visible={noLives} onClose={() => setNoLives(false)}
        onRelax={() => { setNoLives(false); router.replace(`/play/${def.id}?mode=relax`); }}
        onMap={() => { setNoLives(false); router.replace("/map"); }} />
    </View>
  );
}

const s = StyleSheet.create({
  hud: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 },
  stats: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, paddingVertical: 10, minHeight: 64 },
  overlay: { alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 24, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 12 },
  result: { width: "100%", maxWidth: 400, borderRadius: 28, borderWidth: 1, borderBottomWidth: 6, padding: 20, alignItems: "center", gap: 10 },
  btn: { alignSelf: "stretch" },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
});
