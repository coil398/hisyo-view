import { cn } from "@/lib/cn";
import { useHisyoStore, visibleAgents } from "@/lib/hisyo/store";
import { isMainAgent } from "@/lib/hisyo/types";
import { StatusBadge } from "./status-badge";

export function KanbanView() {
  const agents = useHisyoStore(visibleAgents);
  const select = useHisyoStore((s) => s.select);
  const pins = useHisyoStore((s) => s.pins);
  const mains = agents.filter(isMainAgent);
  const groups = new Map<string, typeof mains>();
  for (const a of mains) {
    const key = (a.cwd || "").replace(/\/$/, "").split("/").pop() || a.slug || "—";
    const list = groups.get(key) || [];
    list.push(a);
    groups.set(key, list);
  }
  const cols = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  return (
    <div className="flex min-h-0 flex-1 gap-2 overflow-auto p-3">
      {cols.map(([name, list]) => (
        <section key={name} className="flex w-64 shrink-0 flex-col rounded-lg bg-card">
          <header className="px-3 py-2 text-xs font-medium">
            {name}
            <span className="ml-1 text-micro text-muted-foreground">{list.length}</span>
          </header>
          <ul className="flex flex-col gap-1 overflow-auto p-2">
            {list.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => select(a.id)}
                  className={cn(
                    "w-full rounded-md bg-muted/70 p-2 text-left",
                    pins.includes(a.id) && "ring-1 ring-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs">{a.name}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-micro text-muted-foreground">{a.task || "—"}</p>
                  {a.touching ? (
                    <p className="mt-1 truncate font-mono text-micro text-muted-foreground">{a.touching}</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
