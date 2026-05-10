import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ShoppingBag, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";

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

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthorized: (storeId: string, chain: string) => void;
}

const ZakazAuthSheet = ({ open, onClose, onAuthorized }: Props) => {
  const { setZakazAuthorized, setZakazToken } = useAppStore();
  const [step, setStep]                   = useState<"city" | "store" | "login">("city");
  const [selectedCity, setSelectedCity]   = useState<City | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [phone, setPhone]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState("");

  const resetLoginForm = () => { setPhone(""); setPassword(""); setLoginError(""); setShowPassword(false); };

  const handleClose = () => { onClose(); setStep("city"); resetLoginForm(); };

  const handleCity = (city: City) => {
    setSelectedCity(city);
    setStep("store");
  };

  const handleStore = (store: Store) => {
    setSelectedStore(store);
    resetLoginForm();
    setStep("login");
  };

  const handleLoginSubmit = async () => {
    if (!selectedStore || !phone.trim() || !password) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res  = await fetch("/api/zakaz-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: selectedStore.chain, phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        setZakazAuthorized(selectedStore.id, selectedStore.chain, selectedStore.domain, selectedStore.label);
        setZakazToken(data.token);
        onAuthorized(selectedStore.id, selectedStore.chain);
        setStep("city");
        resetLoginForm();
      } else {
        setLoginError("Невірний номер телефону або пароль");
      }
    } catch {
      setLoginError("Помилка з'єднання — спробуйте ще раз");
    } finally {
      setLoginLoading(false);
    }
  };

  const title = step === "city" ? "Ваше місто" : step === "store" ? selectedCity?.label ?? "" : selectedStore?.label ?? "Вхід";

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
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step: login — phone + password form */}
          {step === "login" && selectedStore && (
            <div className="space-y-3">
              <button onClick={() => setStep("store")} className="text-xs text-primary mb-1 flex items-center gap-1">← назад</button>

              <p className="text-sm text-muted-foreground">
                Введіть дані від акаунту {selectedStore.domain}
              </p>

              {/* Phone */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <input
                  type="tel"
                  placeholder="Номер телефону (0XXXXXXXXX)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>

              {/* Password */}
              <div className="glass-card rounded-2xl overflow-hidden flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLoginSubmit()}
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={() => setShowPassword(v => !v)}
                  className="px-3 text-muted-foreground"
                  type="button"
                  aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {loginError && (
                <p className="text-xs text-destructive text-center">{loginError}</p>
              )}

              <button
                onClick={handleLoginSubmit}
                disabled={loginLoading || !phone.trim() || !password}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
              >
                {loginLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Входимо…</>
                  : "Увійти та підключити кошик"}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Немає акаунту?{" "}
                <a
                  href={`https://${selectedStore.domain}/uk/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Зареєструватись
                </a>
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ZakazAuthSheet;
