import { useEffect, useState } from "react";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function OnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const pendingMutations = useIsMutating();
  const qc = useQueryClient();

  useEffect(() => {
    const on = () => {
      setOnline(true);
      toast.success("Соединение восстановлено — синхронизация...");
      qc.resumePausedMutations().then(() => qc.invalidateQueries());
    };
    const off = () => {
      setOnline(false);
      toast.warning("Оффлайн-режим. Изменения будут отправлены при подключении.");
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [qc]);

  const syncNow = () => {
    qc.resumePausedMutations().then(() => qc.invalidateQueries());
    toast.info("Синхронизация...");
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          online
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        }`}
        title={online ? "Онлайн" : "Оффлайн — работаем локально"}
      >
        {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{online ? "Онлайн" : "Оффлайн"}</span>
        {pendingMutations > 0 && (
          <span className="ml-1 rounded-full bg-background/50 px-1.5">
            {pendingMutations}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        title="Синхронизировать сейчас"
        onClick={syncNow}
        disabled={!online}
      >
        <RefreshCw className={`h-4 w-4 ${pendingMutations > 0 ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
