import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, SearchX } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4">
      <Card className="w-full max-w-lg card-glow bg-card border-border">
        <CardContent className="pt-10 pb-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
              <SearchX className="relative h-16 w-16 text-primary" />
            </div>
          </div>

          <h1
            className="text-5xl font-black gradient-text mb-2"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            404
          </h1>

          <h2 className="text-xl font-semibold text-foreground mb-4">Seite nicht gefunden</h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>

          <Button
            onClick={() => setLocation("/")}
            className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2"
          >
            <Home className="h-4 w-4" />
            Zur Startseite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
