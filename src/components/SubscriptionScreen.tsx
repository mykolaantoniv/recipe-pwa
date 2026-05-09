import { useState } from "react";
import { useAppStore, type SubscriptionPlan } from "@/store/appStore";
import { X, Check, Crown } from "lucide-react";

const plans: {
  id: SubscriptionPlan;
  label: string;
  price: string;
  perDay: string;
  badge?: string;
  popular?: boolean;
  monthlyPrice: number;
}[] = [
  {
    id: "monthly",
    label: "1 місяць",
    price: "5.99$ / міс",
    perDay: "~0.20$ / день",
    badge: "Гнучкий вибір",
    monthlyPrice: 5.99,
  },
  {
    id: "quarterly",
    label: "3 місяці",
    price: "14.99$ / 3 міс",
    perDay: "~0.17$ / день",
    badge: "Вигідніше",
    monthlyPrice: 5.0,
  },
  {
    id: "yearly",
    label: "12 місяців",
    price: "47.99$ / рік",
    perDay: "~0.13$ / день",
    badge: "Найкраща ціна",
    popular: true,
    monthlyPrice: 4.0,
  },
];

const features = [
  "Необмежене збереження рецептів",
  "Планування харчування",
  "Автоматичний список покупок",
  "Персоналізовані рекомендації",
];

const SubscriptionScreen = () => {
  const { auth, startTrial, dismissPaywall } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("yearly");

  const handleStartTrial = () => {
    const pending = auth.pendingAction;
    startTrial(selectedPlan);
    if (pending) {
      setTimeout(() => pending(), 100);
    }
  };

  if (!auth.showSubscription) return null;

  const isExpired = auth.subscriptionStatus === "expired";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => dismissPaywall()}
      />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => dismissPaywall()}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6 mt-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">
            {isExpired ? "Відновіть доступ до всіх функцій" : "Спробуйте безкоштовно 7 днів"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Складай меню, економ час і харчуйся збалансовано
          </p>
        </div>

        {/* Features */}
        <div className="glass-card p-4 mb-6 space-y-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full glass-card p-4 flex items-center justify-between transition-all relative overflow-hidden ${
                selectedPlan === plan.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                  Найпопулярніший
                </div>
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedPlan === plan.id
                      ? "bg-primary border-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selectedPlan === plan.id && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {plan.label}
                    </p>
                    {plan.badge && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.perDay}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground">{plan.price}</p>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleStartTrial}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform mb-3"
        >
          {isExpired ? "Відновити підписку" : "Почати безкоштовний період"}
        </button>

        <button
          onClick={() => dismissPaywall()}
          className="w-full text-muted-foreground font-semibold py-3 text-sm"
        >
          Нагадати пізніше
        </button>

        <div className="text-center space-y-1 mt-2">
          <p className="text-[11px] text-muted-foreground">
            7 днів безкоштовно, потім автоматичне продовження
          </p>
          <p className="text-[11px] text-muted-foreground">
            Скасувати можна в будь-який момент
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionScreen;
