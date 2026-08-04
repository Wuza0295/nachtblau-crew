import { Link } from "wouter";
import { GAME_OPTIONS } from "@/lib/marketplaceConstants";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/40 mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/autic-treasures-logo.png"
                alt="Autic Treasures"
                className="h-9 w-9 object-cover rounded-md"
              />
              <span className="font-serif font-bold text-base text-primary tracking-wide">
                Autic Treasures
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              TCG-Marktplatz mit Merkliste, Warenkorb und Verkäufer-Ratings. Registrieren, kaufen und
              eigene Angebote einstellen.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Marktplatz
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/marktplatz"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Alle Produkte
                </Link>
              </li>
              <li>
                <Link
                  href="/merkliste"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Merkliste
                </Link>
              </li>
              <li>
                <Link
                  href="/warenkorb"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Warenkorb
                </Link>
              </li>
              <li>
                <Link
                  href="/registrieren"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Registrieren
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              TCGs
            </h4>
            <ul className="space-y-2">
              {GAME_OPTIONS.slice(0, 5).map((g) => (
                <li key={g.value}>
                  <Link
                    href={`/marktplatz?game=${g.value}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Handel
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Kauf & Verkauf mit Registrierung</li>
              <li>Eigene Angebote einstellen</li>
              <li>PayPal, Überweisung, Paysafe</li>
              <li>Merkliste, Warenkorb, Filter</li>
            </ul>
          </div>
        </div>

        <div className="divider-glow mt-8 mb-5" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Autic Treasures</span>
          <span className="text-primary/70">nacht-blau.de · autic-treasures.com</span>
        </div>
      </div>
    </footer>
  );
}
