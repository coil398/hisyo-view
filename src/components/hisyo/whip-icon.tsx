import { cn } from "@/lib/cn";

export function WhipIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path d="M5 20l5-5" />
      <path d="M4 21h3v-3" />
      <path d="M10 15c2.2-.4 4.2-2.6 4.5-5 .4-2.8 2.4-4.8 5.2-5.3" />
      <path d="M19.7 4.7c.9.2 1.6 1 1.8 1.9" />
      <path d="M21.2 8.2c.1.8-.2 1.5-.7 2" />
    </svg>
  );
}
