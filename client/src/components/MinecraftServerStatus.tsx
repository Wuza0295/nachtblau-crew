import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MINECRAFT_SERVERS, PI_SERVER } from "@/lib/site";
import { Server, AlertTriangle, Copy, Check } from "lucide-react";
import { useState } from "react";

function statusLabel(status: string) {
  if (status === "online") return { text: "Online", className: "border-emerald-500/40 text-emerald-400 bg-emerald-950/50" };
  if (status === "setup") return { text: "Setup", className: "border-sky-500/40 text-sky-300 bg-sky-950/50" };
  return { text: "Wartung", className: "border-amber-500/40 text-amber-400 bg-amber-950/50" };
}

function CopyHost({ host }: { host: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(host);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      title="Adresse kopieren"
    >
      {host}
      {ok ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export default function MinecraftServerStatus() {
  return (
    <section className="py-12 border-t border-border bg-card/20">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
            <Server className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Minecraft auf dem Pi
            </h2>
            <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-0.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span>
                Raspberry Pi 4 · LAN{" "}
                <CopyHost host={PI_SERVER.lanHost} />
                {" · "}WAN <CopyHost host={PI_SERVER.wanHost} />
                {" · "}
                {PI_SERVER.note}
              </span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          {MINECRAFT_SERVERS.map((server) => {
            const badge = statusLabel(server.status);
            const joinLan = `${PI_SERVER.lanHost}:${server.port}`;
            return (
              <Card key={server.id} className="bg-card/60 border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{server.name}</span>
                    <Badge variant="outline" className={`text-xs ${badge.className}`}>
                      {badge.text}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Port {server.port} · {server.protocol}
                  </p>
                  <p className="text-xs">
                    <CopyHost host={joinLan} />
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
