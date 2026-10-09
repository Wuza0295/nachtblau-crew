import { SITE } from "@/lib/site";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="py-12">
      <div className="container max-w-md">
        <div className="mb-8 space-y-3 text-center">
          <img src={SITE.logoUrl} alt={SITE.name} className="logo-bob mx-auto h-16 w-16 object-contain" />
          <h1 className="text-3xl font-black gradient-text" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Card className="card-glow border-border bg-card">
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
