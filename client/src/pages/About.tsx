import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Coins, Search, ShoppingBag, Tag, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="py-12">
      <div className="container max-w-3xl space-y-10">
        <div className="text-center space-y-4">
          <img
            src="/autic-treasures-logo.png"
            alt="Autic Treasures"
            className="h-28 w-28 mx-auto object-contain drop-shadow-[0_0_24px_oklch(0.72_0.14_65_/_0.35)]"
          />
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 uppercase tracking-widest"
          >
            Trading Card Marketplace
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-primary tracking-wide">
            Autic Treasures
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Autic Treasures ist ein eigenständiger TCG-Marktplatz – kaufen, verkaufen und mit Autic
            Coins handeln. Online und auf dem Flohmarkt.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: Search,
              title: "Marktplatz",
              desc: "Filter nach Spiel, Zustand, Sprache und Foil – sortiert nach bestem Angebot.",
              href: "/marktplatz",
            },
            {
              icon: Tag,
              title: "Verkaufen",
              desc: "Eigene Angebote einstellen – Erlös als Autic Coins aufs Guthaben.",
              href: "/verkaufen",
            },
            {
              icon: Coins,
              title: "Autic Coins",
              desc: "Internes Guthaben (ATC) für Checkout und Flohmarkt-Coupons.",
              href: "/guthaben",
            },
            {
              icon: Heart,
              title: "Merkliste & Warenkorb",
              desc: "Karten merken, Angebote sammeln und bequem bezahlen.",
              href: "/merkliste",
            },
          ].map(({ icon: Icon, title, desc, href }) => (
            <Link key={title} href={href}>
              <div className="h-full p-5 rounded-lg border border-border bg-card/40 hover:border-primary/40 transition-colors space-y-2">
                <div className="inline-flex p-2.5 rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center space-y-3 pt-4">
          <Link href="/registrieren">
            <Button className="bg-primary hover:bg-primary/85 text-primary-foreground font-semibold">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Jetzt registrieren
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">autic-treasures.com</p>
        </div>
      </div>
    </div>
  );
}
