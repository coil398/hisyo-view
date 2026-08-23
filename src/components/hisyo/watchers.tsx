import { formatBeatAgo } from "@/lib/hisyo/format";
import { useHisyoStore } from "@/lib/hisyo/store";
import { StatusDot } from "./status-badge";

export function WatchersView() {
  const watchers = useHisyoStore((s) => s.watchers);
  const now = useHisyoStore((s) => s.now);
  const select = useHisyoStore((s) => s.select);
  const setView = useHisyoStore((s) => s.setView);

  return (
    <div className="min-h-0 flex-1 overflow-auto scroll-thin p-3">
      {watchers.length === 0 ? (
        <p className="px-2 py-12 text-center text-sm text-muted-foreground">まだない</p>
      ) : (
      <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-2">
        {watchers.map((w) => (
          <section key={w.id} className="rounded-lg bg-card p-4">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">{w.name}</h2>
                <p className="text-micro text-muted-foreground">{w.summary}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-micro uppercase tracking-wide text-muted-foreground">
                <StatusDot status={w.mode === "off" ? "idle" : w.mode === "readonly" ? "watching" : "running"} />
                {w.mode === "readonly" ? "READ ONLY" : w.mode === "on" ? "ON" : "OFF"}
              </span>
            </header>
            <p className="mt-2 text-micro text-muted-foreground">
              最終確認 {formatBeatAgo(now - w.lastAt)}
            </p>
            <ul className="mt-3 divide-y divide-border">
              {w.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full py-2.5 text-left hover:bg-muted/40"
                    onClick={() => {
                      if (w.id === "home") {
                        setView("secretary");
                        return;
                      }
                      if (w.id === "feedback" && item.preview.startsWith("http")) {
                        window.open(item.preview, "_blank", "noopener,noreferrer");
                        return;
                      }
                      select(item.id);
                      setView("fleet");
                    }}
                  >
                    <p className="text-sm">
                      {item.urgent ? (
                        <span className="mr-1.5 text-micro font-medium text-watching">急</span>
                      ) : null}
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.preview}</p>
                    <p className="mt-1 text-micro tabular text-muted-foreground">
                      {formatBeatAgo(now - item.at)}
                    </p>
                  </button>
                </li>
              ))}
              {w.items.length === 0 && (
                <li className="py-3 text-xs text-muted-foreground">記録なし</li>
              )}
            </ul>
          </section>
        ))}
      </div>
      )}
    </div>
  );
}
