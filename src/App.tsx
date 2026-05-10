import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import AuthModal from "@/components/AuthModal";
import SubscriptionScreen from "@/components/SubscriptionScreen";
import HomePage from "@/pages/HomePage";
import CookNowPage from "@/pages/CookNowPage";
import PlannerPage from "@/pages/PlannerPage";
import MyMealsPage from "@/pages/MyMealsPage";
import ShoppingListPage from "@/pages/ShoppingListPage";
import ProfilePage from "@/pages/ProfilePage";
import RecipeDetail from "@/pages/RecipeDetail";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const TokenCapture = () => {
  const setZakazToken = useAppStore(s => s.setZakazToken);
  useEffect(() => {
    const stored = localStorage.getItem('reciply_zakaz_token');
    if (stored) { setZakazToken(stored); localStorage.removeItem('reciply_zakaz_token'); }
    const bc = (() => { try { return new BroadcastChannel('zakaz-token'); } catch { return null; } })();
    if (bc) { bc.onmessage = e => { if (e.data?.token) setZakazToken(e.data.token); }; }
    return () => bc?.close();
  }, [setZakazToken]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
        <TokenCapture />
      <BrowserRouter>
        <div className="max-w-lg mx-auto min-h-screen relative">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cook-now" element={<CookNowPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/my-meals" element={<MyMealsPage />} />
            <Route path="/shopping" element={<ShoppingListPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
        <AuthModal />
        <SubscriptionScreen />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
