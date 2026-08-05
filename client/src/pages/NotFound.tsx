import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-6xl font-extrabold text-coral">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Seite nicht gefunden</h1>
        <p className="mt-3 text-muted-foreground">
          Dieser Pfad existiert in Lumen nicht — zurück zum Feed oder zur Startseite.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => setLocation("/")} variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Start
          </Button>
          <Button onClick={() => setLocation("/app")}>Zum Feed</Button>
        </div>
      </div>
    </div>
  );
}
