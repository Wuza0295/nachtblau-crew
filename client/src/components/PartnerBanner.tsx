import { cn } from "@/lib/utils";

type PartnerBannerProps = {
  className?: string;
};

export default function PartnerBanner({ className }: PartnerBannerProps) {
  return (
    <section className={cn("w-full py-6", className)}>
      <div className="container">
        <div className="flex justify-center rounded-2xl border border-border bg-card/50 px-4 py-5">
          <a
            href="https://all-inkl.com/PAC24FB89FC115D"
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            <img
              src="https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg"
              alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
              className="block h-auto max-w-full"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
