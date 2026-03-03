import { useEffect, useRef } from "react";
import type { FrameConfig } from "@/lib/frames";

interface FrameOverlayProps {
  frame: FrameConfig;
  width: number;
  height: number;
  className?: string;
}

const FrameOverlay = ({ frame, width, height, className = "" }: FrameOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (frame.overlayUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = frame.overlayUrl;
    } else {
      frame.drawPlaceholder(ctx, width, height);
    }
  }, [frame, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default FrameOverlay;
