import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, ExternalLink, ShoppingBag, Loader2, Search, X, Minus, Plus, ShoppingCart, Check } from "lucide-react";

export interface ZakazProduct {
  id: string;
  title: string;
  price: string | null;
  image: string | null;
  unit: string;
  url: string;
}

export interface IngredientResult {
  ingredient: string;
  amount: string;
  products: ZakazProduct[];
  loading: boolean;
  loadingMore: boolean;
  selectedIdx: number;
  skipped: boolean;
  quantity: number;
  page: number;
  total: number;
}

interface Props {
  open: boolean;
  results: IngredientResult[];
  storeLabel: string;
  zakazToken: string | null;
  storeId: string;
  chain: string;
  onSelect: (ingredient: string, idx: number) => void;
  onSkip: (ingredient: string) => void;
  onSetQuantity: (ingredient: string, qty: number) => void;
  onLoadMore: (ingredient: string) => void;
  onAddToCart: (confirmed: IngredientResult[]) => void;
  onClose: () => void;
  searching: boolean;
}

const ZakazProductPicker = ({
  open, results, storeLabel, zakazToken, storeId, chain,
  onSelect, onSkip, onSetQuantity, onLoadMore, onAddToCart, onClose, searching,
}: Props) => {
  const done     = results.filter(r => !r.loading).length;
  const total    = results.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  // Local set of ingredients the user has chosen to add
  const [addedSet, setAddedSet]       = useState<Set<string>>(new Set());
  const [cartStatus, setCartStatus]   = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [cartSent, setCartSent]       = useState(false);

  const toggleAdded = (ingredient: string) =>
    setAddedSet(prev => {
      const next = new Set(prev);
      next.has(ingredient) ? next.delete(ingredient) : next.add(ingredient);
      return next;
    });

  const addedResults = results.filter(r => addedSet.has(r.ingredient) && r.products.length > 0);

  const cartDomain = `${chain}.zakaz.ua`;
  const cartUrl    = `https://${cartDomain}/uk/cart/`;

  const handleSendToCart = async () => {
    if (addedResults.length === 0) return;

    if (!zakazToken) {
      // No token → open each selected product page
      addedResults.forEach(r => {
        const p = r.products[r.selectedIdx];
        if (p?.url) window.open(p.url, "_blank", "noopener,noreferrer");
      });
      onAddToCart(addedResults);
      return;
    }

    setCartStatus("loading");
    const products = addedResults.map(r => ({
      ean: r.products[r.selectedIdx].id,
      quantity: r.quantity,
    }));

    try {
      const res = await fetch("/api/zakaz-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, chain, token: zakazToken, products }),
      });
      const data = await res.json();
      if (data.ok) {
        setCartStatus("ok");
        setCartSent(true);
        onAddToCart(addedResults);
      } else {
        console.error("zakaz-cart:", data);
        setCartStatus("err");
        setTimeout(() => setCartStatus("idle"), 3000);
      }
    } catch {
      setCartStatus("err");
      setTimeout(() => setCartStatus("idle"), 3000);
    }
  };

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) { onClose(); setAddedSet(new Set()); setCartSent(false); setCartStatus("idle"); } }}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 overflow-y-auto border-t-0 [&>button]:hidden"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-extrabold leading-tight">Знайдено в магазині</h2>
                <p className="text-[11px] text-muted-foreground">{storeLabel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {searching ? (
            <div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Шукаємо {done}/{total}
              </p>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Оберіть потрібний товар і натисніть{" "}
              <span className="text-primary font-bold">Додати</span>
            </p>
          )}
        </div>

        {/* Ingredient cards */}
        <div className="px-4 py-3 space-y-3 pb-36">
          {results.map(result => {
            const selected   = result.products[result.selectedIdx];
            const isAdded    = addedSet.has(result.ingredient);
            const isSkipped  = result.skipped;

            return (
              <div
                key={result.ingredient}
                className={`glass-card overflow-hidden transition-all ${isSkipped ? "opacity-40" : ""} ${isAdded ? "ring-2 ring-primary/60" : ""}`}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <div className="flex items-center gap-1.5">
                    {isAdded && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      {result.ingredient} · {result.amount}
                    </span>
                  </div>
                  {!result.loading && (
                    <button
                      onClick={() => onSkip(result.ingredient)}
                      className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-lg"
                    >
                      {isSkipped ? "повернути" : "пропустити"}
                    </button>
                  )}
                </div>

                {result.loading ? (
                  <div className="flex items-center justify-center h-28 pb-3">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : selected ? (
                  <div className="px-3 pb-3">
                    {/* Image row */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => onSelect(result.ingredient, result.selectedIdx - 1)}
                        disabled={result.selectedIdx === 0}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center disabled:opacity-20 flex-shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex-1 flex flex-col items-center">
                        {selected.image ? (
                          <img
                            src={`/api/zakaz-image?src=${encodeURIComponent(selected.image)}`}
                            alt={selected.title}
                            loading="lazy"
                            className="w-24 h-24 object-contain rounded-2xl bg-white"
                            onError={e => { if (e.target instanceof HTMLImageElement) e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center">
                            <Search className="w-7 h-7 text-muted-foreground" />
                          </div>
                        )}
                        {result.products.length > 1 && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {result.selectedIdx + 1} / {result.products.length}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => onSelect(result.ingredient, result.selectedIdx + 1)}
                        disabled={result.selectedIdx >= result.products.length - 1}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center disabled:opacity-20 flex-shrink-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title + price */}
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-0.5">
                      {selected.title}
                    </p>
                    {selected.price && (
                      <p className="text-base font-extrabold text-primary mb-2">{selected.price} ₴</p>
                    )}

                    {/* Quantity + Add button row */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center bg-secondary rounded-xl overflow-hidden">
                        <button
                          onClick={() => onSetQuantity(result.ingredient, Math.max(1, result.quantity - 1))}
                          className="w-9 h-9 flex items-center justify-center active:bg-primary/20"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold select-none">
                          {result.quantity}
                        </span>
                        <button
                          onClick={() => onSetQuantity(result.ingredient, result.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center active:bg-primary/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {selected.unit && (
                        <span className="text-xs text-muted-foreground">{selected.unit}</span>
                      )}

                      <button
                        onClick={() => toggleAdded(result.ingredient)}
                        disabled={isSkipped}
                        className={`ml-auto px-4 h-9 rounded-xl text-sm font-extrabold flex items-center gap-1.5 transition-all active:scale-[0.97] ${
                          isAdded
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {isAdded ? <><Check className="w-3.5 h-3.5" /> Додано</> : "Додати"}
                      </button>
                    </div>

                    {/* Load more */}
                    {result.products.length < result.total && (
                      <button
                        onClick={() => onLoadMore(result.ingredient)}
                        disabled={result.loadingMore}
                        className="w-full text-xs text-primary font-semibold py-2 rounded-xl bg-primary/10 active:bg-primary/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {result.loadingMore
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Завантаження…</>
                          : `Ще варіанти · ${result.total - result.products.length} більше`}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="px-3 pb-3 text-sm text-muted-foreground italic">не знайдено</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        {!searching && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/30 p-4 space-y-2">
            {cartSent ? (
              /* After successful cart send */
              <button
                onClick={() => window.open(cartUrl, "_blank", "noopener,noreferrer")}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]"
              >
                <ExternalLink className="w-5 h-5" />
                Перейти до кошика в {storeLabel}
              </button>
            ) : addedSet.size > 0 ? (
              /* Items selected, ready to send */
              <button
                onClick={handleSendToCart}
                disabled={cartStatus === "loading"}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)] disabled:opacity-70"
              >
                {cartStatus === "loading" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Додаємо до кошика…</>
                ) : cartStatus === "err" ? (
                  <><ShoppingCart className="w-5 h-5" /> Помилка — спробуйте знову</>
                ) : zakazToken ? (
                  <><ShoppingCart className="w-5 h-5" /> Додати до кошика · {addedSet.size} товарів</>
                ) : (
                  <><ExternalLink className="w-5 h-5" /> Відкрити вибрані · {addedSet.size} товарів</>
                )}
              </button>
            ) : (
              /* Nothing selected yet */
              <p className="text-center text-sm text-muted-foreground py-2">
                Натисніть <span className="text-primary font-semibold">Додати</span> на потрібних товарах
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ZakazProductPicker;
