import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/cn";

export function BrandMark({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={cn("inline-flex min-w-0 items-center gap-2 text-fg sm:gap-2.5", className)}
    >
      <LogoMark size={28} />
      <span className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
        Kai<span className="text-accent">flow</span>
      </span>
    </Link>
  );
}
