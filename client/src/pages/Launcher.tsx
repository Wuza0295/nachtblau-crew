import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LAUNCHER, SITE } from "@/lib/site";
import { Link } from "wouter";
import {
  Smartphone,
  Download,
  Globe,
  Monitor,
  ExternalLink,
  Gamepad2,
  BookOpen,
  Rocket,
  Shield,
  Wifi,
} from "lucide-react";

const TITLES = [
  {
    icon: Gamepad2,
    title: "Twilight Crown",
    desc: "Action-Adventure im SNES-Zelda-Stil — direkt im Hub starten.",
  },
  {
    icon: Rocket,
    title: "Bluepole Grand Prix",
    desc: "NachtBlau-Kart mit Drift, Mini-Turbo und Touch-Steuerung.",
  },
  {
    icon: Shield,
    title: "NachtBlau Lumina",
    desc: "Minecraft Java + Bedrock + Geyser. Join-Hub mit Status und IPs.",
  },
  {
    icon: BookOpen,
    title: "Symbiose",
    desc: "Band 1 und die Illustrationen — frei lesbar im Launcher.",
  },
];

export default function Launcher() {
  return (
    <div className="py-12">
      <div className="container max-w-5xl space-y-12">
        <div className="text-center space-y-5">
          <img
            src={SITE.logoUrl}
            alt={SITE.name}
            className="h-24 w-24 mx-auto object-contain animate-float"
          />
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 uppercase tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Android App {LAUNCHER.version}
          </Badge>
          <h1
            className="text-4xl md:text-5xl font-black gradient-text"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {LAUNCHER.name}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {LAUNCHER.tagline} Die App lädt immer live vom Webspace — derselbe Stand wie auf dem
            PC und unter Linux.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={LAUNCHER.androidUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-xl shadow-primary/25"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Launcher auf Android öffnen
              </Button>
            </a>
            <a href={LAUNCHER.webUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
              >
                <Globe className="mr-2 h-5 w-5" />
                Im Browser spielen
              </Button>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Smartphone,
              title: "Android-App",
              desc: `Native WebView-App (${LAUNCHER.appId}). Spiele und Bücher vom Hub, Vollbild und Deep Links.`,
            },
            {
              icon: Wifi,
              title: "Immer Webspace",
              desc: "Kein Extra-Sync. Android, Linux und Browser lesen live launcher.nachtblau-interactive.com.",
            },
            {
              icon: Monitor,
              title: "Linux & Web",
              desc: "Auf Bazzite über linux.html, im Browser über die Hub-Startseite — gleicher Katalog.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="card-glow bg-card border-border h-full">
              <CardContent className="p-5 space-y-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
                  <Icon className="h-5 w-5" />
                </div>
                <h2
                  className="font-semibold text-foreground"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="space-y-4">
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Im Hub enthalten
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TITLES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-card border-border">
                <CardContent className="p-5 flex gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary h-fit">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Installation
          </h2>
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                <span className="font-semibold text-foreground">Schnell:</span> Öffne{" "}
                <a
                  href={LAUNCHER.androidUrl}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {LAUNCHER.androidUrl}
                </a>{" "}
                im Chrome auf dem Handy und wähle „Zum Startbildschirm hinzufügen“.
              </p>
              <p>
                <span className="font-semibold text-foreground">Als App:</span> Im Repo liegt die
                native Android-App unter <code className="text-foreground">android/nachtblau-hub/</code>.
                Mit Android Studio oder{" "}
                <code className="text-foreground">./gradlew assembleDebug</code> entsteht die APK
                (`de.nachtblau.hub`). GitHub Actions baut sie bei Änderungen automatisch.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-primary/40 text-primary gap-2">
                    <Download className="h-4 w-4" />
                    Quellcode auf GitHub
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
                <Link href="/ueber-uns">
                  <Button variant="ghost" className="text-muted-foreground">
                    Mehr zum Netzwerk
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
