import { cn } from "@/lib/cn";
import { modelCatalog } from "@/lib/hisyo/secretary-models";
import { useHisyoStore } from "@/lib/hisyo/store";
import { useEffect, useId, useMemo, useState } from "react";

export function ModelSelect({
  runtime,
  model,
  used,
  allowEmpty,
  disabled,
  compact,
  id,
  "aria-label": ariaLabel,
  onChange,
}: {
  runtime: string;
  model: string;
  used?: string[];
  allowEmpty?: boolean;
  disabled?: boolean;
  compact?: boolean;
  id?: string;
  "aria-label"?: string;
  onChange: (model: string) => void;
}) {
  const listId = useId();
  const agents = useHisyoStore((s) => s.agents);
  const fromSeats = useMemo(
    () =>
      agents
        .filter((a) => (runtime === "auto" ? true : a.runtime === runtime) && a.model)
        .map((a) => a.model),
    [agents, runtime],
  );
  const options = modelCatalog(runtime, [...fromSeats, ...(used ?? [])], model);

  return (
    <>
      <input
        id={id}
        list={listId}
        aria-label={ariaLabel ?? "モデル"}
        value={model}
        disabled={disabled}
        placeholder={allowEmpty ? "デフォルト / 任意" : "モデル名"}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-sm bg-muted px-2 font-mono text-xs text-foreground",
          compact ? "h-7 min-w-36 max-w-56" : "h-8 w-full min-w-40",
        )}
      />
      <datalist id={listId}>
        {allowEmpty ? <option value="" /> : null}
        {options.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  );
}

export function ModelPicker({
  runtime,
  model,
  disabled,
  onCommit,
  compact,
}: {
  runtime: string;
  model: string;
  disabled?: boolean;
  onCommit: (model: string) => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState(model);
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    setDraft(model);
    setWarn(false);
  }, [model]);

  const request = (next: string) => {
    const v = next.trim();
    if (v === (model ?? "").trim()) {
      setDraft(v);
      setWarn(false);
      return;
    }
    setDraft(v);
    setWarn(true);
  };

  return (
    <div className="min-w-0">
      <ModelSelect
        runtime={runtime}
        model={draft}
        allowEmpty
        disabled={disabled}
        compact={compact}
        aria-label="秘書モデル"
        onChange={request}
      />
      {warn ? (
        <div className="mt-2 rounded-md bg-muted px-2 py-2">
          <p className="text-micro leading-relaxed text-muted-foreground">
            モデルを変えると会話キャッシュが消えます。MEMORY / USER は残ります。
          </p>
          <div className="mt-1.5 flex gap-1">
            <button
              type="button"
              className="h-7 rounded-sm px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setDraft(model);
                setWarn(false);
              }}
            >
              やめる
            </button>
            <button
              type="button"
              className="h-7 rounded-sm bg-card px-2 text-xs text-foreground"
              onClick={() => {
                setWarn(false);
                onCommit(draft.trim());
              }}
            >
              切り替える
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}