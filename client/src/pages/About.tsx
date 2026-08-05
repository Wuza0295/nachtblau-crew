import { SITE, PORTAL_FEATURES } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function About() {
  return (
    <div className="container py-12 max-w-3xl pb-24">
      <h1 className="font-display text-3xl font-bold mb-4">Über das Portal</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">{SITE.description}</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        {PORTAL_FEATURES.map((f) => (
          <Card key={f.title} className="portal-card border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{f.title}</CardTitle>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.subtitle}</p>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{f.description}</CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center portal-card rounded-2xl p-8 border border-dashed border-border">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
        <p className="font-display font-semibold">Markenname folgt</p>
        <p className="text-sm text-muted-foreground mt-2">
          Du entscheidest den Namen — die Architektur steht bereits.
        </p>
        <Link href="/feed">
          <Button className="mt-4 rounded-full">Feed öffnen</Button>
        </Link>
      </div>
    </div>
  );
}
