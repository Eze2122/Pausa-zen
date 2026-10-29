import React, { useRef, useState } from "react";
import { View } from "react-native";
import { Board, Bub, G, GameProps, NOTE, dist, pick, rint, rnd, uid, useBursts, useForce, useTicker, useTouch } from "./kit";
import { Chunky, Txt } from "@/src/components/ui";

type B = { id: number; x: number; y: number; r: number; c: string; vx?: number; vy?: number; ph?: number };
const BG = "#E0F2FE";

// 1. Pop Bubbles
export function PopBubbles({ w, h, api }: GameProps) {
  const mk = (): B => ({ id: uid(), x: rnd(40, w - 40), y: rnd(40, h - 40), r: rnd(26, 40), c: pick(G) });
  const [bs, setBs] = useState<B[]>(() => Array.from({ length: 8 }, mk));
  const [fx, burst] = useBursts(api.reduce);
  const touch = useTouch({ start: (x, y) => {
    for (let i = bs.length - 1; i >= 0; i--) {
      const b = bs[i];
      if (dist(x, y, b.x, b.y) <= b.r + 8) {
        burst(b.x, b.y, b.c); api.sfx("pop"); api.haptic(); api.score(1);
        setBs((p) => p.map((q) => (q.id === b.id ? mk() : q)));
        return;
      }
    }
  } });
  return <Board w={w} h={h} touch={touch} style={{ backgroundColor: BG }}>{bs.map((b) => <Bub key={b.id} {...b} />)}{fx}</Board>;
}

// 2. Bubble Wrap
export function BubbleWrap({ w, h, api }: GameProps) {
  const cols = 6, rows = 8, cell = Math.min(w / cols, h / rows);
  const ox = (w - cell * cols) / 2, oy = (h - cell * rows) / 2;
  const [popped, setPopped] = useState<boolean[]>(() => Array(cols * rows).fill(false));
  const touch = useTouch({ start: (x, y) => {
    const c = Math.floor((x - ox) / cell), r = Math.floor((y - oy) / cell);
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    const i = r * cols + c;
    if (popped[i]) return;
    const n = [...popped]; n[i] = true; setPopped(n);
    api.sfx("pop"); api.haptic("medium"); api.score(1);
    if (n.every(Boolean)) setTimeout(() => setPopped(Array(cols * rows).fill(false)), 600);
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#DDF4F1" }}>
      {popped.map((p, i) => {
        const x = ox + (i % cols) * cell + cell / 2, y = oy + Math.floor(i / cols) * cell + cell / 2, r = cell * 0.4;
        return p ? <View key={i} style={{ position: "absolute", left: x - r, top: y - r * 0.35, width: r * 2, height: r * 0.7, borderRadius: r, backgroundColor: "#B8E6DF" }} />
          : <Bub key={i} x={x} y={y} r={r} c="#A7F3D0" o={0.95} />;
      })}
    </Board>
  );
}

// 3. Pop Combo (flood-fill groups + gravity)
export function PopCombo({ w, h, api }: GameProps) {
  const cols = 6, rows = 8, cell = Math.min(w / cols, h / rows);
  const ox = (w - cell * cols) / 2, oy = (h - cell * rows) / 2;
  const cs = G.slice(0, 4);
  const [grid, setGrid] = useState<string[]>(() => Array.from({ length: cols * rows }, () => pick(cs)));
  const [fx, burst] = useBursts(api.reduce);
  const touch = useTouch({ start: (x, y) => {
    const c = Math.floor((x - ox) / cell), r = Math.floor((y - oy) / cell);
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    const col = grid[r * cols + c];
    const seen = new Set<number>(); const st = [r * cols + c];
    while (st.length) {
      const i = st.pop()!; if (seen.has(i) || grid[i] !== col) continue; seen.add(i);
      const rr = Math.floor(i / cols), cc = i % cols;
      if (rr > 0) st.push(i - cols); if (rr < rows - 1) st.push(i + cols); if (cc > 0) st.push(i - 1); if (cc < cols - 1) st.push(i + 1);
    }
    if (seen.size < 2) { api.haptic("error"); return; }
    const n = [...grid];
    for (let cc = 0; cc < cols; cc++) {
      const keep: string[] = [];
      for (let rr = rows - 1; rr >= 0; rr--) if (!seen.has(rr * cols + cc)) keep.push(n[rr * cols + cc]);
      for (let rr = rows - 1, k = 0; rr >= 0; rr--, k++) n[rr * cols + cc] = keep[k] ?? pick(cs);
    }
    burst(ox + c * cell + cell / 2, oy + r * cell + cell / 2, col);
    setGrid(n); api.sfx("pop"); api.haptic("medium"); api.score(seen.size);
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: BG }}>
      {grid.map((c, i) => <Bub key={i} x={ox + (i % cols) * cell + cell / 2} y={oy + Math.floor(i / cols) * cell + cell / 2} r={cell * 0.44} c={c} />)}
      {fx}
    </Board>
  );
}

// 4. Bubble Rain
export function BubbleRain({ w, h, paused, api }: GameProps) {
  const bs = useRef<B[]>([]); const sp = useRef(0); const force = useForce();
  const [fx, burst] = useBursts(api.reduce);
  useTicker((dt) => {
    sp.current -= dt;
    if (sp.current <= 0) { sp.current = rnd(0.45, 0.9); bs.current.push({ id: uid(), x: rnd(30, w - 30), y: -30, r: rnd(22, 32), c: pick(G), vy: rnd(70, 140) }); }
    bs.current = bs.current.filter((b) => (b.y += b.vy! * dt) < h + 40);
    force();
  }, paused);
  const touch = useTouch({ start: (x, y) => {
    const b = [...bs.current].reverse().find((q) => dist(x, y, q.x, q.y) <= q.r + 10);
    if (!b) return;
    bs.current = bs.current.filter((q) => q !== b); burst(b.x, b.y, b.c); api.sfx("pop"); api.haptic(); api.score(1);
  } });
  return <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#E0E7FF" }}>{bs.current.map((b) => <Bub key={b.id} {...b} />)}{fx}</Board>;
}

// 5. Giant Pop
export function GiantPop({ w, h, api }: GameProps) {
  const NEED = 8;
  const [taps, setTaps] = useState(0); const [col, setCol] = useState(G[4]);
  const [fx, burst] = useBursts(api.reduce);
  const base = Math.min(w, h) * 0.22, r = base + taps * base * 0.08;
  const touch = useTouch({ start: (x, y) => {
    if (dist(x, y, w / 2, h / 2) > r + 20) return;
    if (taps + 1 >= NEED) { burst(w / 2, h / 2, col); burst(w / 2 - 40, h / 2 + 20, col); burst(w / 2 + 40, h / 2 - 20, col); api.sfx("pop"); api.haptic("heavy"); api.score(1); setTaps(0); setCol(pick(G)); }
    else { setTaps(taps + 1); api.sfx("tap"); api.haptic("light"); }
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FCE7F3" }}>
      <Bub x={w / 2} y={h / 2} r={r} c={col} o={0.9} />
      <Txt v="title" style={{ position: "absolute", top: 16, alignSelf: "center" }}>{NEED - taps}</Txt>
      {fx}
    </Board>
  );
}

// 6. Color Pop
export function ColorPop({ w, h, api }: GameProps) {
  const cs = G.slice(0, 4), top = 70;
  const mk = (c?: string): B => ({ id: uid(), x: rnd(40, w - 40), y: rnd(top + 40, h - 40), r: rnd(26, 36), c: c ?? pick(cs) });
  const [target, setTarget] = useState(cs[0]);
  const [bs, setBs] = useState<B[]>(() => [mk(cs[0]), mk(cs[0]), ...Array.from({ length: 8 }, () => mk())]);
  const [fx, burst] = useBursts(api.reduce);
  const touch = useTouch({ start: (x, y) => {
    const b = [...bs].reverse().find((q) => dist(x, y, q.x, q.y) <= q.r + 8);
    if (!b) return;
    if (b.c !== target) { api.haptic("error"); api.sfx("fail"); api.score(-1); return; }
    burst(b.x, b.y, b.c); api.sfx("pop"); api.haptic(); api.score(1);
    let nt = target;
    if (Math.random() < 0.25) { nt = pick(cs); setTarget(nt); }
    setBs((p) => { const n = p.map((q) => (q.id === b.id ? mk() : q)); if (!n.some((q) => q.c === nt)) n[0] = mk(nt); return n; });
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FEF9C3" }}>
      <View style={{ position: "absolute", top: 12, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Txt v="bold">{api.t("target")}</Txt>
        <View testID="color-pop-target" style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: target }} />
      </View>
      {bs.map((b) => <Bub key={b.id} {...b} />)}{fx}
    </Board>
  );
}

// 7. Bubble Chain
export function BubbleChain({ w, h, paused, api }: GameProps) {
  const R = Math.min(w, h) * 0.17;
  const mk = (): B => ({ id: uid(), x: rnd(30, w - 30), y: rnd(30, h - 30), r: rnd(16, 24), c: pick(G), vx: rnd(-20, 20), vy: rnd(-20, 20) });
  const bs = useRef<B[]>(Array.from({ length: 18 }, mk));
  const ex = useRef<{ id: number; x: number; y: number; t: number; c: string; done: boolean }[]>([]);
  const force = useForce();
  useTicker((dt) => {
    for (const b of bs.current) { b.x += b.vx! * dt; b.y += b.vy! * dt; if (b.x < b.r || b.x > w - b.r) b.vx! *= -1; if (b.y < b.r || b.y > h - b.r) b.vy! *= -1; }
    for (const e of ex.current) {
      e.t += dt;
      if (!e.done && e.t > 0.18) {
        e.done = true;
        const hit = bs.current.filter((b) => dist(b.x, b.y, e.x, e.y) < R);
        if (hit.length) { bs.current = bs.current.filter((b) => !hit.includes(b)); hit.forEach((b) => ex.current.push({ id: uid(), x: b.x, y: b.y, t: 0, c: b.c, done: false })); api.score(hit.length); api.sfx("pop"); }
      }
    }
    ex.current = ex.current.filter((e) => e.t < 0.6);
    if (bs.current.length < 10 && Math.random() < 0.05) bs.current.push(mk());
    force();
  }, paused);
  const touch = useTouch({ start: (x, y) => {
    const b = bs.current.find((q) => dist(x, y, q.x, q.y) < q.r + 14);
    if (!b) return;
    bs.current = bs.current.filter((q) => q !== b); ex.current.push({ id: uid(), x: b.x, y: b.y, t: 0, c: b.c, done: false }); api.score(1); api.sfx("pop"); api.haptic("medium");
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#EDE9FE" }}>
      {ex.current.map((e) => { const r = R * Math.min(1, e.t / 0.18); return <View key={e.id} style={{ position: "absolute", left: e.x - r, top: e.y - r, width: r * 2, height: r * 2, borderRadius: r, borderWidth: 3, borderColor: e.c, opacity: 1 - e.t / 0.6 }} />; })}
      {bs.current.map((b) => <Bub key={b.id} {...b} />)}
    </Board>
  );
}

// 8. Bubble Sort (baskets)
export function BubbleSort({ w, h, api }: GameProps) {
  const cs = G.slice(0, 4), bw = w / 4, bh = 90;
  const [queue, setQueue] = useState(() => Array.from({ length: 4 }, () => pick(cs)));
  const [shake, setShake] = useState(0);
  const touch = useTouch({ start: (x, y) => {
    if (y < h - bh - 10) return;
    const i = Math.floor(x / bw);
    if (cs[i] === queue[0]) { api.sfx("pop"); api.haptic(); api.score(1); setQueue([...queue.slice(1), pick(cs)]); }
    else { api.sfx("fail"); api.haptic("error"); setShake((s) => s + 1); }
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: BG }}>
      <Bub x={w / 2 + (shake % 2 ? 8 : 0)} y={h * 0.35} r={46} c={queue[0]} />
      {queue.slice(1).map((c, i) => <Bub key={i} x={w / 2 + 70 + i * 34} y={h * 0.35 - 60} r={14} c={c} o={0.7} />)}
      {cs.map((c, i) => (
        <View key={c} style={{ position: "absolute", left: i * bw + 6, top: h - bh, width: bw - 12, height: bh - 8, backgroundColor: c, borderRadius: 18, borderBottomWidth: 6, borderColor: "#00000022" }} />
      ))}
    </Board>
  );
}

// 9. Floating Bubbles
export function FloatingBubbles({ w, h, paused, api }: GameProps) {
  const bs = useRef<B[]>([]); const force = useForce();
  const [fx, burst] = useBursts(api.reduce);
  useTicker((dt) => {
    if (bs.current.length < 9 && Math.random() < 0.06) bs.current.push({ id: uid(), x: rnd(40, w - 40), y: h + 40, r: rnd(18, 44), c: pick(G), vy: rnd(25, 55), ph: rnd(0, 6) });
    for (const b of bs.current) { b.y -= b.vy! * dt; b.ph! += dt; b.x += Math.sin(b.ph!) * 0.6; }
    bs.current = bs.current.filter((b) => b.y > -60);
    force();
  }, paused);
  const touch = useTouch({ start: (x, y) => {
    const b = bs.current.find((q) => dist(x, y, q.x, q.y) < q.r + 10);
    if (!b) return;
    bs.current = bs.current.filter((q) => q !== b); burst(b.x, b.y, b.c); api.sfx(NOTE(rint(0, 6))); api.haptic(); api.score(1);
  } });
  return <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#ECFEFF" }}>{bs.current.map((b) => <Bub key={b.id} {...b} o={0.75} />)}{fx}</Board>;
}

// 10. Pop Symphony (compose + playback)
export function PopSymphony({ w, h, api }: GameProps) {
  const bh = h - 90;
  const pos = Array.from({ length: 7 }, (_, i) => ({ x: w * (0.14 + (i % 4) * 0.24) + (i >= 4 ? w * 0.12 : 0), y: i < 4 ? bh * 0.35 : bh * 0.7 }));
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const playing = useRef(false);
  const tap = (i: number) => { api.sfx(NOTE(i)); setLit(i); setTimeout(() => setLit(-1), 180); };
  const touch = useTouch({ start: (x, y) => {
    if (playing.current) return;
    const i = pos.findIndex((p) => dist(x, y, p.x, p.y) < 40);
    if (i < 0) return;
    tap(i); api.haptic(); setSeq((s) => [...s, i].slice(-12));
  } });
  const play = () => {
    if (playing.current || seq.length === 0) return;
    playing.current = true;
    seq.forEach((n, k) => setTimeout(() => tap(n), k * 340));
    setTimeout(() => { playing.current = false; if (seq.length >= 6) { api.score(1); api.sfx("win"); setSeq([]); } }, seq.length * 340 + 200);
  };
  return (
    <View style={{ width: w, height: h, gap: 10 }}>
      <Board w={w} h={bh} touch={touch} style={{ backgroundColor: "#FDF2F8" }}>
        <View style={{ flexDirection: "row", gap: 6, position: "absolute", top: 12, left: 12 }}>
          {seq.map((n, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: G[n] }} />)}
        </View>
        {pos.map((p, i) => <Bub key={i} x={p.x} y={p.y} r={lit === i ? 40 : 34} c={G[i]} />)}
      </Board>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Chunky testID="symphony-play-button" label={api.t("playMelody")} size="sm" style={{ flex: 1 }} onPress={play} />
        <Chunky testID="symphony-clear-button" label={api.t("clear")} size="sm" color={G[3]} style={{ flex: 1 }} onPress={() => setSeq([])} />
      </View>
    </View>
  );
}
