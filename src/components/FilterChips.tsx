import { filterOptions } from "@/data/recipes";

interface FilterChipsProps {
  activeFilters: string[];
  onToggle: (tag: string) => void;
}

const FilterChips = ({ activeFilters, onToggle }: FilterChipsProps) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {filterOptions.map((f) => {
      const active = activeFilters.includes(f.tag);
      return (
        <button
          key={f.id}
          onClick={() => onToggle(f.tag)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            active
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {f.label}
        </button>
      );
    })}
  </div>
);

export default FilterChips;
