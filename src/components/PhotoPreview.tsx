import { Download, RotateCcw } from "lucide-react";

interface PhotoPreviewProps {
  imageUrl: string;
  onRetake: () => void;
  onDownload: () => void;
  onAddStickers: () => void;
}

const PhotoPreview = ({ imageUrl, onRetake, onDownload, onAddStickers }: PhotoPreviewProps) => {
  return (
    <div className="flex flex-col items-center gap-4 animate-scale-in w-full">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-elevated">
        <img src={imageUrl} alt="Photo strip" className="w-full block" />
      </div>

      <div className="flex flex-col gap-2 w-full px-4">
        <button
          onClick={onAddStickers}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-accent-foreground font-medium text-sm shadow-soft transition-colors hover:opacity-90"
        >
          🧁 Add Stickers
        </button>
        <div className="flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm transition-colors hover:bg-secondary/80"
          >
            <RotateCcw size={16} />
            Retake
          </button>
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-soft transition-colors hover:bg-primary/90"
          >
            <Download size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoPreview;
