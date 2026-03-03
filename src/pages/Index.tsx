import { useState, useCallback, useRef, useEffect } from "react";
import { Camera } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { FRAMES, type FrameConfig } from "@/lib/frames";
import FrameOverlay from "@/components/FrameOverlay";
import FrameSelector from "@/components/FrameSelector";
import ShutterButton from "@/components/ShutterButton";
import PhotoPreview from "@/components/PhotoPreview";

const Index = () => {
  const { videoRef, isReady, error, start, stop } = useCamera();
  const [selectedFrameId, setSelectedFrameId] = useState(FRAMES[0].id);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const capturedBlobRef = useRef<Blob | null>(null);

  const selectedFrame = FRAMES.find((f) => f.id === selectedFrameId) as FrameConfig;

  // Start camera on mount
  useEffect(() => {
    start();
  }, [start]);

  // Track viewfinder size for overlay canvas
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

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);

    // Composite photo + overlay onto a canvas
    const canvas = document.createElement("canvas");
    const outputW = video.videoWidth;
    const outputH = video.videoHeight;
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d")!;

    // Mirror the video (front camera)
    ctx.save();
    ctx.translate(outputW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, outputW, outputH);
    ctx.restore();

    // Draw frame overlay
    if (selectedFrame.overlayUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, outputW, outputH);
        finalize(canvas);
      };
      img.src = selectedFrame.overlayUrl;
    } else {
      selectedFrame.drawPlaceholder(ctx, outputW, outputH);
      finalize(canvas);
    }
  }, [selectedFrame, videoRef]);

  const finalize = (canvas: HTMLCanvasElement) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        capturedBlobRef.current = blob;
        setCapturedImage(URL.createObjectURL(blob));
        stop();
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = useCallback(() => {
    if (capturedImage) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    capturedBlobRef.current = null;
    start();
  }, [capturedImage, start]);

  const download = useCallback(() => {
    const blob = capturedBlobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analemma-photobooth-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Preview mode
  if (capturedImage) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-6">
        <div className="w-full max-w-[500px]">
          <h1 className="text-center font-display text-xl text-foreground mb-4">Your Photo ✨</h1>
          <PhotoPreview imageUrl={capturedImage} onRetake={retake} onDownload={download} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <div className="w-full max-w-[500px] mx-auto flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-center py-3 px-4">
          <h1 className="font-display text-lg tracking-wide text-foreground">
            analemma <span className="text-primary">photo booth</span>
          </h1>
        </header>

        {/* Viewfinder */}
        <div className="flex-1 px-3 pb-2 flex flex-col">
          <div
            ref={viewfinderRef}
            className="relative flex-1 rounded-2xl overflow-hidden bg-foreground/5 shadow-soft"
          >
            {/* Camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Frame overlay */}
            {viewportSize.w > 0 && (
              <FrameOverlay
                frame={selectedFrame}
                width={viewportSize.w}
                height={viewportSize.h}
              />
            )}

            {/* Flash */}
            {showFlash && (
              <div className="absolute inset-0 bg-primary-foreground animate-shutter-flash pointer-events-none z-10" />
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

            {/* Loading state */}
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
          {/* Frame picker */}
          <FrameSelector selectedId={selectedFrameId} onSelect={setSelectedFrameId} />

          {/* Shutter */}
          <div className="flex justify-center py-3">
            <ShutterButton onClick={capture} disabled={!isReady} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
