// ─────────────────────────────────────────────────────────────────────────────
// LifeSync — Auth Page
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from "react";
import { authService } from "../services/dataService";
import { seedDemoData } from "../services/seedService";
import { useAppStore } from "../store/appStore";
import { Button, Input, ErrorBanner, SunIcon } from "../components/ui";

type Mode = "login" | "register";

export function AuthPage() {
  const setUser = useAppStore((s) => s.setUser);
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError("Informe seu nome.");
          return;
        }
        if (!email.includes("@")) {
          setError("E-mail inválido.");
          return;
        }
        if (password.length < 6) {
          setError("Senha mínima: 6 caracteres.");
          return;
        }

        const { data: user, error: err } = await authService.register(
          name.trim(),
          email.toLowerCase(),
          password,
        );
        if (err || !user) {
          setError(err ?? "Erro ao criar conta.");
          return;
        }

        // Seed demo data for new users
        await seedDemoData(user.id);
        authService.saveSession(user);
        setUser(user);
      } else {
        if (!email || !password) {
          setError("Preencha todos os campos.");
          return;
        }

        const { data: user, error: err } = await authService.login(
          email,
          password,
        );
        if (err || !user) {
          setError(err ?? "Credenciais inválidas.");
          return;
        }

        authService.saveSession(user);
        setUser(user);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200">
            <SunIcon />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            LifeSync
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 p-8">
          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Nome
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  autoFocus
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                E-mail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                autoFocus={mode === "login"}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <ErrorBanner message={error} />}

            <Button type="submit" loading={loading} className="w-full mt-2">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            {mode === "login" ? "Não tens conta? " : "Já tens conta? "}
            <button
              type="button"
              className="text-indigo-600 font-semibold hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Criar conta grátis" : "Entrar"}
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Cria uma conta nova para ver dados de demonstração 👆
        </p>
      </div>
    </div>
  );
}
