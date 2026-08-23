import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function WebspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/webspace" className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors">
            <Globe className="h-5 w-5 text-primary" />
            <span style={{ fontFamily: "Orbitron, sans-serif" }}>NachtBlau Webspace</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Zur Crew
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Ein Unterprojekt von{" "}
        <a href="https://nacht-blau.de" className="text-primary hover:underline">
          nacht-blau.de
        </a>
      </footer>
    </div>
  );
}
