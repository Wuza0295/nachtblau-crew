import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import CardTile from "@/components/marketplace/CardTile";
import { useMarketplaceSearch, useMarketplaceStats } from "@/lib/useMarketplace";
import { getRecent } from "@/lib/recentStore";
import { getCardById, getListingsForCard } from "@/lib/marketplaceStore";
import {
  ShoppingBag,
  TrendingUp,
  Shield,
  ChevronRight,
  Zap,
  Search,
  UserPlus,
  Coins,
} from "lucide-react";
import { useMemo } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats } = useMarketplaceStats();
  const searchFilters = useMemo(() => ({ sort: "best_offer" as const, limit: 8 }), []);
  const { data: featured } = useMarketplaceSearch(searchFilters);

  const recent = useMemo(() => {
    return getRecent()
      .map((id) => {
        const card = getCardById(id);
        if (!card) return null;
        const listings = getListingsForCard(id);
        return {
          card,
          listing: listings[0],
          listingCount: listings.length,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x?.listing));
  }, [featured]);

  return (
    <div>
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <img
          src="/autic-treasures-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-ken-burns"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />

        <div className="container relative z-10 flex flex-col items-center text-center px-4 pb-10 pt-28 space-y-5 animate-rise">
          <h1 className="sr-only">Autic Treasures</h1>
          <img
            src="/autic-treasures-logo.png"
            alt="Autic Treasures"
            className="h-48 sm:h-60 md:h-72 w-auto object-contain drop-shadow-[0_12px_40px_oklch(0.72_0.14_65_/_0.55)]"
          />

          <p className="text-base md:text-lg text-foreground/90 max-w-md leading-relaxed">
            Kaufen, verkaufen und mit Autic Coins verrechnen – nur echte Angebote von
            angemeldeten Nutzern, Erlös als Guthaben.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link href="/marktplatz">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/85 text-primary-foreground font-bold shadow-xl shadow-primary/30"
              >
                <Search className="mr-2 h-5 w-5" />
                Zum Marktplatz
              </Button>
            </Link>
            {!isAuthenticated ? (
              <Button
                size="lg"
                variant="outline"
                className="border-primary/50 bg-background/40 backdrop-blur-sm text-primary hover:bg-primary/15 font-semibold"
                onClick={() => navigate("/registrieren")}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Registrieren
              </Button>
            ) : (
              <Link href="/verkaufen">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/50 bg-background/40 backdrop-blur-sm text-primary hover:bg-primary/15 font-semibold"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Angebot einstellen
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {stats && (
        <section className="border-y border-border bg-card/30">
          <div className="container py-6 flex flex-wrap gap-8 sm:gap-12">
            {[
              { label: "Aktive Angebote", value: stats.activeListings },
              { label: "Produkte", value: stats.totalCards },
              { label: "Verkäufer", value: stats.totalSellers },
              { label: "Ø Bewertung", value: stats.avgRating },
            ].map((s) => (
              <div key={s.label} className="animate-rise">
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-14">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl">
            {[
              {
                icon: TrendingUp,
                title: "Bestes Angebot",
                desc: "Sortierung nach Preis + Verkäufer-Reputation",
              },
              {
                icon: Coins,
                title: "Autic Coins",
                desc: "Internes Guthaben für Online-Kauf und Flohmarkt",
              },
              {
                icon: Zap,
                title: "Merkliste & Warenkorb",
                desc: "Wants speichern, Angebote sammeln, dann kaufen",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-2 animate-rise">
                <div className="inline-flex p-2.5 rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {stats && (
        <section className="py-10 border-t border-border">
          <div className="container space-y-4">
            <h2 className="text-xl font-bold">Nach TCG browsen</h2>
            <div className="flex flex-wrap gap-2">
              {stats.games.map((g) => (
                <Link key={g.game} href={`/marktplatz?game=${g.game}`}>
                  <Badge
                    variant="outline"
                    className="px-3.5 py-1.5 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors"
                  >
                    {g.label}
                    <span className="ml-2 text-muted-foreground">{g.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-card/30 border-t border-border">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Aktuelle Angebote</h2>
              <p className="text-muted-foreground text-sm mt-1">Nur echte Angebote von Nutzern</p>
            </div>
            <Link href="/marktplatz">
              <Button variant="ghost" className="text-primary gap-1">
                Alle anzeigen <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {(featured?.results.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                Noch keine Angebote – sei der Erste und stelle eines ein.
              </p>
              <Link href="/verkaufen">
                <Button>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Angebot einstellen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {featured?.results.map(({ card, listing, listingCount }) => (
                <CardTile
                  key={card.id}
                  cardId={card.id}
                  name={card.name}
                  setName={card.setName}
                  game={card.game}
                  imageUrl={card.imageUrl}
                  price={listing.price}
                  listingCount={listingCount}
                  avgRating={card.avgRating}
                  isFoil={listing.isFoil}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="py-12 border-t border-border">
          <div className="container">
            <h2 className="text-xl font-bold mb-4">Zuletzt angesehen</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {recent.slice(0, 6).map(({ card, listing, listingCount }) => (
                <CardTile
                  key={card.id}
                  cardId={card.id}
                  name={card.name}
                  setName={card.setName}
                  game={card.game}
                  imageUrl={card.imageUrl}
                  price={listing!.price}
                  listingCount={listingCount}
                  avgRating={card.avgRating}
                  isFoil={listing!.isFoil}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-14 border-t border-border">
        <div className="container max-w-2xl text-center space-y-4">
          <Shield className="h-8 w-8 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Sicher handeln</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Registrierung und Handelsprofil vor dem Kauf. Marktplatz-Käufe nur per Autic Coins –
            Verkäufer erhalten Guthaben, kein echtes Geld. ATC aufladen per PayPal, Überweisung oder
            Paysafe.
          </p>
          <Link href="/ueber-uns">
            <Button variant="outline" className="mt-2">
              Mehr über Autic Treasures
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
