import { SITE } from "@/lib/site";

export default function AllInklPartnerBanner() {
  return (
    <div className="flex justify-center py-4">
      {/* Start Partnerprogramm ALL‑INKL.COM */}
      <a
        href={SITE.allInklPartnerUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={SITE.allInklBannerUrl}
          alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
          className="border-0 max-w-full h-auto"
          width={468}
          height={60}
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
