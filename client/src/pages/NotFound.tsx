import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4">
      <div className="mist-panel w-full max-w-lg rounded-3xl px-8 py-12 text-center">
        <SearchX className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-6 font-display text-5xl">404</h1>
        <h2 className="mt-2 text-xl font-semibold">Seite nicht gefunden</h2>
        <p className="mt-3 text-muted-foreground">
          Diese Route gibt es hier nicht — zurück zum Feed oder zur Startseite.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => setLocation("/")} className="rounded-full gap-2">
            <Home className="h-4 w-4" />
            Start
          </Button>
          <Button
            variant="secondary"
            onClick={() => setLocation("/feed")}
            className="rounded-full"
          >
            Feed
          </Button>
        </div>
      </div>
    </div>
  );
}
