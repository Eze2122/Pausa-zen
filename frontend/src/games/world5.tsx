import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { Board, G, GameProps, NOTE, SHAPES, ShapeKind, dist, pick, rint, rnd, shapePath, shuffle, uid, useForce, useTicker, useTouch } from "./kit";
import { Chunky, Txt } from "@/src/components/ui";

// ---------- 41. Zen Tiles (8-puzzle)
export function ZenTiles({ w, h, api }: GameProps) {
  const N = 3, S = Math.min(w, h) - 8, cell = S / N, ox = (w - S) / 2, oy = (h - S) / 2;
  const mk = (): number[] => { const t = [1, 2, 3, 4, 5, 6, 7, 8, 0]; let e = 8, prev = -1; for (let k = 0; k < 80; k++) { const nb = [e - 3, e + 3, e % 3 ? e - 1 : -1, e % 3 < 2 ? e + 1 : -1].filter((i) => i >= 0 && i < 9 && i !== prev); const n = pick(nb); [t[e], t[n]] = [t[n], t[e]]; prev = e; e = n; } return t.join() === "1,2,3,4,5,6,7,8,0" ? mk() : t; };
  const [t, setT] = useState(mk);
  const touch = useTouch({ start: (x, y) => {
    const c = Math.floor((x - ox) / cell), r = Math.floor((y - oy) / cell); if (c < 0 || r < 0 || c >= N || r >= N) return;
    const i = r * N + c, e = t.indexOf(0);
    if (Math.abs((i % N) - (e % N)) + Math.abs(Math.floor(i / N) - Math.floor(e / N)) !== 1) return;
    const n = [...t]; [n[i], n[e]] = [n[e], n[i]]; setT(n); api.sfx("tap"); api.haptic();
    if (n.join() === "1,2,3,4,5,6,7,8,0") { api.score(1); api.sfx("win"); setTimeout(() => setT(mk()), 900); }
  } });
  return (
    <Board w={w} h={h} touch={touch}>
      {t.map((v, i) => v ? (
        <View key={v} style={{ position: "absolute", left: ox + (i % N) * cell + 4, top: oy + Math.floor(i / N) * cell + 4, width: cell - 8, height: cell - 8, borderRadius: 22, backgroundColor: G[v % 8], alignItems: "center", justifyContent: "center", borderBottomWidth: 6, borderColor: "#00000022" }}>
          <Txt v="display" color="#FFFFFF">{v}</Txt>
        </View>
      ) : null)}
    </Board>
  );
}

// ---------- 42. Tiny Jigsaw
function Pic({ k, s }: { k: number; s: number }) {
  if (k === 0) return (<><Rect width={s} height={s} fill="#BAE6FD" /><Circle cx={s * 0.72} cy={s * 0.25} r={s * 0.13} fill="#FBBF24" /><Path d={`M0 ${s * 0.75} Q${s * 0.3} ${s * 0.5} ${s * 0.6} ${s * 0.72} T${s} ${s * 0.62} V${s} H0 Z`} fill="#34D399" /><Rect x={s * 0.2} y={s * 0.5} width={s * 0.05} height={s * 0.2} fill="#92400E" /><Circle cx={s * 0.225} cy={s * 0.48} r={s * 0.09} fill="#16A34A" /></>);
  if (k === 1) return (<><Rect width={s} height={s} fill="#FDE68A" /><Rect y={s * 0.6} width={s} height={s * 0.4} fill="#38BDF8" /><Path d={`M${s * 0.3} ${s * 0.62} H${s * 0.75} L${s * 0.68} ${s * 0.72} H${s * 0.37} Z`} fill="#FF6B6B" /><Path d={`M${s * 0.52} ${s * 0.25} V${s * 0.6} H${s * 0.32} Z`} fill="#FFFFFF" /><Circle cx={s * 0.2} cy={s * 0.2} r={s * 0.1} fill="#FB923C" /></>);
  return (<><Rect width={s} height={s} fill="#EDE9FE" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Circle key={i} cx={s / 2 + Math.cos(i * 0.785) * s * 0.2} cy={s * 0.42 + Math.sin(i * 0.785) * s * 0.2} r={s * 0.1} fill={G[i]} />)}<Circle cx={s / 2} cy={s * 0.42} r={s * 0.11} fill="#FFFFFF" /><Rect x={s * 0.48} y={s * 0.6} width={s * 0.04} height={s * 0.4} fill="#16A34A" /></>);
}
export function TinyJigsaw({ w, h, api }: GameProps) {
  const N = 3, S = Math.min(w, h) - 8, P = S / N, ox = (w - S) / 2, oy = (h - S) / 2;
  const mk = () => { let p; do p = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]); while (p.every((v, i) => v === i)); return p; };
  const [k, setK] = useState(0); const [perm, setPerm] = useState(mk); const [sel, setSel] = useState(-1);
  const touch = useTouch({ start: (x, y) => {
    const c = Math.floor((x - ox) / P), r = Math.floor((y - oy) / P); if (c < 0 || r < 0 || c >= N || r >= N) return;
    const i = r * N + c;
    if (sel < 0) { setSel(i); api.sfx("tap"); return; }
    const n = [...perm]; [n[i], n[sel]] = [n[sel], n[i]]; setPerm(n); setSel(-1); api.sfx("pop"); api.haptic();
    if (n.every((v, j) => v === j)) { api.score(1); api.sfx("win"); setTimeout(() => { setK((v) => (v + 1) % 3); setPerm(mk()); }, 1000); }
  } });
  return (
    <Board w={w} h={h} touch={touch}>
      {perm.map((pc, i) => (
        <View key={i} style={{ position: "absolute", left: ox + (i % N) * P, top: oy + Math.floor(i / N) * P, width: P, height: P, overflow: "hidden", borderWidth: sel === i ? 4 : 1, borderColor: sel === i ? "#2D3142" : "#FFFFFF" }}>
          <View style={{ position: "absolute", left: -(pc % N) * P, top: -Math.floor(pc / N) * P }}><Svg width={S} height={S}><Pic k={k} s={S} /></Svg></View>
        </View>
      ))}
    </Board>
  );
}

// ---------- 43. Loop Connect
const rot = (m: number) => ((m << 1) | (m >> 3)) & 15;
export function LoopConnect({ w, h, api }: GameProps) {
  const CO = 4, RO = 5, cell = Math.min(w / CO, h / RO), ox = (w - cell * CO) / 2, oy = (h - cell * RO) / 2;
  const solved = (m: number[]) => m.every((v, i) => {
    const r = Math.floor(i / CO), c = i % CO;
    return (!(v & 1) || (r > 0 && m[i - CO] & 4)) && (!(v & 4) || (r < RO - 1 && m[i + CO] & 1)) && (!(v & 2) || (c < CO - 1 && m[i + 1] & 8)) && (!(v & 8) || (c > 0 && m[i - 1] & 2));
  });
  const mk = () => {
    const m = Array(CO * RO).fill(0);
    for (let k = 0; k < 2; k++) {
      const r0 = rint(0, RO - 2), c0 = rint(0, CO - 2), r1 = rint(r0 + 1, RO - 1), c1 = rint(c0 + 1, CO - 1);
      for (let c = c0; c <= c1; c++) for (const r of [r0, r1]) m[r * CO + c] |= (c < c1 ? 2 : 0) | (c > c0 ? 8 : 0);
      for (let r = r0; r <= r1; r++) for (const c of [c0, c1]) m[r * CO + c] |= (r < r1 ? 4 : 0) | (r > r0 ? 1 : 0);
    }
    let s; do s = m.map((v) => { let x = v; for (let q = rint(0, 3); q > 0; q--) x = rot(x); return x; }); while (solved(s));
    return s;
  };
  const [m, setM] = useState(mk); const [win, setWin] = useState(false);
  const touch = useTouch({ start: (x, y) => {
    if (win) return;
    const c = Math.floor((x - ox) / cell), r = Math.floor((y - oy) / cell); if (c < 0 || r < 0 || c >= CO || r >= RO) return;
    const i = r * CO + c; if (!m[i]) return;
    const n = [...m]; n[i] = rot(n[i]); setM(n); api.sfx("tap"); api.haptic("light");
    if (solved(n)) { setWin(true); api.score(1); api.sfx("win"); setTimeout(() => { setM(mk()); setWin(false); }, 1000); }
  } });
  const col = win ? G[5] : G[0];
  return (
    <Board w={w} h={h} touch={touch}>
      <Svg width={w} height={h}>
        {m.map((v, i) => {
          const x = ox + (i % CO) * cell, y = oy + Math.floor(i / CO) * cell, cx = x + cell / 2, cy = y + cell / 2, sw = cell * 0.2;
          return (
            <React.Fragment key={i}>
              <Rect x={x + 3} y={y + 3} width={cell - 6} height={cell - 6} rx={14} fill="#FFFFFF" opacity={0.8} />
              {v & 1 ? <Line x1={cx} y1={cy} x2={cx} y2={y} stroke={col} strokeWidth={sw} strokeLinecap="round" /> : null}
              {v & 2 ? <Line x1={cx} y1={cy} x2={x + cell} y2={cy} stroke={col} strokeWidth={sw} strokeLinecap="round" /> : null}
              {v & 4 ? <Line x1={cx} y1={cy} x2={cx} y2={y + cell} stroke={col} strokeWidth={sw} strokeLinecap="round" /> : null}
              {v & 8 ? <Line x1={cx} y1={cy} x2={x} y2={cy} stroke={col} strokeWidth={sw} strokeLinecap="round" /> : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </Board>
  );
}

// ---------- 44. Happy Blocks
const PIECES = [[[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [0, 3]]];
type Pc = { id: number; cells: number[][]; c: string };
export function HappyBlocks({ w, h, api }: GameProps) {
  const N = 8, cell = Math.min(w / N, (h - 100) / N), bs = cell * N, ox = (w - bs) / 2;
  const deal = (): Pc[] => [0, 1, 2].map(() => ({ id: uid(), cells: pick(PIECES), c: pick(G) }));
  const [board, setBoard] = useState<(string | null)[]>(() => Array(N * N).fill(null));
  const [tray, setTray] = useState<Pc[]>(deal); const [sel, setSel] = useState(0);
  const fits = (b: (string | null)[], p: Pc, r: number, c: number) => p.cells.every(([dr, dc]) => r + dr < N && c + dc < N && !b[(r + dr) * N + c + dc]);
  const anyFit = (b: (string | null)[], ps: Pc[]) => ps.some((p) => b.some((_, i) => fits(b, p, Math.floor(i / N), i % N)));
  const touch = useTouch({ start: (x, y) => {
    const p = tray[sel]; if (!p) return;
    const c = Math.floor((x - ox) / cell), r = Math.floor(y / cell); if (c < 0 || r < 0 || c >= N || r >= N) return;
    if (!fits(board, p, r, c)) { api.haptic("error"); return; }
    const b = [...board]; p.cells.forEach(([dr, dc]) => (b[(r + dr) * N + c + dc] = p.c));
    const rows = [...Array(N).keys()].filter((rr) => [...Array(N).keys()].every((cc) => b[rr * N + cc]));
    const cols = [...Array(N).keys()].filter((cc) => [...Array(N).keys()].every((rr) => b[rr * N + cc]));
    rows.forEach((rr) => { for (let cc = 0; cc < N; cc++) b[rr * N + cc] = null; });
    cols.forEach((cc) => { for (let rr = 0; rr < N; rr++) b[rr * N + cc] = null; });
    const lines = rows.length + cols.length;
    if (lines) { api.score(lines); api.sfx("unlock"); api.haptic("success"); } else { api.sfx("pop"); api.haptic(); }
    let nt = tray.filter((q) => q.id !== p.id); if (!nt.length) nt = deal();
    setBoard(b); setTray(nt); setSel(0);
    if (!anyFit(b, nt)) { api.sfx("fail"); api.fail(); setTimeout(() => { setBoard(Array(N * N).fill(null)); setTray(deal()); }, 700); }
  } });
  const mini = 16;
  return (
    <View style={{ width: w, height: h, gap: 10, alignItems: "center" }}>
      <Board w={w} h={bs} touch={touch}>
        {board.map((c, i) => <View key={i} style={{ position: "absolute", left: ox + (i % N) * cell + 1.5, top: Math.floor(i / N) * cell + 1.5, width: cell - 3, height: cell - 3, borderRadius: 6, backgroundColor: c ?? "#FFFFFFAA", borderBottomWidth: c ? 3 : 0, borderColor: "#00000022" }} />)}
      </Board>
      <View style={{ flexDirection: "row", gap: 14 }}>
        {tray.map((p, i) => (
          <Pressable key={p.id} testID={`blocks-piece-${i}`} onPress={() => { setSel(i); api.sfx("tap"); }} style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 3, borderColor: sel === i ? "#2D3142" : "transparent", alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: mini * 4, height: mini * 4 }}>
              {p.cells.map(([r, c], k) => <View key={k} style={{ position: "absolute", left: c * mini, top: r * mini, width: mini - 2, height: mini - 2, borderRadius: 3, backgroundColor: p.c }} />)}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------- 45. Calm Match (mahjong-style free tiles)
export function CalmMatch({ w, h, api }: GameProps) {
  const CO = 4, RO = 5, cw = w / CO, ch = Math.min(h / RO, cw * 1.2), oy = (h - ch * RO) / 2;
  const syms = Array.from({ length: 10 }, (_, i) => i);
  const [tiles, setTiles] = useState<(number | null)[]>(() => shuffle([...syms, ...syms]));
  const [sel, setSel] = useState(-1);
  const free = (t: (number | null)[], i: number) => { const c = i % CO; return c === 0 || c === CO - 1 || t[i - 1] === null || t[i + 1] === null; };
  const ensureMoves = (t: (number | null)[]) => {
    for (let k = 0; k < 20; k++) {
      const f = t.map((v, i) => (v !== null && free(t, i) ? v : null)).filter((v) => v !== null);
      if (!t.some((v) => v !== null) || f.some((v, i) => f.indexOf(v) !== i)) return t;
      const idx = t.map((v, i) => (v !== null ? i : -1)).filter((i) => i >= 0); const vals = shuffle(idx.map((i) => t[i]));
      t = [...t]; idx.forEach((i, j) => (t[i] = vals[j]));
    }
    return t;
  };
  const touch = useTouch({ start: (x, y) => {
    const c = Math.floor(x / cw), r = Math.floor((y - oy) / ch); if (c < 0 || r < 0 || c >= CO || r >= RO) return;
    const i = r * CO + c; if (tiles[i] === null) return;
    if (!free(tiles, i)) { api.haptic("error"); return; }
    if (sel < 0 || sel === i) { setSel(sel === i ? -1 : i); api.sfx("tap"); return; }
    if (tiles[sel] === tiles[i]) {
      let n = [...tiles]; n[sel] = null; n[i] = null; setSel(-1); api.sfx(NOTE(rint(2, 6))); api.haptic();
      if (n.every((v) => v === null)) { api.score(1); api.sfx("win"); setTiles(n); setTimeout(() => setTiles(shuffle([...syms, ...syms])), 900); return; }
      n = ensureMoves(n); setTiles(n);
    } else { setSel(i); api.sfx("tap"); }
  } });
  return (
    <Board w={w} h={h} touch={touch}>
      <Svg width={w} height={h}>
        {tiles.map((v, i) => v === null ? null : (
          <React.Fragment key={i}>
            <Rect x={(i % CO) * cw + 5} y={oy + Math.floor(i / CO) * ch + 5} width={cw - 10} height={ch - 10} rx={16} fill={sel === i ? "#FEF3C7" : "#FFFFFF"} stroke={sel === i ? "#FBBF24" : "#E2E8F0"} strokeWidth={sel === i ? 4 : 2} opacity={free(tiles, i) ? 1 : 0.55} />
            <Path d={shapePath(SHAPES[v % 7] as ShapeKind, (i % CO) * cw + cw / 2, oy + Math.floor(i / CO) * ch + ch / 2, Math.min(cw, ch) * 0.24)} fill={G[(v * 3) % 8]} />
          </React.Fragment>
        ))}
      </Svg>
    </Board>
  );
}

// ---------- 46. Dot Connect
export function DotConnect({ w, h, api }: GameProps) {
  const mk = (n: number) => { const p: number[][] = []; let tries = 0; while (p.length < n && tries++ < 500) { const q = [rnd(36, w - 36), rnd(36, h - 36)]; if (p.every((o) => dist(o[0], o[1], q[0], q[1]) > 64)) p.push(q); } return p; };
  const [lvl, setLvl] = useState(6); const [pts, setPts] = useState(() => mk(6)); const [next, setNext] = useState(0); const [line, setLine] = useState<number[] | null>(null);
  const bad = useRef(-1);
  const check = (x: number, y: number) => {
    setLine([x, y]);
    const i = pts.findIndex((p) => dist(x, y, p[0], p[1]) < 28);
    if (i < 0) { bad.current = -1; return; }
    if (i === next) {
      const nn = next + 1; setNext(nn); api.sfx(NOTE(nn % 7)); api.haptic("light");
      if (nn === pts.length) { api.score(1); api.sfx("win"); setTimeout(() => { const l = Math.min(12, lvl + 1); setLvl(l); setPts(mk(l)); setNext(0); setLine(null); }, 800); }
    } else if (i >= next && bad.current !== i) { bad.current = i; api.haptic("error"); }
  };
  const touch = useTouch({ start: check, move: check, end: () => setLine(null) });
  const done = pts.slice(0, next);
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FFFBEB" }}>
      <Svg width={w} height={h}>
        {done.length > 1 && <Polyline points={done.map((p) => p.join(",")).join(" ") + (next === pts.length ? ` ${pts[0].join(",")}` : "")} stroke="#8B5CF6" strokeWidth={6} fill={next === pts.length ? "#C4B5FD55" : "none"} strokeLinejoin="round" />}
        {line && next > 0 && next < pts.length && <Line x1={pts[next - 1][0]} y1={pts[next - 1][1]} x2={line[0]} y2={line[1]} stroke="#8B5CF6" strokeOpacity={0.4} strokeWidth={4} />}
        {pts.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={18} fill={i < next ? "#8B5CF6" : i === next ? "#FF6B6B" : "#FFFFFF"} stroke="#2D3142" strokeWidth={2} />)}
      </Svg>
      {pts.map((p, i) => <Txt key={i} v="bold" color={i < next || i === next ? "#FFFFFF" : "#2D3142"} style={{ position: "absolute", left: p[0] - 18, top: p[1] - 10, width: 36, textAlign: "center" }}>{i + 1}</Txt>)}
    </Board>
  );
}

// ---------- 47. Mini Maze
export function MiniMaze({ w, h, api }: GameProps) {
  const CO = 7, RO = 9, cell = Math.min(w / CO, h / RO), ox = (w - cell * CO) / 2, oy = (h - cell * RO) / 2;
  const mk = () => {
    const m = Array(CO * RO).fill(0), seen = new Set([0]), st = [0];
    while (st.length) {
      const i = st[st.length - 1], r = Math.floor(i / CO), c = i % CO;
      const nb = ([[r - 1, c, 1, 4], [r, c + 1, 2, 8], [r + 1, c, 4, 1], [r, c - 1, 8, 2]] as number[][]).filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < RO && cc < CO && !seen.has(rr * CO + cc));
      if (!nb.length) { st.pop(); continue; }
      const [rr, cc, b, ob] = pick(nb), j = rr * CO + cc; m[i] |= b; m[j] |= ob; seen.add(j); st.push(j);
    }
    return m;
  };
  const [m, setM] = useState(mk); const [p, setP] = useState(0); const anchor = useRef<number[] | null>(null);
  const step = (dir: number) => {
    if (!(m[p] & dir)) { api.haptic("light"); return; }
    const np = p + (dir === 1 ? -CO : dir === 4 ? CO : dir === 2 ? 1 : -1); setP(np); api.sfx("tap");
    if (np === CO * RO - 1) { api.score(1); api.sfx("win"); api.haptic("success"); setTimeout(() => { setM(mk()); setP(0); }, 700); }
  };
  const touch = useTouch({
    start: (x, y) => { anchor.current = [x, y]; },
    move: (x, y) => {
      const a = anchor.current; if (!a) return; const dx = x - a[0], dy = y - a[1], th = cell * 0.6;
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 8) : dy > 0 ? 4 : 1); anchor.current = [x, y];
    },
  });
  const lines: React.ReactNode[] = [];
  m.forEach((v, i) => {
    const x = ox + (i % CO) * cell, y = oy + Math.floor(i / CO) * cell;
    if (!(v & 1)) lines.push(<Line key={`n${i}`} x1={x} y1={y} x2={x + cell} y2={y} stroke="#8B5CF6" strokeWidth={4} strokeLinecap="round" />);
    if (!(v & 8)) lines.push(<Line key={`w${i}`} x1={x} y1={y} x2={x} y2={y + cell} stroke="#8B5CF6" strokeWidth={4} strokeLinecap="round" />);
  });
  const pc = (i: number) => [ox + (i % CO) * cell + cell / 2, oy + Math.floor(i / CO) * cell + cell / 2];
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FFFFFF" }}>
      <Svg width={w} height={h}>
        {lines}
        <Line x1={ox + CO * cell} y1={oy} x2={ox + CO * cell} y2={oy + RO * cell} stroke="#8B5CF6" strokeWidth={4} />
        <Line x1={ox} y1={oy + RO * cell} x2={ox + CO * cell} y2={oy + RO * cell} stroke="#8B5CF6" strokeWidth={4} />
        <Path d={shapePath("star", pc(CO * RO - 1)[0], pc(CO * RO - 1)[1], cell * 0.35)} fill="#FBBF24" />
        <Circle cx={pc(p)[0]} cy={pc(p)[1]} r={cell * 0.3} fill="#FF6B6B" />
      </Svg>
    </Board>
  );
}

// ---------- 48. Star Catcher
export function StarCatcher({ w, h, paused, api }: GameProps) {
  const BW = 90;
  const s = useRef({ bx: w / 2, stars: [] as { id: number; x: number; y: number; vy: number; big: boolean }[], sp: 0 }); const force = useForce();
  useTicker((dt) => {
    const st = s.current; st.sp -= dt;
    if (st.sp <= 0) { st.sp = rnd(0.45, 0.8); st.stars.push({ id: uid(), x: rnd(20, w - 20), y: -20, vy: rnd(110, 200), big: Math.random() < 0.12 }); }
    for (const t of st.stars) {
      t.y += t.vy * dt;
      if (t.y > h - 60 && t.y < h - 30 && Math.abs(t.x - st.bx) < BW / 2 + 6) { t.y = h + 100; api.score(t.big ? 3 : 1); api.sfx(t.big ? "unlock" : "pop"); api.haptic(); }
    }
    st.stars = st.stars.filter((t) => t.y < h + 30);
    force();
  }, paused);
  const mv = (x: number) => { s.current.bx = Math.max(BW / 2, Math.min(w - BW / 2, x)); };
  const touch = useTouch({ start: mv, move: mv });
  const st = s.current;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#312E81" }}>
      <Svg width={w} height={h}>
        {st.stars.map((t) => <Path key={t.id} d={shapePath("star", t.x, t.y, t.big ? 20 : 12)} fill={t.big ? "#F472B6" : "#FBBF24"} />)}
        <Path d={`M${st.bx - BW / 2} ${h - 50} h${BW} l-12 34 h${-(BW - 24)} Z`} fill="#14B8A6" stroke="#FFFFFF" strokeWidth={3} />
      </Svg>
    </Board>
  );
}

// ---------- 49. Memory Garden
function Flower({ k, cx, cy, s }: { k: number; cx: number; cy: number; s: number }) {
  const n = [5, 6, 8, 4][k % 4], c = G[(k * 3 + 1) % 8];
  return (<>{Array.from({ length: n }, (_, i) => <Circle key={i} cx={cx + Math.cos((i / n) * 6.283) * s * 0.5} cy={cy + Math.sin((i / n) * 6.283) * s * 0.5} r={s * 0.36} fill={c} />)}<Circle cx={cx} cy={cy} r={s * 0.3} fill={k > 3 ? "#FFFFFF" : "#FBBF24"} /></>);
}
export function MemoryGarden({ w, h, api }: GameProps) {
  const N = 4, cw = w / N, ch = Math.min(h / N, cw * 1.25), oy = (h - ch * N) / 2;
  const mk = () => shuffle([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]);
  const [cards, setCards] = useState(mk); const [up, setUp] = useState<number[]>([]); const [got, setGot] = useState<number[]>([]); const busy = useRef(false);
  const touch = useTouch({ start: (x, y) => {
    if (busy.current) return;
    const c = Math.floor(x / cw), r = Math.floor((y - oy) / ch); if (c < 0 || r < 0 || c >= N || r >= N) return;
    const i = r * N + c; if (up.includes(i) || got.includes(i)) return;
    const nu = [...up, i]; setUp(nu); api.sfx("tap");
    if (nu.length < 2) return;
    busy.current = true;
    if (cards[nu[0]] === cards[nu[1]]) {
      const ng = [...got, ...nu]; setGot(ng); setUp([]); busy.current = false; api.sfx(NOTE(rint(2, 6))); api.haptic("success");
      if (ng.length === 16) { api.score(1); api.sfx("win"); setTimeout(() => { setCards(mk()); setGot([]); }, 900); }
    } else setTimeout(() => { setUp([]); busy.current = false; }, 750);
  } });
  return (
    <Board w={w} h={h} touch={touch}>
      <Svg width={w} height={h}>
        {cards.map((k, i) => {
          const x = (i % N) * cw, y = oy + Math.floor(i / N) * ch, show = up.includes(i) || got.includes(i);
          return (
            <React.Fragment key={i}>
              <Rect x={x + 5} y={y + 5} width={cw - 10} height={ch - 10} rx={16} fill={show ? "#FFFFFF" : "#34D399"} stroke={got.includes(i) ? "#FBBF24" : "#FFFFFF"} strokeWidth={3} />
              {show ? <Flower k={k} cx={x + cw / 2} cy={y + ch / 2} s={Math.min(cw, ch) * 0.28} /> : <Path d={`M${x + cw / 2} ${y + ch * 0.3} Q${x + cw * 0.75} ${y + ch / 2} ${x + cw / 2} ${y + ch * 0.7} Q${x + cw * 0.25} ${y + ch / 2} ${x + cw / 2} ${y + ch * 0.3} Z`} fill="#16A34A" opacity={0.5} />}
            </React.Fragment>
          );
        })}
      </Svg>
    </Board>
  );
}

// ---------- 50. Zen Garden
type Tool = "rake" | "stone" | "plant" | "ripple";
export function ZenGarden({ w, h, api }: GameProps) {
  const bh = h - 64;
  const [els, setEls] = useState<{ id: number; t: Tool; pts: number[][] }[]>([]); const [tool, setTool] = useState<Tool>("rake"); const cur = useRef<number[][]>([]); const force = useForce();
  const add = (t: Tool, pts: number[][]) => { setEls((e) => [...e.slice(-59), { id: uid(), t, pts }]); api.score(1); };
  const touch = useTouch({
    start: (x, y) => { if (tool === "rake") { cur.current = [[x, y]]; api.sfx("swish"); } else { add(tool, [[x, y]]); api.sfx(tool === "ripple" ? "water" : "tap"); api.haptic(); } },
    move: (x, y) => { if (tool !== "rake") return; const l = cur.current[cur.current.length - 1]; if (l && dist(l[0], l[1], x, y) > 6) { cur.current.push([x, y]); force(); } },
    end: () => { if (tool !== "rake") return; const p = cur.current; cur.current = []; let len = 0; for (let i = 1; i < p.length; i++) len += dist(p[i - 1][0], p[i - 1][1], p[i][0], p[i][1]); if (len > 40) add("rake", p); force(); },
  });
  const rake = (pts: number[][], key: string | number) => { const s = pts.map((p) => p.join(",")).join(" "); return <React.Fragment key={key}><Polyline points={s} stroke="#C8B48A" strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Polyline points={s} stroke="#EBDDB8" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Polyline points={s} stroke="#C8B48A" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></React.Fragment>; };
  const tools: Tool[] = ["rake", "stone", "plant", "ripple"];
  return (
    <View style={{ width: w, height: h, gap: 10 }}>
      <Board w={w} h={bh} touch={touch} style={{ backgroundColor: "#F1E6C8" }}>
        <Svg width={w} height={bh}>
          {els.filter((e) => e.t === "rake").map((e) => rake(e.pts, e.id))}
          {cur.current.length > 1 && rake(cur.current, "cur")}
          {els.filter((e) => e.t === "ripple").map((e) => [14, 26, 38].map((r) => <Circle key={`${e.id}-${r}`} cx={e.pts[0][0]} cy={e.pts[0][1]} r={r} stroke="#C8B48A" strokeWidth={3} fill="none" />))}
          {els.filter((e) => e.t === "stone").map((e) => <React.Fragment key={e.id}><Circle cx={e.pts[0][0]} cy={e.pts[0][1] + 4} r={20} fill="#00000022" /><Circle cx={e.pts[0][0]} cy={e.pts[0][1]} r={18} fill="#94A3B8" /><Circle cx={e.pts[0][0] - 6} cy={e.pts[0][1] - 6} r={5} fill="#FFFFFF" opacity={0.5} /></React.Fragment>)}
          {els.filter((e) => e.t === "plant").map((e) => <React.Fragment key={e.id}>{[0, 1, 2, 3, 4].map((i) => <Circle key={i} cx={e.pts[0][0] + Math.cos(i * 1.256) * 10} cy={e.pts[0][1] + Math.sin(i * 1.256) * 10} r={11} fill={i % 2 ? "#16A34A" : "#34D399"} />)}<Circle cx={e.pts[0][0]} cy={e.pts[0][1]} r={5} fill="#F472B6" /></React.Fragment>)}
        </Svg>
      </Board>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {tools.map((t) => (
          <Pressable key={t} testID={`zen-tool-${t}`} onPress={() => { setTool(t); api.sfx("tap"); }} style={{ flex: 1, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: tool === t ? G[3] : "#E2E8F0", borderBottomWidth: 4, borderColor: "#00000022" }}>
            <Txt v="caption" style={{ fontSize: 12 }} color={tool === t ? "#FFFFFF" : "#2D3142"} numberOfLines={1}>{api.t(t)}</Txt>
          </Pressable>
        ))}
        <Chunky testID="zen-clear-button" size="sm" label="✕" color={G[1]} style={{ width: 48 }} onPress={() => setEls([])} />
      </View>
    </View>
  );
}
