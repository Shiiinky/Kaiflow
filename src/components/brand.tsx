import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function BrandMark({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("font-display text-xl font-extrabold tracking-tight text-fg", className)}>
      Kai<span className="text-accent">flow</span>
    </Link>
  );
}
