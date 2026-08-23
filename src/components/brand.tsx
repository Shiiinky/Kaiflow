import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/cn";

export function BrandMark({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <LogoMark size={28} />
      <span className="font-display text-xl font-extrabold tracking-tight">
        Kai<span className="text-accent">flow</span>
      </span>
    </Link>
  );
}
