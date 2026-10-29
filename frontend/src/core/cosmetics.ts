export type CosKind = "bg" | "mascot" | "fx";
export type Cosmetic = { id: string; kind: CosKind; name: { es: string; en: string }; price: number; level: number; colors: string[] };

// Colors are fixed artwork (identical in any scheme).
export const COSMETICS: Cosmetic[] = [
  { id: "bg-cream", kind: "bg", name: { es: "Crema", en: "Cream" }, price: 0, level: 1, colors: ["#FFFBF0", "#FDE8EF"] },
  { id: "bg-sunset", kind: "bg", name: { es: "Atardecer", en: "Sunset" }, price: 150, level: 2, colors: ["#FFE4D6", "#FBD5F5"] },
  { id: "bg-ocean", kind: "bg", name: { es: "Océano", en: "Ocean" }, price: 250, level: 3, colors: ["#DFF6FF", "#D4F7EE"] },
  { id: "bg-garden", kind: "bg", name: { es: "Jardín", en: "Garden" }, price: 400, level: 5, colors: ["#E8FBE4", "#FFF6CC"] },
  { id: "m-teal", kind: "mascot", name: { es: "Pau Turquesa", en: "Teal Pau" }, price: 0, level: 1, colors: ["#2DD4BF", "#0F9488"] },
  { id: "m-coral", kind: "mascot", name: { es: "Pau Coral", en: "Coral Pau" }, price: 200, level: 2, colors: ["#FF8A8A", "#E85555"] },
  { id: "m-violet", kind: "mascot", name: { es: "Pau Violeta", en: "Violet Pau" }, price: 300, level: 4, colors: ["#A78BFA", "#7C3AED"] },
  { id: "m-sun", kind: "mascot", name: { es: "Pau Sol", en: "Sunny Pau" }, price: 500, level: 6, colors: ["#FCD34D", "#F59E0B"] },
  { id: "fx-confetti", kind: "fx", name: { es: "Confeti", en: "Confetti" }, price: 0, level: 1, colors: ["#FF6B6B", "#FBBF24", "#14B8A6", "#8B5CF6"] },
  { id: "fx-ocean", kind: "fx", name: { es: "Espuma", en: "Sea foam" }, price: 150, level: 2, colors: ["#38BDF8", "#7DD3FC", "#34D399", "#FFFFFF"] },
  { id: "fx-candy", kind: "fx", name: { es: "Caramelo", en: "Candy" }, price: 250, level: 3, colors: ["#F472B6", "#FB923C", "#FDE047", "#C084FC"] },
];
export const getCos = (id: string) => COSMETICS.find((c) => c.id === id) ?? COSMETICS[0];
