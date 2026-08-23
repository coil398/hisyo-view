import { formatBeatAgo } from "@/lib/hisyo/format";
import { useHisyoStore } from "@/lib/hisyo/store";
import { StatusDot } from "./status-badge";
import type { HisyoEventKind } from "@/lib/hisyo/types";

const KIND: Record<HisyoEventKind, string> = {
  status: "状態",
  log: "ログ",
  watch: "監視",
  mail: "メール",
  decision: "秘書",
};

export function TimelineView() {
  const events = useHisyoStore((s) => s.events);
  const agents = useHisyoStore((s) => s.agents);
  const now = useHisyoStore((s) => s.now);
  const select = useHisyoStore((s) => s.select);
  const setView = useHisyoStore((s) => s.setView);
  const ordered = [...events].sort((a, b) => b.at - a.at);

  if (!ordered.length) {
    return <p className="px-4 py-12 text-center text-sm text-muted-foreground">まだない</p>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto scroll-thin p-3">
      <ol className="mx-auto max-w-3xl">
        {ordered.map((ev) => {
          const agent = ev.agentId ? agents.find((a) => a.id === ev.agentId) : undefined;
          return (
            <li key={ev.id} className="flex gap-3 border-b border-border/60 py-3">
              <div className="mt-1 w-16 shrink-0 text-right text-micro tabular text-muted-foreground">
                {formatBeatAgo(now - ev.at)}
              </div>
              <div className="mt-1.5">
                {agent ? <StatusDot status={agent.status} live={agent.status === "running"} /> : <StatusDot status="idle" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-micro uppercase tracking-wide text-muted-foreground">
                  {KIND[ev.kind] ?? ev.kind}
                  {agent ? ` · ${agent.name}` : ""}
                </p>
                <p className="mt-0.5 text-sm text-foreground">{ev.text}</p>
                {agent ? (
                  <button
                    type="button"
                    className="mt-1 text-micro text-waiting hover:text-foreground"
                    onClick={() => {
                      select(agent.id);
                      setView("fleet");
                    }}
                  >
                    開く
                  </button>
                ) : ev.kind === "decision" ? (
                  <button
                    type="button"
                    className="mt-1 text-micro text-waiting hover:text-foreground"
                    onClick={() => setView("secretary")}
                  >
                    秘書
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
