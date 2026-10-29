import React from "react";
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle, StyleProp } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useGame } from "@/src/core/state";
import { getCos } from "@/src/core/cosmetics";
import { haptic, playSfx } from "@/src/core/sound";

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

type V = "display" | "title" | "body" | "bold" | "caption";
const SIZES: Record<V, [string, number]> = { display: [fonts.display, 40], title: [fonts.display, 22], body: [fonts.text, 15], bold: [fonts.textBold, 15], caption: [fonts.text, 12] };

export function Txt({ v = "body", style, children, color, numberOfLines, testID }: { v?: V; style?: StyleProp<TextStyle>; children: React.ReactNode; color?: string; numberOfLines?: number; testID?: string }) {
  const { colors } = useTheme();
  const { save } = useGame();
  const [family, size] = SIZES[v];
  const k = save.settings.largeText ? 1.15 : 1;
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[{ fontFamily: family, fontSize: size * k, color: color ?? colors.onSurface }, style]}>
      {children}
    </Text>
  );
}

const AP = Animated.createAnimatedComponent(Pressable);

export function Chunky({ label, onPress, color, textColor, icon, size = "md", testID, disabled, style }: {
  label: string; onPress: () => void; color?: string; textColor?: string; icon?: React.ReactNode; size?: "lg" | "md" | "sm"; testID?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = disabled ? colors.borderStrong : color ?? colors.brandPrimary;
  const sc = useSharedValue(1);
  const press = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const top = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * 4 }] }));
  const h = size === "lg" ? 72 : size === "md" ? 56 : 44;
  return (
    <AP
      testID={testID}
      disabled={disabled}
      onPressIn={() => { sc.value = withSpring(0.96); press.value = withSpring(1); }}
      onPressOut={() => { sc.value = withSpring(1, { damping: 8 }); press.value = withSpring(0); }}
      onPress={() => { haptic(size === "lg" ? "heavy" : "medium"); playSfx("tap"); onPress(); }}
      style={[{ height: h + 6 }, a, style]}
    >
      <View style={[st.chunkBase, { height: h, top: 6, backgroundColor: shade(bg, -0.25), borderRadius: radius.pill }]} />
      <Animated.View style={[st.chunkTop, { height: h, backgroundColor: bg, borderRadius: radius.pill }, top]}>
        <View style={[st.gloss, { borderRadius: radius.pill }]} />
        {icon}
        <Text style={{ fontFamily: fonts.display, fontSize: size === "lg" ? 28 : size === "md" ? 19 : 15, color: textColor ?? colors.onBrandPrimary, letterSpacing: 0.5 }} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </AP>
  );
}

export function IconBtn({ onPress, children, color, testID, size = 48 }: { onPress: () => void; children: React.ReactNode; color?: string; testID?: string; size?: number }) {
  const { colors } = useTheme();
  const bg = color ?? colors.surfaceSecondary;
  return (
    <Pressable testID={testID} hitSlop={6} onPress={() => { haptic("light"); playSfx("tap"); onPress(); }}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center", borderBottomWidth: pressed ? 1 : 4, borderColor: shade(bg === colors.surfaceSecondary ? "#CBD5E1" : bg, -0.2), transform: [{ translateY: pressed ? 3 : 0 }] }]}>
      {children}
    </Pressable>
  );
}

export function Pill({ children, testID, style }: { children: React.ReactNode; testID?: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View testID={testID} style={[st.pill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }, style]}>{children}</View>;
}

export function Card({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const { colors } = useTheme();
  return <View testID={testID} style={[st.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }, style]}>{children}</View>;
}

export function Background() {
  const { save } = useGame();
  const bg = getCos(save.equipped.bg).colors;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[bg[0], bg[1]]} style={StyleSheet.absoluteFill} />
      <View style={[st.deco, { width: 220, height: 220, top: -60, right: -70, backgroundColor: "#FFFFFF55" }]} />
      <View style={[st.deco, { width: 140, height: 140, top: 260, left: -60, backgroundColor: "#FFFFFF66" }]} />
      <View style={[st.deco, { width: 90, height: 90, bottom: 80, right: -20, backgroundColor: "#FFFFFF55" }]} />
    </View>
  );
}

/** Screen with game background, safe-area top padding and optional back header. */
export function Screen({ title, children, right, testID, back = true }: { title?: string; children: React.ReactNode; right?: React.ReactNode; testID?: string; back?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.surface }}>
      <Background />
      <View style={{ paddingTop: insets.top + spacing.sm, flex: 1 }}>
        {title !== undefined && (
          <View style={st.header}>
            {back && (
              <IconBtn testID="header-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
                <ArrowLeft size={24} weight="bold" color={colors.onSurface} />
              </IconBtn>
            )}
            <Txt v="title" style={{ flex: 1, marginLeft: back ? spacing.md : 0 }} numberOfLines={1}>{title}</Txt>
            {right}
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  chunkBase: { position: "absolute", left: 0, right: 0 },
  chunkTop: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20, overflow: "hidden" },
  gloss: { position: "absolute", top: 4, left: 18, right: 18, height: "38%", backgroundColor: "rgba(255,255,255,0.22)" },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 40, borderRadius: 999, borderWidth: 1, borderBottomWidth: 3 },
  card: { borderRadius: 20, borderWidth: 1, borderBottomWidth: 4, padding: 16 },
  deco: { position: "absolute", borderRadius: 999 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, minHeight: 56 },
});
