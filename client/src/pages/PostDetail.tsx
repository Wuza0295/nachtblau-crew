import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import PostCard from "@/components/social/PostCard";
import { ArrowLeft } from "lucide-react";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const { data: post, isLoading } = trpc.social.post.useQuery(
    { id: params.id ?? "" },
    { enabled: Boolean(params.id) }
  );

  if (isLoading) {
    return <div className="container py-12 text-muted-foreground">Lade Beitrag…</div>;
  }
  if (!post) {
    return (
      <div className="container py-12">
        Beitrag nicht gefunden.{" "}
        <Link href="/feed" className="text-primary">
          Zum Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Link
        href="/feed"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zum Feed
      </Link>
      <PostCard post={post} />
    </div>
  );
}
