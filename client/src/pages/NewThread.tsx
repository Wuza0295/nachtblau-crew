import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ChevronLeft, Plus, MessageSquare } from "lucide-react";

export default function NewThread() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedCategoryId = params.get("kategorie");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(preselectedCategoryId ?? "");

  const { data: categories } = trpc.forum.getCategories.useQuery();

  const createThread = trpc.forum.createThread.useMutation({
    onSuccess: ({ insertId }) => {
      toast.success("Thread erstellt!");
      navigate(insertId > 0 ? `/forum/thread/${insertId}` : "/forum");
    },
    onError: (err) => {
      toast.error(err.message ?? "Fehler beim Erstellen");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="py-12 container max-w-2xl text-center">
        <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4 opacity-60" />
        <h2 className="text-xl font-bold text-foreground mb-2">Anmeldung erforderlich</h2>
        <p className="text-muted-foreground mb-4">
          Du musst angemeldet sein, um einen Thread zu erstellen.
        </p>
        <Button
          className="bg-primary hover:bg-primary/80 text-primary-foreground"
          onClick={() => (window.location.href = getLoginUrl())}
        >
          Jetzt anmelden
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Bitte wähle eine Kategorie");
      return;
    }
    if (!title.trim() || title.length < 3) {
      toast.error("Titel muss mindestens 3 Zeichen lang sein");
      return;
    }
    if (!content.trim() || content.length < 10) {
      toast.error("Inhalt muss mindestens 10 Zeichen lang sein");
      return;
    }
    createThread.mutate({
      categoryId: parseInt(categoryId),
      title: title.trim(),
      content: content.trim(),
    });
  };

  return (
    <div className="py-12">
      <div className="container max-w-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Forum
          </Link>
          <span>/</span>
          <span className="text-foreground">Neuer Thread</span>
        </div>

        <Card className="bg-card border-border card-glow">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2 gradient-text"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <Plus className="h-5 w-5 text-primary" />
              Neuen Thread erstellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Kategorie *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-input border-border focus:border-primary/50">
                    <SelectValue placeholder="Kategorie wählen..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(categories ?? []).map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Titel *</Label>
                <Input
                  placeholder="Thread-Titel eingeben..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={256}
                  className="bg-input border-border focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground text-right">{title.length}/256</p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Inhalt *</Label>
                <Textarea
                  placeholder="Schreibe deinen Beitrag..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-input border-border focus:border-primary/50 min-h-40 resize-y"
                />
                <p className="text-xs text-muted-foreground">{content.length} Zeichen</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createThread.isPending}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2 flex-1"
                >
                  <Plus className="h-4 w-4" />
                  {createThread.isPending ? "Wird erstellt..." : "Thread erstellen"}
                </Button>
                <Link href="/forum">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-foreground"
                  >
                    Abbrechen
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
