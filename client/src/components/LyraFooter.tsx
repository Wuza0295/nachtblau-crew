import { Link } from "wouter";
import { SITE } from "@shared/site";

export default function LyraFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60">
      <div className="container py-10 flex flex-col sm:flex-row gap-6 justify-between items-start">
        <div>
          <p className="font-display text-xl font-bold text-[var(--lyra-teal-deep)]">{SITE.name}</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">{SITE.claim}</p>
          <p className="mt-3 text-xs text-muted-foreground/80">
            Arbeitstitel — der finale Name kommt später.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <Link href="/app" className="text-muted-foreground hover:text-foreground">
            App
          </Link>
          <Link href="/circles" className="text-muted-foreground hover:text-foreground">
            Circles
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            Konzept
          </Link>
        </div>
      </div>
    </footer>
  );
}
