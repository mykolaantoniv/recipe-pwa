import { useState, useMemo, useEffect } from "react";
import { type MealType } from "@/data/recipes";
import { useAppStore } from "@/store/appStore";
import { useAppStore } from "@/store/appStore";
import { Search, Check, X, ChevronDown, Sparkles, Zap } from "lucide-react";

interface GroupDef {
  emoji: string;
  label: string;
  categories: string[];
}

const GROUPS: GroupDef[] = [
  { emoji: "🥦", label: "Овочі", categories: ["Овочі"] },
  { emoji: "🍎", label: "Фрукти", categories: ["Фрукти"] },
  { emoji: "🍗", label: "Мʼясо та риба", categories: ["М'ясо", "Риба"] },
  { emoji: "🥚", label: "Яйця", categories: ["Яйця"] },
  { emoji: "🥛", label: "Молочне", categories: ["Молочні"] },
  { emoji: "🌾", label: "Крупи", categories: ["Крупи"] },
  { emoji: "🧂", label: "Спеції", categories: ["Спеції"] },
  { emoji: "🫙", label: "Бакалія та соуси", categories: ["Бакалія", "Олія"] },
  { emoji: "✨", label: "Інше", categories: ["Інше"] },
];

const QUICK_BASICS = ["Сіль", "Олія", "Яйце", "Цибуля"];

interface Props {
  selectedIngredients: string[];
  onToggleIngredient: (name: string) => void;
  mealType?: MealType | null;
  minRequired?: number;
  onSubmit: () => void;
  ctaLabel?: string;
}

const IngredientsSelector = ({
  selectedIngredients,
  onToggleIngredient,
  mealType,
  minRequired = 1,
  onSubmit,
  ctaLabel,
}: Props) => {
  const recentIngredients = useAppStore((s) => s.recentIngredients ?? []);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const allRecipes = useAppStore(s => s.recipes);
  const source = useMemo(
    () => (mealType ? allRecipes.filter((r) => r.mealType === mealType) : allRecipes),
    [mealType, allRecipes]
  );

  // Counts per ingredient + group buckets
  const { groupItems, popular } = useMemo(() => {
    const counts = new Map<string, number>();
    const catOf = new Map<string, string>();
    source.forEach((r) =>
      r.ingredients.forEach((i) => {
        counts.set(i.name, (counts.get(i.name) || 0) + 1);
        catOf.set(i.name, i.category);
      })
    );
    const groupItems = new Map<string, string[]>();
    for (const g of GROUPS) groupItems.set(g.label, []);
    for (const [name, cat] of catOf) {
      const g = GROUPS.find((g) => g.categories.includes(cat));
      const key = g?.label ?? "Інше";
      const arr = groupItems.get(key) ?? [];
      arr.push(name);
      groupItems.set(key, arr);
    }
    for (const [k, arr] of groupItems) {
      groupItems.set(
        k,
        arr.sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0))
      );
    }
    const popular = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([n]) => n)
      .slice(0, 8);
    return { groupItems, popular };
  }, [source]);

  // Live recipe match count
  const matchCount = useMemo(() => {
    if (selectedIngredients.length === 0) return 0;
    return source.filter((r) =>
      r.ingredients.some((i) => selectedIngredients.includes(i.name))
    ).length;
  }, [source, selectedIngredients]);

  const q = search.trim().toLowerCase();
  const matchesSearch = (n: string) => !q || n.toLowerCase().includes(q);

  const toggleGroup = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  const isValid = selectedIngredients.length >= minRequired;

  // Auto-expand groups when user searches
  useEffect(() => {
    if (q) setCollapsed({});
  }, [q]);

  const selectMany = (names: string[]) => {
    names.forEach((n) => {
      if (!selectedIngredients.includes(n)) onToggleIngredient(n);
    });
  };

  const Chip = ({ name, large = true }: { name: string; large?: boolean }) => {
    const selected = selectedIngredients.includes(name);
    return (
      <button
        onClick={() => onToggleIngredient(name)}
        className={`group inline-flex items-center gap-1.5 rounded-2xl font-semibold transition-all active:scale-[0.94] ring-1 ${
          large ? "px-3.5 py-2.5 text-[13px]" : "px-3 py-2 text-[12px]"
        } ${
          selected
            ? "bg-primary text-primary-foreground ring-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.7)]"
            : "bg-[#0F1530] text-slate-200 ring-white/5 hover:ring-white/10"
        }`}
      >
        {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        {name}
      </button>
    );
  };

  return (
    <div className="animate-fade-in pb-28">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          inputMode="search"
          placeholder="Пошук інгредієнтів"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0F1530] border border-white/5 text-foreground placeholder:text-slate-500 rounded-2xl pl-10 pr-10 py-3.5 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-slate-300" />
          </button>
        )}
      </div>

      {/* Quick actions */}
      {!q && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          <button
            onClick={() => selectMany(QUICK_BASICS)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/15 text-primary text-[12px] font-bold ring-1 ring-primary/25 active:scale-[0.95]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            У мене майже нічого немає
          </button>
          <button
            onClick={() => selectMany(popular.slice(0, 6))}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-slate-200 text-[12px] font-bold ring-1 ring-white/10 active:scale-[0.95]"
          >
            <Zap className="w-3.5 h-3.5" />
            Швидкий старт
          </button>
        </div>
      )}

      {/* Recently used */}
      {!q && recentIngredients.length > 0 && (
        <Section title="Нещодавно використані" emoji="🕒">
          <div className="flex flex-wrap gap-2">
            {recentIngredients.slice(0, 10).map((n) => (
              <Chip key={n} name={n} />
            ))}
          </div>
        </Section>
      )}

      {/* Popular */}
      {!q && popular.length > 0 && (
        <Section title="Популярні зараз" emoji="🔥">
          <div className="flex flex-wrap gap-2">
            {popular.map((n) => (
              <Chip key={n} name={n} />
            ))}
          </div>
        </Section>
      )}

      {/* Groups */}
      <div className="space-y-2">
        {GROUPS.map((g) => {
          const items = (groupItems.get(g.label) ?? []).filter(matchesSearch);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[g.label];
          const selectedHere = items.filter((n) =>
            selectedIngredients.includes(n)
          ).length;
          return (
            <div
              key={g.label}
              className="rounded-2xl bg-[#0B1126] ring-1 ring-white/5 overflow-hidden"
            >
              <button
                onClick={() => toggleGroup(g.label)}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-[18px]">{g.emoji}</span>
                  <span className="text-[14px] font-extrabold text-foreground">
                    {g.label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {items.length}
                  </span>
                  {selectedHere > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary ring-1 ring-primary/25">
                      {selectedHere}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isCollapsed ? "" : "rotate-180"
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {items.map((n) => (
                    <Chip key={n} name={n} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky CTA */}
      <div className="fixed left-0 right-0 bottom-[var(--nav-height)] px-4 pb-3 pt-3 pointer-events-none z-30">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="rounded-3xl bg-[#0B1126]/95 backdrop-blur-xl ring-1 ring-white/10 p-3 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-1.5 mb-2">
              <span className="text-[12px] font-bold text-slate-300">
                Обрано:{" "}
                <span className="text-primary">
                  {selectedIngredients.length}
                </span>
              </span>
              <span className="text-[12px] font-bold text-slate-300">
                {matchCount > 0
                  ? `${matchCount} ${matchCount === 1 ? "страва" : matchCount < 5 ? "страви" : "страв"} підходить`
                  : "Оберіть інгредієнти"}
              </span>
            </div>
            <button
              disabled={!isValid}
              onClick={onSubmit}
              className="w-full bg-primary text-primary-foreground font-extrabold py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.7)]"
            >
              {ctaLabel ?? `Показати страви${matchCount ? ` · ${matchCount}` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <span>{emoji}</span>
      {title}
    </p>
    {children}
  </div>
);

export default IngredientsSelector;
