import { Download, RotateCcw } from "lucide-react";

interface PhotoPreviewProps {
  imageUrl: string;
  onRetake: () => void;
  onDownload: () => void;
}

const PhotoPreview = ({ imageUrl, onRetake, onDownload }: PhotoPreviewProps) => {
  return (
    <div className="flex flex-col items-center gap-6 animate-scale-in">
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-elevated">
        <img src={imageUrl} alt="Captured photo" className="w-full h-full object-cover" />
      </div>

      <div className="flex gap-4 w-full px-4">
        <button
          onClick={onRetake}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm transition-colors hover:bg-secondary/80"
        >
          <RotateCcw size={18} />
          Retake
        </button>
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-soft transition-colors hover:bg-primary/90"
        >
          <Download size={18} />
          Save
        </button>
      </div>
    </div>
  );
};

export default PhotoPreview;
