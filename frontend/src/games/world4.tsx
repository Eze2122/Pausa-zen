import React, { useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { Board, Bub, G, GameProps, NOTE, SHAPES, arcPath, dist, pick, rint, rnd, shapePath, uid, useForce, useTicker, useTouch } from "./kit";
import { Chunky, Txt } from "@/src/components/ui";

// ---------- 31. Infinite Orbit
export function InfiniteOrbit({ w, h, paused, api }: GameProps) {
  const cx = w / 2, cy = h / 2, maxR = Math.min(w, h) / 2 - 14;
  const ps = useRef<{ id: number; r: number; a: number; sp: number; c: string; tr: number[][] }[]>([]); const force = useForce();
  useTicker((dt) => {
    for (const p of ps.current) { p.a += p.sp * dt; p.tr.push([cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r]); if (p.tr.length > 16) p.tr.shift(); }
    force();
  }, paused);
  const touch = useTouch({ start: (x, y) => {
    const r = dist(x, y, cx, cy);
    if (r < 36 || r > maxR || ps.current.some((p) => Math.abs(p.r - r) < 16)) { api.haptic("error"); return; }
    ps.current.push({ id: uid(), r, a: Math.atan2(y - cy, x - cx), sp: 2.2 * Math.sqrt(60 / r), c: pick(G), tr: [] });
    if (ps.current.length > 12) ps.current.shift();
    api.score(1); api.sfx(NOTE(Math.min(6, Math.floor((r / maxR) * 7)))); api.haptic();
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#1E1B4B" }}>
      <Svg width={w} height={h}>
        {ps.current.map((p) => <Circle key={"o" + p.id} cx={cx} cy={cy} r={p.r} stroke={p.c} strokeOpacity={0.25} strokeWidth={2} fill="none" />)}
        {ps.current.map((p) => p.tr.map((t, i) => <Circle key={`${p.id}-${i}`} cx={t[0]} cy={t[1]} r={2 + i * 0.4} fill={p.c} opacity={i / 16} />))}
        <Circle cx={cx} cy={cy} r={26} fill="#FBBF24" />
        <Circle cx={cx} cy={cy} r={34} fill="#FBBF24" opacity={0.25} />
        {ps.current.map((p) => <Circle key={p.id} cx={cx + Math.cos(p.a) * p.r} cy={cy + Math.sin(p.a) * p.r} r={9} fill={p.c} stroke="#FFFFFF" strokeWidth={2} />)}
      </Svg>
    </Board>
  );
}

// ---------- 32. Pendulum
export function Pendulum({ w, h, paused, api }: GameProps) {
  const px = w / 2, py = 30, L = h * 0.62, HW = 0.13;
  const s = useRef({ th: 0.9, om: 0, drag: false, zc: rnd(-0.5, 0.5) }); const force = useForce(); const [msg, setMsg] = useState("");
  useTicker((dt) => { const st = s.current; if (!st.drag) { st.om += (-8.15 * Math.sin(st.th) - 0.08 * st.om) * dt; st.th += st.om * dt; } force(); }, paused, 20);
  const bob = () => [px + L * Math.sin(s.current.th), py + L * Math.cos(s.current.th)];
  const touch = useTouch({
    start: (x, y) => {
      const [bx, by] = bob();
      if (dist(x, y, bx, by) < 50) { s.current.drag = true; return; }
      const st = s.current;
      if (Math.abs(st.th - st.zc) < HW + 0.03) { api.score(1); api.sfx("pop"); api.haptic(); setMsg("✓"); let z; do z = rnd(-0.6, 0.6); while (Math.abs(z - st.zc) < 0.2); st.zc = z; }
      else { api.haptic("error"); setMsg(api.t("failed")); }
    },
    move: (x, y) => { if (s.current.drag) { s.current.th = Math.max(-1.3, Math.min(1.3, Math.atan2(x - px, y - py))); s.current.om = 0; } },
    end: () => { s.current.drag = false; },
  });
  const [bx, by] = bob(), z = s.current.zc, deg = (r: number) => 90 - (r * 180) / Math.PI;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FFF7ED" }}>
      <Svg width={w} height={h}>
        <Path d={arcPath(px, py, L - 28, L + 28, deg(z + HW), deg(z - HW))} fill="#34D399" opacity={0.5} />
        <Line x1={px} y1={py} x2={bx} y2={by} stroke="#2D3142" strokeWidth={4} />
        <Circle cx={px} cy={py} r={8} fill="#2D3142" />
        <Circle cx={bx} cy={by} r={24} fill="#FF6B6B" stroke="#FFFFFF" strokeWidth={4} />
      </Svg>
      {!!msg && <Txt v="title" style={{ position: "absolute", bottom: 16, alignSelf: "center" }}>{msg}</Txt>}
    </Board>
  );
}

// ---------- 33. Gravity Balls
type Ball = { id: number; x: number; y: number; vx: number; vy: number; c: string };
export function GravityBalls({ w, h, paused, api }: GameProps) {
  const R = 18, HR = 32;
  const spots = [[HR + 6, HR + 6], [w - HR - 6, HR + 6], [HR + 6, h - HR - 6], [w - HR - 6, h - HR - 6], [w / 2, HR + 6], [w / 2, h - HR - 6]];
  const s = useRef({ g: [0, 500], hole: spots[3], balls: Array.from({ length: 5 }, (_, i): Ball => ({ id: uid(), x: w / 2 + (i - 2) * 40, y: h / 2, vx: 0, vy: 0, c: G[i] })) });
  const sw = useRef<number[] | null>(null); const force = useForce();
  useTicker((dt) => {
    const st = s.current;
    for (const b of st.balls) {
      b.vx = (b.vx + st.g[0] * dt) * 0.995; b.vy = (b.vy + st.g[1] * dt) * 0.995; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < R) { b.x = R; b.vx *= -0.5; } if (b.x > w - R) { b.x = w - R; b.vx *= -0.5; }
      if (b.y < R) { b.y = R; b.vy *= -0.5; } if (b.y > h - R) { b.y = h - R; b.vy *= -0.5; }
    }
    for (let i = 0; i < st.balls.length; i++) for (let j = i + 1; j < st.balls.length; j++) {
      const a = st.balls[i], b = st.balls[j], d = dist(a.x, a.y, b.x, b.y);
      if (d < R * 2 && d > 0) { const o = (R * 2 - d) / 2, nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; }
    }
    for (const b of st.balls) if (dist(b.x, b.y, st.hole[0], st.hole[1]) < HR - 6) {
      api.score(1); api.sfx("pop"); api.haptic("success");
      b.x = w / 2 + rnd(-30, 30); b.y = h / 2; b.vx = b.vy = 0;
      let n; do n = pick(spots); while (n === st.hole); st.hole = n;
    }
    force();
  }, paused, 20);
  const touch = useTouch({ start: (x, y) => { sw.current = [x, y]; }, move: (x, y) => {
    const a = sw.current; if (!a) return; const dx = x - a[0], dy = y - a[1], d = Math.hypot(dx, dy);
    if (d > 30) { s.current.g = [(dx / d) * 500, (dy / d) * 500]; sw.current = [x, y]; api.sfx("swish"); }
  } });
  const st = s.current, ga = Math.atan2(st.g[1], st.g[0]);
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#ECFEFF" }}>
      <View style={{ position: "absolute", left: st.hole[0] - HR, top: st.hole[1] - HR, width: HR * 2, height: HR * 2, borderRadius: HR, backgroundColor: "#2D3142", borderWidth: 4, borderColor: "#FBBF24" }} />
      <Svg width={w} height={h} style={{ position: "absolute" }}><Line x1={w / 2} y1={h / 2} x2={w / 2 + Math.cos(ga) * 40} y2={h / 2 + Math.sin(ga) * 40} stroke="#94A3B8" strokeWidth={6} strokeLinecap="round" /></Svg>
      {st.balls.map((b) => <Bub key={b.id} x={b.x} y={b.y} r={R} c={b.c} />)}
    </Board>
  );
}

// ---------- 34. Soft Bounce
export function SoftBounce({ w, h, paused, api }: GameProps) {
  const lx = w / 2, ly = h - 50, R = 14, TR = 30;
  const s = useRef({ x: lx, y: ly, vx: 0, vy: 0, fly: false, t: 0, tx: rnd(60, w - 60), ty: rnd(60, h * 0.45), aim: null as number[] | null, st: null as number[] | null }); const force = useForce();
  const reset = () => { const st = s.current; st.x = lx; st.y = ly; st.vx = st.vy = 0; st.fly = false; };
  useTicker((dt) => {
    const st = s.current;
    if (st.fly) {
      st.t += dt; st.vy += 250 * dt; st.x += st.vx * dt; st.y += st.vy * dt;
      if (st.x < R || st.x > w - R) { st.vx *= -0.85; st.x = Math.max(R, Math.min(w - R, st.x)); api.sfx("tap"); }
      if (st.y < R || st.y > h - R) { st.vy *= -0.8; st.y = Math.max(R, Math.min(h - R, st.y)); }
      if (dist(st.x, st.y, st.tx, st.ty) < TR + R) { api.score(1); api.sfx("pop"); api.haptic("success"); st.tx = rnd(60, w - 60); st.ty = rnd(60, h * 0.5); reset(); }
      if (st.t > 5) reset();
    }
    force();
  }, paused, 20);
  const touch = useTouch({
    start: (x, y) => { if (!s.current.fly) s.current.st = [x, y]; },
    move: (x, y) => { const st = s.current; if (st.st) st.aim = [st.st[0] - x, st.st[1] - y]; },
    end: () => { const st = s.current; if (st.aim && Math.hypot(st.aim[0], st.aim[1]) > 20) { const k = Math.min(900, Math.hypot(st.aim[0], st.aim[1]) * 5) / Math.hypot(st.aim[0], st.aim[1]); st.vx = st.aim[0] * k; st.vy = st.aim[1] * k; st.fly = true; st.t = 0; api.sfx("swish"); } st.aim = null; st.st = null; },
  });
  const st = s.current;
  const k = st.aim ? Math.min(900, Math.hypot(st.aim[0], st.aim[1]) * 5) / Math.max(1, Math.hypot(st.aim[0], st.aim[1])) : 0;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FDF2F8" }}>
      <Svg width={w} height={h}>
        <Circle cx={st.tx} cy={st.ty} r={TR} fill="#FBBF24" stroke="#FFFFFF" strokeWidth={4} />
        <Circle cx={st.tx} cy={st.ty} r={TR * 0.45} fill="#FF6B6B" />
        {st.aim && [1, 2, 3, 4, 5, 6].map((i) => { const t = i * 0.08; return <Circle key={i} cx={lx + st.aim![0] * k * t} cy={ly + st.aim![1] * k * t + 125 * t * t} r={4} fill="#8B5CF6" opacity={1 - i / 7} />; })}
        <Rect x={lx - 30} y={ly + 10} width={60} height={14} rx={7} fill="#8B5CF6" />
        <Circle cx={st.x} cy={st.y} r={R} fill="#14B8A6" stroke="#FFFFFF" strokeWidth={3} />
      </Svg>
    </Board>
  );
}

// ---------- 35. Spiral Flow
export function SpiralFlow({ w, h, paused, api }: GameProps) {
  const sp = useRef<{ id: number; x: number; y: number; c: string; t: number; rot: number }[]>([]); const force = useForce();
  useTicker((dt) => { for (const s of sp.current) { s.t += dt; s.rot += dt * 1.4; } force(); }, paused);
  const touch = useTouch({ start: (x, y) => {
    if (sp.current.some((s) => dist(s.x, s.y, x, y) < 75)) { api.haptic("error"); return; }
    sp.current.push({ id: uid(), x, y, c: pick(G), t: 0, rot: 0 }); if (sp.current.length > 8) sp.current.shift();
    api.score(1); api.sfx(NOTE(rint(0, 6))); api.haptic();
  } });
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#F0FDF4" }}>
      <Svg width={w} height={h}>
        {sp.current.map((s) => {
          const tm = Math.PI * 6 * Math.min(1, s.t / 2);
          const pts = Array.from({ length: 50 }, (_, i) => { const th = (i / 49) * tm; return `${(s.x + Math.cos(th + s.rot) * 3 * th).toFixed(1)},${(s.y + Math.sin(th + s.rot) * 3 * th).toFixed(1)}`; }).join(" ");
          return <Polyline key={s.id} points={pts} stroke={s.c} strokeWidth={5} fill="none" strokeLinecap="round" />;
        })}
      </Svg>
    </Board>
  );
}

// ---------- 36. Floating Islands
export function FloatingIslands({ w, h, paused, api }: GameProps) {
  const IW = Math.min(100, w * 0.26), BH = 20;
  const s = useRef({ t: 0, stacks: [0, 0, 0], items: [] as { id: number; x: number; y: number; vy: number; c: string }[], spl: [] as { id: number; x: number; t: number }[] }); const force = useForce();
  const isl = (i: number, t: number) => [w * (0.2 + i * 0.3) + Math.sin(t * 0.6 + i * 2) * w * 0.06, h * 0.72 + Math.sin(t * 1.2 + i) * 10];
  useTicker((dt) => {
    const st = s.current; st.t += dt;
    for (const it of st.items) {
      it.vy += 700 * dt; it.y += it.vy * dt;
      for (let i = 0; i < 3; i++) {
        const [ix, iy] = isl(i, st.t), topY = iy - st.stacks[i] * BH;
        if (it.vy > 0 && it.y + BH / 2 >= topY && it.y < topY + 14 && Math.abs(it.x - ix) < IW / 2) {
          it.y = -999; st.stacks[i]++; api.score(1); api.sfx("pop"); api.haptic();
          if (st.stacks[i] >= 5) { st.stacks[i] = 0; api.sfx("unlock"); }
        }
      }
      if (it.y > h) { st.spl.push({ id: uid(), x: it.x, t: 0 }); it.y = -999; api.sfx("water"); }
    }
    st.items = st.items.filter((it) => it.y > -500);
    for (const p of st.spl) p.t += dt; st.spl = st.spl.filter((p) => p.t < 0.6);
    force();
  }, paused);
  const touch = useTouch({ start: (x) => { if (s.current.items.length < 3) s.current.items.push({ id: uid(), x, y: 10, vy: 0, c: pick(G) }); } });
  const st = s.current;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#E0F2FE" }}>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.12, backgroundColor: "#7DD3FC" }} />
      {[0, 1, 2].map((i) => { const [ix, iy] = isl(i, st.t); return (
        <React.Fragment key={i}>
          <View style={{ position: "absolute", left: ix - IW / 2, top: iy, width: IW, height: 16, borderRadius: 8, backgroundColor: "#34D399" }} />
          <View style={{ position: "absolute", left: ix - IW / 2 + 10, top: iy + 12, width: IW - 20, height: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, backgroundColor: "#B45309" }} />
          {Array.from({ length: st.stacks[i] }, (_, k) => <View key={k} style={{ position: "absolute", left: ix - 18, top: iy - (k + 1) * BH, width: 36, height: BH - 2, borderRadius: 6, backgroundColor: G[(i * 3 + k) % 8] }} />)}
        </React.Fragment>); })}
      {st.items.map((it) => <View key={it.id} style={{ position: "absolute", left: it.x - 18, top: it.y - BH / 2, width: 36, height: BH - 2, borderRadius: 6, backgroundColor: it.c }} />)}
      {st.spl.map((p) => <View key={p.id} style={{ position: "absolute", left: p.x - 20 - p.t * 30, top: h - 30, width: 40 + p.t * 60, height: 14, borderRadius: 10, borderWidth: 3, borderColor: "#FFFFFF", opacity: 1 - p.t / 0.6 }} />)}
    </Board>
  );
}

// ---------- 37. Balance Tower
export function BalanceTower({ w, h, paused, api }: GameProps) {
  const BH = 28, W0 = w * 0.5;
  const s = useRef({ blocks: [{ x: (w - W0) / 2, w: W0, c: G[0] }], x: 0, dir: 1, v: 120, c: G[1] }); const force = useForce();
  useTicker((dt) => {
    const st = s.current, cw = st.blocks[st.blocks.length - 1].w;
    st.x += st.dir * st.v * dt; if (st.x < 0) { st.x = 0; st.dir = 1; } if (st.x + cw > w) { st.x = w - cw; st.dir = -1; }
    force();
  }, paused);
  const touch = useTouch({ start: () => {
    const st = s.current, prev = st.blocks[st.blocks.length - 1];
    const l = Math.max(st.x, prev.x), r = Math.min(st.x + prev.w, prev.x + prev.w), ov = r - l;
    if (ov <= 4) {
      api.sfx("fail"); api.haptic("error"); api.fail();
      st.blocks = [{ x: (w - W0) / 2, w: W0, c: G[0] }]; st.v = 120; st.x = 0; return;
    }
    const perfect = Math.abs(st.x - prev.x) < 6;
    st.blocks.push(perfect ? { x: prev.x, w: prev.w, c: st.c } : { x: l, w: ov, c: st.c });
    st.c = G[st.blocks.length % 8]; st.v = Math.min(330, st.v + 10); st.x = 0; st.dir = 1;
    api.score(1); api.sfx(perfect ? "unlock" : "pop"); api.haptic(perfect ? "success" : "medium");
  } });
  const st = s.current, n = st.blocks.length, shift = Math.max(0, (n + 2) * BH - h * 0.7);
  const cur = st.blocks[n - 1];
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#FEF9C3" }}>
      {st.blocks.map((b, i) => <View key={i} style={{ position: "absolute", left: b.x, top: h - (i + 1) * BH + shift, width: b.w, height: BH - 2, borderRadius: 8, backgroundColor: b.c, borderBottomWidth: 4, borderColor: "#00000022" }} />)}
      <View style={{ position: "absolute", left: st.x, top: h - (n + 2) * BH + shift, width: cur.w, height: BH - 2, borderRadius: 8, backgroundColor: st.c, borderBottomWidth: 4, borderColor: "#00000022" }} />
    </Board>
  );
}

// ---------- 38. Magnetic Shapes
export function MagneticShapes({ w, h, paused, api }: GameProps) {
  const bh = h - 64, GR = 52;
  const mk = () => ({ id: uid(), x: rnd(30, w - 30), y: rnd(30, bh - 30), vx: 0, vy: 0, k: rint(0, 6), c: pick(G), inT: 0 });
  const s = useRef({ sh: Array.from({ length: 10 }, mk), f: null as number[] | null, gx: w / 2, gy: bh / 2 }); const force = useForce();
  const [att, setAtt] = useState(true);
  useTicker((dt) => {
    const st = s.current;
    for (const p of st.sh) {
      if (st.f) { const dx = st.f[0] - p.x, dy = st.f[1] - p.y, d = Math.max(20, Math.hypot(dx, dy)), F = (att ? 1 : -1) * 60000 / (d + 40); p.vx += (dx / d) * F * dt; p.vy += (dy / d) * F * dt; }
      p.vx *= 0.94; p.vy *= 0.94; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 16 || p.x > w - 16) { p.vx *= -0.6; p.x = Math.max(16, Math.min(w - 16, p.x)); }
      if (p.y < 16 || p.y > bh - 16) { p.vy *= -0.6; p.y = Math.max(16, Math.min(bh - 16, p.y)); }
      if (dist(p.x, p.y, st.gx, st.gy) < GR) { p.inT += dt; if (p.inT > 0.6) { api.score(1); api.sfx("unlock"); api.haptic("success"); Object.assign(p, mk()); st.gx = rnd(GR + 10, w - GR - 10); st.gy = rnd(GR + 10, bh - GR - 10); } } else p.inT = 0;
    }
    force();
  }, paused);
  const touch = useTouch({ start: (x, y) => { s.current.f = [x, y]; }, move: (x, y) => { s.current.f = [x, y]; }, end: () => { s.current.f = null; } });
  const st = s.current;
  return (
    <View style={{ width: w, height: h, gap: 10 }}>
      <Board w={w} h={bh} touch={touch} style={{ backgroundColor: "#F5F3FF" }}>
        <Svg width={w} height={bh}>
          <Circle cx={st.gx} cy={st.gy} r={GR} fill="#34D399" opacity={0.3} stroke="#34D399" strokeWidth={4} strokeDasharray="8 6" />
          {st.f && <Circle cx={st.f[0]} cy={st.f[1]} r={22} fill={att ? "#FF6B6B" : "#38BDF8"} opacity={0.5} />}
          {st.sh.map((p) => <Path key={p.id} d={shapePath(SHAPES[p.k], p.x, p.y, 14)} fill={p.c} stroke="#FFFFFF" strokeWidth={2} />)}
        </Svg>
      </Board>
      <Chunky testID="magnet-polarity-button" size="sm" label={att ? api.t("attract") : api.t("repel")} color={att ? G[1] : G[4]} onPress={() => setAtt(!att)} />
    </View>
  );
}

// ---------- 39. Water Waves
export function WaterWaves({ w, h, paused, api }: GameProps) {
  const PR = 44;
  const mkL = () => ({ id: uid(), x: rnd(60, w - 60), y: rnd(60, h - 60), vx: 0, vy: 0, rot: rnd(0, 360) });
  const s = useRef({ rip: [] as { id: number; x: number; y: number; t: number }[], leaves: Array.from({ length: 5 }, mkL), gx: w - PR - 10, gy: PR + 10 }); const force = useForce();
  useTicker((dt) => {
    const st = s.current;
    for (const r of st.rip) r.t += dt; st.rip = st.rip.filter((r) => r.t < 1.2);
    for (const l of st.leaves) {
      l.vx *= 0.97; l.vy *= 0.97; l.x += l.vx * dt; l.y += l.vy * dt; l.rot += l.vx * dt;
      if (l.x < 14 || l.x > w - 14) { l.vx *= -0.7; l.x = Math.max(14, Math.min(w - 14, l.x)); }
      if (l.y < 14 || l.y > h - 14) { l.vy *= -0.7; l.y = Math.max(14, Math.min(h - 14, l.y)); }
      if (dist(l.x, l.y, st.gx, st.gy) < PR) {
        api.score(1); api.sfx("unlock"); api.haptic("success"); Object.assign(l, mkL());
        const corners = [[PR + 10, PR + 10], [w - PR - 10, PR + 10], [PR + 10, h - PR - 10], [w - PR - 10, h - PR - 10]];
        const c = pick(corners); st.gx = c[0]; st.gy = c[1];
      }
    }
    force();
  }, paused);
  const touch = useTouch({ start: (x, y) => {
    const st = s.current; st.rip.push({ id: uid(), x, y, t: 0 }); api.sfx("water"); api.haptic("light");
    for (const l of st.leaves) { const d = dist(x, y, l.x, l.y); if (d < 170 && d > 0) { const f = (170 - d) * 2.6; l.vx += ((l.x - x) / d) * f; l.vy += ((l.y - y) / d) * f; } }
  } });
  const st = s.current;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#7DD3FC" }}>
      <View style={{ position: "absolute", left: st.gx - PR, top: st.gy - PR, width: PR * 2, height: PR * 2, borderRadius: PR, backgroundColor: "#34D399", borderWidth: 4, borderColor: "#F472B6" }} />
      {st.rip.map((r) => { const rr = 10 + r.t * 150; return <View key={r.id} style={{ position: "absolute", left: r.x - rr, top: r.y - rr, width: rr * 2, height: rr * 2, borderRadius: rr, borderWidth: 3, borderColor: "#FFFFFF", opacity: 1 - r.t / 1.2 }} />; })}
      {st.leaves.map((l) => <View key={l.id} style={{ position: "absolute", left: l.x - 14, top: l.y - 9, width: 28, height: 18, borderTopLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: "#16A34A", transform: [{ rotate: `${l.rot}deg` }] }} />)}
    </Board>
  );
}

// ---------- 40. Light Trails
export function LightTrails({ w, h, paused, api }: GameProps) {
  const mkO = () => ({ id: uid(), x: rnd(30, w - 30), y: rnd(30, h - 30), vx: rnd(-20, 20), vy: rnd(-20, 20), c: pick(G) });
  const s = useRef({ tr: [] as { x: number; y: number; t: number }[], orbs: Array.from({ length: 4 }, mkO) }); const force = useForce();
  useTicker((dt) => {
    const st = s.current;
    for (const p of st.tr) p.t += dt; st.tr = st.tr.filter((p) => p.t < 0.9);
    for (const o of st.orbs) { o.x += o.vx * dt; o.y += o.vy * dt; if (o.x < 20 || o.x > w - 20) o.vx *= -1; if (o.y < 20 || o.y > h - 20) o.vy *= -1; }
    force();
  }, paused);
  const add = (x: number, y: number) => {
    const st = s.current; st.tr.push({ x, y, t: 0 }); if (st.tr.length > 50) st.tr.shift();
    st.orbs.forEach((o, i) => { if (dist(x, y, o.x, o.y) < 30) { st.orbs[i] = mkO(); api.score(1); api.sfx(NOTE(rint(2, 6))); api.haptic(); } });
  };
  const touch = useTouch({ start: add, move: add });
  const st = s.current;
  return (
    <Board w={w} h={h} touch={touch} style={{ backgroundColor: "#1E1B4B" }}>
      <Svg width={w} height={h}>
        {st.orbs.map((o) => <React.Fragment key={o.id}><Circle cx={o.x} cy={o.y} r={20} fill={o.c} opacity={0.3} /><Circle cx={o.x} cy={o.y} r={10} fill={o.c} /></React.Fragment>)}
        {st.tr.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={10 * (1 - p.t / 0.9) + 2} fill={G[i % 8]} opacity={1 - p.t / 0.9} />)}
      </Svg>
    </Board>
  );
}
