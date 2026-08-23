import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium select-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
        outline: "shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] text-foreground",
        muted: "bg-muted text-foreground hover:bg-muted/80",
      },
      size: {
        sm: "h-8 px-2.5 text-xs rounded-sm",
        md: "h-10 px-3 text-sm rounded-md",
        icon: "size-8 rounded-sm",
        iconLg: "size-11 rounded-md",
      },
    },
    defaultVariants: { variant: "ghost", size: "sm" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
