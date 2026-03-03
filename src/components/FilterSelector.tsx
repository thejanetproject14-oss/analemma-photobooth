import { FILTERS, type FilterConfig } from "@/lib/filters";

interface FilterSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const FilterSelector = ({ selectedId, onSelect }: FilterSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f.id)}
          className={`flex flex-col items-center gap-0.5 min-w-[56px] px-2 py-1.5 rounded-xl transition-all duration-200 text-[10px] ${
            selectedId === f.id
              ? "bg-primary text-primary-foreground shadow-soft scale-105"
              : "bg-secondary/60 text-secondary-foreground hover:bg-secondary"
          }`}
        >
          <span className="text-lg">{f.emoji}</span>
          <span className="font-medium whitespace-nowrap">{f.name}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterSelector;
