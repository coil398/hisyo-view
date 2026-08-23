import { cn } from "@/lib/cn";
import { formatElapsed, formatTokens } from "@/lib/hisyo/format";
import { runtimeLabel } from "@/lib/hisyo/plugins";
import type { Agent } from "@/lib/hisyo/types";
import { Sparkline } from "./sparkline";
import { StatusBadge, StatusDot } from "./status-badge";
import { WhereIcon } from "./where-icon";

const BAR: Record<Agent["status"], string> = {
  running: "row-bar-running",
  waiting: "row-bar-waiting",
  watching: "row-bar-watching",
  idle: "row-bar-idle",
  done: "row-bar-done",
  error: "row-bar-error",
};

const TONE: Record<Agent["status"], string> = {
  running: "text-running",
  waiting: "text-waiting",
  watching: "text-watching",
  idle: "text-idle",
  done: "text-done",
  error: "text-error",
};

export function AgentCard({
  agent,
  now,
  selected,
  onSelect,
  compact = false,
}: {
  agent: Agent;
  now: number;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const age = now - agent.lastBeatAt;
  const glow =
    agent.status === "error"
      ? "seat-alert"
      : agent.status === "waiting"
        ? "seat-wait"
        : agent.status === "running" || age < 8000
          ? "seat-live"
          : BAR[agent.status];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full min-h-11 rounded-md bg-card px-3 py-2.5 text-left transition-colors duration-150",
        glow,
        selected ? "bg-muted" : "hover:bg-muted/60",
        compact && "px-2.5 py-2",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={agent.status} />
        <span className="text-micro text-muted-foreground tabular">
          {formatElapsed(now - agent.startedAt)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <WhereIcon agent={agent} className="shrink-0" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{agent.name}</div>
          <div className="truncate text-micro text-muted-foreground">{agent.slug}</div>
        </div>
      </div>
      {agent.goal ? (
        <p className="mt-1 truncate text-micro text-waiting">ゴール {agent.goal}</p>
      ) : null}
      {!compact && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{agent.lastEvent}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-micro text-muted-foreground">
          {runtimeLabel(agent.runtime)}
          {agent.model ? (
            <>
              <span className="mx-1 text-border">·</span>
              <span className="font-mono">{agent.model.replace(/^openai\//, "").replace(/^anthropic\//, "")}</span>
            </>
          ) : null}
          <span className="mx-1 text-border">·</span>
          <span className="tabular">{formatTokens(agent.tokensIn + agent.tokensOut)}</span>
        </span>
        <Sparkline values={agent.heartbeat} className={TONE[agent.status]} />
      </div>
    </button>
  );
}
