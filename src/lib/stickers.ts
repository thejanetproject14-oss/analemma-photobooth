export interface StickerInstance {
  id: string;
  emoji: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // px
}

export const FOOD_EMOJIS = [
  "🧁", "🍰", "🍩", "🍪", "🍓", "🍒", "🍑", "🫐",
  "🍫", "🍬", "🍭", "🎂", "🧇", "🥐", "🍦", "🍡",
  "🧋", "☕", "🍵", "🌸", "✨", "💖", "🦋", "🌈",
];
