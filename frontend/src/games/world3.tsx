import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect, G as SG } from "react-native-svg";
import { Board, G, GameProps, NOTE, SHAPES, dist, pick, rint, rnd, segDist, shapePath, uid, useForce, useTicker, useTouch } from "./kit";
import { Txt } from "@/src/components/ui";

type P = { id: number; x: number; y: number; vx: number; vy: number; c: string; t: number; s: number };

// ---------- 21. Kinetic Sand
export function KineticSand({ w, h, paused, api }: GameProps) {
  const x0 = 24, top = h * 0.3, bot = h * 0.72;
  const s = useRef({ x1: w - 24, sx: 0, sy: 0, cut: false, cols: [pick(G), pick(G), pick(G)] });
  const parts = useRef<P[]>([]); const force = useForce();
  useTicker((dt) => {
    if (!parts.current.length) return;
    for (const p of parts.current) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt; }
    parts.current = parts.current.filter((p) => p.t < 1.2 && p.y < h + 20);
    force();
  }, paused);
  const touch = useTouch({
    start: (x, y) => { s.current.sx = x; s.current.sy = y; s.current.cut = false; },
    move: (x, y) => {
      const st = s.current;
      if (st.cut || y - st.sy < 50 || x < x0 + 14 || x > st.x1 - 6) return;
      st.cut = true;
      const pw = st.x1 - x;
      for (let i = 0; i < 18; i++) { const py = rnd(top, bot); parts.current.push({ id: uid(), x: x + rnd(0, pw), y: py, vx: rnd(10, 90), vy: rnd(-60, 20), c: st.cols[Math.min(2, Math.floor(((py - top) / (bot - top)) * 3))], t: 0, s: rnd(5, 11) }); }
      st.x1 = x; api.sfx("swish"); api.haptic("medium"); api.score(1);
      if (st.x1 - x0 < 40) setTimeout(() => { st.x1 = w - 24; st.cols = [pick(G), pick(G), pick(G)]; force(); }, 500);
      force();
    },
  });
  const st = s.current, lh = (bot - top) / 3;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FEF3C7" }}>
      {st.cols.map((c, i) => <View key={i} style={{ position: "absolute", left: x0, top: top + i * lh, width: Math.max(0, st.x1 - x0), height: lh + 1, backgroundColor: c, opacity: 0.85, borderTopLeftRadius: i === 0 ? 16 : 0, borderBottomLeftRadius: i === 2 ? 16 : 0 }} />)}
      {parts.current.map((p) => <View key={p.id} style={{ position: "absolute", left: p.x, top: p.y, width: p.s, height: p.s, borderRadius: 3, backgroundColor: p.c, opacity: 1 - p.t / 1.2 }} />)}
    </Board>
  );
}

// ---------- 22. Sand Art
export function SandArt({ w, h, paused, api }: GameProps) {
  const C = 40, cw = w / C, GR = 5, bh = h - 64, cap = Math.floor((bh - 10) / GR);
  const cols = useRef<string[][]>(Array.from({ length: C }, () => []));
  const hold = useRef<number | null>(null); const cnt = useRef(0); const force = useForce();
  const [col, setCol] = useState(G[0]);
  useTicker(() => {
    const cs = cols.current;
    if (hold.current !== null) {
      for (let k = 0; k < 2; k++) { const i = Math.max(0, Math.min(C - 1, hold.current + rint(-1, 1))); if (cs[i].length < cap) { cs[i].push(col); cnt.current++; if (cnt.current % 10 === 0) api.score(1); } }
    }
    for (let i = 0; i < C; i++) for (const j of [i - 1, i + 1]) if (j >= 0 && j < C && cs[i].length > cs[j].length + 2) cs[j].push(cs[i].pop()!);
    if (cs.every((c) => c.length >= cap - 2)) cols.current = Array.from({ length: C }, () => []);
    force();
  }, paused, 50);
  const touch = useTouch({ start: (x) => { hold.current = Math.floor(x / cw); api.sfx("swish"); }, move: (x) => { hold.current = Math.max(0, Math.min(C - 1, Math.floor(x / cw))); }, end: () => { hold.current = null; } });
  return (
    <View style={{ width: w, height: h, gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
        {G.slice(0, 7).map((c, i) => <Pressable key={c} testID={`sand-color-${i}`} onPress={() => setCol(c)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, borderWidth: col === c ? 4 : 2, borderColor: col === c ? "#2D3142" : "#FFFFFF" }} />)}
      </View>
      <Board w={w} h={bh} touch={touch} style={{ backgroundColor: "#FFFFFF" }}>
        {cols.current.map((cs, i) => {
          const runs: { c: string; n: number; s: number }[] = [];
          cs.forEach((c, k) => { const l = runs[runs.length - 1]; if (l && l.c === c) l.n++; else runs.push({ c, n: 1, s: k }); });
          return runs.map((r, k) => <View key={`${i}-${k}`} style={{ position: "absolute", left: i * cw, width: cw + 0.5, bottom: r.s * GR, height: r.n * GR, backgroundColor: r.c }} />);
        })}
      </Board>
    </View>
  );
}

// ---------- 23. Slice Shapes
type Sh = { id: number; x: number; y: number; vx: number; vy: number; k: number; c: string; half?: number; t: number };
export function SliceShapes({ w, h, paused, api }: GameProps) {
  const sh = useRef<Sh[]>([]); const sp = useRef(0); const last = useRef<number[] | null>(null); const trail = useRef<number[][]>([]); const force = useForce();
  const R = 30, gy = h * 1.1;
  useTicker((dt) => {
    sp.current -= dt;
    if (sp.current <= 0) { sp.current = rnd(0.7, 1.1); const x = rnd(50, w - 50); sh.current.push({ id: uid(), x, y: h + R, vx: (w / 2 - x) * 0.4, vy: -Math.sqrt(2 * gy * rnd(h * 0.5, h * 0.85)), k: rint(0, 6), c: pick(G), t: 0 }); }
    for (const s of sh.current) { s.vy += gy * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt; }
    sh.current = sh.current.filter((s) => s.y < h + 60 && (!s.half || s.t < 0.8));
    if (trail.current.length) trail.current = trail.current.slice(-6);
    force();
  }, paused);
  const touch = useTouch({
    start: (x, y) => { last.current = [x, y]; trail.current = [[x, y]]; },
    move: (x, y) => {
      const l = last.current; last.current = [x, y]; trail.current.push([x, y]);
      if (!l) return;
      for (const s of sh.current) {
        if (s.half || segDist(s.x, s.y, l[0], l[1], x, y) > R) continue;
        s.half = 1; s.vx = -120; s.t = 0;
        sh.current.push({ ...s, id: uid(), half: 2, vx: 120 });
        api.score(1); api.sfx("swish"); api.haptic("medium");
      }
    },
    end: () => { last.current = null; trail.current = []; },
  });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#ECFDF5" }}>
      <Svg width={w} height={h}>
        {sh.current.map((s) => s.half ? (
          <SG key={s.id} opacity={1 - s.t / 0.8}><Path d={shapePath(SHAPES[s.k], s.x + (s.half === 1 ? -6 : 6), s.y, R * 0.7)} fill={s.c} /></SG>
        ) : <Path key={s.id} d={shapePath(SHAPES[s.k], s.x, s.y, R)} fill={s.c} stroke="#FFFFFF" strokeWidth={3} />)}
        {trail.current.length > 1 && <Polyline points={trail.current.map((p) => p.join(",")).join(" ")} stroke="#2D3142" strokeOpacity={0.4} strokeWidth={5} fill="none" strokeLinecap="round" />}
      </Svg>
    </Board>
  );
}

// ---------- 24. Soft Clay
const NC = 24;
const angOf = (i: number) => (i / NC) * Math.PI * 2;
function targetR(k: number, a: number, r0: number) {
  if (k === 0) return r0 * 1.1;
  if (k === 1) return r0 * (1 + 0.22 * Math.cos(5 * a));
  if (k === 2) return r0 * (1 + 0.3 * Math.cos(2 * a));
  return (r0 * 0.9) / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
}
const blobPath = (rs: number[], cx: number, cy: number) => {
  const p = rs.map((r, i) => [cx + Math.cos(angOf(i)) * r, cy + Math.sin(angOf(i)) * r]);
  const mid = (i: number) => { const a = p[i], b = p[(i + 1) % NC]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  let d = `M${mid(NC - 1)[0].toFixed(1)} ${mid(NC - 1)[1].toFixed(1)}`;
  for (let i = 0; i < NC; i++) { const m = mid(i); d += ` Q${p[i][0].toFixed(1)} ${p[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; }
  return d + " Z";
};
export function SoftClay({ w, h, api }: GameProps) {
  const cx = w / 2, cy = h / 2, r0 = Math.min(w, h) * 0.26;
  const [k, setK] = useState(1); const [rs, setRs] = useState(() => Array(NC).fill(r0 * 0.75));
  const busy = useRef(false);
  const tr = Array.from({ length: NC }, (_, i) => targetR(k, angOf(i), r0));
  const sim = Math.max(0, Math.round((1 - rs.reduce((a, r, i) => a + Math.abs(r - tr[i]), 0) / NC / r0) * 100));
  const touch = useTouch({ move: (x, y) => {
    if (busy.current) return;
    const th = Math.atan2(y - cy, x - cx), d = Math.max(r0 * 0.4, Math.min(r0 * 1.6, dist(x, y, cx, cy)));
    const n = rs.map((r, i) => { let a = Math.abs(angOf(i) - ((th + Math.PI * 2) % (Math.PI * 2))); a = Math.min(a, Math.PI * 2 - a); return r + (d - r) * 0.25 * Math.exp(-((a / 0.35) ** 2)); });
    setRs(n);
    const s2 = 1 - n.reduce((acc, r, i) => acc + Math.abs(r - tr[i]), 0) / NC / r0;
    if (s2 >= 0.9) { busy.current = true; api.score(1); api.sfx("win"); api.haptic("success"); setTimeout(() => { setK((v) => (v + 1) % 4); setRs(Array(NC).fill(r0 * 0.75)); busy.current = false; }, 900); }
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FFF1F2" }}>
      <Svg width={w} height={h}>
        <Path d={blobPath(tr, cx, cy)} fill="none" stroke="#2D3142" strokeOpacity={0.35} strokeWidth={4} strokeDasharray="10 8" />
        <Path d={blobPath(rs, cx, cy)} fill="#F9A8D4" stroke="#F472B6" strokeWidth={5} />
        <Circle cx={cx - r0 * 0.25} cy={cy - r0 * 0.3} r={r0 * 0.12} fill="#FFFFFF" opacity={0.5} />
      </Svg>
      <Txt v="bold" style={{ position: "absolute", top: 12, alignSelf: "center" }} testID="clay-similarity">{api.t("similarity")}: {sim}%</Txt>
    </Board>
  );
}

// ---------- 25. Foam Pop
export function FoamPop({ w, h, paused, api }: GameProps) {
  const CO = 4, RO = 5, cw = w / CO, ch = h / RO;
  const st = useRef({ idx: -1, hold: 0, popped: {} as Record<number, number>, t: 0 }); const force = useForce();
  useTicker((dt) => {
    const s = st.current; s.t += dt;
    for (const k of Object.keys(s.popped)) if (s.t - s.popped[+k] > 2.5) delete s.popped[+k];
    if (s.idx >= 0) { s.hold += dt; if (s.hold >= 0.6) { s.popped[s.idx] = s.t; s.idx = -1; s.hold = 0; api.score(1); api.sfx("pop"); api.haptic("heavy"); } }
    force();
  }, paused);
  const cellAt = (x: number, y: number) => Math.floor(y / ch) * CO + Math.floor(x / cw);
  const touch = useTouch({
    start: (x, y) => { const i = cellAt(x, y); if (st.current.popped[i] === undefined) { st.current.idx = i; st.current.hold = 0; api.haptic("light"); } },
    move: (x, y) => { if (cellAt(x, y) !== st.current.idx) { st.current.idx = -1; st.current.hold = 0; } },
    end: () => { st.current.idx = -1; st.current.hold = 0; },
  });
  const s = st.current;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#F0F9FF" }}>
      {Array.from({ length: CO * RO }, (_, i) => {
        const pop = s.popped[i] !== undefined, k = s.idx === i ? 1 - 0.4 * (s.hold / 0.6) : 1;
        return <View key={i} style={{ position: "absolute", left: (i % CO) * cw + 6, top: Math.floor(i / CO) * ch + 6, width: cw - 12, height: ch - 12, borderRadius: 26, backgroundColor: G[i % 8], opacity: pop ? 0.15 : 0.85, transform: [{ scaleY: k }, { scaleX: 2 - k }], borderBottomWidth: 6, borderColor: "#00000018" }} />;
      })}
    </Board>
  );
}

// ---------- 26. Soap Cut
export function SoapCut({ w, h, api }: GameProps) {
  const top = h / 2 - 50, bot = h / 2 + 50, x0 = 20, x1 = w - 20;
  const mk = () => { const n = rint(3, 5); return { c: pick(G), guides: Array.from({ length: n }, (_, i) => x0 + ((x1 - x0) * (i + 1)) / (n + 1) + rnd(-12, 12)), cuts: [] as number[], done: [] as number[] }; };
  const [bar, setBar] = useState(mk); const sw = useRef<number[] | null>(null); const [msg, setMsg] = useState("");
  const touch = useTouch({
    start: (x, y) => { sw.current = [x, y]; },
    end: (x, y) => {
      const s = sw.current; sw.current = null; if (!s) return;
      if (Math.abs(y - s[1]) < bot - top || Math.min(y, s[1]) > top + 10 || Math.max(y, s[1]) < bot - 10) return;
      const cx = (x + s[0]) / 2;
      let bi = -1, bd = 1e9;
      bar.guides.forEach((g, i) => { if (!bar.done.includes(i) && Math.abs(g - cx) < bd) { bd = Math.abs(g - cx); bi = i; } });
      if (bi < 0) return;
      const pts = bd < 8 ? 3 : bd < 18 ? 2 : bd < 40 ? 1 : 0;
      if (!pts) { api.haptic("error"); setMsg(api.t("failed")); return; }
      const nb = { ...bar, cuts: [...bar.cuts, cx], done: [...bar.done, bi] };
      setBar(nb); setMsg(pts === 3 ? "★★★" : pts === 2 ? "★★" : "★"); api.score(pts); api.sfx("swish"); api.haptic("medium");
      if (nb.done.length === nb.guides.length) setTimeout(() => { setBar(mk()); setMsg(""); }, 700);
    },
  });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#F5F3FF" }}>
      <Svg width={w} height={h}>
        <Rect x={x0} y={top} width={x1 - x0} height={bot - top} rx={22} fill={bar.c} opacity={0.85} />
        <Rect x={x0 + 14} y={top + 10} width={x1 - x0 - 28} height={16} rx={8} fill="#FFFFFF" opacity={0.35} />
        {bar.guides.map((g, i) => !bar.done.includes(i) && <Line key={i} x1={g} y1={top - 14} x2={g} y2={bot + 14} stroke="#2D3142" strokeWidth={2} strokeDasharray="6 6" />)}
        {bar.cuts.map((c, i) => <Line key={"c" + i} x1={c} y1={top} x2={c} y2={bot} stroke="#FFFFFF" strokeWidth={6} />)}
      </Svg>
      {!!msg && <Txt v="title" style={{ position: "absolute", top: 20, alignSelf: "center" }}>{msg}</Txt>}
    </Board>
  );
}

// ---------- 27. Glitter Touch
export function GlitterTouch({ w, h, paused, api }: GameProps) {
  const ps = useRef<P[]>([]); const n = useRef(0); const force = useForce();
  useTicker((dt) => { if (!ps.current.length) return; for (const p of ps.current) { p.t += dt; p.y += p.vy * dt; p.x += p.vx * dt; } ps.current = ps.current.filter((p) => p.t < 1.3); force(); }, paused);
  const spawn = (x: number, y: number) => {
    for (let i = 0; i < 2; i++) ps.current.push({ id: uid(), x: x + rnd(-14, 14), y: y + rnd(-14, 14), vx: rnd(-20, 20), vy: rnd(-30, 10), c: pick(G), t: 0, s: rnd(6, 14) });
    if (ps.current.length > 160) ps.current.splice(0, ps.current.length - 160);
    n.current += 2; if (n.current % 10 === 0) { api.score(1); if (n.current % 40 === 0) api.sfx(NOTE(rint(3, 6))); }
  };
  const touch = useTouch({ start: spawn, move: spawn });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#2D3142" }}>
      {ps.current.map((p) => <View key={p.id} style={{ position: "absolute", left: p.x, top: p.y, width: p.s, height: p.s, backgroundColor: p.c, opacity: 1 - p.t / 1.3, transform: [{ rotate: "45deg" }, { scale: 0.6 + Math.abs(Math.sin(p.t * 9)) * 0.6 }] }} />)}
    </Board>
  );
}

// ---------- 28. Smooth Brush (paint by numbers)
const PATS = [(r: number, c: number) => (r + c) % 3, (r: number, c: number) => Math.floor(Math.hypot(r - 3.5, c - 2.5)) % 3, (r: number) => Math.floor(r / 3) % 3, (r: number, c: number) => (Math.abs(c - 2.5) + r) % 3 | 0];
const BR = [G[0], G[1], G[2]];
export function SmoothBrush({ w, h, api }: GameProps) {
  const CO = 6, RO = 8, bh = h - 64, cell = Math.min(w / CO, bh / RO), ox = (w - cell * CO) / 2;
  const [pat, setPat] = useState(0); const [sel, setSel] = useState(0);
  const nums = Array.from({ length: CO * RO }, (_, i) => Math.floor(PATS[pat % PATS.length](Math.floor(i / CO), i % CO)));
  const [painted, setPainted] = useState<number[]>(() => Array(CO * RO).fill(-1));
  const paint = (x: number, y: number) => {
    const c = Math.floor((x - ox) / cell), r = Math.floor(y / cell); if (c < 0 || r < 0 || c >= CO || r >= RO) return;
    const i = r * CO + c; if (painted[i] === sel) return;
    const n = [...painted]; n[i] = sel; setPainted(n); api.haptic("light");
    if (n.every((v, j) => v === nums[j])) { api.score(1); api.sfx("win"); setTimeout(() => { setPat((p) => p + 1); setPainted(Array(CO * RO).fill(-1)); }, 800); }
  };
  const touch = useTouch({ start: paint, move: paint });
  return (
    <View style={{ width: w, height: h, gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
        {BR.map((c, i) => <Pressable key={c} testID={`brush-color-${i + 1}`} onPress={() => setSel(i)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c, alignItems: "center", justifyContent: "center", borderWidth: sel === i ? 4 : 2, borderColor: sel === i ? "#2D3142" : "#FFFFFF" }}><Txt v="bold" color="#FFFFFF">{i + 1}</Txt></Pressable>)}
      </View>
      <Board w={w} h={bh} touch={touch}>
        {nums.map((nm, i) => (
          <View key={i} style={{ position: "absolute", left: ox + (i % CO) * cell + 2, top: Math.floor(i / CO) * cell + 2, width: cell - 4, height: cell - 4, borderRadius: 10, backgroundColor: painted[i] >= 0 ? BR[painted[i]] : "#FFFFFF", alignItems: "center", justifyContent: "center", opacity: painted[i] >= 0 && painted[i] !== nm ? 0.55 : 1 }}>
            {painted[i] !== nm && <Txt v="caption" color="#64748B">{nm + 1}</Txt>}
          </View>
        ))}
      </Board>
    </View>
  );
}

// ---------- 29. Texture Mixer
function Texture({ k, s, c, o = 1 }: { k: number; s: number; c: string; o?: number }) {
  const n = 5, st = s / n, items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = i * st, y = j * st, key = `${i}-${j}`;
    if (k === 0 && j === 0) items.push(<Rect key={key} x={x + st * 0.3} y={0} width={st * 0.35} height={s} fill={c} opacity={o} />);
    if (k === 1) items.push(<Circle key={key} cx={x + st / 2} cy={y + st / 2} r={st * 0.22} fill={c} opacity={o} />);
    if (k === 2 && i === 0) items.push(<Path key={key} d={`M0 ${y + st / 2} q${st / 2} ${-st / 2} ${st} 0 t${st} 0 t${st} 0 t${st} 0 t${st} 0`} stroke={c} strokeWidth={st * 0.18} fill="none" opacity={o} />);
    if (k === 3 && (i + j) % 2 === 0) items.push(<Rect key={key} x={x} y={y} width={st} height={st} fill={c} opacity={o * 0.8} />);
    if (k === 4 && i === 0) items.push(<Polyline key={key} points={Array.from({ length: n * 2 + 1 }, (_, q) => `${(q * st) / 2},${y + (q % 2 ? st * 0.2 : st * 0.8)}`).join(" ")} stroke={c} strokeWidth={st * 0.15} fill="none" opacity={o} />);
  }
  return <>{items}</>;
}
function Tile({ a, b, c, s }: { a: number; b: number; c: string; s: number }) {
  return <Svg width={s} height={s}><Rect width={s} height={s} rx={16} fill="#FFFBF0" /><Texture k={a} s={s} c={c} /><Texture k={b} s={s} c="#2D3142" o={0.45} /></Svg>;
}
export function TextureMixer({ w, h, api }: GameProps) {
  const cs = G.slice(0, 5);
  const mk = () => ({ a: rint(0, 4), b: rint(0, 4), c: rint(0, 4) });
  const [tg, setTg] = useState(mk); const [sel, setSel] = useState({ a: 0, b: 1, c: 0 });
  const T = Math.min((w - 24) / 2, h * 0.34), btn = Math.min(52, (w - 40) / 5);
  const set = (k: "a" | "b" | "c", v: number) => {
    const n = { ...sel, [k]: v }; setSel(n); api.sfx("tap");
    if (n.a === tg.a && n.b === tg.b && n.c === tg.c) { api.score(1); api.sfx("win"); api.haptic("success"); setTimeout(() => setTg(mk()), 700); }
  };
  const Row = ({ k }: { k: "a" | "b" | "c" }) => (
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
      {[0, 1, 2, 3, 4].map((v) => (
        <Pressable key={v} testID={`texture-${k}-${v}`} onPress={() => set(k, v)} style={{ borderRadius: 12, borderWidth: 3, borderColor: sel[k] === v ? "#2D3142" : "transparent", overflow: "hidden" }}>
          {k === "c" ? <View style={{ width: btn, height: btn, backgroundColor: cs[v] }} /> : <Svg width={btn} height={btn}><Rect width={btn} height={btn} fill="#FFFFFF" /><Texture k={v} s={btn} c={k === "a" ? cs[sel.c] : "#2D3142"} o={k === "a" ? 1 : 0.6} /></Svg>}
        </Pressable>
      ))}
    </View>
  );
  return (
    <View style={{ width: w, height: h, gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <View style={{ alignItems: "center" }}><Txt v="caption">{api.t("target")}</Txt><Tile {...tg} c={cs[tg.c]} s={T} /></View>
        <View style={{ alignItems: "center" }}><Txt v="caption">{api.lang === "es" ? "Tu mezcla" : "Your mix"}</Txt><Tile {...sel} c={cs[sel.c]} s={T} /></View>
      </View>
      <Row k="a" /><Row k="b" /><Row k="c" />
    </View>
  );
}

// ---------- 30. Magic Eraser
function Scene({ k, w, h }: { k: number; w: number; h: number }) {
  if (k === 0) return (<><Rect width={w} height={h} fill="#BAE6FD" /><Circle cx={w * 0.75} cy={h * 0.22} r={w * 0.12} fill="#FBBF24" /><Path d={`M0 ${h * 0.7} Q${w * 0.3} ${h * 0.45} ${w * 0.6} ${h * 0.68} T${w} ${h * 0.6} V${h} H0 Z`} fill="#34D399" /><Path d={`M0 ${h * 0.85} Q${w * 0.5} ${h * 0.7} ${w} ${h * 0.85} V${h} H0 Z`} fill="#14B8A6" /></>);
  if (k === 1) return (<><Rect width={w} height={h} fill="#FEF3C7" />{[0, 1, 2, 3, 4, 5].map((i) => <Circle key={i} cx={w / 2 + Math.cos(i * 1.047) * w * 0.17} cy={h * 0.4 + Math.sin(i * 1.047) * w * 0.17} r={w * 0.12} fill="#F472B6" />)}<Circle cx={w / 2} cy={h * 0.4} r={w * 0.1} fill="#FBBF24" /><Rect x={w / 2 - 6} y={h * 0.5} width={12} height={h * 0.45} fill="#34D399" /></>);
  return (<><Rect width={w} height={h} fill="#DDD6FE" /><Rect x={w * 0.25} y={h * 0.45} width={w * 0.5} height={h * 0.4} fill="#FF6B6B" /><Path d={`M${w * 0.18} ${h * 0.47} L${w / 2} ${h * 0.22} L${w * 0.82} ${h * 0.47} Z`} fill="#8B5CF6" /><Rect x={w * 0.44} y={h * 0.65} width={w * 0.12} height={h * 0.2} fill="#FBBF24" /><Circle cx={w * 0.2} cy={h * 0.15} r={w * 0.07} fill="#FFFFFF" /></>);
}
export function MagicEraser({ w, h, api }: GameProps) {
  const CO = 12, RO = 16, cw = w / CO, ch = h / RO;
  const [k, setK] = useState(0); const [cover, setCover] = useState<boolean[]>(() => Array(CO * RO).fill(true)); const done = useRef(false);
  const erase = (x: number, y: number) => {
    if (done.current) return;
    let ch2 = false; const n = [...cover];
    for (let i = 0; i < CO * RO; i++) if (n[i] && dist(x, y, ((i % CO) + 0.5) * cw, (Math.floor(i / CO) + 0.5) * ch) < 30) { n[i] = false; ch2 = true; }
    if (!ch2) return;
    setCover(n); api.haptic("light");
    if (n.filter(Boolean).length / n.length <= 0.12) { done.current = true; api.score(1); api.sfx("win"); setCover(Array(CO * RO).fill(false)); setTimeout(() => { setK((v) => (v + 1) % 3); setCover(Array(CO * RO).fill(true)); done.current = false; }, 1100); }
  };
  const touch = useTouch({ start: erase, move: erase });
  return (
    <Board w={w} h={h} touch={touch}>
      <Svg width={w} height={h} style={{ position: "absolute" }}><Scene k={k} w={w} h={h} /></Svg>
      {cover.map((c, i) => c && <View key={i} style={{ position: "absolute", left: (i % CO) * cw, top: Math.floor(i / CO) * ch, width: cw + 0.5, height: ch + 0.5, backgroundColor: G[(Math.floor(i / CO) >> 1) % 8] }} />)}
    </Board>
  );
}
