import { cn } from "@/lib/utils";

type Props = {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
  viewed?: boolean;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function UserAvatar({
  initials,
  color,
  size = "md",
  className,
  ring,
  viewed,
}: Props) {
  const inner = (
    <div
      className={cn(
        "relative z-[1] flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm",
        sizes[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials}
    </div>
  );

  if (!ring) return inner;

  return (
    <div className={cn("moment-ring inline-flex rounded-full p-[3px]", viewed && "viewed")}>
      {inner}
    </div>
  );
}
