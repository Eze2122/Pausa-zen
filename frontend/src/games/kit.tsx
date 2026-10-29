import React, { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { gameColors } from "@/src/theme";
import type { SoundName } from "@/src/core/sound";
import type { Mode } from "@/src/core/rewards";
import type { TKey } from "@/src/core/i18n";

export type GameApi = {
  score: (n?: number) => void; fail: () => void; sfx: (n: SoundName) => void;
  haptic: (k?: "light" | "medium" | "heavy" | "success" | "error") => void; reduce: boolean; mode: Mode; t: (k: TKey) => string; lang: "es" | "en";
};

export function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)].map((v) => v.toFixed(1));
  const [x1, y1] = p(r1, a0), [x2, y2] = p(r1, a1), [x3, y3] = p(r0, a1), [x4, y4] = p(r0, a0);
  return `M${x1} ${y1} A${r1} ${r1} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${r0} ${r0} 0 0 0 ${x4} ${y4} Z`;
}
export type GameProps = { w: number; h: number; paused: boolean; api: GameApi };

export const G = gameColors;
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const rint = (a: number, b: number) => Math.floor(rnd(a, b + 1));
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
let _id = 1;
export const uid = () => _id++;
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
export function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Fixed-step game loop (~30fps) that stops while paused. dt in seconds. */
export function useTicker(fn: (dt: number) => void, paused: boolean, ms = 33) {
  const r = useRef(fn);
  r.current = fn;
  useEffect(() => {
    if (paused) return;
    let last = Date.now();
    const iv = setInterval(() => { const n = Date.now(); const dt = Math.min(0.1, (n - last) / 1000); last = n; r.current(dt); }, ms);
    return () => clearInterval(iv);
  }, [paused, ms]);
}

export const useForce = () => useReducer((x: number) => x + 1, 0)[1];

type TouchH = { start?: (x: number, y: number) => void; move?: (x: number, y: number) => void; end?: (x: number, y: number) => void };
export function useTouch(h: TouchH) {
  const r = useRef(h);
  r.current = h;
  return useMemo(() => ({
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: any) => r.current.start?.(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onResponderMove: (e: any) => r.current.move?.(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onResponderRelease: (e: any) => r.current.end?.(e.nativeEvent.locationX, e.nativeEvent.locationY),
  }), []);
}

/** Touch surface; children never capture touches so locationX/Y are board coordinates. */
export function Board({ w, h, touch, children, style, testID = "game-board" }: { w: number; h: number; touch?: any; children?: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <View testID={testID} style={[{ width: w, height: h, overflow: "hidden", borderRadius: 24 }, style]} {...(touch ?? {})}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}

export const Bub = memo(function Bub({ x, y, r, c, o = 1 }: { x: number; y: number; r: number; c: string; o?: number }) {
  return (
    <View style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: c, opacity: o, borderWidth: 2, borderColor: "rgba(255,255,255,0.7)" }}>
      <View style={{ position: "absolute", left: r * 0.3, top: r * 0.22, width: r * 0.55, height: r * 0.32, borderRadius: r, backgroundColor: "rgba(255,255,255,0.6)" }} />
    </View>
  );
});

function BurstOne({ x, y, c, reduce }: { x: number; y: number; c: string; reduce: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1, { duration: reduce ? 200 : 420 }); }, [p, reduce]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ scale: 0.4 + p.value * (reduce ? 0.6 : 1.4) }] }));
  const dots = [0, 1, 2, 3, 4, 5];
  return (
    <View style={{ position: "absolute", left: x, top: y }}>
      <Animated.View style={[{ position: "absolute", left: -30, top: -30, width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: c }, ring]} />
      {!reduce && dots.map((i) => <Dot key={i} p={p} a={(i / 6) * Math.PI * 2} c={c} />)}
    </View>
  );
}
function Dot({ p, a, c }: { p: any; a: number; c: string }) {
  const s = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ translateX: Math.cos(a) * p.value * 46 }, { translateY: Math.sin(a) * p.value * 46 }] }));
  return <Animated.View style={[{ position: "absolute", left: -5, top: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: c }, s]} />;
}

export function useBursts(reduce: boolean) {
  const [list, setList] = useState<{ id: number; x: number; y: number; c: string }[]>([]);
  const add = useCallback((x: number, y: number, c: string) => {
    const id = uid();
    setList((l) => [...l.slice(-10), { id, x, y, c }]);
    setTimeout(() => setList((l) => l.filter((b) => b.id !== id)), 500);
  }, []);
  const layer = <>{list.map((b) => <BurstOne key={b.id} {...b} reduce={reduce} />)}</>;
  return [layer, add] as const;
}

export type ShapeKind = "circle" | "square" | "triangle" | "star" | "diamond" | "hex" | "heart";
export const SHAPES: ShapeKind[] = ["circle", "square", "triangle", "star", "diamond", "hex", "heart"];
export function shapePath(k: ShapeKind, cx: number, cy: number, s: number): string {
  const poly = (pts: [number, number][]) => "M" + pts.map(([x, y]) => `${(cx + x * s).toFixed(1)} ${(cy + y * s).toFixed(1)}`).join(" L") + " Z";
  switch (k) {
    case "circle": return `M${cx - s} ${cy} a${s} ${s} 0 1 0 ${2 * s} 0 a${s} ${s} 0 1 0 ${-2 * s} 0 Z`;
    case "square": return poly([[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]]);
    case "triangle": return poly([[0, -1], [0.95, 0.8], [-0.95, 0.8]]);
    case "diamond": return poly([[0, -1], [0.8, 0], [0, 1], [-0.8, 0]]);
    case "hex": return poly(Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)] as [number, number]));
    case "star": return poly(Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 0.45 : 1; const a = -Math.PI / 2 + (i * Math.PI) / 5; return [Math.cos(a) * r, Math.sin(a) * r] as [number, number]; }));
    case "heart": return `M${cx} ${cy + s * 0.9} C${cx - s * 1.4} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.2} ${cx} ${cy - s * 0.45} C${cx + s * 0.7} ${cy - s * 1.2} ${cx + s * 1.4} ${cy - s * 0.1} ${cx} ${cy + s * 0.9} Z`;
  }
}

export const NOTE = (i: number) => `note${Math.max(0, Math.min(6, i))}` as SoundName;
