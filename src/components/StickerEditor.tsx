import { useRef, useState, useCallback, useEffect } from "react";
import { DEFAULT_STICKERS, type StickerDef, type StickerInstance } from "@/lib/stickers";
import { X, Check, Plus, RotateCw } from "lucide-react";

interface StickerEditorProps {
  imageUrl: string;
  onDone: (stickers: StickerInstance[]) => void;
  onCancel: () => void;
}

const StickerEditor = ({ imageUrl, onDone, onCancel }: StickerEditorProps) => {
  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customStickers, setCustomStickers] = useState<StickerDef[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    action: "move" | "resize" | "rotate";
    startSize?: number;
    startDist?: number;
    startRotation?: number;
    startAngle?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allStickerDefs = [...DEFAULT_STICKERS, ...customStickers];

  const addSticker = (def: StickerDef) => {
    const newSticker: StickerInstance = {
      id: `${Date.now()}-${Math.random()}`,
      emoji: def.type === "emoji" ? def.emoji : undefined,
      imageUrl: def.type === "image" ? def.imageUrl : undefined,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      size: 12,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedId(newSticker.id);
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAddImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const def: StickerDef = {
      id: `custom-${Date.now()}`,
      type: "image",
      imageUrl: url,
      label: file.name.replace(/\.[^.]+$/, ""),
    };
    setCustomStickers((prev) => [...prev, def]);
    addSticker(def);
    e.target.value = "";
  };

  // --- Pointer-based drag for move ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, sticker: StickerInstance) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedId(sticker.id);
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const currentX = (sticker.x / 100) * rect.width;
      const currentY = (sticker.y / 100) * rect.height;

      dragRef.current = {
        id: sticker.id,
        offsetX: e.clientX - rect.left - currentX,
        offsetY: e.clientY - rect.top - currentY,
        action: "move",
      };

      const handleMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || drag.action !== "move") return;
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

  // --- Corner resize handle ---
  const handleResizeDown = useCallback(
    (e: React.PointerEvent, sticker: StickerInstance) => {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cx = (sticker.x / 100) * rect.width + rect.left;
      const cy = (sticker.y / 100) * rect.height + rect.top;
      const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);

      dragRef.current = {
        id: sticker.id,
        offsetX: 0,
        offsetY: 0,
        action: "resize",
        startSize: sticker.size,
        startDist,
        startRotation: sticker.rotation,
        startAngle,
      };

      const handleMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || drag.action !== "resize") return;
        const r = container.getBoundingClientRect();
        const ccx = (sticker.x / 100) * r.width + r.left;
        const ccy = (sticker.y / 100) * r.height + r.top;
        const dist = Math.hypot(ev.clientX - ccx, ev.clientY - ccy);
        const angle = Math.atan2(ev.clientY - ccy, ev.clientX - ccx) * (180 / Math.PI);
        const scale = dist / (drag.startDist || 1);
        const newSize = Math.max(5, Math.min(50, (drag.startSize || 12) * scale));
        const newRotation = (drag.startRotation || 0) + (angle - (drag.startAngle || 0));
        const dragId = drag.id;
        setStickers((prev) =>
          prev.map((s) =>
            s.id === dragId ? { ...s, size: newSize, rotation: newRotation } : s
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

  // --- Touch pinch-to-resize + rotate ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDist = 0;
    let initialSize = 0;
    let initialAngle = 0;
    let initialRotation = 0;
    let activeId: string | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !selectedId) return;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
      const sticker = stickers.find((s) => s.id === selectedId);
      if (!sticker) return;
      initialSize = sticker.size;
      initialRotation = sticker.rotation;
      activeId = selectedId;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !activeId) return;
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
      const scale = dist / initialDist;
      const newSize = Math.max(5, Math.min(50, initialSize * scale));
      const newRotation = initialRotation + (angle - initialAngle);
      const id = activeId;
      setStickers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, size: newSize, rotation: newRotation } : s))
      );
    };

    const onTouchEnd = () => {
      activeId = null;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [selectedId, stickers]);

  const deselect = () => setSelectedId(null);

  return (
    <div className="flex flex-col items-center gap-3 animate-scale-in w-full">
      <p className="text-xs text-muted-foreground">Tap sticker to select · Drag to move · Corner handle to resize & rotate</p>

      {/* Photo with stickers */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-elevated"
        onClick={deselect}
      >
        <img src={imageUrl} alt="Photo strip" className="w-full block" draggable={false} />
        {stickers.map((s) => {
          const isSelected = selectedId === s.id;
          const sizePx = `${s.size}%`;
          return (
            <div
              key={s.id}
              className={`absolute touch-none select-none ${isSelected ? "z-20" : "z-10"}`}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: sizePx,
                transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
              }}
              onPointerDown={(e) => handlePointerDown(e, s)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(s.id);
              }}
            >
              {s.emoji ? (
                <span
                  className="block w-full text-center"
                  style={{ fontSize: `min(${s.size * 3}px, 80px)` }}
                >
                  {s.emoji}
                </span>
              ) : s.imageUrl ? (
                <img
                  src={s.imageUrl}
                  alt="sticker"
                  className="w-full h-auto pointer-events-none"
                  draggable={false}
                />
              ) : null}

              {/* Selection ring + handles */}
              {isSelected && (
                <>
                  <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none" />
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSticker(s.id);
                    }}
                    className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                  >
                    <X size={12} />
                  </button>
                  {/* Resize + rotate handle */}
                  <div
                    className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => handleResizeDown(e, s)}
                  >
                    <RotateCw size={10} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticker tray */}
      <div className="w-full">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 py-1">
          {/* Add custom image button */}
          <button
            onClick={handleAddImage}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors"
          >
            <Plus size={18} className="text-muted-foreground" />
          </button>
          {allStickerDefs.map((def) => (
            <button
              key={def.id}
              onClick={() => addSticker(def)}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
              {def.type === "emoji" ? (
                <span className="text-2xl">{def.emoji}</span>
              ) : (
                <img
                  src={def.imageUrl}
                  alt={def.label}
                  className="w-9 h-9 object-contain rounded"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

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
