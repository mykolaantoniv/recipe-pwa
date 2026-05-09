import { useState, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Check, ExternalLink, ShoppingBag, LogIn, ChevronRight, Loader2 } from "lucide-react";

interface Store { id: string; chain: string; label: string; domain: string; }
interface City  { city: string; label: string; stores: Store[]; }

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthorized: () => void;
}

export function openInBrowser(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  window.open(`${url}${sep}_t=${Date.now()}`, "_blank", "noopener,noreferrer");
}

const ZakazAuthSheet = ({ open, onClose, onAuthorized }: Props) => {
  const { zakazAuth, setZakazAuthorized } = useAppStore();
  const [step, setStep] = useState<"city" | "store" | "login" | "confirm">("city");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/zakaz-stores")
      .then(r => r.json())
      .then(d => { setCities(d.cities || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setStep("store");
  };

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setStep("login");
    openInBrowser(`https://${store.domain}/uk/login/`);
  };

  const handleConfirm = () => {
    if (!selectedStore) return;
    setZakazAuthorized(selectedStore.id, selectedStore.chain, selectedStore.domain, selectedStore.label);
    onAuthorized();
    setStep("city");
  };

  const handleClose = () => {
    onClose();
    setStep("city");
  };

  const CHAIN_EMOJI: Record<string, string> = {
    auchan: '🛒', metro: '🏪', novus: '🌿', megamarket: '🏬', varus: '🛍️', ekomarket: '🌱', ultramarket: '⚡',
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 border-t-0 [&>button]:hidden" style={{ maxHeight: '80vh' }}>
        <div className="px-5 pt-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/25">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">
                  {step === "city"    ? "Ваше місто"         :
                   step === "store"   ? selectedCity?.label  :
                   step === "login"   ? "Увійдіть в магазин" :
                                        "Підтвердження"}
                </h2>
                <p className="text-xs text-muted-foreground">zakaz.ua</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">✕</button>
          </div>

          {/* ── Step: city ── */}
          {step === "city" && (
            loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {cities.map(city => (
                  <button
                    key={city.city}
                    onClick={() => handleSelectCity(city)}
                    className="w-full flex items-center justify-between p-4 glass-card rounded-2xl active:bg-white/5"
                  >
                    <span className="font-semibold text-foreground">{city.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{city.stores.length} магазини</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {/* ── Step: store ── */}
          {step === "store" && selectedCity && (
            <>
              <button onClick={() => setStep("city")} className="text-xs text-primary mb-4 flex items-center gap-1">
                ← назад
              </button>
              <div className="space-y-2">
                {selectedCity.stores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => handleSelectStore(store)}
                    className="w-full flex items-center gap-3 p-4 glass-card rounded-2xl active:bg-white/5"
                  >
                    <span className="text-2xl">{CHAIN_EMOJI[store.chain] || '🏪'}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">{store.label}</p>
                      <p className="text-xs text-muted-foreground">{store.domain}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                      Увійти <ExternalLink className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step: login ── */}
          {step === "login" && selectedStore && (
            <>
              <div className="glass-card p-4 mb-5">
                <p className="text-xs font-bold text-primary mb-1">{selectedStore.domain} відкрито в браузері</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  1. Увійдіть в акаунт<br />
                  2. Поверніться сюди<br />
                  3. Натисніть «Я увійшов»
                </p>
              </div>
              <button
                onClick={handleConfirm}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 mb-3"
              >
                <Check className="w-5 h-5" /> Я увійшов — продовжити
              </button>
              <button
                onClick={() => openInBrowser(`https://${selectedStore.domain}/uk/login/`)}
                className="w-full text-muted-foreground font-semibold py-2.5 text-sm flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Відкрити знову
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ZakazAuthSheet;
