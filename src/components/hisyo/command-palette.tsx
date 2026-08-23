import { cn } from "@/lib/cn";
import { searchSeats } from "@/lib/hisyo/sources";
import { useHisyoStore } from "@/lib/hisyo/store";
import { VIEW_LABEL, type AppView } from "@/lib/hisyo/types";
import { useEffect, useMemo, useState } from "react";

export function CommandPalette() {
  const features = useHisyoStore((s) => s.features);
  const setView = useHisyoStore((s) => s.setView);
  const select = useHisyoStore((s) => s.select);
  const agents = useHisyoStore((s) => s.agents);
  const setLaunchOpen = useHisyoStore((s) => s.setLaunchOpen);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ id: string; name: string; snippet: string }[]>([]);

  useEffect(() => {
    if (!features.palette && !features.search) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [features.palette, features.search]);

  useEffect(() => {
    if (!open || !q.trim() || !features.search) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      void searchSeats(q).then(setHits);
    }, 180);
    return () => window.clearTimeout(t);
  }, [q, open, features.search]);

  const views = useMemo(
    () =>
      (Object.keys(VIEW_LABEL) as AppView[]).filter((id) => {
        if (id === "secretary") return features.secretary;
        if (id === "skills") return features.skills;
        if (id === "kanban") return features.kanban;
        return true;
      }),
    [features],
  );

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-background/70 p-4 pt-20" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="h-11 w-full bg-transparent px-3 text-sm text-foreground"
          placeholder="席・会話・画面"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="max-h-80 overflow-auto border-t border-border">
          {views
            .filter((id) => VIEW_LABEL[id].includes(q) || !q)
            .map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className="flex h-9 w-full items-center px-3 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    setView(id);
                    setOpen(false);
                  }}
                >
                  {VIEW_LABEL[id]}
                </button>
              </li>
            ))}
          <li>
            <button
              type="button"
              className="flex h-9 w-full items-center px-3 text-left text-xs hover:bg-muted"
              onClick={() => {
                setLaunchOpen(true);
                setOpen(false);
              }}
            >
              起動
            </button>
          </li>
          {(hits.length ? hits : agents.filter((a) => !q || a.name.includes(q) || a.task.includes(q)).slice(0, 8)).map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={cn("flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted")}
                onClick={() => {
                  select(a.id);
                  setView("fleet");
                  setOpen(false);
                }}
              >
                <span className="text-xs">{a.name}</span>
                <span className="text-micro text-muted-foreground">{"snippet" in a ? a.snippet : a.task}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
