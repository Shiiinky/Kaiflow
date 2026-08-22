import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function BrandMark({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <span className="relative grid size-7 place-items-center rounded-xs border border-accent/35 bg-accent/10">
        <span className="absolute inset-[5px] border border-accent/25" />
        <span className="size-1.5 bg-accent shadow-[0_0_10px_#00e5ff]" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        Kai<span className="text-accent">flow</span>
      </span>
    </Link>
  );
}
