type PartnerBannerProps = {
  className?: string;
};

export default function PartnerBanner({ className = "" }: PartnerBannerProps) {
  return (
    <div className={`flex justify-center ${className}`.trim()}>
      {/* Start Partnerprogramm ALL-INKL.COM */}
      <a href="https://all-inkl.com/PAC24FB89FC115D">
        <img
          src="https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg"
          alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
          className="h-auto max-w-full"
          style={{ border: 0 }}
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
