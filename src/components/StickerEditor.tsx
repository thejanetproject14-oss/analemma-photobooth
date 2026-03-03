import { useRef, useState, useCallback } from "react";
import { FOOD_EMOJIS, type StickerInstance } from "@/lib/stickers";
import { X, Check } from "lucide-react";

interface StickerEditorProps {
  /** The photo strip image data URL */
  imageUrl: string;
  onDone: (stickers: StickerInstance[]) => void;
  onCancel: () => void;
}

const StickerEditor = ({ imageUrl, onDone, onCancel }: StickerEditorProps) => {
  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const addSticker = (emoji: string) => {
    const newSticker: StickerInstance = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      size: 36,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, sticker: StickerInstance) => {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const currentX = (sticker.x / 100) * rect.width;
      const currentY = (sticker.y / 100) * rect.height;

      dragRef.current = {
        id: sticker.id,
        offsetX: e.clientX - rect.left - currentX,
        offsetY: e.clientY - rect.top - currentY,
      };

      const handleMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const r = container.getBoundingClientRect();
        const x = ((ev.clientX - r.left - drag.offsetX) / r.width) * 100;
        const y = ((ev.clientY - r.top - drag.offsetY) / r.height) * 100;
        const dragId = drag.id;
        setStickers((prev) =>
          prev.map((s) =>
            s.id === dragId
              ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
              : s
          )
        );
      };

      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    []
  );

  return (
    <div className="flex flex-col items-center gap-3 animate-scale-in w-full">
      <p className="text-xs text-muted-foreground">Tap an emoji to add, drag to move, tap ✕ to remove</p>

      {/* Photo with stickers */}
      <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden shadow-elevated">
        <img src={imageUrl} alt="Photo strip" className="w-full block" draggable={false} />
        {stickers.map((s) => (
          <div
            key={s.id}
            className="absolute touch-none select-none cursor-grab active:cursor-grabbing"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: `${s.size}px`,
              zIndex: 10,
            }}
            onPointerDown={(e) => handlePointerDown(e, s)}
          >
            <span>{s.emoji}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSticker(s.id);
              }}
              className="absolute -top-2 -right-3 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Emoji picker */}
      <div className="flex flex-wrap gap-2 justify-center px-2 max-h-[80px] overflow-y-auto">
        {FOOD_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => addSticker(emoji)}
            className="text-2xl hover:scale-125 transition-transform active:scale-90 p-1"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full px-4">
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm"
        >
          <X size={16} />
          Skip
        </button>
        <button
          onClick={() => onDone(stickers)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-soft"
        >
          <Check size={16} />
          Done
        </button>
      </div>
    </div>
  );
};

export default StickerEditor;
