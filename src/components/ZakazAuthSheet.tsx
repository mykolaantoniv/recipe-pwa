import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ExternalLink, Check, ShoppingBag, ChevronDown, LogIn } from "lucide-react";

const CITIES = [
  { value: "kyiv",       label: "Київ (Петрівка)" },
  { value: "kyiv_north", label: "Київ (Північна)" },
  { value: "dnipro",     label: "Дніпро" },
  { value: "kharkiv",    label: "Харків" },
  { value: "odesa",      label: "Одеса" },
  { value: "lviv",       label: "Львів" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthorized: () => void;
}

// Force open in browser — prevents native app interception
// Appending ?_t= breaks Universal Links cache on iOS
export function openInBrowser(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  const target = `${url}${sep}_t=${Date.now()}`;
  window.open(target, "_blank", "noopener,noreferrer");
}

const ZakazAuthSheet = ({ open, onClose, onAuthorized }: Props) => {
  const { zakazAuth, setZakazAuthorized, setZakazCity } = useAppStore();
  const [step, setStep] = useState<"intro" | "login" | "confirm">("intro");
  const [city, setLocalCity] = useState(zakazAuth.city);

  const handleOpenLogin = () => {
    setStep("login");
    openInBrowser("https://auchan.zakaz.ua/uk/login/");
  };

  const handleConfirm = () => {
    setZakazAuthorized(city);
    setZakazCity(city);
    onAuthorized();
    setStep("intro");
  };

  const handleCityChange = (val: string) => {
    setLocalCity(val);
    setZakazCity(val);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setStep("intro"); } }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 border-t-0 [&>button]:hidden"
        style={{ maxHeight: "70vh" }}
      >
        <div className="px-5 pt-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/25">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">Вхід в Auchan</h2>
                <p className="text-xs text-muted-foreground">auchan.zakaz.ua</p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); setStep("intro"); }}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
            >
              ✕
            </button>
          </div>

          {/* City selector */}
          <div className="glass-card p-4 mb-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">Ваше місто</p>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full appearance-none bg-secondary text-foreground text-sm font-semibold pl-4 pr-8 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {CITIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {step === "intro" && (
            <>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Щоб відкривати товари на auchan.zakaz.ua, потрібно бути авторизованим — інакше кошик не збережеться.
              </p>

              <button
                onClick={handleOpenLogin}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-3"
              >
                <LogIn className="w-5 h-5" />
                Відкрити auchan.zakaz.ua та увійти
                <ExternalLink className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => setStep("confirm")}
                className="w-full text-muted-foreground font-semibold py-3 text-sm"
              >
                Я вже авторизований →
              </button>
            </>
          )}

          {step === "login" && (
            <>
              <div className="glass-card p-4 mb-5">
                <p className="text-xs font-bold text-primary mb-1">auchan.zakaz.ua відкрито в браузері</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  1. Увійдіть в акаунт<br />
                  2. Поверніться сюди<br />
                  3. Натисніть «Я увійшов»
                </p>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-3"
              >
                <Check className="w-5 h-5" />
                Я увійшов — продовжити
              </button>

              <button
                onClick={handleOpenLogin}
                className="w-full text-muted-foreground font-semibold py-3 text-sm flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Відкрити знову
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Ми запам'ятаємо що ви авторизовані в Auchan — більше не питатимемо.
              </p>
              <button
                onClick={handleConfirm}
                className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Check className="w-5 h-5" />
                Підтвердити
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ZakazAuthSheet;
