import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { User, Target, AlertTriangle, Bell, Search, X, ThumbsDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const goals = [
  { id: "lose" as const, label: "Схуднення", emoji: "🔥", cal: 1600 },
  { id: "maintain" as const, label: "Підтримка", emoji: "⚖️", cal: 2000 },
  { id: "gain" as const, label: "Набір маси", emoji: "💪", cal: 2500 },
];

const allergenGroups = [
  {
    emoji: "🥛",
    label: "Молочні продукти",
    items: ["молоко", "сир", "йогурт", "вершки"],
  },
  { emoji: "🥚", label: "Яйця", items: ["яйця"] },
  {
    emoji: "🌾",
    label: "Глютен",
    items: ["пшениця", "жито", "ячмінь"],
  },
  {
    emoji: "🥜",
    label: "Горіхи",
    items: ["мигдаль", "фундук", "кеш'ю"],
  },
  { emoji: "🥜", label: "Арахіс", items: ["арахіс"] },
  { emoji: "🐟", label: "Риба", items: ["риба"] },
  { emoji: "🦐", label: "Морепродукти", items: ["морепродукти"] },
  { emoji: "🌱", label: "Соя", items: ["соя"] },
  { emoji: "🌻", label: "Кунжут", items: ["кунжут"] },
];

const popularDislikes = ["цибуля", "гриби", "броколі", "печінка", "оливки"];

const ProfilePage = () => {
  const { profile, updateProfile } = useAppStore();
  const [dislikeSearch, setDislikeSearch] = useState("");
  const [dislikeInput, setDislikeInput] = useState("");

  const dislikedIngredients = profile.dislikedIngredients ?? [];
  const notifications = profile.notifications ?? { cooking: true, streaks: true, newRecipes: true };

  const toggleAllergen = (item: string) => {
    const allergies = profile.allergies ?? [];
    const has = allergies.includes(item);
    updateProfile({
      allergies: has
        ? allergies.filter((a) => a !== item)
        : [...allergies, item],
    });
  };

  const toggleDislike = (item: string) => {
    const lower = item.toLowerCase().trim();
    if (!lower) return;
    const has = dislikedIngredients.includes(lower);
    updateProfile({
      dislikedIngredients: has
        ? dislikedIngredients.filter((d) => d !== lower)
        : [...dislikedIngredients, lower],
    });
  };

  const addCustomDislike = () => {
    const val = dislikeInput.toLowerCase().trim();
    if (val && !dislikedIngredients.includes(val)) {
      updateProfile({
        dislikedIngredients: [...dislikedIngredients, val],
      });
      setDislikeInput("");
    }
  };

  const toggleNotification = (key: "cooking" | "streaks" | "newRecipes") => {
    updateProfile({
      notifications: { ...notifications, [key]: !notifications[key] },
    });
  };

  const handleSave = () => {
    toast.success("Збережено ✅");
  };

  return (
    <div className="safe-bottom px-4 pt-12 pb-28">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-foreground">Профіль</h1>
        </div>
      </div>

      {/* Profile info */}
      <div className="glass-card p-4 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3">Особисті дані</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Ім'я</label>
            <input
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="Ваше ім'я"
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Email</label>
            <input
              value={profile.email}
              onChange={(e) => updateProfile({ email: e.target.value })}
              placeholder="Введіть email"
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
            />
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Налаштуйте під себе</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Ваша ціль:</p>
        <div className="grid grid-cols-3 gap-3">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => updateProfile({ goal: g.id, dailyCalories: g.cal })}
              className={`p-3 rounded-xl text-center transition-all ${
                profile.goal === g.id
                  ? "bg-primary/15 ring-2 ring-primary"
                  : "bg-secondary"
              }`}
            >
              <span className="text-xl">{g.emoji}</span>
              <p className="text-xs font-semibold text-foreground mt-1">{g.label}</p>
              <p className="text-[10px] text-muted-foreground">{g.cal} ккал</p>
            </button>
          ))}
        </div>
      </div>

      {/* Daily calories */}
      <div className="glass-card p-4 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3">Денна норма калорій</h2>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1200}
            max={3500}
            step={50}
            value={profile.dailyCalories}
            onChange={(e) => updateProfile({ dailyCalories: Number(e.target.value) })}
            className="flex-1 accent-primary"
            style={{ accentColor: "hsl(142, 60%, 45%)" }}
          />
          <span className="text-lg font-extrabold text-primary w-20 text-right">
            {profile.dailyCalories}
          </span>
        </div>
      </div>

      {/* Allergens - grouped */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-bold text-foreground">Обмеження та алергії</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Оберіть продукти, які ви не вживаєте або на які маєте алергію
        </p>
        <div className="space-y-4">
          {allergenGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {group.emoji} {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleAllergen(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                      (profile.allergies ?? []).includes(item)
                        ? "bg-warning/20 text-warning ring-1 ring-warning/50"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disliked ingredients */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ThumbsDown className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-bold text-foreground">Не люблю</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Виключіть інгредієнти, які вам не подобаються
        </p>

        {/* Search / add */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={dislikeInput}
            onChange={(e) => setDislikeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomDislike()}
            placeholder="Введіть інгредієнт"
            className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Popular suggestions */}
        <p className="text-xs text-muted-foreground mb-2">Популярні:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {popularDislikes.map((item) => (
            <button
              key={item}
              onClick={() => toggleDislike(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                dislikedIngredients.includes(item)
                  ? "bg-destructive/20 text-destructive ring-1 ring-destructive/50"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Selected dislikes */}
        {dislikedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {dislikedIngredients.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-destructive/20 text-destructive"
              >
                {item}
                <button onClick={() => toggleDislike(item)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-info" />
          <h2 className="text-sm font-bold text-foreground">Сповіщення</h2>
        </div>
        <div className="space-y-4">
          {([
            { key: "cooking" as const, label: "🍳 Нагадування готувати" },
            { key: "streaks" as const, label: "🔥 Досягнення / streaks" },
            { key: "newRecipes" as const, label: "🍽 Нові рецепти" },
          ]).map((n) => (
            <div key={n.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{n.label}</span>
              <Switch
                checked={notifications[n.key]}
                onCheckedChange={() => toggleNotification(n.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Subscription */}
      <div className="glass-card p-4 overflow-hidden relative mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <h2 className="text-lg font-bold text-foreground mb-1">Спробуйте безкоштовно 7 днів</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Складай меню, економ час і харчуйся збалансовано
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 ring-2 ring-primary">
            <div>
              <p className="text-sm font-bold text-foreground">1 місяць</p>
              <p className="text-xs text-muted-foreground">~$0.20/день</p>
            </div>
            <p className="text-lg font-extrabold text-primary">$5.99/міс</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary">
            <div>
              <p className="text-sm font-bold text-foreground">3 місяці</p>
              <p className="text-xs text-muted-foreground">Вигідніше</p>
            </div>
            <p className="text-lg font-extrabold text-foreground">$13.99</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary">
            <div>
              <p className="text-sm font-bold text-foreground">12 місяців</p>
              <p className="text-xs text-muted-foreground">Найкраща ціна</p>
            </div>
            <p className="text-lg font-extrabold text-foreground">$35.99</p>
          </div>
        </div>
        <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl text-sm">
          Почати безкоштовний період
        </button>
        <button className="w-full text-muted-foreground text-xs font-medium py-3 mt-1">
          Нагадати пізніше
        </button>
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg"
          >
            Зберегти налаштування
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
