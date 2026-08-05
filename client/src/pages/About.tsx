import { MiraShell } from "@/components/mira/MiraShell";
import { SITE } from "@/lib/site";
import { PLATFORM_DNA } from "@shared/mira";
import { Link } from "wouter";

export default function About() {
  return (
    <MiraShell>
      <div className="max-w-2xl fade-up">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Über das Projekt
        </p>
        <h1 className="font-display text-4xl font-700 tracking-tight">
          {SITE.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {SITE.description}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Arbeitstitel – der finale Name kommt später.
        </p>
        <div className="mt-10 space-y-6">
          {PLATFORM_DNA.map((item) => (
            <div key={item.from} className="border-t border-border pt-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {item.from}
              </p>
              <p className="font-display font-600 text-lg mt-1">{item.take}</p>
              <p className="text-sm text-muted-foreground">{item.why}</p>
            </div>
          ))}
        </div>
        <Link
          href="/app"
          className="inline-flex mt-10 rounded-full bg-[var(--mira-jade)] text-primary-foreground px-5 py-2.5 text-sm font-medium"
        >
          Zum Feed
        </Link>
      </div>
    </MiraShell>
  );
}
