import { Link } from "wouter";
import { Github, Twitter, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663739653758/PbtcqHtcftAKnwDnhmoduf/nachtblau-logo-Li7umgFb8XhrYaRtYVFm4Z.webp"
                alt="NachtBlau Crew"
                className="h-10 w-10 object-contain"
              />
              <span
                className="font-bold text-lg gradient-text"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                NachtBlau Crew
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deine Gaming Community für PC, Konsolen, Steam und mehr. Aktuelle News,
              kostenlose Spiele und ein aktives Forum.
            </p>
          </div>

          {/* Navigation */}
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

          {/* Community */}
          <div className="space-y-3">
            <h4
              className="text-sm font-semibold text-foreground uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Community
            </h4>
            <div className="flex gap-3">
              {[
                { icon: MessageSquare, label: "Discord" },
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="p-2 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all duration-200"
                  title={label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Free Games Daten bereitgestellt von{" "}
              <a
                href="https://www.gamerpower.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GamerPower.com
              </a>
            </p>
          </div>
        </div>

        <div className="divider-glow mt-8 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} NachtBlau Crew. Alle Rechte vorbehalten.</span>
          <span className="text-primary/60">
            Powered by the Night 🌙
          </span>
        </div>
      </div>
    </footer>
  );
}
