import { Loader2 } from "lucide-react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { WebspaceBlockRenderer } from "@/components/webspace/WebspaceBlockRenderer";
import { getWebspaceSlugFromHost } from "@/lib/webspaceHost";

export default function WebspacePublicSite() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? getWebspaceSlugFromHost() ?? "";

  const { data, isLoading, error } = trpc.webspace.getPublicSite.useQuery(
    { slug },
    { enabled: Boolean(slug) }
  );

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Keine Webspace-Seite gefunden.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Diese Seite ist nicht veröffentlicht oder existiert nicht.</p>
        <a href="/webspace" className="text-primary hover:underline">
          Zum Webspace
        </a>
      </div>
    );
  }

  return <WebspaceBlockRenderer blocks={data.blocks} theme={data.theme} />;
}
