import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/autic-treasures-logo.png"
                alt="Autic Treasures"
                className="h-10 w-10 object-cover rounded-lg"
              />
              <span className="font-serif font-bold text-lg text-primary tracking-wide">
                Autic Treasures
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deine Trading Card Community. Kaufe, verkaufe und bewerte – modern, klar und fair.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-widest">
              Marktplatz
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/marktplatz", label: "Alle Karten" },
                { href: "/marktplatz?game=pokemon", label: "Pokémon" },
                { href: "/marktplatz?game=yugioh", label: "Yu-Gi-Oh!" },
                { href: "/verkaufen", label: "Karte verkaufen" },
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
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-widest">
              Vorteile
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Preisverlauf für jede Karte</li>
              <li>Verkäufer-Bewertungen nach Kauf</li>
              <li>Sofort-Kauf mit einem Klick</li>
              <li>Große Kartenbilder statt Tabellen</li>
            </ul>
          </div>
        </div>

        <div className="divider-glow mt-8 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Autic Treasures. Alle Rechte vorbehalten.</span>
          <span className="text-primary/60">Trading Card Community</span>
        </div>
      </div>
    </footer>
  );
}
