import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MINECRAFT_SERVERS, SITE } from "@/lib/site";
import { Server, AlertTriangle } from "lucide-react";

export default function MinecraftServerStatus() {
  if (!SITE.maintenanceMode) return null;

  return (
    <section className="py-12 border-t border-border bg-card/20">
      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Minecraft-Server
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Alle Server derzeit offline – Wartungsarbeiten
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          {MINECRAFT_SERVERS.map((server) => (
            <Card key={server.id} className="bg-card/60 border-amber-500/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{server.name}</span>
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-400 bg-amber-950/50 text-xs"
                  >
                    Wartung
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Port {server.port} · {server.protocol}
                </p>
                <p className="text-xs text-amber-400/80">Offline</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
