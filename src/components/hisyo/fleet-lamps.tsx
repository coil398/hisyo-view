import { cn } from "@/lib/cn";
import { STATUS_LABEL, type Agent } from "@/lib/hisyo/types";
import { StatusDot } from "./status-badge";

export function FleetLamps({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const shown = agents.slice(0, 28);
  const extra = agents.length - shown.length;
  if (!agents.length) return null;
  return (
    <div className="hidden min-w-0 items-center gap-0.5 sm:flex" role="list" aria-label="席">
      {shown.map((a) => (
        <button
          key={a.id}
          type="button"
          role="listitem"
          title={`${a.name} · ${STATUS_LABEL[a.status]}`}
          aria-label={`${a.name} ${STATUS_LABEL[a.status]}`}
          aria-pressed={a.id === selectedId}
          onClick={() => onSelect(a.id)}
          className={cn(
            "flex size-4 items-center justify-center rounded-sm",
            a.id === selectedId ? "bg-muted" : "hover:bg-muted/80",
          )}
        >
          <StatusDot status={a.status} live className="size-1.5" />
        </button>
      ))}
      {extra > 0 ? <span className="pl-0.5 text-micro text-muted-foreground">+{extra}</span> : null}
    </div>
  );
}
