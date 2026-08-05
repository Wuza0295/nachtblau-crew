import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4 mist-bg">
      <div className="text-center max-w-md animate-rise">
        <p className="font-display text-6xl font-bold text-primary/30 mb-2">404</p>
        <h1 className="font-display text-2xl font-bold mb-3">Seite nicht gefunden</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Diese Frequenz gibt es nicht — zurück zum Feed oder zur Startseite.
        </p>
        <Button onClick={() => setLocation("/")} className="rounded-full gap-2 px-6">
          <Home className="h-4 w-4" />
          Zur Startseite
        </Button>
      </div>
    </div>
  );
}
