import React, { useEffect } from "react";
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGrad, Path, Stop } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { useGame } from "@/src/core/state";
import { getCos } from "@/src/core/cosmetics";

/** "Pau": PAUSA's original blob mascot, drawn in SVG (offline, no external assets). */
export function Mascot({ size = 160, mood = "happy", testID }: { size?: number; mood?: "happy" | "sad" | "calm"; testID?: string }) {
  const { save } = useGame();
  const [c1, c2] = getCos(save.equipped.mascot).colors;
  const y = useSharedValue(0);
  const sq = useSharedValue(1);
  useEffect(() => {
    if (save.settings.reduceMotion) return;
    y.value = withRepeat(withTiming(-10, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    sq.value = withRepeat(withSequence(withTiming(1.04, { duration: 1400 }), withTiming(0.97, { duration: 1400 })), -1, true);
  }, [save.settings.reduceMotion, y, sq]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scaleX: sq.value }, { scaleY: 2 - sq.value }] }));
  const mouth = mood === "happy" ? "M80 118 Q100 138 120 118" : mood === "sad" ? "M82 128 Q100 112 118 128" : "M86 122 Q100 128 114 122";
  return (
    <Animated.View testID={testID} style={[{ width: size, height: size }, a]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <SvgGrad id="mb" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c1} />
            <Stop offset="1" stopColor={c2} />
          </SvgGrad>
        </Defs>
        <Ellipse cx="100" cy="186" rx="52" ry="8" fill="#00000018" />
        <Path d="M100 22 C150 22 182 62 180 112 C178 158 146 178 100 178 C54 178 22 158 20 112 C18 62 50 22 100 22 Z" fill="url(#mb)" />
        <Path d="M60 50 C72 38 92 34 104 36" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={10} strokeLinecap="round" fill="none" />
        <Circle cx="100" cy="20" r="9" fill="#FBBF24" />
        <Path d="M100 28 L100 38" stroke={c2} strokeWidth={5} strokeLinecap="round" />
        {mood === "calm" ? (
          <>
            <Path d="M62 92 Q74 100 86 92" stroke="#2D3142" strokeWidth={6} strokeLinecap="round" fill="none" />
            <Path d="M114 92 Q126 100 138 92" stroke="#2D3142" strokeWidth={6} strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <Circle cx="74" cy="92" r="15" fill="#FFFFFF" />
            <Circle cx="126" cy="92" r="15" fill="#FFFFFF" />
            <Circle cx={mood === "sad" ? 74 : 77} cy={mood === "sad" ? 97 : 94} r="8" fill="#2D3142" />
            <Circle cx={mood === "sad" ? 126 : 129} cy={mood === "sad" ? 97 : 94} r="8" fill="#2D3142" />
            <Circle cx="80" cy="89" r="3" fill="#FFFFFF" />
            <Circle cx="132" cy="89" r="3" fill="#FFFFFF" />
          </>
        )}
        <Ellipse cx="56" cy="118" rx="11" ry="7" fill="#FF6B6B" opacity={0.45} />
        <Ellipse cx="144" cy="118" rx="11" ry="7" fill="#FF6B6B" opacity={0.45} />
        <Path d={mouth} stroke="#2D3142" strokeWidth={6} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

export function Logo({ size = 52 }: { size?: number }) {
  const letters = ["P", "A", "U", "S", "A"];
  const cols = ["#14B8A6", "#FF6B6B", "#FBBF24", "#8B5CF6", "#38BDF8"];
  return (
    <Animated.View style={{ flexDirection: "row" }} testID="pausa-logo">
      {letters.map((l, i) => (
        <Animated.Text key={i} style={{ fontFamily: "Fredoka-Bold", fontSize: size, color: cols[i], textShadowColor: "#00000022", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0, transform: [{ rotate: `${(i % 2 ? 4 : -4)}deg` }] }}>
          {l}
        </Animated.Text>
      ))}
    </Animated.View>
  );
}
