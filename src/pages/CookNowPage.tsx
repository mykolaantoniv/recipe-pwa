import { useState, useMemo } from "react";
import { recipes, type MealType } from "@/data/recipes";
import { useAppStore } from "@/store/appStore";
import IngredientsSelector from "@/components/IngredientsSelector";
import RecipeModal from "@/components/RecipeModal";
import {
  Flame,
  ArrowLeft,
  Clock,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import PortionStepper from "@/components/PortionStepper";

const mealTypes: { type: MealType; label: string; emoji: string }[] = [
  { type: "сніданок", label: "Сніданок", emoji: "🌅" },
  { type: "обід", label: "Обід", emoji: "☀️" },
  { type: "вечеря", label: "Вечеря", emoji: "🌙" },
];

type Step = "meal" | "portions" | "ingredients" | "results";

const CookNowPage = () => {
  const {
    savedRecipes,
    toggleSavedRecipe,
    addToShoppingList,
    requireAuth,
    addRecentIngredients,
  } = useAppStore();

  const [step, setStep] = useState<Step>("meal");
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [portions, setPortions] = useState(2);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showLoading, setShowLoading] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  const matchingRecipes = useMemo(() => {
    if (!selectedMeal) return [];
    return recipes
      .filter((r) => r.mealType === selectedMeal)
      .map((r) => {
        const recipeIngs = r.ingredients.map((i) => i.name);
        const matchCount = selectedIngredients.filter((ing) =>
          recipeIngs.includes(ing)
        ).length;
        const missingIngs = r.ingredients.filter(
          (i) => !selectedIngredients.includes(i.name)
        );
        return { recipe: r, matchCount, missingIngs, missingCount: missingIngs.length };
      })
      .filter((item) => item.matchCount > 0)
      .sort((a, b) => {
        // Primary: fewer missing ingredients first
        if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
        // Secondary: more matches
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        // Tertiary: faster cook time
        return a.recipe.cookTime - b.recipe.cookTime;
      });
  }, [selectedMeal, selectedIngredients]);

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const goToResults = () => {
    addRecentIngredients(selectedIngredients);
    setShowLoading(true);
    setTimeout(() => {
      setShowLoading(false);
      setStep("results");
    }, 800);
  };

  const handleAddMissing = (recipeId: string) => {
    const match = matchingRecipes.find((m) => m.recipe.id === recipeId);
    if (!match) return;
    const items = match.missingIngs.map((ing, i) => ({
      id: `missing-${recipeId}-${i}-${Date.now()}`,
      name: ing.name,
      amount: ing.amount,
      category: ing.category,
      checked: false,
    }));
    addToShoppingList(items);
    toast.success("Додано до списку покупок ✅");
  };

  const handleSave = (recipeId: string) => {
    const doSave = () => toggleSavedRecipe(recipeId);
    if (savedRecipes.includes(recipeId)) {
      doSave();
      return;
    }
    if (!requireAuth(doSave)) return;
    doSave();
  };

  const stepTitle: Record<Step, string> = {
    meal: "Що готуємо?",
    portions: "На скільки осіб?",
    ingredients: "Що є у вас вдома?",
    results: "Ось що можна приготувати",
  };

  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center animate-pulse">
          <Flame className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground animate-fade-in">
          Підбираємо найкращі страви для вас...
        </p>
      </div>
    );
  }

  return (
    <div className="safe-bottom px-4 pt-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {step !== "meal" && (
            <button
              onClick={() => {
                if (step === "results") setStep("ingredients");
                else if (step === "ingredients") setStep("portions");
                else if (step === "portions") setStep("meal");
              }}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">
              Готуємо прямо зараз
            </h1>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-6">
        {(["meal", "portions", "ingredients", "results"] as Step[]).map(
          (s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                (["meal", "portions", "ingredients", "results"] as Step[]).indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-secondary"
              }`}
            />
          )
        )}
      </div>

      <h2 className="text-base font-bold text-foreground mb-4">
        {stepTitle[step]}
      </h2>

      {/* STEP 1: Meal type */}
      {step === "meal" && (
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          {mealTypes.map((m) => (
            <button
              key={m.type}
              onClick={() => {
                setSelectedMeal(m.type);
                setSelectedIngredients([]);
                setStep("portions");
              }}
              className="glass-card p-5 text-center transition-all active:scale-[0.96] hover-scale"
            >
              <span className="text-3xl">{m.emoji}</span>
              <p className="text-sm font-bold text-foreground mt-2">
                {m.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2: Portions */}
      {step === "portions" && (
        <div className="animate-fade-in">
          <div className="mb-8">
            <PortionStepper value={portions} onChange={setPortions} />
          </div>
          <button
            onClick={() => setStep("ingredients")}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform"
          >
            Далі
          </button>
        </div>
      )}

      {/* STEP 3: Ingredients */}
      {step === "ingredients" && (
        <IngredientsSelector
          selectedIngredients={selectedIngredients}
          onToggleIngredient={toggleIngredient}
          mealType={selectedMeal}
          minRequired={3}
          onSubmit={goToResults}
          ctaLabel="👉 Обрати страви"
        />
      )}

      {/* STEP 4: Results */}
      {step === "results" && (
        <div className="animate-fade-in">
          {matchingRecipes.length > 0 ? (
            <div className="space-y-4">
              {matchingRecipes.map(({ recipe, matchCount, missingIngs }, idx) => {
                const isSaved = savedRecipes.includes(recipe.id);
                return (
                  <div
                    key={recipe.id}
                    className="glass-card overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <button
                      onClick={() => setOpenRecipeId(recipe.id)}
                      className="w-full text-left"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
                        {/* Tags */}
                        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-lg backdrop-blur-sm">
                            {recipe.mealType === "сніданок" ? "Сніданок" : recipe.mealType === "обід" ? "Обід" : "Вечеря"}
                          </span>
                          {recipe.protein >= 25 && (
                            <span className="text-[10px] font-bold bg-primary/80 text-primary-foreground px-2 py-0.5 rounded-lg backdrop-blur-sm">
                              Багато білка
                            </span>
                          )}
                          {recipe.carbs <= 30 && (
                            <span className="text-[10px] font-bold bg-primary/80 text-primary-foreground px-2 py-0.5 rounded-lg backdrop-blur-sm">
                              Мало вуглеводів
                            </span>
                          )}
                        </div>
                        {/* Match badge */}
                        <div className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur ${
                          missingIngs.length === 0
                            ? "bg-primary/90 text-primary-foreground"
                            : "bg-secondary/90 text-secondary-foreground"
                        }`}>
                          {missingIngs.length === 0
                            ? "У вас є всі інгредієнти ✅"
                            : `Не вистачає: ${missingIngs.length}`}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-foreground font-bold text-base leading-tight">
                            {recipe.title}
                          </h3>
                        </div>
                      </div>
                    </button>

                    <div className="p-3">
                      <div className="flex items-center gap-3 text-xs font-semibold mb-3">
                        <span className="text-primary">
                          {recipe.calories} ккал
                        </span>
                        <span className="text-muted-foreground">
                          Б {recipe.protein} · Ж {recipe.fat} · В{" "}
                          {recipe.carbs}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground ml-auto">
                          <Clock className="w-3 h-3" />
                          {recipe.cookTime} хв
                        </span>
                      </div>

                      {missingIngs.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">
                            Не вистачає ({missingIngs.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {missingIngs.map((ing) => (
                              <span
                                key={ing.name}
                                className="text-[11px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-lg font-medium"
                              >
                                {ing.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setOpenRecipeId(recipe.id)}
                          className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-xl active:scale-[0.97] transition-transform"
                        >
                          Дивитися рецепт
                        </button>
                        <button
                          onClick={() => handleSave(recipe.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isSaved
                              ? "bg-primary/15 text-primary"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <Heart
                            className="w-4 h-4"
                            fill={isSaved ? "currentColor" : "none"}
                          />
                        </button>
                        {missingIngs.length > 0 && (
                          <button
                            onClick={() => handleAddMissing(recipe.id)}
                            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground active:scale-[0.95] transition-transform"
                            title="Додати відсутні інгредієнти"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <p className="text-4xl mb-3">🍽</p>
              <p className="font-semibold mb-1">Недостатньо варіантів</p>
              <p className="text-sm">
                Спробуйте додати більше інгредієнтів
              </p>
              <button
                onClick={() => setStep("ingredients")}
                className="mt-4 text-primary font-bold text-sm"
              >
                ← Повернутися до інгредієнтів
              </button>
            </div>
          )}
        </div>
      )}

      <RecipeModal recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} userIngredients={selectedIngredients} />
    </div>
  );
};

export default CookNowPage;
