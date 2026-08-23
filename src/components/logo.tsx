import { cn } from "@/lib/cn";

/** HUD reticle mark from logo B — works on dark UI and print. */
export function LogoMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-accent", className)}
      aria-hidden
    >
      {/* Corner brackets (HUD frame) */}
      <path
        d="M8 4H4v4M24 4h4v4M4 24v4h4M28 24v4h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Outer ring */}
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      {/* Center glow dot */}
      <circle cx="16" cy="16" r="2.75" fill="currentColor" />
    </svg>
  );
}

/** Wordmark Kai(flow) + optional mark — logo B. */
export function LogoWordmark({
  className,
  mark = true,
  markSize = 28,
}: {
  className?: string;
  mark?: boolean;
  markSize?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="font-display text-xl font-extrabold tracking-tight text-fg print:text-neutral-900">
        Kai<span className="text-accent print:text-[#00b8d4]">flow</span>
      </span>
      {mark ? <LogoMark size={markSize} className="print:text-[#00b8d4]" /> : null}
    </span>
  );
}
