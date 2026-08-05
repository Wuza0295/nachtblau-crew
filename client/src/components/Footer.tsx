import { SITE } from "@/lib/site";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 py-10">
      <div className="container flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div>
          <div className="font-display text-2xl brand-mark font-bold">{SITE.name}</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">{SITE.tagline}</p>
          <p className="text-xs text-muted-foreground mt-3 uppercase tracking-[0.18em]">
            Arbeitsname · finaler Name folgt
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/home" className="hover:text-foreground">
            Feed
          </Link>
          <Link href="/algorithm" className="hover:text-foreground">
            Algorithmus
          </Link>
          <Link href="/ueber" className="hover:text-foreground">
            Konzept
          </Link>
          <Link href="/circles" className="hover:text-foreground">
            Circles
          </Link>
        </div>
      </div>
    </footer>
  );
}
