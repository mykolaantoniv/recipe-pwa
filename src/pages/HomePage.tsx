import { useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import RecipeCard from "@/components/RecipeCard";
import RecipeModal from "@/components/RecipeModal";
import FilterChips from "@/components/FilterChips";
import { Search, ChefHat, ArrowRight, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cookNowBg from "@/assets/cook-now-bg.jpg";

const HomePage = () => {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  const toggleFilter = (tag: string) => {
    setActiveFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchesFilters =
        activeFilters.length === 0 ||
        activeFilters.some(
          (f) => r.tags.includes(f) || r.mealType === f
        );
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q));
      return matchesFilters && matchesSearch;
    });
  }, [activeFilters, search]);

  return (
    <div className="safe-bottom bg-[#050816] min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-[28px] leading-[1.1] font-extrabold text-foreground tracking-tight">
          Що є в холодильнику?
        </h1>
        <p className="text-slate-400 text-[13px] mt-1.5 font-medium">
          Обери інгредієнти, що є вдома - отримай ідеї страв миттєво
        </p>
      </div>

      {/* Cook Now Hero Card */}
      <div className="px-5 mb-4">
        <button
          onClick={() => navigate("/cook-now")}
          className="relative w-full text-left rounded-[24px] overflow-hidden active:scale-[0.99] transition-transform shadow-[0_16px_40px_-20px_hsl(var(--primary)/0.45)] ring-1 ring-white/5"
          style={{ minHeight: 168 }}
        >
          <img
            src={cookNowBg}
            alt=""
            aria-hidden
            width={1280}
            height={768}
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #0B1020 0%, rgba(11,16,32,0.95) 35%, rgba(11,16,32,0.55) 65%, rgba(11,16,32,0.25) 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
          />

          <div className="relative p-4 flex flex-col justify-between h-full" style={{ minHeight: 168 }}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <h2 className="mt-2.5 text-[20px] leading-[1.15] font-extrabold text-white tracking-tight max-w-[78%]">
                Обери інгредієнти — ми знайдемо що приготувати
              </h2>
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold ring-1 ring-primary/25">
                ⚡ За 30 секунд
              </span>
            </div>

            <div className="mt-3 flex justify-end">
              <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full pl-4 pr-3 py-2.5 font-extrabold text-[13px] shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.7)]">
                Почати
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </button>
      </div>

      <div className="px-5 mb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-slate-400" />
          <input
            type="text"
            placeholder="Пошук страв по назві або інгредієнтах"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1530] border border-white/5 text-foreground placeholder:text-slate-500 rounded-2xl pl-10 pr-12 py-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            aria-label="Фільтри"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-primary/15 ring-1 ring-primary/25 flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      <div className="px-4 mb-3">
        <FilterChips activeFilters={activeFilters} onToggle={toggleFilter} />
      </div>

      <div className="px-4 space-y-4">
        {filtered.map((r) => (
          <RecipeCard key={r.id} recipe={r} onOpen={setOpenRecipeId} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">Нічого не знайдено</p>
            <p className="text-sm mt-1">Спробуйте змінити фільтри</p>
          </div>
        )}
      </div>

      <RecipeModal recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />
    </div>
  );
};

export default HomePage;
