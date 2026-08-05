import { BRAND } from "@shared/brand";
import { Link } from "wouter";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 py-10">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-2xl">{BRAND.name}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{BRAND.tagline}</p>
          {BRAND.isWorkingName && (
            <p className="mt-2 text-xs text-muted-foreground/80">
              Arbeitsname — finaler Name folgt.
            </p>
          )}
        </div>
        <div className="flex gap-5 text-sm text-muted-foreground">
          <Link href="/konzept" className="hover:text-foreground">
            Konzept
          </Link>
          <Link href="/feed" className="hover:text-foreground">
            Feed
          </Link>
          <Link href="/kreise" className="hover:text-foreground">
            Kreise
          </Link>
        </div>
      </div>
    </footer>
  );
}
