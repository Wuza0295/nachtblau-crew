import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRight, Layers, Palette, Cpu, Heart, MapPin } from "lucide-react";

const ICONS: Record<string, typeof Layers> = {
  Palette,
  Cpu,
  Heart,
  MapPin,
  Layers,
};

function CircleIcon({ name }: { name: string | null }) {
  const Icon = (name && ICONS[name]) || Layers;
  return <Icon className="h-5 w-5" />;
}

export default function Circles() {
  const { data: circles, isLoading } = trpc.social.getCircles.useQuery();

  return (
    <div className="container py-8 pb-24 md:pb-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Kreise</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Reddit-Tiefe trifft Discord-Gefühl — Nischen-Communities ohne Algorithmus-Zwang. Joinen,
          posten, moderieren.
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(circles ?? []).map((circle) => (
            <Link key={circle.id} href={`/kreise/${circle.slug}`}>
              <Card className="portal-card h-full border-border/70 hover:border-primary/40 transition-all duration-200 cursor-pointer group hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="pb-2 flex flex-row items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: circle.accentColor ?? "oklch(0.2 0.04 280)" }}
                  >
                    <CircleIcon name={circle.icon} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {circle.name}
                      {circle.isOfficial && (
                        <Badge variant="outline" className="text-[10px]">
                          Official
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {(circle.memberCount ?? 0).toLocaleString("de-DE")} Mitglieder
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{circle.description}</p>
                  <span className="inline-flex items-center gap-1 text-primary text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Beitreten <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
