import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Car, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSection, isLoggedIn, loginTo } from "@/lib/authGate";
import { useLoginHero } from "@/hooks/useLoginHero";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [section, setSection] = useState<"auto" | "gym" | null>(null);
  const hero = useLoginHero();

  useEffect(() => {
    if (isLoggedIn()) navigate({ to: "/" });
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(u, p)) {
      navigate({ to: section === "gym" ? "/gym" : "/" });
    } else {
      setErr("Неверный логин или пароль");
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-background p-4"
      style={{
        backgroundImage: `url(${hero})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      {!section ? (
        <div className="relative z-10 grid w-full max-w-md grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSection("auto")}
            className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-background/90 p-6 shadow-2xl backdrop-blur-md transition hover:scale-[1.02]"
          >
            <Car className="h-10 w-10" />
            <span className="font-medium">Автосервис</span>
          </button>
          <button
            type="button"
            onClick={() => setSection("gym")}
            className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-background/90 p-6 shadow-2xl backdrop-blur-md transition hover:scale-[1.02]"
          >
            <Dumbbell className="h-10 w-10" />
            <span className="font-medium">Тренажёрный зал</span>
          </button>
        </div>
      ) : (
      <Card className="relative z-10 w-full max-w-sm border-white/10 bg-background/90 shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle>{section === "gym" ? "Samson Fit — вход" : "Samson Auto — вход"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="u">Логин</Label>
              <Input id="u" autoFocus value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <Label htmlFor="p">Пароль</Label>
              <Input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full">Войти</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setSection(null)}>
              Назад
            </Button>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
