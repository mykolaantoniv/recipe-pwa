import { NavLink, useLocation } from "react-router-dom";
import { Flame, CalendarDays, UtensilsCrossed, ShoppingCart, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Flame, label: "Готувати", end: true },
  { to: "/planner", icon: CalendarDays, label: "Планування" },
  { to: "/my-meals", icon: UtensilsCrossed, label: "Мої страви" },
  { to: "/shopping", icon: ShoppingCart, label: "Покупки" },
  { to: "/profile", icon: User, label: "Профіль" },
];

const BottomNav = () => {
  const location = useLocation();

  // Hide on recipe detail pages
  if (location.pathname.startsWith("/recipe/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around h-[var(--nav-height)] max-w-lg mx-auto px-2">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
