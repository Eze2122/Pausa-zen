// Central registry of the 50 activities. Pure data (testable without React Native).
export type GameDef = {
  id: string; num: number; world: number; name: string;
  mechanic: "tap" | "drag" | "puzzle" | "physics" | "creative" | "memory" | "timing";
  target: number; time: number; // challenge goal (score) and seconds
  status: "implemented";
  rules: { es: string; en: string };
};

type Row = [string, string, GameDef["mechanic"], number, number, string, string];
const W: Row[][] = [
  [
    ["pop-bubbles", "Pop Bubbles", "tap", 25, 40, "Toca las burbujas para explotarlas.", "Tap the bubbles to pop them."],
    ["bubble-wrap", "Bubble Wrap", "tap", 48, 45, "Revienta todas las burbujas del plástico.", "Pop every bubble of the wrap."],
    ["pop-combo", "Pop Combo", "tap", 60, 60, "Toca grupos de 2 o más burbujas del mismo color.", "Tap groups of 2+ same-colored bubbles."],
    ["bubble-rain", "Bubble Rain", "tap", 20, 40, "Atrapa las burbujas que caen antes de que se escapen.", "Pop falling bubbles before they escape."],
    ["giant-pop", "Giant Pop", "tap", 5, 40, "Toca la burbuja gigante hasta que explote.", "Tap the giant bubble until it bursts."],
    ["color-pop", "Color Pop", "tap", 15, 40, "Explota solo las burbujas del color indicado.", "Pop only bubbles of the shown color."],
    ["bubble-chain", "Bubble Chain", "tap", 30, 45, "Explota una burbuja y provoca reacciones en cadena.", "Pop one bubble to trigger chain reactions."],
    ["bubble-sort", "Bubble Sort", "tap", 20, 45, "Envía cada burbuja a la cesta de su color.", "Send each bubble to the basket of its color."],
    ["floating-bubbles", "Floating Bubbles", "tap", 30, 60, "Toca con calma las burbujas que flotan.", "Calmly tap the floating bubbles."],
    ["pop-symphony", "Pop Symphony", "creative", 3, 90, "Crea melodías de 6+ notas y pulsa Reproducir.", "Compose 6+ note melodies and press Play."],
  ],
  [
    ["liquid-colors", "Liquid Colors", "puzzle", 3, 90, "Añade gotas para igualar el color objetivo.", "Add drops to match the target color."],
    ["color-flow", "Color Flow", "puzzle", 2, 120, "Arrastra para unir los puntos del mismo color sin cruzarte.", "Drag to join same-colored dots without crossing."],
    ["neon-lines", "Neon Lines", "drag", 3, 60, "Recorre la figura con el dedo para encender todos los puntos.", "Trace the shape to light every point."],
    ["color-switch", "Color Switch", "timing", 10, 60, "Toca para girar el anillo y recibir la bola en su color.", "Tap to spin the ring so the ball hits its color."],
    ["shape-match", "Shape Match", "puzzle", 2, 60, "Une cada forma con su silueta.", "Link each shape to its outline."],
    ["color-sort", "Color Sort", "puzzle", 1, 120, "Ordena las bolas para que cada tubo tenga un solo color.", "Sort the balls so each tube has one color."],
    ["paint-splash", "Paint Splash", "creative", 85, 40, "Toca para salpicar pintura y cubrir el lienzo.", "Tap to splash paint and cover the canvas."],
    ["rainbow-mixer", "Rainbow Mixer", "puzzle", 8, 90, "Mezcla dos colores y descubre combinaciones nuevas.", "Mix two colors and discover new combinations."],
    ["pattern-glow", "Pattern Glow", "memory", 6, 120, "Repite la secuencia de luces.", "Repeat the light sequence."],
    ["color-rings", "Color Rings", "puzzle", 2, 90, "Gira los anillos hasta alinear los colores.", "Spin the rings until colors line up."],
  ],
  [
    ["kinetic-sand", "Kinetic Sand", "drag", 15, 45, "Desliza hacia abajo sobre la arena para cortarla.", "Swipe down over the sand to slice it."],
    ["sand-art", "Sand Art", "creative", 40, 60, "Mantén el dedo para verter arena de colores.", "Hold your finger to pour colored sand."],
    ["slice-shapes", "Slice Shapes", "drag", 15, 40, "Desliza a través de las formas para cortarlas.", "Swipe through the shapes to slice them."],
    ["soft-clay", "Soft Clay", "drag", 2, 90, "Moldea la arcilla hasta parecerse a la silueta.", "Mold the clay to match the outline."],
    ["foam-pop", "Foam Pop", "tap", 15, 45, "Mantén pulsada la espuma hasta que se aplaste.", "Press and hold the foam until it squishes."],
    ["soap-cut", "Soap Cut", "drag", 20, 60, "Desliza en vertical sobre las guías para cortar el jabón.", "Swipe vertically over the guides to cut the soap."],
    ["glitter-touch", "Glitter Touch", "creative", 30, 40, "Arrastra el dedo para crear purpurina brillante.", "Drag your finger to make shiny glitter."],
    ["smooth-brush", "Smooth Brush", "puzzle", 1, 90, "Pinta cada casilla con el color de su número.", "Paint each cell with its number's color."],
    ["texture-mixer", "Texture Mixer", "puzzle", 3, 90, "Combina dos texturas y un color como el modelo.", "Combine two textures and a color like the model."],
    ["magic-eraser", "Magic Eraser", "drag", 2, 60, "Borra la capa para descubrir el dibujo oculto.", "Erase the layer to reveal the hidden drawing."],
  ],
  [
    ["infinite-orbit", "Infinite Orbit", "creative", 10, 60, "Toca para crear planetas en órbitas distintas.", "Tap to create planets on distinct orbits."],
    ["pendulum", "Pendulum", "timing", 8, 60, "Arrastra la bola para impulsar. Toca cuando pase por la zona.", "Drag the bob to swing. Tap when it crosses the zone."],
    ["gravity-balls", "Gravity Balls", "physics", 6, 60, "Desliza para cambiar la gravedad y lleva bolas al agujero.", "Swipe to change gravity and guide balls into the hole."],
    ["soft-bounce", "Soft Bounce", "physics", 5, 60, "Tira hacia atrás y suelta para lanzar hacia el objetivo.", "Pull back and release to launch at the target."],
    ["spiral-flow", "Spiral Flow", "creative", 10, 60, "Toca espacios libres para crear espirales animadas.", "Tap free spots to create animated spirals."],
    ["floating-islands", "Floating Islands", "timing", 10, 60, "Toca para soltar objetos sobre las islas flotantes.", "Tap to drop objects onto floating islands."],
    ["balance-tower", "Balance Tower", "timing", 10, 90, "Toca para soltar el bloque sobre la torre.", "Tap to drop the block on the tower."],
    ["magnetic-shapes", "Magnetic Shapes", "physics", 6, 60, "Mantén pulsado para atraer o repeler figuras hacia la meta.", "Hold to attract or repel shapes into the goal."],
    ["water-waves", "Water Waves", "physics", 6, 60, "Toca el agua para crear ondas y llevar hojas al nenúfar.", "Tap the water to push leaves onto the lily pad."],
    ["light-trails", "Light Trails", "drag", 20, 40, "Dibuja estelas de luz y recoge los orbes.", "Draw light trails and collect the orbs."],
  ],
  [
    ["zen-tiles", "Zen Tiles", "puzzle", 1, 150, "Desliza las fichas para ordenarlas del 1 al 8.", "Slide the tiles to order them 1 to 8."],
    ["tiny-jigsaw", "Tiny Jigsaw", "puzzle", 2, 90, "Toca dos piezas para intercambiarlas y completar la imagen.", "Tap two pieces to swap them and complete the picture."],
    ["loop-connect", "Loop Connect", "puzzle", 2, 90, "Gira las piezas para cerrar todos los circuitos.", "Rotate pieces to close every loop."],
    ["happy-blocks", "Happy Blocks", "puzzle", 4, 120, "Elige una pieza y toca el tablero. Completa filas o columnas.", "Pick a piece and tap the board. Complete rows or columns."],
    ["calm-match", "Calm Match", "puzzle", 1, 90, "Une parejas de símbolos libres (con un lado vacío).", "Match pairs of free symbols (one side open)."],
    ["dot-connect", "Dot Connect", "puzzle", 3, 60, "Arrastra uniendo los puntos en orden: 1, 2, 3...", "Drag through the dots in order: 1, 2, 3..."],
    ["mini-maze", "Mini Maze", "puzzle", 2, 90, "Desliza para mover la bola hasta la estrella.", "Swipe to move the ball to the star."],
    ["star-catcher", "Star Catcher", "drag", 20, 45, "Arrastra la cesta para recoger estrellas.", "Drag the basket to catch stars."],
    ["memory-garden", "Memory Garden", "memory", 1, 90, "Encuentra todas las parejas de flores.", "Find every pair of flowers."],
    ["zen-garden", "Zen Garden", "creative", 15, 90, "Rastrilla, coloca piedras, plantas y ondas.", "Rake, place stones, plants and ripples."],
  ],
];

export const GAMES: GameDef[] = W.flatMap((rows, wi) =>
  rows.map(([id, name, mechanic, target, time, es, en], i) => ({
    id, name, mechanic, target, time, num: wi * 10 + i + 1, world: wi + 1, status: "implemented" as const, rules: { es, en },
  })),
);

export const WORLDS = [
  { id: 1, key: "w1" }, { id: 2, key: "w2" }, { id: 3, key: "w3" }, { id: 4, key: "w4" }, { id: 5, key: "w5" },
];

export const getGame = (id: string) => GAMES.find((g) => g.id === id);
export const gamesOfWorld = (w: number) => GAMES.filter((g) => g.world === w);
