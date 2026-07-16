import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";

export function UssuriyskClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const text = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Asia/Vladivostok",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
        day: "2-digit",
        month: "short",
      }).format(now),
    [now],
  );
  return (
    <div className="hidden items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1 text-xs sm:flex">
      <Clock className="h-3.5 w-3.5 text-red-600" />
      <div className="leading-tight">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
          Уссурийск
        </div>
        <div className="font-mono font-semibold tabular-nums">{text}</div>
      </div>
    </div>
  );
}
