import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import RecipeModal from "@/components/RecipeModal";
import { UtensilsCrossed, Trash2, ChevronRight, Heart } from "lucide-react";

type Tab = "plans" | "saved";

const MyMealsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("plans");
  const { mealPlans, removeMealPlan, savedRecipes, toggleSavedRecipe, recipes } = useAppStore();
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);

  const saved = recipes.filter((r) => savedRecipes.includes(r.id));

  const mealLabels: Record<string, string> = {
    сніданок: "🌅 Сніданок",
    обід: "☀️ Обід",
    вечеря: "🌙 Вечеря",
  };

  return (
    <div className="safe-bottom px-4 pt-12">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-foreground">Моє меню</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "plans"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          Плани
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "saved"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          Збережені рецепти
        </button>
      </div>

      {activeTab === "saved" && (
        <>
          {saved.length > 0 ? (
            <div className="space-y-2">
              {saved.map((r) => (
                <div key={r.id} className="glass-card p-3 flex items-center gap-3">
                  <button
                    onClick={() => setOpenRecipeId(r.id)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.calories} ккал · {r.cookTime} хв
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleSavedRecipe(r.id)}
                    className="text-primary p-2"
                  >
                    <Heart className="w-5 h-5" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">💾</p>
              <p className="font-semibold">У вас ще немає збережених страв</p>
              <p className="text-sm mt-1">
                Почніть з "Готувати зараз" або створіть план
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === "plans" && (
        <>
          {mealPlans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-semibold">У вас ще немає збережених страв</p>
              <p className="text-sm mt-1">
                Почніть з "Готувати зараз" або створіть план
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mealPlans.map((plan) => (
                <div key={plan.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <button
                      onClick={() => removeMealPlan(plan.id)}
                      className="text-destructive p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {plan.days.map((day) => (
                    <div key={day.day} className="mb-3 last:mb-0">
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">
                        День {day.day}
                      </p>
                      {day.meals.map((meal) => {
                        const recipe = recipes.find((r) => r.id === meal.recipeId);
                        if (!recipe) return null;
                        return (
                          <button
                            key={`${day.day}-${meal.mealType}`}
                            onClick={() => setOpenRecipeId(recipe.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary mb-1.5 transition-colors"
                          >
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div className="flex-1 text-left">
                              <p className="text-[10px] text-muted-foreground">
                                {mealLabels[meal.mealType]}
                              </p>
                              <p className="text-xs font-semibold text-foreground">
                                {recipe.title}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <RecipeModal recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />
    </div>
  );
};

export default MyMealsPage;
