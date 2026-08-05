export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="18" stroke="url(#aether-ring)" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="8" fill="url(#aether-core)" />
      <circle cx="28" cy="12" r="3.5" fill="oklch(0.65 0.19 35)" className="float-soft" />
      <defs>
        <linearGradient id="aether-ring" x1="4" y1="4" x2="36" y2="36">
          <stop stopColor="oklch(0.42 0.1 195)" />
          <stop offset="0.5" stopColor="oklch(0.58 0.12 185)" />
          <stop offset="1" stopColor="oklch(0.65 0.19 35)" />
        </linearGradient>
        <linearGradient id="aether-core" x1="12" y1="12" x2="28" y2="28">
          <stop stopColor="oklch(0.45 0.11 195)" />
          <stop offset="1" stopColor="oklch(0.55 0.14 175)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
