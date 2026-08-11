import { cn } from "@/lib/utils";

export default function PartnerBanner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center", className)}>
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
          loading="lazy"
          className="max-w-full h-auto rounded-md"
        />
      </a>
      {/* Ende Partnerprogramm */}
    </div>
  );
}
