import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatBeatAgo } from "@/lib/hisyo/format";
import { useHisyoStore } from "@/lib/hisyo/store";
import type { ChatMessage } from "@/lib/hisyo/types";
import { MessageSquare, Minus, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TalkButton } from "./secretary-voice";
import { ModelPicker } from "./model-picker";

export function SecretaryDock() {
  const view = useHisyoStore((s) => s.view);
  const messages = useHisyoStore((s) => s.messages);
  const sendMessage = useHisyoStore((s) => s.sendMessage);
  const asking = useHisyoStore((s) => s.asking);
  const home = useHisyoStore((s) => s.home);
  const now = useHisyoStore((s) => s.now);
  const saveSecretary = useHisyoStore((s) => s.saveSecretary);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages.length, messages[messages.length - 1]?.id, asking]);

  if (view === "secretary") return null;

  if (!open) {
    return (
      <button
        type="button"
        aria-label="秘書と話す"
        onClick={() => {
          setOpen(true);
          queueMicrotask(() => document.getElementById("hisyo-dock-composer")?.focus());
        }}
        className="fixed right-3 bottom-5 z-50 flex size-11 items-center justify-center rounded-lg bg-card text-foreground shadow-[var(--shadow-border)]"
      >
        <MessageSquare className="size-4" />
      </button>
    );
  }

  return (
    <div className="fixed right-3 bottom-5 z-50 flex h-[min(28rem,calc(100dvh-8rem))] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]">
      <header className="flex items-center gap-2 border-b border-border px-2.5 py-2">
        <p className="text-sm font-medium">秘書</p>
        <p className="min-w-0 flex-1 truncate text-micro text-muted-foreground">
          {home?.model || home?.runtime || "auto"}
        </p>
        <TalkButton compact />
        <button
          type="button"
          aria-label="しまう"
          className="flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(false)}
        >
          <Minus className="size-3.5" />
        </button>
      </header>
      <div className="border-b border-border px-2.5 py-2">
        <ModelPicker
          compact
          runtime={home?.runtime || "auto"}
          model={home?.model || ""}
          disabled={asking}
          onCommit={(model) => void saveSecretary({ model })}
        />
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-auto scroll-thin px-3 py-2">
        {messages.length === 0 && !asking ? (
          <p className="py-8 text-center text-xs text-muted-foreground">話しかける</p>
        ) : (
          messages.map((m) => <DockBubble key={m.id} message={m} now={now} />)
        )}
        {asking ? <p className="py-1 text-center text-micro text-muted-foreground">考え中</p> : null}
      </div>
      <form
        className="flex gap-1.5 border-t border-border p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim() || asking) return;
          const t = draft;
          setDraft("");
          void sendMessage(t);
        }}
      >
        <input
          id="hisyo-dock-composer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="秘書に話す"
          disabled={asking}
          className="h-9 min-w-0 flex-1 rounded-md bg-muted px-2.5 text-sm"
        />
        <Button type="submit" variant="primary" size="sm" disabled={asking} className="h-9 px-2.5">
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}

function DockBubble({ message, now }: { message: ChatMessage; now: number }) {
  if (message.role === "system") {
    return <p className="py-1 text-center text-micro text-muted-foreground">{message.text}</p>;
  }
  const mine = message.role === "user";
  return (
    <div className={cn("mb-2 flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-md px-2.5 py-1.5 text-xs leading-relaxed whitespace-pre-wrap",
          mine ? "bg-muted" : "bg-background shadow-[var(--shadow-border)]",
        )}
      >
        <p>{message.text}</p>
        <p className="mt-0.5 text-micro tabular text-muted-foreground">{formatBeatAgo(now - message.at)}</p>
      </div>
    </div>
  );
}
