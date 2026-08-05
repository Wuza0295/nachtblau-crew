import { SITE } from "@/lib/site";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-8 mt-auto">
      <div className="container text-center text-xs text-muted-foreground space-y-2">
        <p>
          {SITE.shortName} · {SITE.codename}
        </p>
        <p>{SITE.tagline}</p>
        <Link href="/feed" className="text-primary hover:underline">
          Zum Feed
        </Link>
      </div>
    </footer>
  );
}
