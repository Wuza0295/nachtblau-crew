import { SITE } from "@/lib/site";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 py-8 mt-auto">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
        <Link href="/" className="font-display font-600 text-foreground">
          {SITE.name}
        </Link>
        <span>Arbeitstitel · Finaler Name folgt</span>
      </div>
    </footer>
  );
}
