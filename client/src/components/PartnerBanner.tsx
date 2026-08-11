import { cn } from "@/lib/utils";
import { ALL_INKL_PARTNER } from "@shared/site";

/** ALL-INKL.COM Partnerprogramm-Banner – auf allen öffentlichen Seiten. */
export default function PartnerBanner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-4", className)}>
      {/* Start Partnerprogramm ALL‑INKL.COM */}
      <a
        href={ALL_INKL_PARTNER.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-block leading-none"
      >
        <img
          src={ALL_INKL_PARTNER.bannerSrc}
          alt={ALL_INKL_PARTNER.bannerAlt}
          width={468}
          height={60}
          className="max-w-full h-auto border-0"
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
