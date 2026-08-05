import { SITE } from "@/lib/site";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container py-10 flex flex-col sm:flex-row gap-6 justify-between items-start">
        <div>
          <p className="font-display text-xl font-bold tracking-tight">{SITE.name}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {SITE.tagline}
            {SITE.isWorkingTitle && " · Finaler Name folgt."}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/konzept" className="hover:text-foreground">
            Konzept
          </Link>
          <Link href="/feed" className="hover:text-foreground">
            Feed
          </Link>
          <Link href="/raeume" className="hover:text-foreground">
            Räume
          </Link>
          <a href={`mailto:${SITE.contactEmail}`} className="hover:text-foreground">
            Kontakt
          </a>
        </div>
      </div>
    </footer>
  );
}
