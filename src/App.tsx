import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import AuthModal from "@/components/AuthModal";
import SubscriptionScreen from "@/components/SubscriptionScreen";
import { useAppStore } from "@/store/appStore";

const HomePage        = lazy(() => import("@/pages/HomePage"));
const CookNowPage     = lazy(() => import("@/pages/CookNowPage"));
const PlannerPage     = lazy(() => import("@/pages/PlannerPage"));
const MyMealsPage     = lazy(() => import("@/pages/MyMealsPage"));
const ShoppingListPage = lazy(() => import("@/pages/ShoppingListPage"));
const ProfilePage     = lazy(() => import("@/pages/ProfilePage"));
const RecipeDetail    = lazy(() => import("@/pages/RecipeDetail"));
const NotFound        = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

// Picks up the zakaz auth token that zakaz-connect.html delivers via
// BroadcastChannel (primary) or localStorage fallback.
const TokenCapture = () => {
  const setZakazToken = useAppStore(s => s.setZakazToken);

  useEffect(() => {
    // localStorage fallback (BroadcastChannel not available, or same-tab redirect)
    const stored = localStorage.getItem('reciply_zakaz_token');
    if (stored && typeof stored === 'string' && stored.length >= 20) {
      setZakazToken(stored);
      localStorage.removeItem('reciply_zakaz_token');
    }

    let bc: BroadcastChannel | null = null;
    try { bc = new BroadcastChannel('zakaz-token'); } catch { /* not supported */ }

    if (bc) {
      const handler = (e: MessageEvent) => {
        if (e.data && typeof e.data.token === 'string' && e.data.token.length >= 20) {
          setZakazToken(e.data.token);
        }
      };
      bc.addEventListener('message', handler);
      return () => {
        bc!.removeEventListener('message', handler);
        bc!.close();
      };
    }
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
          <Suspense fallback={null}>
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
          </Suspense>
          <BottomNav />
        </div>
        <AuthModal />
        <SubscriptionScreen />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
