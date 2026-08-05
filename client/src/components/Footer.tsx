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
    <footer className="border-t border-border/50 mt-16 bg-background/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl flux-gradient-text">{SITE.name}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">
                Arbeitstitel
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{SITE.tagline}</p>
            <p className="text-xs text-muted-foreground/80">{SITE.description}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-display font-semibold uppercase tracking-widest">Portal</h4>
            <ul className="space-y-2">
              {[
                { href: "/feed", label: "Feed" },
                { href: "/pulse", label: "Pulse" },
                { href: "/circles", label: "Circles" },
                { href: "/radar", label: "Radar" },
                { href: "/messages", label: "Messages" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-display font-semibold uppercase tracking-widest">Links</h4>
            <ul className="space-y-2">
              {EXTERNAL_LINKS.map((link) => {
                const Icon = LINK_ICONS[link.href] ?? ExternalLink;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="divider-glow mt-8 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {SITE.name} · Name folgt
          </span>
          <span>Synthese aus dem Besten aller Social-Plattformen</span>
        </div>
      </div>
    </footer>
  );
}
