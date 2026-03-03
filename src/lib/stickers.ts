export interface StickerInstance {
  id: string;
  emoji?: string;
  imageUrl?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // percentage of container width (e.g. 15 = 15%)
  rotation: number; // degrees
}

export const FOOD_EMOJIS = [
  "🧁", "🍰", "🍩", "🍪", "🍓", "🍒", "🍑", "🫐",
  "🍫", "🍬", "🍭", "🎂", "🧇", "🥐", "🍦", "🍡",
  "🧋", "☕", "🍵", "🌸", "✨", "💖", "🦋", "🌈",
];

/** Built-in PNG sticker definitions */
export interface StickerDef {
  id: string;
  type: "emoji" | "image";
  emoji?: string;
  imageUrl?: string;
  label: string;
}

export const DEFAULT_STICKERS: StickerDef[] = FOOD_EMOJIS.map((e) => ({
  id: `emoji-${e}`,
  type: "emoji" as const,
  emoji: e,
  label: e,
}));
