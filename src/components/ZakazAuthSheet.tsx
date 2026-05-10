import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Check, ExternalLink, ShoppingBag, LogIn, ChevronRight } from "lucide-react";

interface Store { id: string; chain: string; label: string; domain: string; }
interface City  { city: string; label: string; stores: Store[]; }

const STORES_DATA: City[] = [
  { city: "kyiv", label: "Київ", stores: [
    { id: "48246401", chain: "auchan",     label: "Auchan Київ",     domain: "auchan.zakaz.ua"     },
    { id: "48215611", chain: "metro",      label: "Metro Київ",      domain: "metro.zakaz.ua"      },
    { id: "48201029", chain: "novus",      label: "Novus Київ",      domain: "novus.zakaz.ua"      },
    { id: "48267601", chain: "megamarket", label: "МегаМаркет Київ", domain: "megamarket.zakaz.ua" },
  ]},
  { city: "lviv", label: "Львів", stores: [
    { id: "48246409", chain: "auchan",     label: "Auchan Львів",    domain: "auchan.zakaz.ua"     },
    { id: "48215637", chain: "metro",      label: "Metro Львів",     domain: "metro.zakaz.ua"      },
  ]},
  { city: "dnipro", label: "Дніпро", stores: [
    { id: "48246429", chain: "auchan",     label: "Auchan Дніпро",   domain: "auchan.zakaz.ua"     },
    { id: "48215614", chain: "metro",      label: "Metro Дніпро",    domain: "metro.zakaz.ua"      },
  ]},
  { city: "kharkiv", label: "Харків", stores: [
    { id: "48215613", chain: "metro",      label: "Metro Харків",    domain: "metro.zakaz.ua"      },
  ]},
  { city: "odesa", label: "Одеса", stores: [
    { id: "48246416", chain: "auchan",     label: "Auchan Одеса",    domain: "auchan.zakaz.ua"     },
    { id: "48215612", chain: "metro",      label: "Metro Одеса",     domain: "metro.zakaz.ua"      },
  ]},
];

const CHAIN_EMOJI: Record<string, string> = {
  auchan: "🛒", metro: "🏪", novus: "🌿", megamarket: "🏬",
};

export function openInBrowser(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  window.open(`${url}${sep}_t=${Date.now()}`, "_blank", "noopener,noreferrer");
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthorized: () => void;
}

const ZakazAuthSheet = ({ open, onClose, onAuthorized }: Props) => {
  const { zakazAuth, setZakazAuthorized } = useAppStore();
  const [step, setStep]                   = useState<"city" | "store" | "login">("city");
  const [selectedCity, setSelectedCity]   = useState<City | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const handleClose = () => { onClose(); setStep("city"); };

  const handleCity = (city: City) => {
    setSelectedCity(city);
    setStep("store");
  };

  const handleStore = (store: Store) => {
    setSelectedStore(store);
    setStep("login");
    openInBrowser(`https://${store.domain}/uk/`);
  };

  const handleConfirm = () => {
    if (!selectedStore) return;
    setZakazAuthorized(selectedStore.id, selectedStore.chain, selectedStore.domain, selectedStore.label);
    onAuthorized();
    setStep("city");
  };

  const title = step === "city" ? "Ваше місто" : step === "store" ? selectedCity?.label ?? "" : "Увійдіть";

  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 border-t-0 [&>button]:hidden" style={{ maxHeight: "80vh" }}>
        <div className="px-5 pt-5 pb-8 overflow-y-auto" style={{ maxHeight: "80vh" }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground">zakaz.ua</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">✕</button>
          </div>

          {/* Step: city */}
          {step === "city" && (
            <div className="space-y-2">
              {STORES_DATA.map(city => (
                <button key={city.city} onClick={() => handleCity(city)}
                  className="w-full flex items-center justify-between p-4 glass-card rounded-2xl active:opacity-70">
                  <span className="font-semibold text-foreground">{city.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{city.stores.length} магазини</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step: store */}
          {step === "store" && selectedCity && (
            <>
              <button onClick={() => setStep("city")} className="text-xs text-primary mb-4 flex items-center gap-1">← назад</button>
              <div className="space-y-2">
                {selectedCity.stores.map(store => (
                  <button key={store.id} onClick={() => handleStore(store)}
                    className="w-full flex items-center gap-3 p-4 glass-card rounded-2xl active:opacity-70">
                    <span className="text-2xl">{CHAIN_EMOJI[store.chain] ?? "🏪"}</span>
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

          {/* Step: login */}
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
              <button onClick={handleConfirm}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 mb-3 active:scale-[0.98]">
                <Check className="w-5 h-5" /> Я увійшов — продовжити
              </button>
              <button onClick={() => openInBrowser(`https://${selectedStore.domain}/uk/`)}
                className="w-full text-muted-foreground text-sm py-2.5 flex items-center justify-center gap-1.5">
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
