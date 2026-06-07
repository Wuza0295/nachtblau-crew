import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  Pin,
  Lock,
  Eye,
  MessageCircle,
  Clock,
} from "lucide-react";

export default function ForumCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const { data: category, isLoading: catLoading } = trpc.forum.getCategoryBySlug.useQuery({
    slug: slug ?? "",
  });

  const { data: threads, isLoading: threadsLoading } = trpc.forum.getThreadsByCategory.useQuery(
    { categoryId: category?.id ?? 0 },
    { enabled: !!category?.id }
  );

  if (catLoading) {
    return (
      <div className="py-12 container">
        <div className="h-8 w-48 bg-card rounded animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-12 container text-center text-muted-foreground">
        Kategorie nicht gefunden.
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Forum
          </Link>
          <span>/</span>
          <span className="text-foreground">{category.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-bold gradient-text"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {category.name}
            </h1>
            <p className="text-muted-foreground mt-1">{category.description}</p>
          </div>

          {isAuthenticated ? (
            <Link href={`/forum/neu?kategorie=${category.id}`}>
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
              Anmelden
            </Button>
          )}
        </div>

        {/* Threads */}
        {threadsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !threads || threads.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Noch keine Threads</p>
            <p className="text-sm mt-1">Sei der Erste und erstelle einen Thread!</p>
            {isAuthenticated && (
              <Link href={`/forum/neu?kategorie=${category.id}`}>
                <Button className="mt-4 bg-primary hover:bg-primary/80 text-primary-foreground gap-2">
                  <Plus className="h-4 w-4" />
                  Thread erstellen
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map(({ thread, author }) => (
              <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
                <Card className="card-glow bg-card border-border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {thread.isPinned && (
                          <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        )}
                        {thread.isLocked && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {thread.title}
                        </h3>
                        {thread.isPinned && (
                          <Badge className="text-xs bg-primary/20 text-primary border-primary/30 flex-shrink-0">
                            Angepinnt
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>von {author.name ?? "Unbekannt"}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(thread.createdAt).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {thread.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {thread.replyCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
