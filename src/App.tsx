import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
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
