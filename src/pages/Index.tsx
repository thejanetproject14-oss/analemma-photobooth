import { useState, useCallback, useRef, useEffect } from "react";
import { Camera } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { FRAMES, type FrameConfig } from "@/lib/frames";
import { FILTERS, type FilterConfig } from "@/lib/filters";
import { type StickerInstance } from "@/lib/stickers";
import FrameOverlay from "@/components/FrameOverlay";
import FrameSelector from "@/components/FrameSelector";
import FilterSelector from "@/components/FilterSelector";
import ShutterButton from "@/components/ShutterButton";
import PhotoPreview from "@/components/PhotoPreview";
import StickerEditor from "@/components/StickerEditor";

type AppPhase = "camera" | "countdown" | "preview" | "stickers";

const PHOTOS_PER_STRIP = 3;
const COUNTDOWN_SECONDS = 3;
const DELAY_BETWEEN_PHOTOS = 1200; // ms pause between captures

const Index = () => {
  const { videoRef, isReady, error, start, stop } = useCamera();
  const [selectedFrameId, setSelectedFrameId] = useState(FRAMES[0].id);
  const [selectedFilterId, setSelectedFilterId] = useState(FILTERS[0].id);
  const [phase, setPhase] = useState<AppPhase>("camera");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0); // which photo we're on (0-2)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]); // individual data URLs
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [captureTime, setCaptureTime] = useState<Date | null>(null);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const viewfinderRef = useRef<HTMLDivElement>(null);

  const selectedFrame = FRAMES.find((f) => f.id === selectedFrameId) as FrameConfig;
  const selectedFilter = FILTERS.find((f) => f.id === selectedFilterId) as FilterConfig;

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    const el = viewfinderRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setViewportSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Capture a single photo from video, returns data URL
  const captureOne = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) return;

      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 350);

      const canvas = document.createElement("canvas");
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Apply filter
      if (selectedFilter.css !== "none") {
        ctx.filter = selectedFilter.css;
      }

      // Mirror
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      // Reset filter for overlay
      ctx.filter = "none";

      // Draw frame
      if (selectedFrame.overlayUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        };
        img.src = selectedFrame.overlayUrl;
      } else {
        selectedFrame.drawPlaceholder(ctx, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      }
    });
  }, [selectedFrame, selectedFilter, videoRef]);

  // Run countdown then capture
  const runCountdown = useCallback(
    async (photoIdx: number) => {
      setPhase("countdown");
      setPhotoIndex(photoIdx);

      // Countdown 3, 2, 1
      for (let i = COUNTDOWN_SECONDS; i >= 1; i--) {
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(null);

      // Capture
      const dataUrl = await captureOne();
      setCapturedPhotos((prev) => [...prev, dataUrl]);

      return dataUrl;
    },
    [captureOne]
  );

  // Start the 3-photo sequence
  const startCapture = useCallback(async () => {
    setCapturedPhotos([]);
    for (let i = 0; i < PHOTOS_PER_STRIP; i++) {
      await runCountdown(i);
      if (i < PHOTOS_PER_STRIP - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_PHOTOS));
      }
    }
  }, [runCountdown]);

  // When all 3 photos are captured, build the strip
  useEffect(() => {
    if (capturedPhotos.length === PHOTOS_PER_STRIP) {
      buildStrip(capturedPhotos);
    }
  }, [capturedPhotos]);

  const buildStrip = async (photos: string[]) => {
    // Load all images
    const images = await Promise.all(
      photos.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
          })
      )
    );

    const stripW = images[0].width;
    const photoH = images[0].height;
    const padding = Math.round(stripW * 0.03);
    const borderWidth = Math.round(stripW * 0.05);
    const headerHeight = Math.round(stripW * 0.12);
    const footerHeight = Math.round(stripW * 0.08);

    const totalH =
      borderWidth * 2 +
      headerHeight +
      photoH * PHOTOS_PER_STRIP +
      padding * (PHOTOS_PER_STRIP - 1) +
      footerHeight;
    const totalW = stripW + borderWidth * 2;

    const canvas = document.createElement("canvas");
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d")!;

    // White background (like a real photo strip)
    ctx.fillStyle = "#FFF8F5";
    ctx.fillRect(0, 0, totalW, totalH);

    // Header text
    ctx.fillStyle = "#C8829B";
    ctx.font = `italic ${Math.round(stripW * 0.06)}px 'Playfair Display', serif`;
    ctx.textAlign = "center";
    ctx.fillText("analemma photo booth", totalW / 2, borderWidth + headerHeight * 0.7);

    // Draw photos
    let y = borderWidth + headerHeight;
    images.forEach((img, i) => {
      // Rounded clip
      const x = borderWidth;
      const r = Math.round(stripW * 0.02);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + stripW - r, y);
      ctx.quadraticCurveTo(x + stripW, y, x + stripW, y + r);
      ctx.lineTo(x + stripW, y + photoH - r);
      ctx.quadraticCurveTo(x + stripW, y + photoH, x + stripW - r, y + photoH);
      ctx.lineTo(x + r, y + photoH);
      ctx.quadraticCurveTo(x, y + photoH, x, y + photoH - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, stripW, photoH);
      ctx.restore();

      y += photoH + padding;
    });

    // Footer
    ctx.fillStyle = "#C8829B";
    ctx.font = `${Math.round(stripW * 0.03)}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("analemma.shop", totalW / 2, totalH - borderWidth - footerHeight * 0.2);

    const url = canvas.toDataURL("image/jpeg", 0.92);
    setStripUrl(url);
    setPhase("preview");
    stop();
  };

  const retake = useCallback(() => {
    if (stripUrl) URL.revokeObjectURL(stripUrl);
    setStripUrl(null);
    setCapturedPhotos([]);
    setPhotoIndex(0);
    setPhase("camera");
    start();
  }, [stripUrl, start]);

  const downloadImage = useCallback((dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `analemma-photobooth-${Date.now()}.jpg`;
    a.click();
  }, []);

  const handleStickersComplete = useCallback(
    (stickers: StickerInstance[]) => {
      if (!stripUrl || stickers.length === 0) {
        setPhase("preview");
        return;
      }

      // Render stickers onto the strip
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        stickers.forEach((s) => {
          const x = (s.x / 100) * img.width;
          const y = (s.y / 100) * img.height;
          const fontSize = Math.round((s.size / 400) * img.width);
          ctx.font = `${fontSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(s.emoji, x, y);
        });

        const newUrl = canvas.toDataURL("image/jpeg", 0.92);
        setStripUrl(newUrl);
        setPhase("preview");
      };
      img.src = stripUrl;
    },
    [stripUrl]
  );

  // Sticker editor phase
  if (phase === "stickers" && stripUrl) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center bg-background px-4 py-4">
        <div className="w-full max-w-[500px]">
          <h1 className="text-center font-display text-lg text-foreground mb-3">Add Stickers 🧁</h1>
          <StickerEditor
            imageUrl={stripUrl}
            onDone={handleStickersComplete}
            onCancel={() => setPhase("preview")}
          />
        </div>
      </div>
    );
  }

  // Preview phase
  if (phase === "preview" && stripUrl) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-4">
        <div className="w-full max-w-[500px]">
          <h1 className="text-center font-display text-lg text-foreground mb-3">Your Photo Strip ✨</h1>
          <PhotoPreview
            imageUrl={stripUrl}
            onRetake={retake}
            onDownload={() => downloadImage(stripUrl)}
            onAddStickers={() => setPhase("stickers")}
          />
        </div>
      </div>
    );
  }

  // Camera / countdown phase
  const cssFilter = selectedFilter.css !== "none" ? selectedFilter.css : undefined;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="w-full max-w-[500px] mx-auto flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between py-3 px-4">
          <h1 className="font-display text-lg tracking-wide text-foreground">
            analemma <span className="text-primary">photo booth</span>
          </h1>
          {phase === "countdown" && (
            <span className="text-xs font-medium text-muted-foreground">
              Photo {photoIndex + 1}/{PHOTOS_PER_STRIP}
            </span>
          )}
        </header>

        {/* Viewfinder */}
        <div className="flex-1 px-3 pb-2 flex flex-col min-h-0">
          <div
            ref={viewfinderRef}
            className="relative flex-1 rounded-2xl overflow-hidden bg-foreground/5 shadow-soft"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)", filter: cssFilter }}
            />

            {viewportSize.w > 0 && (
              <FrameOverlay frame={selectedFrame} width={viewportSize.w} height={viewportSize.h} />
            )}

            {/* Flash */}
            {showFlash && (
              <div className="absolute inset-0 bg-primary-foreground animate-shutter-flash pointer-events-none z-10" />
            )}

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <span className="text-7xl font-bold text-primary-foreground drop-shadow-lg animate-scale-in">
                  {countdown}
                </span>
              </div>
            )}

            {/* Photo count badges (show which photos are done) */}
            {phase === "countdown" && (
              <div className="absolute top-3 left-3 flex gap-1.5 z-20">
                {Array.from({ length: PHOTOS_PER_STRIP }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i < capturedPhotos.length
                        ? "bg-primary scale-110"
                        : i === photoIndex
                        ? "bg-primary-foreground/80 animate-pulse"
                        : "bg-primary-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 z-20 p-6 text-center">
                <Camera size={40} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <button
                  onClick={start}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {!isReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
                <div className="flex flex-col items-center gap-2">
                  <Camera size={32} className="text-muted-foreground animate-pulse" />
                  <p className="text-xs text-muted-foreground">Starting camera…</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="safe-bottom pb-2">
          {/* Filter picker */}
          <FilterSelector selectedId={selectedFilterId} onSelect={setSelectedFilterId} />

          {/* Frame picker */}
          <FrameSelector selectedId={selectedFrameId} onSelect={setSelectedFrameId} />

          {/* Shutter */}
          <div className="flex flex-col items-center gap-1 py-2">
            <ShutterButton onClick={startCapture} disabled={!isReady || phase === "countdown"} />
            <p className="text-[10px] text-muted-foreground">
              {phase === "countdown" ? "Smile! 📸" : "Tap for 3 photos"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
