const PARTNER_HREF = "https://all-inkl.com/PAC24FB89FC115D";
const PARTNER_IMG =
  "https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg";

/** ALL‑INKL.COM Partnerprogramm-Banner (Affiliate). */
export default function AllInklPartnerBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center py-3 ${className}`.trim()}>
      {/* Start Partnerprogramm ALL‑INKL.COM */}
      <a
        href={PARTNER_HREF}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-block leading-none"
      >
        <img
          src={PARTNER_IMG}
          width={468}
          height={60}
          alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
          className="max-w-full h-auto border-0"
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
