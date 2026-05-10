import { useState, useCallback, useRef } from "react";
import { useAppStore, type ZakazAuth } from "@/store/appStore";
import { ShoppingCart, Trash2, ShoppingBag, LogIn } from "lucide-react";
import ZakazAuthSheet from "@/components/ZakazAuthSheet";
import ZakazProductPicker, { IngredientResult } from "@/components/ZakazProductPicker";

const DEFAULT_AUTH: ZakazAuth = {
  authorized: false, storeId: '', chain: '', domain: '', storeLabel: '', authorizedAt: null,
};

const ShoppingListPage = () => {
  const {
    shoppingList, toggleShoppingItem, removeShoppingItem, setShoppingList,
    zakazAuth: rawAuth, zakazToken,
  } = useAppStore();

  const zakazAuth: ZakazAuth = rawAuth ?? DEFAULT_AUTH;

  const [showAuth, setShowAuth]     = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [searching, setSearching]   = useState(false);
  const [results, setResults]       = useState<IngredientResult[]>([]);
  const resultsRef                  = useRef<IngredientResult[]>([]);
  const [storeCtx, setStoreCtx]     = useState({ storeId: '', chain: '' });

  const grouped = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  const categories = Object.keys(grouped).sort();
  const unchecked  = shoppingList.filter((i) => !i.checked);

  const startSearch = useCallback(async (storeId: string, chain: string) => {
    setSearching(true);
    setShowPicker(true);
    setStoreCtx({ storeId, chain });

    const initial: IngredientResult[] = unchecked.map((item) => ({
      ingredient: item.name,
      amount: item.amount,
      products: [],
      loading: true,
      loadingMore: false,
      selectedIdx: 0,
      skipped: false,
      quantity: 1,
      page: 1,
      total: 0,
    }));
    syncResultsRef(initial);

    for (let i = 0; i < unchecked.length; i += 5) {
      const chunk = unchecked.slice(i, i + 5);
      const updates = await Promise.all(
        chunk.map(async (item) => {
          try {
            const res = await fetch(
              `/api/zakaz-search?q=${encodeURIComponent(item.name)}&storeId=${storeId}&chain=${chain}&per_page=10&page=1`
            );
            const data = await res.json();
            return { ingredient: item.name, products: data.results || [], loading: false, total: data.count || 0 };
          } catch {
            return { ingredient: item.name, products: [], loading: false, total: 0 };
          }
        })
      );
      setResults(prev => {
        const next = prev.map(r => {
          const u = updates.find(x => x.ingredient === r.ingredient);
          return u ? { ...r, ...u } : r;
        });
        resultsRef.current = next;
        return next;
      });
    }
    setSearching(false);
  }, [unchecked]);

  const handleFindInStore = () => {
    if (zakazAuth.authorized) {
      startSearch(zakazAuth.storeId, zakazAuth.chain);
    } else {
      setShowAuth(true);
    }
  };

  const handleAuthorized = (storeId: string, chain: string) => {
    setShowAuth(false);
    startSearch(storeId, chain);
  };

  const handleSelect = (ingredient: string, idx: number) => {
    setResults((prev) =>
      prev.map((r) => r.ingredient === ingredient ? { ...r, selectedIdx: idx } : r)
    );
  };

  const handleSetQuantity = (ingredient: string, qty: number) => {
    setResults((prev) =>
      prev.map((r) => r.ingredient === ingredient ? { ...r, quantity: qty } : r)
    );
  };

  // Keep ref in sync so handleLoadMore can read current page without stale closure
  const syncResultsRef = (updated: IngredientResult[]) => {
    resultsRef.current = updated;
    setResults(updated);
  };

  const handleLoadMore = useCallback(async (ingredient: string) => {
    const current = resultsRef.current.find(r => r.ingredient === ingredient);
    if (!current) return;
    const nextPage = current.page + 1;
    setResults(prev => prev.map(r => r.ingredient === ingredient ? { ...r, loadingMore: true } : r));
    try {
      const res  = await fetch(
        `/api/zakaz-search?q=${encodeURIComponent(ingredient)}&storeId=${storeCtx.storeId}&chain=${storeCtx.chain}&per_page=10&page=${nextPage}`
      );
      const data = await res.json();
      setResults(prev => {
        const next = prev.map(r =>
          r.ingredient === ingredient
            ? { ...r, products: [...r.products, ...(data.results || [])], page: nextPage, loadingMore: false }
            : r
        );
        resultsRef.current = next;
        return next;
      });
    } catch {
      setResults(prev => prev.map(r => r.ingredient === ingredient ? { ...r, loadingMore: false } : r));
    }
  }, [storeCtx]);

  const handleSkip = (ingredient: string) => {
    setResults((prev) =>
      prev.map((r) => r.ingredient === ingredient ? { ...r, skipped: !r.skipped } : r)
    );
  };

  const handleAddToCart = (confirmed: IngredientResult[]) => {
    confirmed.forEach((c) => {
      const item = shoppingList.find((i) => i.name === c.ingredient);
      if (item && !item.checked) toggleShoppingItem(item.id);
    });
  };

  return (
    <div className="safe-bottom px-4 pt-12 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Список покупок</h1>
          </div>
          <p className="text-sm text-muted-foreground">{shoppingList.length} продуктів</p>
        </div>
        {shoppingList.length > 0 && (
          <button
            onClick={() => setShoppingList([])}
            className="text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1.5 rounded-full"
          >
            Очистити
          </button>
        )}
      </div>

      {shoppingList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-3">🛒</p>
          <p className="font-semibold text-base">Список порожній</p>
          <p className="text-sm mt-1.5 leading-relaxed">
            Створіть план харчування —<br />список сформується автоматично
          </p>
        </div>
      ) : (
        <>
          {unchecked.length > 0 && (
            <div className="mb-6">
              <button
                onClick={handleFindInStore}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.45)]"
              >
                {zakazAuth.authorized ? <ShoppingBag className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {zakazAuth.authorized
                  ? `Знайти в ${zakazAuth.storeLabel} · ${unchecked.length} товарів`
                  : "Увійти в zakaz.ua → знайти товари"}
              </button>
              {zakazAuth.authorized && (
                <p className="text-center text-[11px] text-muted-foreground mt-1.5">
                  {zakazAuth.storeLabel}
                  <button onClick={() => setShowAuth(true)} className="ml-2 text-primary underline">
                    змінити
                  </button>
                </p>
              )}
            </div>
          )}

          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h3>
                <div className="glass-card divide-y divide-border/50">
                  {grouped[cat].map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3.5">
                      <button
                        onClick={() => toggleShoppingItem(item.id)}
                        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          item.checked ? "bg-primary border-primary" : "border-muted-foreground"
                        }`}
                      >
                        {item.checked && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {item.name}
                        </p>
                        {item.amount && <p className="text-xs text-muted-foreground mt-0.5">{item.amount}</p>}
                      </div>
                      <button onClick={() => removeShoppingItem(item.id)} className="text-muted-foreground/50 hover:text-destructive p-1 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ZakazAuthSheet open={showAuth} onClose={() => setShowAuth(false)} onAuthorized={handleAuthorized} />
      <ZakazProductPicker open={showPicker} results={results} storeLabel={zakazAuth.storeLabel} zakazToken={zakazToken ?? null} storeId={storeCtx.storeId} chain={storeCtx.chain} onSelect={handleSelect} onSkip={handleSkip} onSetQuantity={handleSetQuantity} onLoadMore={handleLoadMore} onAddToCart={handleAddToCart} onClose={() => setShowPicker(false)} searching={searching} />
    </div>
  );
};

export default ShoppingListPage;
