import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe, MealType } from '@/data/recipes';
import { loadAllRecipes } from '@/data/recipes';

export interface MealPlan {
  id: string;
  name: string;
  days: { day: number; meals: { mealType: MealType; recipeId: string; portions: number }[] }[];
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  checked: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  goal: 'lose' | 'maintain' | 'gain' | null;
  dailyCalories: number;
  allergies: string[];
  dislikedIngredients: string[];
  notifications: { cooking: boolean; streaks: boolean; newRecipes: boolean };
}

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly';

export interface AuthState {
  isAuthenticated: boolean;
  subscriptionStatus: 'none' | 'trial' | 'active' | 'expired';
  subscriptionPlan: SubscriptionPlan | null;
  trialStartedAt: string | null;
  sessionCount: number;
  showAuthModal: boolean;
  showSubscription: boolean;
  pendingAction: (() => void) | null;
}

interface AppState {
  // ── Recipe data ──────────────────────────────────────────────────
  recipes: Recipe[];
  recipesLoading: boolean;
  recipesError: string | null;
  loadRecipes: () => Promise<void>;

  // ── User data ────────────────────────────────────────────────────
  savedRecipes: string[];
  mealPlans: MealPlan[];
  shoppingList: ShoppingItem[];
  profile: UserProfile;
  hasSeenPersonalization: boolean;
  recentIngredients: string[];
  auth: AuthState;

  addRecentIngredients: (names: string[]) => void;
  toggleSavedRecipe: (id: string) => void;
  addMealPlan: (plan: MealPlan) => void;
  removeMealPlan: (id: string) => void;
  setShoppingList: (items: ShoppingItem[]) => void;
  addToShoppingList: (items: ShoppingItem[]) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  setHasSeenPersonalization: (v: boolean) => void;

  signUp: (name: string, email: string) => void;
  signOut: () => void;
  startTrial: (plan: SubscriptionPlan) => void;
  dismissPaywall: () => void;
  setShowAuthModal: (show: boolean) => void;
  setShowSubscription: (show: boolean) => void;
  setPendingAction: (action: (() => void) | null) => void;
  requireAuth: (action: () => void) => boolean;
  incrementSessionCount: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      recipes: [],
      recipesLoading: false,
      recipesError: null,

      loadRecipes: async () => {
        if (get().recipes.length > 0) return;
        set({ recipesLoading: true, recipesError: null });
        try {
          const data = await loadAllRecipes();
          set({ recipes: data, recipesLoading: false });
        } catch (e) {
          set({ recipesError: 'Помилка завантаження рецептів', recipesLoading: false });
        }
      },

      savedRecipes: [],
      mealPlans: [],
      shoppingList: [],
      profile: { name: '', email: '', goal: null, dailyCalories: 2000, allergies: [], dislikedIngredients: [], notifications: { cooking: true, streaks: true, newRecipes: true } },
      hasSeenPersonalization: false,
      recentIngredients: [],
      auth: { isAuthenticated: false, subscriptionStatus: 'none', subscriptionPlan: null, trialStartedAt: null, sessionCount: 0, showAuthModal: false, showSubscription: false, pendingAction: null },

      addRecentIngredients: (names) => set(s => {
        const merged = [...names, ...(s.recentIngredients ?? [])];
        const unique: string[] = [];
        for (const n of merged) if (!unique.includes(n)) unique.push(n);
        return { recentIngredients: unique.slice(0, 12) };
      }),

      toggleSavedRecipe: (id) => set(s => ({ savedRecipes: s.savedRecipes.includes(id) ? s.savedRecipes.filter(x => x !== id) : [...s.savedRecipes, id] })),
      addMealPlan: (plan) => set(s => ({ mealPlans: [plan, ...s.mealPlans] })),
      removeMealPlan: (id) => set(s => ({ mealPlans: s.mealPlans.filter(p => p.id !== id) })),
      setShoppingList: (items) => set({ shoppingList: items }),
      addToShoppingList: (items) => set(s => ({ shoppingList: [...s.shoppingList, ...items] })),
      toggleShoppingItem: (id) => set(s => ({ shoppingList: s.shoppingList.map(i => i.id === id ? { ...i, checked: !i.checked } : i) })),
      removeShoppingItem: (id) => set(s => ({ shoppingList: s.shoppingList.filter(i => i.id !== id) })),
      updateProfile: (p) => set(s => ({ profile: { ...s.profile, ...p } })),
      setHasSeenPersonalization: (v) => set({ hasSeenPersonalization: v }),

      signUp: (name, email) => set(s => ({ auth: { ...s.auth, isAuthenticated: true, showAuthModal: false, showSubscription: true }, profile: { ...s.profile, name, email } })),
      signOut: () => set(s => ({ auth: { ...s.auth, isAuthenticated: false, subscriptionStatus: 'none', subscriptionPlan: null, trialStartedAt: null, showAuthModal: false, showSubscription: false, pendingAction: null } })),
      startTrial: (plan) => set(s => ({ auth: { ...s.auth, subscriptionStatus: 'trial', subscriptionPlan: plan, trialStartedAt: new Date().toISOString(), showSubscription: false } })),
      dismissPaywall: () => set(s => ({ auth: { ...s.auth, showSubscription: false } })),
      setShowAuthModal: (show) => set(s => ({ auth: { ...s.auth, showAuthModal: show } })),
      setShowSubscription: (show) => set(s => ({ auth: { ...s.auth, showSubscription: show } })),
      setPendingAction: (action) => set(s => ({ auth: { ...s.auth, pendingAction: action } })),

      requireAuth: (action) => {
        const state = get();
        if (!state.auth.isAuthenticated) {
          set(s => ({ auth: { ...s.auth, showAuthModal: true, pendingAction: action } }));
          return false;
        }
        if (state.auth.subscriptionStatus === 'none' || state.auth.subscriptionStatus === 'expired') {
          set(s => ({ auth: { ...s.auth, showSubscription: true, pendingAction: action } }));
          return false;
        }
        return true;
      },

      incrementSessionCount: () => set(s => ({ auth: { ...s.auth, sessionCount: s.auth.sessionCount + 1 } })),
    }),
    {
      name: 'reciply-storage',
      partialize: (state) => ({
        savedRecipes: state.savedRecipes,
        mealPlans: state.mealPlans,
        shoppingList: state.shoppingList,
        profile: state.profile,
        hasSeenPersonalization: state.hasSeenPersonalization,
        recentIngredients: state.recentIngredients,
        auth: { ...state.auth, showAuthModal: false, showSubscription: false, pendingAction: null },
      }),
    }
  )
);
