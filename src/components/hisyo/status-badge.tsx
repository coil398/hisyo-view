import { cn } from "@/lib/cn";
import { STATUS_LABEL, type AgentStatus } from "@/lib/hisyo/types";

const DOT: Record<AgentStatus, string> = {
  running: "bg-running",
  waiting: "bg-waiting",
  watching: "bg-watching",
  idle: "bg-idle",
  done: "bg-done",
  error: "bg-error",
};

const TEXT: Record<AgentStatus, string> = {
  running: "text-running",
  waiting: "text-waiting",
  watching: "text-watching",
  idle: "text-idle",
  done: "text-done",
  error: "text-error",
};

const LAMP: Record<AgentStatus, string> = {
  running: "dot-running",
  waiting: "dot-waiting",
  watching: "dot-watching",
  idle: "",
  done: "",
  error: "dot-error",
};

export function StatusDot({
  status,
  live = false,
  className,
}: {
  status: AgentStatus;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full",
        DOT[status],
        live ? LAMP[status] : null,
        className,
      )}
      aria-hidden
    />
  );
}

const PILL: Record<AgentStatus, string> = {
  running: "badge-running",
  waiting: "badge-waiting",
  watching: "badge-watching",
  idle: "badge-idle",
  done: "badge-done",
  error: "badge-error",
};

export function StatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-micro uppercase tracking-wide",
        TEXT[status],
        PILL[status],
      )}
    >
      <StatusDot status={status} live />
      {STATUS_LABEL[status]}
    </span>
  );
}
