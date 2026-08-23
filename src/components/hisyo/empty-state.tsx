import { Button } from "@/components/ui/button";
import { useHisyoStore } from "@/lib/hisyo/store";
import { FolderOpen, Play, RefreshCw } from "lucide-react";

export function EmptyFleet() {
  const mode = useHisyoStore((s) => s.mode);
  const loading = useHisyoStore((s) => s.loading);
  const canPick = useHisyoStore((s) => s.canPick);
  const connect = useHisyoStore((s) => s.connect);
  const refresh = useHisyoStore((s) => s.refresh);
  const setLaunchOpen = useHisyoStore((s) => s.setLaunchOpen);
  const plugins = useHisyoStore((s) => s.plugins).filter((p) => p.enabled);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-sm font-medium tracking-tight">セッションなし</p>
      {mode === "tauri" ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" onClick={() => setLaunchOpen(true)}>
            <Play className="size-4" />
            起動
          </Button>
          <Button onClick={() => void refresh()}>
            <RefreshCw className="size-4" />
            更新
          </Button>
        </div>
      ) : canPick ? (
        <div className="mt-5 flex max-w-full flex-wrap items-center justify-center gap-2">
          {plugins.map((p) => (
            <Button key={p.id} onClick={() => void connect(p.id)}>
              <FolderOpen className="size-4" />
              {p.name}
            </Button>
          ))}
        </div>
      ) : null}
      {loading ? <p className="mt-4 text-micro text-muted-foreground">読込中</p> : null}
    </div>
  );
}
