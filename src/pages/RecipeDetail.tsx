import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { useAppStore } from "@/store/appStore";
import { ArrowLeft, Heart, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipes } = useAppStore();
  const recipe = recipes.find((r) => r.id === id);
  const { savedRecipes, toggleSavedRecipe, addToShoppingList, requireAuth } = useAppStore();

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <div className="text-center">
          <p className="text-3xl mb-2">😕</p>
          <p>Щось пішло не так. Спробуйте ще раз</p>
        </div>
      </div>
    );
  }

  const isSaved = savedRecipes.includes(recipe.id);

  const handleAddToShopping = () => {
    const items = recipe.ingredients.map((ing, i) => ({
      id: `${recipe.id}-${i}-${Date.now()}`,
      name: ing.name,
      amount: ing.amount,
      category: ing.category,
      checked: false,
    }));
    addToShoppingList(items);
    navigate("/shopping");
  };

  return (
    <div className="pb-6">
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full aspect-[16/10] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            const doSave = () => {
              toggleSavedRecipe(recipe.id);
              if (!savedRecipes.includes(recipe.id)) {
                // Adding - also add ingredients to shopping
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
          }}
          className={`absolute top-12 right-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center transition-colors ${
            isSaved ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Heart className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <h1 className="text-2xl font-extrabold text-foreground mb-3">
          {recipe.title}
        </h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Час приготування: ~{recipe.cookTime} хв</span>
          </div>
          <span className="text-sm font-bold text-primary">
            {recipe.calories} ккал
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Білки", value: `${recipe.protein} г`, color: "text-info" },
            { label: "Жири", value: `${recipe.fat} г`, color: "text-warning" },
            { label: "Вуглеводи", value: `${recipe.carbs} г`, color: "text-primary" },
          ].map((m) => (
            <div key={m.label} className="glass-card p-3 text-center">
              <p className={`text-lg font-extrabold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {m.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Інгредієнти</h2>
          <div className="glass-card p-4 space-y-2.5">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{ing.name}</span>
                <span className="text-sm text-muted-foreground font-medium">
                  {ing.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Приготування</h2>
          <div className="space-y-3">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed pt-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
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
            }}
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
            onClick={handleAddToShopping}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <ShoppingCart className="w-5 h-5" />
            До списку покупок
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
