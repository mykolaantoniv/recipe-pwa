import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Check, ChevronRight, ExternalLink, ShoppingBag, Loader2, Search, X } from "lucide-react";
import { openInBrowser } from "@/components/ZakazAuthSheet";

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
  selectedIdx: number;
  skipped: boolean;
}

interface Props {
  open: boolean;
  results: IngredientResult[];
  onSelect: (ingredient: string, idx: number) => void;
  onSkip: (ingredient: string) => void;
  onAddToCart: (confirmed: IngredientResult[]) => void;
  onClose: () => void;
  searching: boolean;
}

const ZakazProductPicker = ({
  open, results, onSelect, onSkip, onAddToCart, onClose, searching
}: Props) => {
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const [cartStep, setCartStep] = useState(false);
  const [cartIdx, setCartIdx] = useState(0);

  const confirmed = results.filter(r => !r.loading && !r.skipped && r.products.length > 0);
  const done = results.filter(r => !r.loading).length;
  const total = results.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  const pickingResult = results.find(r => r.ingredient === pickingFor);

  // ── Cart flow ──────────────────────────────────────────────────────────
  const handleStartCart = () => {
    setCartStep(true);
    setCartIdx(0);
    if (confirmed.length > 0) {
      const item = confirmed[0];
      openInBrowser(item.products[item.selectedIdx]?.url || '');
    }
  };

  const handleNextCart = () => {
    const next = cartIdx + 1;
    if (next < confirmed.length) {
      setCartIdx(next);
      const item = confirmed[next];
      openInBrowser(item.products[item.selectedIdx]?.url || '');
    } else {
      setCartStep(false);
      onAddToCart(confirmed);
      onClose();
    }
  };

  return (
    <>
      {/* ── Main picker sheet ───────────────────────── */}
      <Sheet open={open && !cartStep} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 overflow-y-auto border-t-0 [&>button]:hidden">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-base font-extrabold">Товари в Auchan</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            {searching && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Шукаємо {done}/{total}
                  </span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {!searching && (
              <p className="text-xs text-muted-foreground mb-2">
                Знайдено <span className="text-primary font-bold">{confirmed.length}</span> з {total} · Оберіть правильний варіант
              </p>
            )}
          </div>

          {/* Ingredient list */}
          <div className="px-4 py-3 space-y-2 pb-32">
            {results.map((result) => {
              const selected = result.products[result.selectedIdx];
              return (
                <div
                  key={result.ingredient}
                  className={`glass-card overflow-hidden transition-all ${result.skipped ? 'opacity-40' : ''}`}
                >
                  {/* Row */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Status indicator */}
                    {result.loading ? (
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : selected ? (
                      <img
                        src={selected.image || ''}
                        alt={selected.title}
                        className="w-10 h-10 rounded-lg object-contain bg-white flex-shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{result.ingredient} · {result.amount}</p>
                      {selected ? (
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                          {selected.title}
                        </p>
                      ) : !result.loading ? (
                        <p className="text-sm text-muted-foreground italic">не знайдено</p>
                      ) : null}
                      {selected?.price && (
                        <p className="text-xs font-bold text-primary">{selected.price} ₴</p>
                      )}
                    </div>

                    {/* Action */}
                    {!result.loading && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {result.products.length > 1 && (
                          <button
                            onClick={() => setPickingFor(result.ingredient)}
                            className="text-[11px] text-primary font-semibold bg-primary/10 px-2.5 py-1.5 rounded-lg"
                          >
                            варіанти
                          </button>
                        )}
                        {!result.skipped && selected && (
                          <button
                            onClick={() => onSkip(result.ingredient)}
                            className="text-[11px] text-muted-foreground bg-secondary px-2 py-1.5 rounded-lg"
                          >
                            пропустити
                          </button>
                        )}
                        {result.skipped && (
                          <button
                            onClick={() => onSkip(result.ingredient)}
                            className="text-[11px] text-primary bg-primary/10 px-2 py-1.5 rounded-lg"
                          >
                            повернути
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add to cart CTA */}
          {!searching && confirmed.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/30 p-4 safe-area-pb">
              <button
                onClick={handleStartCart}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]"
              >
                <ShoppingBag className="w-5 h-5" />
                Додати в кошик — {confirmed.length} товарів
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Product variants picker ───────────────────── */}
      <Sheet open={!!pickingFor} onOpenChange={(o) => !o && setPickingFor(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 border-t-0 [&>button]:hidden" style={{ maxHeight: '80vh' }}>
          <div className="px-4 pt-4 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base">{pickingFor}</h3>
              <button onClick={() => setPickingFor(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {pickingResult?.products.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(pickingResult.ingredient, idx);
                    setPickingFor(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    pickingResult.selectedIdx === idx
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/30'
                  }`}
                >
                  {p.image && (
                    <img src={p.image} alt={p.title} className="w-14 h-14 rounded-xl object-contain bg-white flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground leading-snug">{p.title}</p>
                    {p.price && <p className="text-sm font-extrabold text-primary mt-0.5">{p.price} ₴</p>}
                    {p.unit && <p className="text-xs text-muted-foreground">{p.unit}</p>}
                  </div>
                  {pickingResult.selectedIdx === idx && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Cart step-by-step sheet ───────────────────── */}
      <Sheet open={cartStep} onOpenChange={(o) => !o && setCartStep(false)}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 border-t-0 [&>button]:hidden" style={{ maxHeight: '60vh' }}>
          <div className="px-5 pt-5 pb-8">
            {/* Progress */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">
                Товар {cartIdx + 1} з {confirmed.length}
              </span>
              <span className="text-xs font-bold text-primary">
                {Math.round(((cartIdx + 1) / confirmed.length) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((cartIdx + 1) / confirmed.length) * 100}%` }}
              />
            </div>

            {/* Current product */}
            {confirmed[cartIdx] && (() => {
              const item = confirmed[cartIdx];
              const p = item.products[item.selectedIdx];
              return (
                <>
                  <div className="flex items-center gap-4 glass-card p-4 mb-5">
                    {p?.image && (
                      <img src={p.image} alt={p.title} className="w-16 h-16 rounded-xl object-contain bg-white flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{item.ingredient}</p>
                      <p className="text-sm font-bold text-foreground leading-snug">{p?.title}</p>
                      {p?.price && <p className="text-base font-extrabold text-primary mt-0.5">{p.price} ₴</p>}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center mb-5 leading-relaxed">
                    Сторінка товару відкрита в браузері.<br />
                    Натисніть <strong className="text-foreground">"В кошик"</strong> і поверніться сюди.
                  </p>

                  <button
                    onClick={handleNextCart}
                    className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <Check className="w-5 h-5" />
                    {cartIdx + 1 < confirmed.length
                      ? `Додав — наступний (${cartIdx + 2} з ${confirmed.length})`
                      : 'Готово — завершити'}
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openInBrowser(p?.url || '')}
                    className="w-full mt-2 text-sm text-muted-foreground py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Відкрити знову
                  </button>
                </>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ZakazProductPicker;
