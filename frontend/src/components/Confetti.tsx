import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { useGame } from "@/src/core/state";
import { getCos } from "@/src/core/cosmetics";

function Piece({ color, x, delay, h, round }: { color: string; x: number; delay: number; h: number; round: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(delay, withTiming(1, { duration: 1800, easing: Easing.in(Easing.quad) })); }, [p, delay]);
  const a = useAnimatedStyle(() => ({ opacity: 1 - p.value * 0.6, transform: [{ translateY: -30 + p.value * (h + 60) }, { translateX: Math.sin(p.value * 8 + x) * 20 }, { rotate: `${p.value * 720}deg` }] }));
  return <Animated.View style={[{ position: "absolute", left: x, top: 0, width: 10, height: round ? 10 : 16, borderRadius: round ? 5 : 2, backgroundColor: color }, a]} />;
}

/** Lightweight celebration particles; colors from the equipped effect cosmetic. */
export function Confetti({ count = 26 }: { count?: number }) {
  const { save } = useGame();
  const { width, height } = useWindowDimensions();
  if (save.settings.reduceMotion) return null;
  const cols = getCos(save.equipped.fx).colors;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} color={cols[i % cols.length]} x={(i * 97) % width} delay={(i * 53) % 500} h={height} round={i % 3 === 0} />
      ))}
    </View>
  );
}
