import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type Ctx = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<
    (ConfirmOptions & { open: boolean; resolve?: (v: boolean) => void }) | null
  >(null);

  const confirm = useCallback<Ctx>((opts) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  const close = (result: boolean) => {
    state?.resolve?.(result);
    setState((s) => (s ? { ...s, open: false } : s));
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <AlertDialog
        open={!!state?.open}
        onOpenChange={(o) => {
          if (!o) close(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.title ?? "Подтвердите действие"}</AlertDialogTitle>
            {state?.description && (
              <AlertDialogDescription>{state.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>
              {state?.cancelText ?? "Отмена"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => close(true)}
              className={
                state?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {state?.confirmText ?? "Подтвердить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm(): Ctx {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) {
    // Fallback to native confirm if provider missing (SSR / isolated).
    return (opts) =>
      Promise.resolve(
        typeof window !== "undefined"
          ? window.confirm(
              [opts.title, opts.description].filter(Boolean).join("\n") ||
                "Подтвердите действие",
            )
          : false,
      );
  }
  return ctx;
}
