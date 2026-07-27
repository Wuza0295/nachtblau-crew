import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { EXTERNAL_LINKS, SITE } from "@/lib/site";
import {
  ExternalLink,
  Github,
  Globe,
  Mail,
  Gamepad2,
  Gift,
  Newspaper,
  MessageSquare,
  Users,
} from "lucide-react";

const LINK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [SITE.webspaceUrl]: Globe,
  [SITE.githubUrl]: Github,
  [`mailto:${SITE.contactEmail}`]: Mail,
};

export default function About() {
  return (
    <div className="py-12">
      <div className="container max-w-4xl space-y-10">
        <div className="text-center space-y-4">
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
            Gaming Community
          </Badge>
          <h1
            className="text-4xl font-black gradient-text"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {SITE.name}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {SITE.tagline} Entdecke kostenlose Spiele, aktuelle Gaming-News und tausche dich
            im Community-Forum aus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Gift, label: "Free Games", href: "/free-games" },
            { icon: Newspaper, label: "Gaming News", href: "/news" },
            { icon: MessageSquare, label: "Forum", href: "/forum" },
            { icon: Users, label: "Community", href: "/forum" },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href}>
              <Card className="card-glow bg-card border-border h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
                <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                  <div className="p-3 rounded-full bg-primary/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-foreground">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <section className="space-y-4">
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            NachtBlau Netzwerk
          </h2>
          <p className="text-muted-foreground">
            Die NachtBlau Crew App ist Teil des NachtBlau-Ökosystems. Hier findest du alle
            wichtigen Verknüpfungen zu Webspace und GitHub.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXTERNAL_LINKS.map((link) => {
              const Icon = LINK_ICONS[link.href] ?? ExternalLink;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="card-glow bg-card border-border h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {link.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {link.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        Öffnen <ExternalLink className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gamepad2 className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Bereit loszulegen?</p>
                <p className="text-sm text-muted-foreground">
                  Entdecke Free Games, News und das Forum.
                </p>
              </div>
            </div>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
                Zur Startseite
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
