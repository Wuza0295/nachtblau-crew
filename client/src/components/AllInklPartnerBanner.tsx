import { cn } from "@/lib/utils";

type AllInklPartnerBannerProps = {
  className?: string;
};

export default function AllInklPartnerBanner({
  className,
}: AllInklPartnerBannerProps) {
  return (
    <div className={cn("flex w-full justify-center px-4 py-6", className)}>
      {/* Start Partnerprogramm ALL‑INKL.COM */}
      <a
        href="https://all-inkl.com/PAC24FB89FC115D"
        rel="sponsored"
        className="block max-w-full"
      >
        <img
          src="https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg"
          alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
          width={468}
          height={60}
          loading="lazy"
          className="block h-auto max-w-full border-0"
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
