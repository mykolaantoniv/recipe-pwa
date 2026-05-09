import { useState, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { ShoppingCart, Trash2, ShoppingBag, LogIn } from "lucide-react";
import ZakazAuthSheet from "@/components/ZakazAuthSheet";
import ZakazProductPicker, { IngredientResult } from "@/components/ZakazProductPicker";

const ShoppingListPage = () => {
  const {
    shoppingList, toggleShoppingItem, removeShoppingItem, setShoppingList,
    zakazAuth,
  } = useAppStore();

  const [showAuth, setShowAuth] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<IngredientResult[]>([]);

  const grouped = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  const categories = Object.keys(grouped).sort();
  const unchecked = shoppingList.filter((i) => !i.checked);

  // ── Start search ──────────────────────────────────────────────────────
  const startSearch = useCallback(async (city: string) => {
    setSearching(true);
    setShowPicker(true);

    const initial: IngredientResult[] = unchecked.map((item) => ({
      ingredient: item.name,
      amount: item.amount,
      products: [],
      loading: true,
      selectedIdx: 0,
      skipped: false,
    }));
    setResults(initial);

    // Search in batches of 5
    const arr = [...initial];
    for (let i = 0; i < unchecked.length; i += 5) {
      const chunk = unchecked.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (item) => {
          const idx = arr.findIndex((r) => r.ingredient === item.name);
          try {
            const res = await fetch(
              `/api/zakaz-search?q=${encodeURIComponent(item.name)}&city=${city}&per_page=6`
            );
            const data = await res.json();
            arr[idx] = { ...arr[idx], products: data.results || [], loading: false };
          } catch {
            arr[idx] = { ...arr[idx], products: [], loading: false };
          }
          setResults([...arr]);
        })
      );
    }
    setSearching(false);
  }, [unchecked]);

  const handleFindInAuchan = () => {
    if (zakazAuth.authorized) {
      startSearch(zakazAuth.city);
    } else {
      setShowAuth(true);
    }
  };

  const handleAuthorized = () => {
    setShowAuth(false);
    startSearch(zakazAuth.city);
  };

  const handleSelect = (ingredient: string, idx: number) => {
    setResults((prev) =>
      prev.map((r) => r.ingredient === ingredient ? { ...r, selectedIdx: idx } : r)
    );
  };

  const handleSkip = (ingredient: string) => {
    setResults((prev) =>
      prev.map((r) => r.ingredient === ingredient ? { ...r, skipped: !r.skipped } : r)
    );
  };

  const handleAddToCart = (confirmed: IngredientResult[]) => {
    // Mark confirmed items as checked in shopping list
    confirmed.forEach((c) => {
      const item = shoppingList.find((i) => i.name === c.ingredient);
      if (item && !item.checked) toggleShoppingItem(item.id);
    });
    setShowPicker(false);
  };

  return (
    <div className="safe-bottom px-4 pt-12 pb-28">
      {/* Header */}
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
          {/* Auchan CTA */}
          {unchecked.length > 0 && (
            <div className="mb-6">
              <button
                onClick={handleFindInAuchan}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.45)]"
              >
                {zakazAuth.authorized ? (
                  <ShoppingBag className="w-5 h-5" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {zakazAuth.authorized
                  ? `Знайти в Auchan · ${unchecked.length} товарів`
                  : "Увійти в Auchan → знайти товари"}
              </button>
              {zakazAuth.authorized && (
                <p className="text-center text-[11px] text-muted-foreground mt-1.5">
                  {zakazAuth.city === "kyiv" ? "Київ (Петрівка)" :
                   zakazAuth.city === "kyiv_north" ? "Київ (Північна)" :
                   zakazAuth.city === "dnipro" ? "Дніпро" :
                   zakazAuth.city === "kharkiv" ? "Харків" :
                   zakazAuth.city === "odesa" ? "Одеса" : "Львів"}
                  <button onClick={() => setShowAuth(true)} className="ml-2 text-primary underline">
                    змінити
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Shopping list by category */}
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {cat}
                </h3>
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
                        <p className={`text-sm font-medium leading-snug ${
                          item.checked ? "text-muted-foreground line-through" : "text-foreground"
                        }`}>
                          {item.name}
                        </p>
                        {item.amount && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.amount}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeShoppingItem(item.id)}
                        className="text-muted-foreground/50 hover:text-destructive p-1 transition-colors"
                      >
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

      {/* Zakaz Auth Sheet */}
      <ZakazAuthSheet
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthorized={handleAuthorized}
      />

      {/* Product Picker */}
      <ZakazProductPicker
        open={showPicker}
        results={results}
        onSelect={handleSelect}
        onSkip={handleSkip}
        onAddToCart={handleAddToCart}
        onClose={() => setShowPicker(false)}
        searching={searching}
      />
    </div>
  );
};

export default ShoppingListPage;
