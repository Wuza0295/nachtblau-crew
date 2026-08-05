import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-display text-6xl font-bold brand-mark">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Seite nicht im Spektrum</h1>
        <p className="mt-2 text-muted-foreground">
          Diese Route existiert nicht — zurück zum Einstieg.
        </p>
        <Button className="mt-8 rounded-full" onClick={() => setLocation("/")}>
          <Home className="h-4 w-4 mr-2" />
          Zur Startseite
        </Button>
      </div>
    </div>
  );
}
