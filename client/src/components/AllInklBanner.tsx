import { cn } from "@/lib/utils";

type AllInklBannerProps = {
  className?: string;
};

export default function AllInklBanner({ className }: AllInklBannerProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <a
        href="https://all-inkl.com/PAC24FB89FC115D"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block overflow-hidden rounded-lg border border-border/60 shadow-sm transition-opacity duration-200 hover:opacity-90"
      >
        <img
          src="https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg"
          alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
          width={468}
          height={60}
          className="h-auto max-w-full"
        />
      </a>
    </div>
  );
}
