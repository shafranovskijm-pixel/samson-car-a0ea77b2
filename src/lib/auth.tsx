import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const LOGIN = "самсон";
const PASSWORD = "самсон";
const KEY = "samson_crm_auth";

type AuthCtx = {
  isAuthed: boolean;
  openLogin: () => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthed(window.localStorage.getItem(KEY) === "1");
    }
  }, []);

  const openLogin = useCallback(() => {
    setError("");
    setLogin("");
    setPassword("");
    setOpen(true);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(KEY);
    setIsAuthed(false);
    navigate({ to: "/" });
  }, [navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = login.trim().toLowerCase();
    const p = password.trim().toLowerCase();
    if ((l === LOGIN || l === "samson") && (p === PASSWORD || p === "samson")) {
      window.localStorage.setItem(KEY, "1");
      setIsAuthed(true);
      setOpen(false);
      navigate({ to: "/calendar" });
    } else {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <Ctx.Provider value={{ isAuthed, openLogin, logout }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Вход в CRM Samson Auto</DialogTitle>
            <DialogDescription className="text-center">
              Введите логин и пароль для доступа к системе управления
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login">Логин</Label>
              <Input id="login" value={login} onChange={(e) => setLogin(e.target.value)} autoFocus autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pass">Пароль</Label>
              <Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-red-600 text-white hover:bg-red-700">
              Войти
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
