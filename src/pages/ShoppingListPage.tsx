import { useState, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { ShoppingCart, Trash2, ExternalLink, Search, Loader2, ShoppingBag, RefreshCw, LogIn } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ZakazAuthSheet, { openInBrowser } from "@/components/ZakazAuthSheet";

interface ZakazProduct {
  id: string;
  title: string;
  price: string | null;
  image: string | null;
  unit: string;
  url: string;
}

interface SearchResult {
  ingredient: string;
  products: ZakazProduct[];
  loading: boolean;
  error: boolean;
}

const ShoppingListPage = () => {
  const {
    shoppingList, toggleShoppingItem, removeShoppingItem, setShoppingList,
    zakazAuth, setZakazAuthorized,
  } = useAppStore();

  const [showAuchan, setShowAuchan] = useState(false);
  const [showZakazAuth, setShowZakazAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  const grouped = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof shoppingList>);

  const categories = Object.keys(grouped).sort();
  const unchecked = shoppingList.filter((i) => !i.checked);

  // ── Search ────────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (city: string) => {
    setSearching(true);
    setShowAuchan(true);

    const initial: SearchResult[] = unchecked.map((item) => ({
      ingredient: item.name,
      products: [],
      loading: true,
      error: false,
    }));
    setSearchResults(initial);
    setSelectedProducts({});

    const results: SearchResult[] = [...initial];

    // Search in batches of 6 to not overwhelm the edge function
    for (let i = 0; i < unchecked.length; i += 6) {
      const chunk = unchecked.slice(i, i + 6);
      await Promise.all(
        chunk.map(async (item) => {
          const idx = results.findIndex((r) => r.ingredient === item.name);
          try {
            const res = await fetch(
              `/api/zakaz-search?q=${encodeURIComponent(item.name)}&city=${city}`
            );
            const data = await res.json();
            results[idx] = {
              ingredient: item.name,
              products: data.results || [],
              loading: false,
              error: false,
            };
          } catch {
            results[idx] = {
              ingredient: item.name,
              products: [],
              loading: false,
              error: true,
            };
          }
          setSearchResults([...results]);
        })
      );
    }

    setSearching(false);
  }, [unchecked]);

  // ── Auth-gated action ────────────────────────────────────────────────────
  const requireZakazAuth = useCallback((action: () => void) => {
    if (zakazAuth.authorized) {
      action();
    } else {
      setPendingAction(() => action);
      setShowZakazAuth(true);
    }
  }, [zakazAuth.authorized]);

  const handleStartSearch = () => {
    if (unchecked.length === 0) return;
    requireZakazAuth(() => runSearch(zakazAuth.city));
  };

  const handleZakazAuthorized = () => {
    setShowZakazAuth(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // ── Open product in browser ───────────────────────────────────────────────
  const handleOpenProduct = (url: string) => {
    requireZakazAuth(() => openInBrowser(url));
  };

  const getSelectedProduct = (ingredient: string, products: ZakazProduct[]) => {
    const idx = selectedProducts[ingredient] ?? 0;
    return products[idx] ?? null;
  };

  const foundCount = searchResults.filter((r) => !r.loading && r.products.length > 0).length;
  const totalDone = searchResults.filter((r) => !r.loading).length;

  return (
    <div className="safe-bottom px-4 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Ваш список покупок</h1>
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
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-semibold">Немає списку продуктів</p>
          <p className="text-sm mt-1">Створіть план — і ми згенеруємо список автоматично</p>
        </div>
      ) : (
        <>
          {/* Auchan CTA */}
          {unchecked.length > 0 && (
            <div className="mb-6">
              <button
                onClick={handleStartSearch}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]"
              >
                {zakazAuth.authorized ? (
                  <ShoppingBag className="w-5 h-5" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {zakazAuth.authorized
                  ? `Знайти в Auchan (${unchecked.length})`
                  : "Увійти в Auchan та знайти товари"}
              </button>
              {zakazAuth.authorized && (
                <p className="text-center text-[11px] text-muted-foreground mt-1.5">
                  ✓ Auchan · {zakazAuth.city === "kyiv" ? "Київ (Петрівка)" :
                    zakazAuth.city === "kyiv_north" ? "Київ (Північна)" :
                    zakazAuth.city === "dnipro" ? "Дніпро" :
                    zakazAuth.city === "kharkiv" ? "Харків" :
                    zakazAuth.city === "odesa" ? "Одеса" : "Львів"}
                  <button
                    onClick={() => setShowZakazAuth(true)}
                    className="ml-2 text-primary underline"
                  >
                    змінити
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Shopping list */}
          <div className="space-y-5 mb-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h3>
                <div className="glass-card divide-y divide-border/50">
                  {grouped[cat].map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
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
                      <div className="flex-1">
                        <p className={`text-sm font-medium transition-all ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.amount}</p>
                      </div>
                      <button onClick={() => removeShoppingItem(item.id)} className="text-muted-foreground hover:text-destructive p-1">
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

      {/* ── Zakaz Auth Sheet ────────────────────────────────────────────── */}
      <ZakazAuthSheet
        open={showZakazAuth}
        onClose={() => setShowZakazAuth(false)}
        onAuthorized={handleZakazAuthorized}
      />

      {/* ── Auchan Products Sheet ─────────────────────────────────────── */}
      <Sheet open={showAuchan} onOpenChange={setShowAuchan}>
        <SheetContent
          side="bottom"
          className="h-[92vh] rounded-t-3xl p-0 overflow-y-auto border-t-0 [&>button]:hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-base font-extrabold text-foreground">Товари в Auchan</h2>
              </div>
              <div className="flex items-center gap-2">
                {!searching && (
                  <button
                    onClick={() => runSearch(zakazAuth.city)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setShowAuchan(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            {searching ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Шукаємо {totalDone}/{searchResults.length}...
              </p>
            ) : totalDone > 0 ? (
              <p className="text-xs text-muted-foreground">
                Знайдено: <span className="text-primary font-bold">{foundCount}</span> з {totalDone} товарів
              </p>
            ) : null}
          </div>

          {/* Product results */}
          <div className="px-4 py-3 space-y-2 pb-12">
            {searchResults.map((result) => {
              const selected = getSelectedProduct(result.ingredient, result.products);
              return (
                <div key={result.ingredient} className="glass-card overflow-hidden">
                  {/* Ingredient name */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      {result.ingredient}
                    </p>
                    {result.loading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  </div>

                  {/* Best match */}
                  {!result.loading && selected && (
                    <button
                      onClick={() => handleOpenProduct(selected.url)}
                      className="w-full flex items-center gap-3 px-3 pb-3 text-left active:bg-white/5 transition-colors"
                    >
                      {selected.image ? (
                        <img
                          src={selected.image}
                          alt={selected.title}
                          className="w-14 h-14 rounded-xl object-contain bg-white flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                          <Search className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                          {selected.title}
                        </p>
                        {selected.price && (
                          <p className="text-sm font-extrabold text-primary mt-0.5">
                            {selected.price} ₴
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  )}

                  {/* Alternative products (horizontal scroll) */}
                  {!result.loading && result.products.length > 1 && (
                    <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
                      {result.products.map((p, idx) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProducts((prev) => ({ ...prev, [result.ingredient]: idx }))}
                          className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            (selectedProducts[result.ingredient] ?? 0) === idx
                              ? "ring-2 ring-primary bg-primary/10"
                              : "bg-secondary/50"
                          }`}
                          style={{ minWidth: 64 }}
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-10 h-10 object-contain rounded-lg bg-white"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-secondary" />
                          )}
                          <p className="text-[9px] text-muted-foreground text-center font-medium">
                            {p.price ? `${p.price} ₴` : "—"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Not found fallback */}
                  {!result.loading && result.products.length === 0 && (
                    <button
                      onClick={() =>
                        handleOpenProduct(
                          `https://auchan.zakaz.ua/uk/search/?q=${encodeURIComponent(result.ingredient)}`
                        )
                      }
                      className="w-full flex items-center gap-2 px-3 pb-3 text-xs text-muted-foreground"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Пошукати вручну
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ShoppingListPage;
