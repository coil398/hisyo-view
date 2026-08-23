import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useHisyoStore } from "@/lib/hisyo/store";

const TONE: Record<string, string> = {
  permit: "text-waiting",
  error: "text-error",
  whip: "text-watching",
  done: "text-running",
  wait: "text-waiting",
  update: "text-foreground",
};

export function NoteStack() {
  const notes = useHisyoStore((s) => s.notes);
  const dismiss = useHisyoStore((s) => s.dismissNote);
  const select = useHisyoStore((s) => s.select);
  const setView = useHisyoStore((s) => s.setView);
  const decidePermit = useHisyoStore((s) => s.decidePermit);
  const features = useHisyoStore((s) => s.features);
  if (!features.notify || !notes.length) return null;

  return (
    <div className="fixed bottom-5 right-3 z-[80] flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-2">
      {notes.map((n) => (
        <article
          key={`${n.kind}-${n.id}`}
          className="rounded-md bg-card p-3 shadow-[var(--shadow-border)]"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-medium", TONE[n.kind] || "text-foreground")}>
                {n.title}
                <span className="ml-1.5 font-normal text-muted-foreground">{n.name}</span>
              </p>
              {n.body ? (
                <p className="mt-0.5 line-clamp-2 text-micro text-muted-foreground">{n.body}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="text-micro text-muted-foreground hover:text-foreground"
              onClick={() => dismiss(n.kind, n.id)}
            >
              閉じる
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {n.kind === "permit" ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    void decidePermit(n.id, "allow");
                    dismiss(n.kind, n.id);
                  }}
                >
                  認める
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    void decidePermit(n.id, "deny");
                    dismiss(n.kind, n.id);
                  }}
                >
                  拒否
                </Button>
              </>
            ) : null}
            {n.id && n.id !== "git" ? (
              <Button
                size="sm"
                onClick={() => {
                  select(n.id);
                  setView("fleet");
                  dismiss(n.kind, n.id);
                }}
              >
                開く
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
