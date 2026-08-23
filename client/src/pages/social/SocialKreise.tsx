import SocialShell from "@/components/social/SocialShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SocialKreise() {
  const { isAuthenticated } = useAuth();
  const { data: communities, isLoading } = trpc.social.getCommunities.useQuery();
  const joinMut = trpc.social.joinCommunity.useMutation({
    onSuccess: (r) =>
      toast.success(r.already ? "Du bist schon Mitglied" : "Willkommen im Kreis"),
  });

  return (
    <SocialShell>
      <div className="py-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            Kreise
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Persistente Communities mit öffentlichem Feed — Reddit-Tiefe trifft Discord-Zugehörigkeit.
          </p>
        </div>

        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {communities?.map((c) => (
              <Card
                key={c.id}
                className="border-white/10 bg-card/40 backdrop-blur-sm overflow-hidden group hover:border-[oklch(0.65_0.22_310/0.4)] transition-colors duration-200"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{c.iconEmoji}</span>
                    {c.name}
                  </CardTitle>
                  <CardDescription>{c.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {c.memberCount?.toLocaleString("de-DE")} Mitglieder
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/portal?kreis=${c.slug}`}>
                      <Button size="sm" variant="outline" className="rounded-full">
                        Feed
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="rounded-full gap-1"
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.message("Anmelden zum Beitreten");
                          return;
                        }
                        joinMut.mutate({ communityId: c.id });
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Beitreten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SocialShell>
  );
}
