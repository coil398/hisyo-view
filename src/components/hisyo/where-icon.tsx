import { cn } from "@/lib/cn";
import { isCloudAgent } from "@/lib/hisyo/plugins";
import { Cloud, HardDrive } from "lucide-react";

export function WhereIcon({
  agent,
  className,
}: {
  agent: { slug?: string; cwd?: string; path?: string };
  className?: string;
}) {
  const cloud = isCloudAgent(agent);
  const Icon = cloud ? Cloud : HardDrive;
  const label = cloud ? "クラウド" : "ローカル";
  return (
    <span title={label} className="inline-flex">
      <Icon
        className={cn("size-3.5 shrink-0", cloud ? "text-waiting" : "text-muted-foreground", className)}
        aria-label={label}
      />
    </span>
  );
}
