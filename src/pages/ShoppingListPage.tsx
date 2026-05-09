import { useAppStore } from "@/store/appStore";
import { ShoppingCart, Trash2, ExternalLink } from "lucide-react";

const retailers = [
  { name: "Сільпо", url: "https://shop.silpo.ua" },
  { name: "Auchan", url: "https://auchan.ua" },
  { name: "Zakaz.ua", url: "https://zakaz.ua" },
  { name: "Metro", url: "https://metro.zakaz.ua" },
];

const ShoppingListPage = () => {
  const { shoppingList, toggleShoppingItem, removeShoppingItem, setShoppingList } =
    useAppStore();

  const grouped = shoppingList.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof shoppingList>
  );

  const categories = Object.keys(grouped).sort();

  return (
    <div className="safe-bottom px-4 pt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Ваш список покупок</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {shoppingList.length} продуктів
          </p>
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
          <p className="text-sm mt-1">
            Створіть план — і ми згенеруємо список автоматично
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-5 mb-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {cat}
                </h3>
                <div className="glass-card divide-y divide-border/50">
                  {grouped[cat].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3"
                    >
                      <button
                        onClick={() => toggleShoppingItem(item.id)}
                        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          item.checked
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {item.checked && (
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium transition-all ${
                            item.checked
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.amount}
                        </p>
                      </div>
                      <button
                        onClick={() => removeShoppingItem(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">
              Замовити онлайн
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {retailers.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-3 flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:ring-2 hover:ring-primary transition-all"
                >
                  Відкрити в {r.name}
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingListPage;
