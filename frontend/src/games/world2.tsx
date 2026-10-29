import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G as SG, Line, Path, Polyline } from "react-native-svg";
import { Board, Bub, G, GameProps, NOTE, SHAPES, ShapeKind, arcPath, dist, pick, rint, rnd, shapePath, shuffle, uid, useForce, useTicker, useTouch } from "./kit";
import { Chunky, Txt } from "@/src/components/ui";

// ---------- 11. Liquid Colors (RYB mixing)
const CORNERS = [[1, 1, 1], [1, 0, 0], [0.163, 0.373, 0.6], [0.5, 0, 0.5], [1, 1, 0], [1, 0.5, 0], [0, 0.66, 0.2], [0.2, 0.094, 0]];
function ryb(r: number, y: number, b: number) {
  const out = [0, 0, 0];
  for (let i = 0; i < 8; i++) {
    const wr = i & 1 ? r : 1 - r, wb = i & 2 ? b : 1 - b, wy = i & 4 ? y : 1 - y, wgt = wr * wb * wy;
    for (let k = 0; k < 3; k++) out[k] += CORNERS[i][k] * wgt;
  }
  return out.map((v) => Math.round(v * 255));
}
function mixColor(c: number[]) {
  const [r, y, b, wh] = c, m = Math.max(r, y, b);
  let rgb = m ? ryb(r / m, y / m, b / m) : [255, 255, 255];
  const tot = r + y + b + wh;
  if (tot && wh) rgb = rgb.map((v) => Math.round(v + (255 - v) * (wh / tot)));
  return rgb;
}
const rgbS = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const DROPS = ["#EF4444", "#FACC15", "#3B82F6", "#FFFFFF"];
export function LiquidColors({ w, h, api }: GameProps) {
  const mkT = () => { let t: number[]; do t = [rint(0, 2), rint(0, 2), rint(0, 2), rint(0, 1)]; while (t[0] + t[1] + t[2] === 0 || t[0] + t[1] + t[2] + t[3] < 2); return t; };
  const [target, setTarget] = useState(mkT);
  const [cnt, setCnt] = useState([0, 0, 0, 0]);
  const tc = mixColor(target), cc = mixColor(cnt), total = cnt.reduce((a, b) => a + b, 0);
  const add = (i: number) => {
    if (total >= 10) return;
    const n = [...cnt]; n[i]++; setCnt(n); api.sfx("water"); api.haptic();
    const m = mixColor(n);
    if (Math.hypot(m[0] - tc[0], m[1] - tc[1], m[2] - tc[2]) < 22) {
      api.score(1); api.sfx("win"); api.haptic("success");
      setTimeout(() => { setCnt([0, 0, 0, 0]); setTarget(mkT()); }, 700);
    }
  };
  const bh = Math.min(h - 170, 300);
  return (
    <View style={{ width: w, height: h, alignItems: "center", gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Txt v="bold">{api.t("target")}</Txt>
        <View testID="liquid-target" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: rgbS(tc), borderWidth: 3, borderColor: "#FFFFFF" }} />
      </View>
      <View style={{ width: 150, height: bh, borderRadius: 30, borderWidth: 5, borderColor: "#FFFFFF", backgroundColor: "#FFFFFF88", overflow: "hidden", justifyContent: "flex-end" }}>
        <View testID="liquid-mix" style={{ height: `${Math.min(100, total * 10)}%`, backgroundColor: total ? rgbS(cc) : "transparent" }} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {DROPS.map((c, i) => (
          <Chunky key={c} testID={`liquid-drop-${i}`} label={String(cnt[i])} size="sm" color={c} textColor={i === 3 || i === 1 ? "#2D3142" : "#FFFFFF"} style={{ width: 64 }} onPress={() => add(i)} />
        ))}
      </View>
      <Chunky testID="liquid-empty-button" label={api.t("empty")} size="sm" color={G[3]} onPress={() => setCnt([0, 0, 0, 0])} />
    </View>
  );
}

// ---------- 12. Color Flow
const FLOWS = [
  [[0, 0, 4, 0], [0, 2, 4, 2], [0, 4, 4, 4]],
  [[0, 0, 3, 3], [0, 4, 4, 4], [1, 0, 3, 2], [2, 0, 4, 3], [3, 0, 4, 0]],
  [[0, 0, 4, 2], [2, 1, 0, 3], [0, 4, 2, 2], [2, 3, 4, 4], [3, 1, 4, 3]],
];
export function ColorFlow({ w, h, api }: GameProps) {
  const N = 5, cell = Math.min(w, h) / N, ox = (w - cell * N) / 2, oy = (h - cell * N) / 2;
  const load = (k: number) => {
    const t = Math.random() < 0.5, fx = Math.random() < 0.5, fy = Math.random() < 0.5;
    const tr = (r: number, c: number) => { let a = t ? c : r, b = t ? r : c; if (fx) b = N - 1 - b; if (fy) a = N - 1 - a; return a * N + b; };
    return FLOWS[k % FLOWS.length].map(([r1, c1, r2, c2]) => [tr(r1, c1), tr(r2, c2)]);
  };
  const [lvl, setLvl] = useState(0);
  const [ends, setEnds] = useState(() => load(0));
  const [paths, setPaths] = useState<number[][]>(() => ends.map(() => []));
  const act = useRef(-1);
  const cellAt = (x: number, y: number) => { const c = Math.floor((x - ox) / cell), r = Math.floor((y - oy) / cell); return c < 0 || r < 0 || c >= N || r >= N ? -1 : r * N + c; };
  const endColor = (i: number) => ends.findIndex((e) => e.includes(i));
  const done = (k: number, p = paths[k]) => p.length >= 2 && ends[k].includes(p[0]) && ends[k].includes(p[p.length - 1]) && p[0] !== p[p.length - 1];
  const touch = useTouch({
    start: (x, y) => {
      const i = cellAt(x, y); if (i < 0) return;
      const e = endColor(i);
      if (e >= 0) { act.current = e; setPaths((p) => p.map((q, k) => (k === e ? [i] : q))); api.sfx("tap"); return; }
      const k = paths.findIndex((p) => p.includes(i));
      act.current = k;
      if (k >= 0) setPaths((p) => p.map((q, j) => (j === k ? q.slice(0, q.indexOf(i) + 1) : q)));
    },
    move: (x, y) => {
      const k = act.current, i = cellAt(x, y); if (k < 0 || i < 0) return;
      const p = paths[k], last = p[p.length - 1];
      if (i === last || last === undefined) return;
      if (Math.abs((i % N) - (last % N)) + Math.abs(Math.floor(i / N) - Math.floor(last / N)) !== 1) return;
      if (p.includes(i)) { setPaths((ps) => ps.map((q, j) => (j === k ? q.slice(0, q.indexOf(i) + 1) : q))); return; }
      if (done(k)) return;
      const e = endColor(i);
      if ((e >= 0 && e !== k) || paths.some((q, j) => j !== k && q.includes(i))) return;
      const np = paths.map((q, j) => (j === k ? [...q, i] : q));
      setPaths(np); api.haptic("light");
      if (done(k, np[k])) api.sfx(NOTE(k));
    },
    end: () => {
      act.current = -1;
      if (paths.every((_, k) => done(k))) {
        api.score(1); api.sfx("win"); api.haptic("success");
        setTimeout(() => { const n = lvl + 1, e = load(n); setLvl(n); setEnds(e); setPaths(e.map(() => [])); }, 700);
      }
    },
  });
  const cx = (i: number) => ox + (i % N) * cell + cell / 2, cy = (i: number) => oy + Math.floor(i / N) * cell + cell / 2;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#1E293B10" }}>
      <Svg width={w} height={h}>
        {Array.from({ length: N * N }, (_, i) => <Path key={i} d={`M${ox + (i % N) * cell + 2} ${oy + Math.floor(i / N) * cell + 2} h${cell - 4} v${cell - 4} h${-cell + 4} Z`} fill="#FFFFFF" opacity={0.8} />)}
        {paths.map((p, k) => p.length > 1 && <Polyline key={k} points={p.map((i) => `${cx(i)},${cy(i)}`).join(" ")} stroke={G[k]} strokeWidth={cell * 0.36} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
        {ends.map((e, k) => e.map((i) => <Circle key={`${k}-${i}`} cx={cx(i)} cy={cy(i)} r={cell * 0.32} fill={G[k]} stroke="#FFFFFF" strokeWidth={3} />))}
      </Svg>
    </Board>
  );
}

// ---------- 13. Neon Lines
function shapePts(k: number): [number, number][] {
  const n = 18;
  if (k === 0) return Array.from({ length: n }, (_, i) => [0.5 + 0.4 * Math.cos((i / n) * 2 * Math.PI), 0.5 + 0.4 * Math.sin((i / n) * 2 * Math.PI)]);
  if (k === 1) return Array.from({ length: n }, (_, i) => { const t = (i / n) * 2 * Math.PI; return [0.5 + 0.38 * Math.pow(Math.sin(t), 3), 0.45 - 0.026 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; });
  if (k === 2) return Array.from({ length: n }, (_, i) => [0.08 + (0.84 * i) / (n - 1), 0.5 + 0.25 * Math.sin((i / (n - 1)) * 4 * Math.PI)]);
  const v = Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 0.18 : 0.42, a = -Math.PI / 2 + (i * Math.PI) / 5; return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]; });
  return v.flatMap((p, i) => { const q = v[(i + 1) % 10]; return [p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]] as [number, number][]; });
}
export function NeonLines({ w, h, api }: GameProps) {
  const S = Math.min(w, h) - 20, ox = (w - S) / 2, oy = (h - S) / 2;
  const [k, setK] = useState(0);
  const pts = shapePts(k % 4).map(([x, y]) => [ox + x * S, oy + y * S]);
  const [lit, setLit] = useState<boolean[]>(() => pts.map(() => false));
  const [stroke, setStroke] = useState<number[][]>([]);
  const touch = useTouch({
    start: (x, y) => setStroke([[x, y]]),
    move: (x, y) => {
      setStroke((s) => [...s.slice(-80), [x, y]]);
      const i = pts.findIndex((p, j) => !lit[j] && dist(x, y, p[0], p[1]) < 30);
      if (i < 0) return;
      const n = [...lit]; n[i] = true; setLit(n); api.sfx(NOTE(i % 7)); api.haptic("light");
      if (n.every(Boolean)) { api.score(1); api.sfx("win"); setTimeout(() => { setK((v) => v + 1); setLit(shapePts((k + 1) % 4).map(() => false)); setStroke([]); }, 600); }
    },
  });
  const poly = stroke.map((p) => p.join(",")).join(" ");
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#2D3142" }}>
      <Svg width={w} height={h}>
        {pts.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={lit[i] ? 10 : 6} fill={lit[i] ? G[(k + 4) % 8] : "#FFFFFF55"} />)}
        {stroke.length > 1 && <Polyline points={poly} stroke={G[(k + 4) % 8]} strokeOpacity={0.35} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {stroke.length > 1 && <Polyline points={poly} stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </Svg>
    </Board>
  );
}

// ---------- 14. Color Switch
export function ColorSwitch({ w, h, paused, api }: GameProps) {
  const cs = [G[0], G[1], G[2], G[3]], R = Math.min(w * 0.28, 90), cx = w / 2, cy = h - R - 30;
  const s = useRef({ rot: 0, ang: 0, by: -20, bc: pick(cs), v: 140 }); const force = useForce();
  const [msg, setMsg] = useState("");
  useTicker((dt) => {
    const st = s.current;
    st.ang += (st.rot * 90 - st.ang) * Math.min(1, dt * 14);
    st.by += st.v * dt;
    if (st.by >= cy - R + 6) {
      const top = cs[(4 - (st.rot % 4)) % 4];
      if (top === st.bc) { api.score(1); api.sfx("pop"); api.haptic(); st.v = Math.min(320, st.v + 10); setMsg(""); }
      else { api.sfx("fail"); api.haptic("error"); setMsg(api.t("failed")); }
      st.by = -20; st.bc = pick(cs);
    }
    force();
  }, paused);
  const touch = useTouch({ start: () => { s.current.rot += 1; api.sfx("tap"); } });
  const st = s.current;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#F5F3FF" }}>
      <Bub x={cx} y={st.by} r={16} c={st.bc} />
      <Svg width={w} height={h} style={{ position: "absolute" }}>
        <SG rotation={st.ang} origin={`${cx}, ${cy}`}>
          {cs.map((c, i) => <Path key={i} d={arcPath(cx, cy, R * 0.62, R, -135 + 90 * i + 2, -45 + 90 * i - 2)} fill={c} />)}
        </SG>
      </Svg>
      {!!msg && <Txt v="title" style={{ position: "absolute", top: 20, alignSelf: "center" }}>{msg}</Txt>}
    </Board>
  );
}

// ---------- 15. Shape Match
export function ShapeMatch({ w, h, api }: GameProps) {
  const n = 5;
  const mk = () => { const k = shuffle(SHAPES).slice(0, n) as ShapeKind[]; return { left: k, right: shuffle(k), done: [] as ShapeKind[] }; };
  const [r, setR] = useState(mk); const [sel, setSel] = useState<ShapeKind | null>(null);
  const rowY = (i: number) => (h / n) * (i + 0.5), lx = w * 0.2, rx = w * 0.8, S = Math.min(28, h / n / 2.6);
  const touch = useTouch({ start: (x, y) => {
    const i = Math.floor(y / (h / n)); if (i < 0 || i >= n) return;
    if (Math.abs(x - lx) < 50) { if (!r.done.includes(r.left[i])) { setSel(r.left[i]); api.sfx("tap"); } return; }
    if (Math.abs(x - rx) < 50 && sel) {
      if (r.right[i] === sel) {
        const done = [...r.done, sel]; setR({ ...r, done }); setSel(null); api.sfx(NOTE(done.length)); api.haptic();
        if (done.length === n) { api.score(1); api.sfx("win"); setTimeout(() => setR(mk()), 700); }
      } else { api.haptic("error"); api.sfx("fail"); setSel(null); }
    }
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FFF7ED" }}>
      <Svg width={w} height={h}>
        {r.done.map((k) => <Line key={k} x1={lx} y1={rowY(r.left.indexOf(k))} x2={rx} y2={rowY(r.right.indexOf(k))} stroke={G[SHAPES.indexOf(k)]} strokeWidth={6} strokeLinecap="round" />)}
        {r.left.map((k, i) => <Path key={"l" + k} d={shapePath(k, lx, rowY(i), sel === k ? S * 1.2 : S)} fill={G[SHAPES.indexOf(k)]} stroke="#FFFFFF" strokeWidth={3} />)}
        {r.right.map((k, i) => <Path key={"r" + k} d={shapePath(k, rx, rowY(i), S)} fill={r.done.includes(k) ? G[SHAPES.indexOf(k)] : "none"} stroke="#2D3142" strokeDasharray="6 4" strokeWidth={3} />)}
      </Svg>
    </Board>
  );
}

// ---------- 16. Color Sort (tubes)
export function ColorSort({ w, h, api }: GameProps) {
  const T = 6, CAP = 4, cs = G.slice(0, 4);
  const mk = () => { let t: string[][]; do { const b = shuffle(cs.flatMap((c) => [c, c, c, c])); t = [0, 1, 2, 3].map((i) => b.slice(i * 4, i * 4 + 4)); t.push([], []); } while (t.every((x) => x.length === 0 || x.every((c) => c === x[0]))); return t; };
  const [tubes, setTubes] = useState(mk); const [sel, setSel] = useState(-1);
  const tw = w / T, ball = Math.min(tw - 16, (h - 80) / CAP - 6), th = CAP * (ball + 4) + 20, top = (h - th) / 2;
  const touch = useTouch({ start: (x) => {
    const i = Math.floor(x / tw); if (i < 0 || i >= T) return;
    if (sel < 0) { if (tubes[i].length) { setSel(i); api.sfx("tap"); } return; }
    if (sel === i) { setSel(-1); return; }
    const n = tubes.map((t) => [...t]), a = n[sel], b = n[i];
    let moved = 0;
    while (a.length && b.length < CAP && (!b.length || b[b.length - 1] === a[a.length - 1])) { const c = a.pop()!; b.push(c); moved++; if (a[a.length - 1] !== c) break; }
    setSel(-1);
    if (!moved) { api.haptic("error"); return; }
    setTubes(n); api.sfx("pop"); api.haptic();
    if (n.every((t) => t.length === 0 || (t.length === CAP && t.every((c) => c === t[0])))) { api.score(1); api.sfx("win"); setTimeout(() => setTubes(mk()), 800); }
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#F0FDFA" }}>
      {tubes.map((t, i) => (
        <View key={i} style={{ position: "absolute", left: i * tw + 6, top: top - (sel === i ? 20 : 0), width: tw - 12, height: th, borderRadius: 18, borderWidth: 3, borderColor: sel === i ? G[3] : "#94A3B8", backgroundColor: "#FFFFFFAA", justifyContent: "flex-end", alignItems: "center", paddingBottom: 6, gap: 4 }}>
          {[...t].reverse().map((c, j) => <View key={j} style={{ width: ball, height: ball, borderRadius: ball / 2, backgroundColor: c, borderWidth: 2, borderColor: "#FFFFFF" }} />)}
        </View>
      ))}
    </Board>
  );
}

// ---------- 17. Paint Splash
export function PaintSplash({ w, h, api }: GameProps) {
  const GX = 10, GY = 14;
  const [spl, setSpl] = useState<{ id: number; c: string; d: number[][] }[]>([]);
  const cov = useRef<boolean[]>(Array(GX * GY).fill(false)); const pct = useRef(0);
  const touch = useTouch({ start: (x, y) => {
    const c = pick(G), R = rnd(30, 48);
    const d = [[x, y, R], ...Array.from({ length: 6 }, () => { const a = rnd(0, 6.28), r = rnd(R * 0.9, R * 1.6); return [x + Math.cos(a) * r, y + Math.sin(a) * r, rnd(6, 14)]; })];
    setSpl((s) => [...s.slice(-90), { id: uid(), c, d }]);
    for (let i = 0; i < GX * GY; i++) { const px = ((i % GX) + 0.5) * (w / GX), py = (Math.floor(i / GX) + 0.5) * (h / GY); if (d.some(([dx, dy, r]) => dist(px, py, dx, dy) < r * 1.15)) cov.current[i] = true; }
    const np = Math.floor((cov.current.filter(Boolean).length / (GX * GY)) * 100);
    if (np > pct.current) api.score(np - pct.current);
    pct.current = np; api.sfx("water"); api.haptic("medium");
    if (np >= 98) setTimeout(() => { setSpl([]); cov.current = Array(GX * GY).fill(false); pct.current = 0; }, 1200);
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FFFFFF" }}>
      {spl.map((s) => s.d.map(([x, y, r], j) => <View key={`${s.id}-${j}`} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: s.c, opacity: 0.9 }} />))}
    </Board>
  );
}

// ---------- 18. Rainbow Mixer
const BASES = [{ k: "R", c: "#EF4444" }, { k: "Y", c: "#FACC15" }, { k: "B", c: "#3B82F6" }, { k: "W", c: "#FFFFFF" }, { k: "K", c: "#334155" }];
const COMBOS: Record<string, [string, string, string]> = {
  RY: ["#FB923C", "Naranja", "Orange"], BY: ["#22C55E", "Verde", "Green"], BR: ["#8B5CF6", "Morado", "Purple"], RW: ["#F9A8D4", "Rosa", "Pink"],
  BW: ["#7DD3FC", "Celeste", "Sky"], WY: ["#FEF3C7", "Crema", "Cream"], KW: ["#94A3B8", "Gris", "Grey"], KR: ["#7F1D1D", "Granate", "Maroon"],
  BK: ["#1E3A8A", "Marino", "Navy"], KY: ["#65A30D", "Oliva", "Olive"],
};
export function RainbowMixer({ w, h, api }: GameProps) {
  const [sel, setSel] = useState<string[]>([]); const [found, setFound] = useState<string[]>([]); const [res, setRes] = useState<string | null>(null);
  const tapBase = (k: string) => {
    api.sfx("tap");
    const n = [...sel, k];
    if (n.length < 2) { setSel(n); return; }
    setSel([]);
    if (n[0] === n[1]) { setRes(null); return; }
    const key = [...n].sort().join("");
    setRes(key); api.sfx("water");
    if (!found.includes(key)) {
      const f = [...found, key]; api.score(1); api.sfx("unlock"); api.haptic("success");
      setFound(f.length === 10 ? [] : f);
    }
  };
  const r = res ? COMBOS[res] : null;
  return (
    <View style={{ width: w, height: h, alignItems: "center", gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {BASES.map((b, i) => <Chunky key={b.k} testID={`mixer-base-${i}`} label={sel.includes(b.k) ? "•" : " "} size="sm" color={b.c} textColor="#2D3142" style={{ width: 56 }} onPress={() => tapBase(b.k)} />)}
      </View>
      <View testID="mixer-result" style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: r ? r[0] : "#FFFFFF", borderWidth: 6, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
        <Txt v="title" color={res === "BK" || res === "KR" ? "#FFFFFF" : "#2D3142"}>{r ? (api.lang === "es" ? r[1] : r[2]) : "?"}</Txt>
      </View>
      <Txt v="bold">{api.t("discovered")}: {found.length}/10</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", width: Math.min(w, 300) }}>
        {Object.keys(COMBOS).map((k) => <View key={k} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: found.includes(k) ? COMBOS[k][0] : "#E2E8F0", borderWidth: 2, borderColor: "#FFFFFF" }} />)}
      </View>
    </View>
  );
}

// ---------- 19. Pattern Glow (Simon)
export function PatternGlow({ w, h, api }: GameProps) {
  const S = Math.min(w, h) / 2 - 12, ox = (w - S * 2 - 12) / 2, oy = (h - S * 2 - 12) / 2;
  const [seq, setSeq] = useState<number[]>([]); const [lit, setLit] = useState(-1);
  const st = useRef({ input: false, idx: 0 }); const timers = useRef<any[]>([]);
  const show = (s: number[]) => {
    st.current = { input: false, idx: 0 };
    s.forEach((p, i) => { timers.current.push(setTimeout(() => { setLit(p); api.sfx(NOTE(p * 2)); }, 700 + i * 550), setTimeout(() => setLit(-1), 700 + i * 550 + 350)); });
    timers.current.push(setTimeout(() => { st.current.input = true; }, 700 + s.length * 550));
  };
  const next = (base: number[]) => { const s = [...base, rint(0, 3)]; setSeq(s); show(s); };
  useEffect(() => { next([]); return () => timers.current.forEach(clearTimeout); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const touch = useTouch({ start: (x, y) => {
    if (!st.current.input) return;
    const c = Math.floor((x - ox) / (S + 12)), r = Math.floor((y - oy) / (S + 12)); if (c < 0 || c > 1 || r < 0 || r > 1) return;
    const p = r * 2 + c; setLit(p); api.sfx(NOTE(p * 2)); setTimeout(() => setLit(-1), 200);
    if (seq[st.current.idx] !== p) { st.current.input = false; api.haptic("error"); api.sfx("fail"); api.fail(); timers.current.push(setTimeout(() => next([]), 900)); return; }
    st.current.idx++;
    if (st.current.idx === seq.length) { st.current.input = false; api.score(1); api.haptic("success"); next(seq); }
  } });
  return (
    <Board w={w} h={h} touch={touch}>
      {[0, 1, 2, 3].map((p) => <View key={p} style={{ position: "absolute", left: ox + (p % 2) * (S + 12), top: oy + Math.floor(p / 2) * (S + 12), width: S, height: S, borderRadius: 32, backgroundColor: G[p * 2 + 1 > 7 ? 0 : [0, 1, 3, 2][p]], opacity: lit === p ? 1 : 0.35, borderBottomWidth: 8, borderColor: "#00000022" }} />)}
      <Txt v="title" style={{ position: "absolute", top: 4, alignSelf: "center" }}>{seq.length}</Txt>
    </Board>
  );
}

// ---------- 20. Color Rings
export function ColorRings({ w, h, api }: GameProps) {
  const cs = [G[0], G[1], G[2], G[3]], cx = w / 2, cy = h / 2, U = Math.min(w, h) / 2 / 4.2;
  const mk = () => { let o: number[]; do o = [rint(0, 3), rint(0, 3), rint(0, 3)]; while (o[0] === o[1] && o[1] === o[2]); return o; };
  const [off, setOff] = useState(mk);
  const touch = useTouch({ start: (x, y) => {
    const d = dist(x, y, cx, cy) / U, i = d < 1.2 ? -1 : d < 2.2 ? 0 : d < 3.2 ? 1 : d < 4.2 ? 2 : -1;
    if (i < 0) return;
    const n = [...off]; n[i] = (n[i] + 1) % 4; setOff(n); api.sfx(NOTE(i * 2)); api.haptic();
    if (n[0] === n[1] && n[1] === n[2]) { api.score(1); api.sfx("win"); setTimeout(() => setOff(mk()), 800); }
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FDF4FF" }}>
      <Svg width={w} height={h}>
        {[0, 1, 2].map((ri) => (
          <SG key={ri} rotation={off[ri] * 90} origin={`${cx}, ${cy}`}>
            {cs.map((c, q) => <Path key={q} d={arcPath(cx, cy, U * (1.25 + ri), U * (2.15 + ri), -135 + 90 * q + 2, -45 + 90 * q - 2)} fill={c} />)}
          </SG>
        ))}
        <Circle cx={cx} cy={cy} r={U * 0.9} fill="#FFFFFF" />
      </Svg>
    </Board>
  );
}
