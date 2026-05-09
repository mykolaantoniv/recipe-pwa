import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';
import SubscriptionScreen from '@/components/SubscriptionScreen';
import HomePage from '@/pages/HomePage';
import CookNowPage from '@/pages/CookNowPage';
import PlannerPage from '@/pages/PlannerPage';
import MyMealsPage from '@/pages/MyMealsPage';
import ShoppingListPage from '@/pages/ShoppingListPage';
import ProfilePage from '@/pages/ProfilePage';
import RecipeDetail from '@/pages/RecipeDetail';
import NotFound from '@/pages/NotFound';
import { useAppStore } from '@/store/appStore';

const queryClient = new QueryClient();

const App = () => {
  const { loadRecipes, recipesLoading, recipes } = useAppStore();

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  if (recipesLoading && recipes.length === 0) {
    return (
      <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/30 animate-pulse">
          <span className="text-3xl">🍽️</span>
        </div>
        <p className="text-sm font-semibold text-muted-foreground animate-fade-in">
          Завантажуємо рецепти...
        </p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <div className="max-w-lg mx-auto min-h-screen relative">
            <Routes>
              <Route path="/"           element={<HomePage />} />
              <Route path="/cook-now"   element={<CookNowPage />} />
              <Route path="/planner"    element={<PlannerPage />} />
              <Route path="/my-meals"   element={<MyMealsPage />} />
              <Route path="/shopping"   element={<ShoppingListPage />} />
              <Route path="/profile"    element={<ProfilePage />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="*"           element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
          <AuthModal />
          <SubscriptionScreen />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
