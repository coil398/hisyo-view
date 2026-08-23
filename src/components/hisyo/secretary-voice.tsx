import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useHisyoStore } from "@/lib/hisyo/store";
import { canListen, listenOnce } from "@/lib/hisyo/voice";
import { Mic, Square } from "lucide-react";
import { useEffect, useRef } from "react";

export function TalkButton({ compact = false }: { compact?: boolean }) {
  const on = useHisyoStore((s) => s.features.secretaryVoice);
  const talking = useHisyoStore((s) => s.talking);
  const setTalking = useHisyoStore((s) => s.setTalking);
  const asking = useHisyoStore((s) => s.asking);
  const sendMessage = useHisyoStore((s) => s.sendMessage);
  const busy = useRef(false);

  useEffect(() => {
    if (!talking || asking || busy.current) return;
    if (!canListen()) return;
    let stop = false;
    busy.current = true;
    void listenOnce()
      .then((t) => {
        if (stop || !t) return;
        void sendMessage(t);
      })
      .catch(() => undefined)
      .finally(() => {
        busy.current = false;
      });
    return () => {
      stop = true;
    };
  }, [talking, asking, sendMessage]);

  if (!on) return null;

  return (
    <Button
      size={compact ? "icon" : "sm"}
      variant={talking ? "primary" : "ghost"}
      aria-label={talking ? "会話を止める" : "会話"}
      aria-pressed={talking}
      onClick={() => setTalking(!talking)}
      className={cn(talking && "nav-tick")}
    >
      {talking ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
      {compact ? null : talking ? "会話中" : "会話"}
    </Button>
  );
}
