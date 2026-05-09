import { useState, useMemo } from "react";
import { recipes, type MealType } from "@/data/recipes";
import { useAppStore, type MealPlan, type ShoppingItem } from "@/store/appStore";
import { CalendarDays, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import IngredientsSelector from "@/components/IngredientsSelector";
import PortionStepper from "@/components/PortionStepper";
import RecipeModal from "@/components/RecipeModal";

const mealLabels: Record<MealType, string> = {
  сніданок: "🌅 Сніданок",
  обід: "☀️ Обід",
  вечеря: "🌙 Вечеря",
};

const dayOptions = [
  { value: 1, label: "1 день" },
  { value: 3, label: "3 дні" },
  { value: 5, label: "5 днів" },
  { value: 7, label: "7 днів" },
];

type PlannerStep = "config" | "ingredients" | "result";

interface MealSlot {
  mealType: MealType;
  selectedIdx: number;
  alternatives: string[];
}

const PlannerPage = () => {
  const navigate = useNavigate();
  const { addMealPlan, addToShoppingList, requireAuth, addRecentIngredients } = useAppStore();
  const [days, setDays] = useState(3);
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(["сніданок", "обід", "вечеря"]);
  const [portions, setPortions] = useState(2);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [step, setStep] = useState<PlannerStep>("config");
  const [generatedSlots, setGeneratedSlots] = useState<MealSlot[][]>([]);
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  const toggleMeal = (meal: MealType) => {
    setSelectedMeals((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
    );
  };

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const generatePlan = () => {
    addRecentIngredients(selectedIngredients);
    const slots: MealSlot[][] = Array.from({ length: days }, (_, dayIdx) => {
      return selectedMeals.map((mealType) => {
        const available = recipes.filter((r) => r.mealType === mealType);
        let sorted = [...available];
        if (selectedIngredients.length > 0) {
          sorted.sort((a, b) => {
            const aMatch = a.ingredients.filter((i) => selectedIngredients.includes(i.name)).length;
            const bMatch = b.ingredients.filter((i) => selectedIngredients.includes(i.name)).length;
            return bMatch - aMatch;
          });
        }
        const alts = sorted.slice(0, Math.min(4, sorted.length));
        const defaultIdx = dayIdx % alts.length;
        const reordered = [
          alts[defaultIdx].id,
          ...alts.filter((_, i) => i !== defaultIdx).map((r) => r.id),
        ];
        return { mealType, selectedIdx: 0, alternatives: reordered };
      });
    });
    setGeneratedSlots(slots);
    setStep("result");
  };

  const selectAlternative = (dayIdx: number, mealIdx: number, altIdx: number) => {
    setGeneratedSlots((prev) => {
      const next = prev.map((d) => d.map((m) => ({ ...m })));
      next[dayIdx][mealIdx].selectedIdx = altIdx;
      return next;
    });
  };

  const handleSave = () => {
    if (generatedSlots.length === 0) return;

    const planDays = generatedSlots.map((daySlots, dayIdx) => ({
      day: dayIdx + 1,
      meals: daySlots.map((slot) => ({
        mealType: slot.mealType,
        recipeId: slot.alternatives[slot.selectedIdx],
        portions,
      })),
    }));

    const plan: MealPlan = {
      id: Date.now().toString(),
      name: `План на ${days} ${days === 1 ? "день" : days < 5 ? "дні" : "днів"}`,
      days: planDays,
      createdAt: new Date().toISOString(),
    };

    const doSave = () => {
      addMealPlan(plan);

      const ingredientMap = new Map<string, { amount: string; category: string }>();
      planDays.forEach((day) => {
        day.meals.forEach((meal) => {
          const recipe = recipes.find((r) => r.id === meal.recipeId);
          if (!recipe) return;
          recipe.ingredients.forEach((ing) => {
            if (!ingredientMap.has(ing.name)) {
              ingredientMap.set(ing.name, { amount: ing.amount, category: ing.category });
            }
          });
        });
      });

      const shoppingItems: ShoppingItem[] = Array.from(ingredientMap.entries()).map(
        ([name, { amount, category }], i) => ({
          id: `plan-${plan.id}-${i}`,
          name,
          amount,
          category,
          checked: false,
        })
      );
      addToShoppingList(shoppingItems);

      toast.success("План збережено, список покупок згенеровано ✅");
      navigate("/my-meals");
    };

    if (!requireAuth(doSave)) return;
    doSave();
  };

  return (
    <div className="safe-bottom px-4 pt-12">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-foreground">Планування</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Створіть свій план харчування
        </p>
      </div>

      {step === "config" && (
        <>
          <div className="mb-6">
            <h2 className="text-sm font-bold text-foreground mb-3">На скільки днів плануємо?</h2>
            <div className="flex gap-3">
              {dayOptions.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDays(d.value)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    days === d.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-foreground mb-3">Скільки прийомів їжі?</h2>
            <div className="space-y-2">
              {(["сніданок", "обід", "вечеря"] as MealType[]).map((meal) => (
                <button
                  key={meal}
                  onClick={() => toggleMeal(meal)}
                  className={`w-full glass-card p-4 flex items-center justify-between transition-all ${
                    selectedMeals.includes(meal) ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <span className="font-semibold text-foreground">{mealLabels[meal]}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      selectedMeals.includes(meal) ? "bg-primary border-primary" : "border-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-bold text-foreground mb-3">Кількість порцій</h2>
            <PortionStepper value={portions} onChange={setPortions} />
          </div>

          <button
            onClick={() => setStep("ingredients")}
            disabled={selectedMeals.length === 0}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Далі — обрати інгредієнти
          </button>
        </>
      )}

      {step === "ingredients" && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-4">Що є у вас вдома?</h2>
          <IngredientsSelector
            selectedIngredients={selectedIngredients}
            onToggleIngredient={toggleIngredient}
            minRequired={3}
            onSubmit={generatePlan}
            ctaLabel="Підібрати страви"
          />
          <button
            onClick={() => setStep("config")}
            className="w-full mt-3 text-muted-foreground text-sm font-semibold py-2"
          >
            ← Назад
          </button>
        </div>
      )}

      {step === "result" && generatedSlots.length > 0 && (
        <>
          <div className="space-y-4 mb-6">
            {generatedSlots.map((daySlots, dayIdx) => (
              <div key={dayIdx} className="glass-card p-4">
                <h3 className="font-bold text-foreground mb-3">День {dayIdx + 1}</h3>
                <div className="space-y-4">
                  {daySlots.map((slot, mealIdx) => {
                    const selectedRecipe = recipes.find(
                      (r) => r.id === slot.alternatives[slot.selectedIdx]
                    );
                    return (
                      <div key={`${dayIdx}-${slot.mealType}`}>
                        <p className="text-xs text-muted-foreground font-semibold mb-2">
                          {mealLabels[slot.mealType]}
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {slot.alternatives.map((recipeId, altIdx) => {
                            const r = recipes.find((rec) => rec.id === recipeId);
                            if (!r) return null;
                            const isSelected = altIdx === slot.selectedIdx;
                            return (
                              <div
                                key={recipeId}
                                className={`flex-shrink-0 w-36 rounded-xl overflow-hidden transition-all cursor-pointer relative ${
                                  isSelected ? "ring-2 ring-primary" : "opacity-60"
                                }`}
                                onClick={() => {
                                  if (isSelected) {
                                    setOpenRecipeId(recipeId);
                                  } else {
                                    selectAlternative(dayIdx, mealIdx, altIdx);
                                  }
                                }}
                              >
                                <img
                                  src={r.image}
                                  alt={r.title}
                                  className="w-full h-20 object-cover"
                                />
                                <div className="p-2 bg-secondary">
                                  <p className="text-[11px] font-bold text-foreground leading-tight line-clamp-2">
                                    {r.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {r.calories} ккал · {r.cookTime} хв
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setGeneratedSlots([]);
                setStep("ingredients");
              }}
              className="flex-1 bg-secondary text-secondary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Змінити
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-primary text-primary-foreground font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform"
            >
              Зберегти план
            </button>
          </div>
        </>
      )}

      <RecipeModal recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} userIngredients={selectedIngredients} />
    </div>
  );
};

export default PlannerPage;
