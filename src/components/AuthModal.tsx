import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { X, Eye, EyeOff } from "lucide-react";

const AuthModal = () => {
  const { auth, signUp, setShowAuthModal } = useAppStore();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!auth.showAuthModal) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "signup" && !name.trim()) e.name = "Введіть ваше ім'я";
    if (!email.trim()) e.email = "Введіть email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Невірний формат email";
    if (!password.trim()) e.password = "Введіть пароль";
    else if (password.length < 6) e.password = "Мінімум 6 символів";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    signUp(name.trim(), email.trim());
  };

  const handleGoogleSignUp = () => {
    signUp("Користувач", "google@user.com");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setShowAuthModal(false)}
      />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6 mt-2">
          <p className="text-3xl mb-3">🍽</p>
          <h2 className="text-xl font-extrabold text-foreground">
            Готуйте смачно без зайвих зусиль
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Ми робимо здорове харчування простим для людей, у яких немає часу на планування
          </p>
        </div>

        <div className="space-y-3 mb-4">
          {mode === "signup" && (
            <div>
              <input
                type="text"
                placeholder="Ваше ім'я"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1 ml-1">{errors.name}</p>
              )}
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="Введіть email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1 ml-1">{errors.email}</p>
            )}
          </div>
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Створіть пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3.5 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1 ml-1">{errors.password}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform mb-3"
        >
          {mode === "signup" ? "Зареєструватися" : "Увійти"}
        </button>

        <button
          onClick={handleGoogleSignUp}
          className="w-full bg-secondary text-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Увійти через Google
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>
              Вже маєте акаунт?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-primary font-semibold"
              >
                Увійти
              </button>
            </>
          ) : (
            <>
              Немає акаунту?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-primary font-semibold"
              >
                Зареєструватися
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
