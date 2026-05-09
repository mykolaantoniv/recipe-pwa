import { Recipe } from "@/data/recipes";
import { Flame, Clock } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  onOpen?: (recipeId: string) => void;
}

const mealTypeLabels: Record<string, string> = {
  сніданок: "Сніданок",
  обід: "Обід",
  вечеря: "Вечеря",
};

const getNutritionTags = (recipe: Recipe): string[] => {
  const tags: string[] = [];
  if (recipe.protein >= 25) tags.push("Багато білка");
  if (recipe.carbs <= 30) tags.push("Мало вуглеводів");
  return tags;
};

const RecipeCard = ({ recipe, onOpen }: RecipeCardProps) => {
  const nutritionTags = getNutritionTags(recipe);
  const mealLabel = mealTypeLabels[recipe.mealType];
  const primaryBenefit = nutritionTags[0];
  const bottomTags = nutritionTags.slice(0, 2);

  return (
    <button
      onClick={() => onOpen?.(recipe.id)}
      className="overflow-hidden text-left w-full animate-fade-in transition-transform active:scale-[0.98] rounded-[20px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.25)]"
    >
      {/* Top 60%: image */}
      <div className="relative aspect-[5/3] overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Top-left chips */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {mealLabel && (
            <span className="text-[11px] font-bold bg-white/90 text-neutral-900 px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm">
              {mealLabel}
            </span>
          )}
          {primaryBenefit && (
            <span className="text-[11px] font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-sm">
              {primaryBenefit}
            </span>
          )}
        </div>

        {/* Top-right time badge */}
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 text-[11px] font-bold bg-primary/95 text-primary-foreground px-2.5 py-1 rounded-full shadow-sm">
            <Clock className="w-3 h-3" />
            {recipe.cookTime} хв
          </span>
        </div>
      </div>

      {/* Bottom 40%: solid light panel */}
      <div className="bg-white px-4 pt-3.5 pb-4">
        <h3 className="text-neutral-900 font-extrabold text-[19px] leading-[1.2] line-clamp-2 tracking-tight">
          {recipe.title}
        </h3>

        {bottomTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {bottomTags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3.5">
          <span className="flex items-center gap-1.5 text-[14px] font-bold text-neutral-900">
            <Flame className="w-4 h-4 text-primary" />
            {recipe.calories} kcal
          </span>
          <span className="flex items-center gap-1.5 text-[14px] font-bold text-neutral-900">
            <Clock className="w-4 h-4 text-neutral-500" />
            {recipe.cookTime} хв
          </span>
        </div>
      </div>
    </button>
  );
};

export default RecipeCard;
