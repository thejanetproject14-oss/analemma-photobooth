import { FRAMES } from "@/lib/frames";

interface FrameSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const FrameSelector = ({ selectedId, onSelect }: FrameSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {FRAMES.map((frame) => (
        <button
          key={frame.id}
          onClick={() => onSelect(frame.id)}
          className={`flex flex-col items-center gap-1 min-w-[72px] px-3 py-2 rounded-2xl transition-all duration-200 ${
            selectedId === frame.id
              ? "bg-primary text-primary-foreground shadow-soft scale-105"
              : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
          }`}
        >
          <span className="text-xl">{frame.emoji}</span>
          <span className="text-[11px] font-medium whitespace-nowrap">{frame.name}</span>
        </button>
      ))}
    </div>
  );
};

export default FrameSelector;
