import { SITE } from "@/lib/site";
import { Link } from "wouter";
import { BrandMark } from "./BrandMark";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60">
      <div className="container py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <BrandMark className="h-8 w-8" />
          <div>
            <p className="font-display font-semibold text-gradient">{SITE.name}</p>
            <p className="text-sm text-muted-foreground">{SITE.tagline}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/feed" className="hover:text-primary transition-colors">
            Pulse
          </Link>
          <Link href="/circles" className="hover:text-primary transition-colors">
            Circles
          </Link>
          <Link href="/explore" className="hover:text-primary transition-colors">
            Explore
          </Link>
          <Link href="/ueber-uns" className="hover:text-primary transition-colors">
            Konzept
          </Link>
        </div>
      </div>
      <div className="container pb-6">
        <p className="text-xs text-muted-foreground/70">
          Arbeitstitel {SITE.name} — finaler Name folgt. Mischung aus dem Besten: Pulse-Dials
          (Bluesky/Threads), Circles (Reddit×Discord), Signals (Stories), Boards (Pinterest),
          Resonance & Essays.
        </p>
      </div>
    </footer>
  );
}
