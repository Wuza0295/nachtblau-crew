import { Link } from "wouter";
import { EXTERNAL_LINKS, SITE } from "@/lib/site";
import { Github, Globe, Mail, ExternalLink } from "lucide-react";

const LINK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [SITE.webspaceUrl]: Globe,
  [SITE.githubUrl]: Github,
  [`mailto:${SITE.contactEmail}`]: Mail,
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-3">
              <img src={SITE.logoUrl} alt={SITE.name} className="h-10 w-10 object-contain" />
              <span
                className="font-bold text-lg gradient-text"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {SITE.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{SITE.tagline}</p>
          </div>

          <div className="space-y-3">
            <h4
              className="text-sm font-semibold text-foreground uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Navigation
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/free-games", label: "Free Games" },
                { href: "/news", label: "Gaming News" },
                { href: "/forum", label: "Community Forum" },
                { href: "/ueber-uns", label: "Über uns" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4
              className="text-sm font-semibold text-foreground uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              NachtBlau Netzwerk
            </h4>
            <ul className="space-y-2">
              {EXTERNAL_LINKS.map((link) => {
                const Icon = LINK_ICONS[link.href] ?? ExternalLink;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-3">
            <h4
              className="text-sm font-semibold text-foreground uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Datenquellen
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Free Games bereitgestellt von{" "}
              <a
                href={SITE.gamerPowerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GamerPower.com
              </a>
              . Quellcode auf{" "}
              <a
                href={SITE.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
              .
            </p>
            <div className="flex gap-3 pt-1">
              {EXTERNAL_LINKS.map((link) => {
                const Icon = LINK_ICONS[link.href] ?? ExternalLink;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all duration-200"
                    title={link.label}
                    aria-label={link.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="divider-glow mt-8 mb-6" />

        {/* Start Partnerprogramm ALL‑INKL.COM */}
        <div className="flex justify-center mb-6">
          <a
            href="https://all-inkl.com/PAC24FB89FC115D"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              border={0}
              src="https://all-inkl.com/banner/all-inkl_banner_468x60_black.jpg"
              alt="ALL-INKL.COM - Webhosting Server Hosting Domain Provider"
              width={468}
              height={60}
            />
          </a>
        </div>
        {/* Ende Partnerprogramm */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {SITE.name}. Alle Rechte vorbehalten.</span>
          <div className="flex items-center gap-3">
            <a
              href={SITE.webspaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              {SITE.webspaceLabel}
            </a>
            <span className="text-border">·</span>
            <a
              href={SITE.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <span className="text-border">·</span>
            <span className="text-primary/60">Powered by the Night 🌙</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
