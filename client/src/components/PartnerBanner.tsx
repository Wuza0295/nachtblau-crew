export default function PartnerBanner() {
  return (
    <div className="w-full flex justify-center py-6 bg-background border-t border-border">
      {/* Start Partnerprogramm ALL-INKL.COM */}
      <a
        href="https://all-inkl.com/PAC24FB89FC115D"
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        <img
          src="https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg"
          alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
          width={468}
          height={60}
          className="max-w-full h-auto"
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
