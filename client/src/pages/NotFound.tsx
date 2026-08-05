import { Link } from "wouter";
import { SITE } from "@shared/site";

export default function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-[var(--lyra-teal-deep)]/20">404</p>
      <h1 className="font-display text-2xl font-bold mt-2">Diese Frequenz gibt es nicht</h1>
      <p className="mt-2 text-muted-foreground">Zurück zu {SITE.name}.</p>
      <Link
        href="/app"
        className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
      >
        Zum Feed
      </Link>
    </div>
  );
}
