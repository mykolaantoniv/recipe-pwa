// Async recipe service — fetches from Azure Blob Storage (or local /data in dev)
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

export const ingredientCategories = [
  "М'ясо", 'Риба', 'Молочні', 'Яйця', 'Овочі', 'Фрукти',
  'Крупи', 'Горіхи', 'Олія', 'Спеції', 'Бакалія', 'Інше',
];

export const filterOptions = [
  { id: 'high-protein', label: 'Багато білка',    tag: 'багато білка'    },
  { id: 'low-carb',     label: 'Мало вуглеводів', tag: 'мало вуглеводів' },
  { id: 'under-30',     label: 'До 30 хв',         tag: 'до 30 хв'        },
  { id: 'breakfast',    label: 'Сніданок',          tag: 'сніданок'        },
  { id: 'lunch',        label: 'Обід',             tag: 'обід'            },
  { id: 'dinner',       label: 'Вечеря',           tag: 'вечеря'          },
  { id: 'snack',        label: 'Снеки',            tag: 'снек'            },
];

const BLOB_BASE = 'https://recipepwastorage.blob.core.windows.net/recipes';
const BASE_URL = import.meta.env.DEV ? '/data' : BLOB_BASE;

let _all: Recipe[] | null = null;

export async function loadAllRecipes(): Promise<Recipe[]> {
  if (_all) return _all;
  const res = await fetch(`${BASE_URL}/all.json`);
  if (!res.ok) throw new Error('Failed to load recipes');
  _all = await res.json();
  return _all!;
}

export function getRecipes(): Recipe[] {
  return _all ?? [];
}

// backward-compat: synchronous recipes array (empty until loaded)
export let recipes: Recipe[] = [];
loadAllRecipes().then(r => {
  recipes = r;
  _all = r;
}).catch(() => {});
