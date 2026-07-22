import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isLoggedIn, login } from "@/lib/authGate";
import { Download } from "lucide-react";
import winDownload from "@/assets/downloads/SamsonCRM-windows.zip.asset.json";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn()) navigate({ to: "/" });
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(u, p)) {
      navigate({ to: "/" });
    } else {
      setErr("Неверный логин или пароль");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Samson Auto — вход</CardTitle>
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
          </form>
        </CardContent>
      </Card>

      <a
        href={winDownload.url}
        download="SamsonCRM-windows.zip"
        className="mt-4 flex w-full max-w-sm items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm transition hover:bg-accent"
      >
        <Download className="h-4 w-4" />
        <div className="text-left">
          <div className="font-medium">Скачать для Windows (оффлайн)</div>
          <div className="text-xs text-muted-foreground">
            ZIP ~146 МБ · распакуйте и запустите SamsonCRM.exe · логин тот же
          </div>
        </div>
      </a>
    </div>
  );
}
