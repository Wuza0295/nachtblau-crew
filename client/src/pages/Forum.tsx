import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  MessageSquare,
  Monitor,
  Gamepad2,
  Flame,
  Gift,
  Users,
  Plus,
  ChevronRight,
} from "lucide-react";
import MaintenanceNotice from "@/components/MaintenanceNotice";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Monitor,
  Gamepad2,
  Flame,
  Gift,
  Users,
};

export default function Forum() {
  const { data: categories, isLoading } = trpc.forum.getCategories.useQuery();
  const { isAuthenticated } = useAuth();

  return (
    <div className="py-12">
      <div className="container space-y-6">
        <MaintenanceNotice />
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/15 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h1
                className="text-3xl font-bold gradient-text"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Community Forum
              </h1>
            </div>
            <p className="text-muted-foreground">
              Diskutiere mit der NachtBlau Crew über Gaming, Spiele und mehr.
            </p>
          </div>

          {isAuthenticated ? (
            <Link href="/forum/neu">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                Neuer Thread
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 gap-2"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Anmelden zum Posten
            </Button>
          )}
        </div>

        {/* Categories */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (categories ?? []).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Forum wird vorbereitet</p>
            <p className="text-sm mt-1">Kategorien werden beim nächsten Start angelegt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(categories ?? []).map((cat) => {
              const Icon = ICONS[cat.icon ?? "MessageSquare"] ?? MessageSquare;
              return (
                <Link key={cat.id} href={`/forum/kategorie/${cat.slug}`}>
                  <Card className="card-glow bg-card border-border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 group">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {cat.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-10 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <MessageSquare className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
            <h3 className="font-semibold text-foreground mb-1">Werde Teil der Community!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Melde dich an, um Threads zu erstellen und zu kommentieren.
            </p>
            <Button
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Jetzt anmelden
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
