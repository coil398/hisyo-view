import { Button } from "@/components/ui/button";
import { useHisyoStore } from "@/lib/hisyo/store";
import { Download, X } from "lucide-react";

export function UpdateToast() {
  const update = useHisyoStore((s) => s.update);
  const busy = useHisyoStore((s) => s.updateBusy);
  const install = useHisyoStore((s) => s.installUpdate);
  const dismiss = useHisyoStore((s) => s.dismissUpdate);

  if (!update?.available) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 left-3 z-[80] w-[min(20rem,calc(100vw-6.5rem))] rounded-lg bg-card p-3 shadow-[var(--shadow-border)]"
    >
      <div className="flex items-start gap-2">
        <Download className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">更新があります</p>
          <p className="mt-0.5 truncate text-micro text-muted-foreground">
            {update.remote}
            {update.message ? ` · ${update.message}` : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label="あとで"
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          onClick={dismiss}
          disabled={busy}
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void install()}>
          {busy ? "入れている" : "インストール"}
        </Button>
        <Button size="sm" disabled={busy} onClick={dismiss}>
          あとで
        </Button>
      </div>
    </div>
  );
}
