import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * ALL-INKL.COM Partnerprogramm-Banner – auf allen Seiten einbinden.
 */
export default function AllInklPartnerBanner({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      {/* Start Partnerprogramm ALL‑INKL.COM */}
      <a
        href={SITE.allInklPartnerUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        <img
          src={SITE.allInklBannerUrl}
          alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
          width={468}
          height={60}
          className="max-w-full h-auto border-0"
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
