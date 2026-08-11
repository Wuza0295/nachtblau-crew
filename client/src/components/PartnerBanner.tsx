import { cn } from "@/lib/utils";

const PARTNER_URL = "https://all-inkl.com/PAC24FB89FC115D";
const PARTNER_BANNER_SRC = "https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg";
const PARTNER_ALT = "ALL-INKL.COM - Webhosting Server Hosting Domain Provider";

export default function PartnerBanner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center", className)}>
      {/* Partnerprogramm ALL-INKL.COM */}
      <a href={PARTNER_URL} target="_blank" rel="noopener noreferrer sponsored">
        <img
          src={PARTNER_BANNER_SRC}
          alt={PARTNER_ALT}
          width={468}
          height={60}
          loading="lazy"
          className="max-w-full h-auto rounded-md"
          style={{ border: 0 }}
        />
      </a>
    </div>
  );
}
