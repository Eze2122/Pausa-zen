import type { ComponentType } from "react";
import type { GameProps } from "./kit";
import * as W1 from "./world1";
import * as W2 from "./world2";
import * as W3 from "./world3";
import * as W4 from "./world4";
import * as W5 from "./world5";

// id -> playable component. Every entry of src/core/registry.ts must appear here (checked by tests).
export const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  "pop-bubbles": W1.PopBubbles, "bubble-wrap": W1.BubbleWrap, "pop-combo": W1.PopCombo, "bubble-rain": W1.BubbleRain, "giant-pop": W1.GiantPop,
  "color-pop": W1.ColorPop, "bubble-chain": W1.BubbleChain, "bubble-sort": W1.BubbleSort, "floating-bubbles": W1.FloatingBubbles, "pop-symphony": W1.PopSymphony,
  "liquid-colors": W2.LiquidColors, "color-flow": W2.ColorFlow, "neon-lines": W2.NeonLines, "color-switch": W2.ColorSwitch, "shape-match": W2.ShapeMatch,
  "color-sort": W2.ColorSort, "paint-splash": W2.PaintSplash, "rainbow-mixer": W2.RainbowMixer, "pattern-glow": W2.PatternGlow, "color-rings": W2.ColorRings,
  "kinetic-sand": W3.KineticSand, "sand-art": W3.SandArt, "slice-shapes": W3.SliceShapes, "soft-clay": W3.SoftClay, "foam-pop": W3.FoamPop,
  "soap-cut": W3.SoapCut, "glitter-touch": W3.GlitterTouch, "smooth-brush": W3.SmoothBrush, "texture-mixer": W3.TextureMixer, "magic-eraser": W3.MagicEraser,
  "infinite-orbit": W4.InfiniteOrbit, "pendulum": W4.Pendulum, "gravity-balls": W4.GravityBalls, "soft-bounce": W4.SoftBounce, "spiral-flow": W4.SpiralFlow,
  "floating-islands": W4.FloatingIslands, "balance-tower": W4.BalanceTower, "magnetic-shapes": W4.MagneticShapes, "water-waves": W4.WaterWaves, "light-trails": W4.LightTrails,
  "zen-tiles": W5.ZenTiles, "tiny-jigsaw": W5.TinyJigsaw, "loop-connect": W5.LoopConnect, "happy-blocks": W5.HappyBlocks, "calm-match": W5.CalmMatch,
  "dot-connect": W5.DotConnect, "mini-maze": W5.MiniMaze, "star-catcher": W5.StarCatcher, "memory-garden": W5.MemoryGarden, "zen-garden": W5.ZenGarden,
};
