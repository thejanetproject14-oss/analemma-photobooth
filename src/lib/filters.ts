export interface FilterConfig {
  id: string;
  name: string;
  emoji: string;
  /** CSS filter string applied to the video/canvas */
  css: string;
}

export const FILTERS: FilterConfig[] = [
  { id: "none", name: "None", emoji: "🔲", css: "none" },
  { id: "warm", name: "Warm", emoji: "☀️", css: "saturate(1.3) sepia(0.15) brightness(1.05)" },
  { id: "cool", name: "Cool", emoji: "❄️", css: "saturate(0.9) hue-rotate(15deg) brightness(1.05)" },
  { id: "bw", name: "B&W", emoji: "🖤", css: "grayscale(1) contrast(1.1)" },
  { id: "vintage", name: "Vintage", emoji: "📷", css: "sepia(0.4) contrast(1.1) brightness(0.95) saturate(1.2)" },
  { id: "pink", name: "Rosé", emoji: "🌸", css: "saturate(1.2) hue-rotate(-10deg) brightness(1.05) contrast(1.05)" },
  { id: "golden", name: "Golden", emoji: "✨", css: "sepia(0.25) saturate(1.4) brightness(1.08)" },
  { id: "fade", name: "Fade", emoji: "🌫️", css: "contrast(0.85) brightness(1.1) saturate(0.8)" },
];
