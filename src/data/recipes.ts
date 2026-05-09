// ─── Types ───────────────────────────────────────────────────────────────────
export type MealType = 'сніданок' | 'обід' | 'вечеря' | 'снек';

export interface Recipe {
  id: string;
  title: string;
  image: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cookTime: number;
  mealType: MealType;
  ingredients: { name: string; amount: string; category: string }[];
  steps: string[];
  tags: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
import _all from './all.json';
export const recipes = _all as Recipe[];

// ─── Filter options ───────────────────────────────────────────────────────────
export const filterOptions = [
  { id: 'high-protein', label: 'Багато білка',    tag: 'багато білка'    },
  { id: 'low-carb',     label: 'Мало вуглеводів', tag: 'мало вуглеводів' },
  { id: 'under-30',     label: 'До 30 хв',         tag: 'до 30 хв'        },
  { id: 'breakfast',    label: 'Сніданок',          tag: 'сніданок'        },
  { id: 'lunch',        label: 'Обід',             tag: 'обід'            },
  { id: 'dinner',       label: 'Вечеря',           tag: 'вечеря'          },
  { id: 'snack',        label: 'Снеки',            tag: 'снек'            },
];

export const ingredientCategories = [
  "М'ясо", 'Риба', 'Молочні', 'Яйця', 'Овочі', 'Фрукти',
  'Крупи', 'Горіхи', 'Олія', 'Спеції', 'Бакалія', 'Інше',
];
