import { useState, useMemo } from "react";
import { type Recipe } from "@/data/recipes";
import { useAppStore } from "@/store/appStore";
import { useAppStore } from "@/store/appStore";
import { ArrowLeft, X, Heart, Clock, ShoppingCart, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface RecipeModalProps {
  recipeId: string | null;
  onClose: () => void;
  userIngredients?: string[];
}

const normalize = (s: string) => s.toLowerCase().trim();

const RecipeModal = ({ recipeId, onClose, userIngredients }: RecipeModalProps) => {
  const recipe = recipeId ? recipes.find((r) => r.id === recipeId) : null;
  const { savedRecipes, toggleSavedRecipe, addToShoppingList, requireAuth, shoppingList, recipes } = useAppStore();

  const hasContext = !!(userIngredients && userIngredients.length > 0);

  const { haveIngredients, missingIngredients } = useMemo(() => {
    if (!recipe || !hasContext) return { haveIngredients: recipe?.ingredients ?? [], missingIngredients: [] as { name: string; amount: string; category: string }[] };
    const normalizedUser = userIngredients!.map(normalize);
    const have = recipe.ingredients.filter((ing) => normalizedUser.includes(normalize(ing.name)));
    const missing = recipe.ingredients.filter((ing) => !normalizedUser.includes(normalize(ing.name)));
    return { haveIngredients: have, missingIngredients: missing };
  }, [recipe, userIngredients, hasContext]);

  if (!recipe) return null;

  const isSaved = savedRecipes.includes(recipe.id);
  const allHave = hasContext && missingIngredients.length === 0;
  const allMissing = hasContext && haveIngredients.length === 0;

  const handleSave = () => {
    const doSave = () => {
      toggleSavedRecipe(recipe.id);
      if (!savedRecipes.includes(recipe.id)) {
        const items = recipe.ingredients.map((ing, i) => ({
          id: `save-${recipe.id}-${i}-${Date.now()}`,
          name: ing.name,
          amount: ing.amount,
          category: ing.category,
          checked: false,
        }));
        addToShoppingList(items);
        toast.success("Збережено та додано до покупок ✅");
      }
    };
    if (isSaved) { toggleSavedRecipe(recipe.id); return; }
    if (!requireAuth(doSave)) return;
    doSave();
  };

  const handleAddMissing = () => {
    const existingNames = shoppingList.map((item) => normalize(item.name));
    const newItems = missingIngredients
      .filter((ing) => !existingNames.includes(normalize(ing.name)))
      .map((ing, i) => ({
        id: `missing-${recipe.id}-${i}-${Date.now()}`,
        name: ing.name,
        amount: ing.amount,
        category: ing.category,
        checked: false,
      }));
    if (newItems.length === 0) {
      toast.info("Усі інгредієнти вже у списку покупок");
      return;
    }
    addToShoppingList(newItems);
    toast.success(`Додано ${newItems.length} інгредієнтів до покупок ✅`);
  };

  const handleAddToShopping = () => {
    const items = recipe.ingredients.map((ing, i) => ({
      id: `${recipe.id}-${i}-${Date.now()}`,
      name: ing.name,
      amount: ing.amount,
      category: ing.category,
      checked: false,
    }));
    addToShoppingList(items);
    toast.success("Додано до списку покупок ✅");
  };

  const IngredientRow = ({ ing, isHave }: { ing: typeof recipe.ingredients[0]; isHave: boolean }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {hasContext && (
          isHave
            ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 text-accent flex-shrink-0" />
        )}
        <span className="text-sm text-foreground">{ing.name}</span>
      </div>
      <span className="text-sm text-muted-foreground font-medium">{ing.amount}</span>
    </div>
  );

  return (
    <Sheet open={!!recipeId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[95vh] rounded-t-3xl p-0 overflow-y-auto border-t-0 [&>button]:hidden"
      >
        {/* Header bar - fixed */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border/30">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-foreground truncate max-w-[55%]">
            {recipe.title}
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-foreground active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero image */}
        <div className="relative">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full aspect-[16/10] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="px-4 -mt-8 relative z-10 pb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-3">
            {recipe.title}
          </h1>

          <p className="text-lg font-extrabold text-primary mb-1">
            {recipe.calories} ккал на 1 порцію
          </p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Clock className="w-4 h-4" />
            <span>Час приготування: ~{recipe.cookTime} хв</span>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Білки", value: `${recipe.protein} г`, color: "text-info" },
              { label: "Жири", value: `${recipe.fat} г`, color: "text-warning" },
              { label: "Вуглеводи", value: `${recipe.carbs} г`, color: "text-primary" },
            ].map((m) => (
              <div key={m.label} className="glass-card p-3 text-center">
                <p className={`text-lg font-extrabold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Ingredients — split or flat */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Інгредієнти</h2>

            {hasContext ? (
              <>
                {/* All ingredients available */}
                {allHave && (
                  <div className="glass-card p-4 flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-bold text-green-500">У вас є всі інгредієнти ✅</span>
                  </div>
                )}

                {/* Have section */}
                {haveIngredients.length > 0 && !allHave && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-green-500 mb-2 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      У вас вже є
                    </p>
                    <div className="glass-card p-4 space-y-2.5 border border-green-500/20">
                      {haveIngredients.map((ing, i) => (
                        <IngredientRow key={i} ing={ing} isHave />
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing section */}
                {missingIngredients.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-accent mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Потрібно докупити
                    </p>
                    <div className="glass-card p-4 space-y-2.5 border border-accent/20">
                      {missingIngredients.map((ing, i) => (
                        <IngredientRow key={i} ing={ing} isHave={false} />
                      ))}
                    </div>
                    <button
                      onClick={handleAddMissing}
                      className="w-full mt-3 bg-accent/15 text-accent font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Додати до списку покупок
                    </button>
                  </div>
                )}

                {/* All missing */}
                {allMissing && (
                  <div className="glass-card p-4 space-y-2.5">
                    {recipe.ingredients.map((ing, i) => (
                      <IngredientRow key={i} ing={ing} isHave={false} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-4 space-y-2.5">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{ing.name}</span>
                    <span className="text-sm text-muted-foreground font-medium">{ing.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Приготування</h2>
            <div className="space-y-3">
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
                isSaved
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary/15 text-primary"
              }`}
            >
              <Heart className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
              {isSaved ? "Збережено ✅" : "Зберегти"}
            </button>
            <button
              onClick={hasContext && missingIngredients.length > 0 ? handleAddMissing : handleAddToShopping}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ShoppingCart className="w-5 h-5" />
              {hasContext && missingIngredients.length > 0 ? "Додати відсутні до покупок" : "До списку покупок"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecipeModal;
