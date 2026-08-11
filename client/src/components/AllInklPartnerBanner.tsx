import { SITE } from "@/lib/site";

/** ALL-INKL.COM Partnerprogramm-Banner – auf allen Seiten des Webspaces. */
export default function AllInklPartnerBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`.trim()}>
      {/* Start Partnerprogramm ALL‑INKL.COM */}
      <a
        href={SITE.allInklPartnerUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-block max-w-full"
      >
        <img
          src={SITE.allInklBannerUrl}
          alt={SITE.allInklBannerAlt}
          width={468}
          height={60}
          className="max-w-full h-auto border-0"
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
