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
  Home,
  CheckCircle2,
  FolderOpen,
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
            Erstellung und Test am Smartphone: den Ordner **NachtBlau-Hub** in Code Assist
            öffnen — daraus wird die APK gebaut.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={LAUNCHER.codeAssistZipUrl}>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-xl shadow-primary/25"
              >
                <FolderOpen className="mr-2 h-5 w-5" />
                Ordner NachtBlau-Hub
              </Button>
            </a>
            <a href={LAUNCHER.androidUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Jetzt am Handy testen
              </Button>
            </a>
            <a href={LAUNCHER.apkUrl}>
              <Button
                size="lg"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
              >
                <Download className="mr-2 h-5 w-5" />
                APK installieren
              </Button>
            </a>
          </div>
        </div>

        <section className="space-y-4">
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Testen am Smartphone
          </h2>
          <p className="text-sm text-muted-foreground">
            Code Assist auf dem Handy: ZIP entpacken, den Ordner{" "}
            <span className="text-foreground font-medium">NachtBlau-Hub</span> öffnen, APK bauen
            lassen. Der Hub selbst ist ohne App sofort testbar.
          </p>
          <Card className="card-glow bg-primary/10 border-primary/30">
            <CardContent className="p-5 space-y-3">
              <h3
                className="font-semibold text-foreground"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Code Assist — Ordner öffnen
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ZIP herunterladen, entpacken. Es entsteht der Ordner{" "}
                <code className="text-foreground">NachtBlau-Hub</code>. Diesen Ordner in Code
                Assist öffnen und die Debug-APK bauen lassen.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={LAUNCHER.codeAssistZipUrl}>
                  <Button className="bg-primary text-primary-foreground gap-2">
                    <Download className="h-4 w-4" />
                    NachtBlau-Hub.zip
                  </Button>
                </a>
                <a href={LAUNCHER.codeAssistFolderUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-primary/40 text-primary gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Ordner auf GitHub
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-glow bg-card border-border h-full">
              <CardContent className="p-5 space-y-3">
                <Badge className="bg-primary/20 text-primary border-0">1</Badge>
                <h3
                  className="font-semibold text-foreground"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Hub öffnen
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Kein Installieren. Chrome oder Firefox auf dem Handy öffnet den Live-Launcher.
                </p>
                <a href={LAUNCHER.androidUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-primary text-primary-foreground gap-2">
                    <Smartphone className="h-4 w-4" />
                    android.html öffnen
                  </Button>
                </a>
              </CardContent>
            </Card>
            <Card className="card-glow bg-card border-border h-full">
              <CardContent className="p-5 space-y-3">
                <Badge className="bg-primary/20 text-primary border-0">2</Badge>
                <h3
                  className="font-semibold text-foreground"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  APK sideloaden
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  APK antippen, „unbekannte Apps“ erlauben, installieren. Danach Hub-Icon auf
                  dem Startbildschirm.
                </p>
                <a href={LAUNCHER.apkUrl}>
                  <Button variant="outline" className="w-full border-primary/40 text-primary gap-2">
                    <Download className="h-4 w-4" />
                    NachtBlau-Hub.apk
                  </Button>
                </a>
              </CardContent>
            </Card>
            <Card className="card-glow bg-card border-border h-full">
              <CardContent className="p-5 space-y-3">
                <Badge className="bg-primary/20 text-primary border-0">3</Badge>
                <h3
                  className="font-semibold text-foreground"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  Zum Startbildschirm
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  In Chrome: Menü → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.
                </p>
                <a href={LAUNCHER.androidUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" className="w-full text-muted-foreground gap-2">
                    <Home className="h-4 w-4" />
                    Chrome-Shortcut
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: CheckCircle2,
              title: "Sofort testbar",
              desc: "Code Assist am Smartphone öffnet denselben Live-Hub. Änderungen am Webspace sind ohne neuen Build sichtbar.",
            },
            {
              icon: Wifi,
              title: "Immer Webspace",
              desc: "Android, Linux und Browser lesen live launcher.nachtblau-interactive.com — kein Extra-Sync.",
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
            APK-Download
          </h2>
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                GitHub Actions baut die Debug-APK bei jedem Push. Am Handy: Datei antippen,
                Installation unbekannter Apps erlauben, öffnen. Paket{" "}
                <code className="text-foreground">{LAUNCHER.appId}</code> · Version {LAUNCHER.version}.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href={LAUNCHER.apkUrl}>
                  <Button className="bg-primary text-primary-foreground gap-2">
                    <Download className="h-4 w-4" />
                    APK herunterladen
                  </Button>
                </a>
                <a href={LAUNCHER.apkNightlyUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-primary/40 text-primary gap-2">
                    Alternative (ZIP)
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
                <a href={LAUNCHER.actionsUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" className="text-muted-foreground gap-2">
                    Build neu anstoßen
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
                <a href={LAUNCHER.webUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" className="text-muted-foreground gap-2">
                    <Globe className="h-4 w-4" />
                    Hub im Browser
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
