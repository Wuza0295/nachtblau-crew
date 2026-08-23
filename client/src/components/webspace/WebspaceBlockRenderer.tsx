import type { WebspaceBlock, WebspaceTheme } from "@shared/webspace";
import { ExternalLink } from "lucide-react";

const themeClasses: Record<WebspaceTheme, string> = {
  midnight: "bg-[oklch(0.09_0.025_250)] text-[oklch(0.93_0.015_220)]",
  neon: "bg-[oklch(0.08_0.04_280)] text-[oklch(0.95_0.02_220)]",
  clean: "bg-[oklch(0.98_0.01_250)] text-[oklch(0.2_0.02_250)]",
};

function HeroBlock({ block, theme }: { block: Extract<WebspaceBlock, { type: "hero" }>; theme: WebspaceTheme }) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border ${
        theme === "clean" ? "border-black/10" : "border-white/10"
      }`}
    >
      {block.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${block.imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
      )}
      <div className="relative p-8 md:p-12 space-y-3">
        <h1
          className="text-4xl md:text-5xl font-black"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          {block.title}
        </h1>
        <p className={`text-lg max-w-2xl ${theme === "clean" ? "text-black/70" : "text-white/70"}`}>
          {block.subtitle}
        </p>
      </div>
    </section>
  );
}

function TextBlock({ block, theme }: { block: Extract<WebspaceBlock, { type: "text" }>; theme: WebspaceTheme }) {
  return (
    <section
      className={`rounded-2xl border p-6 md:p-8 ${
        theme === "clean" ? "border-black/10 bg-white" : "border-white/10 bg-white/5"
      }`}
    >
      <p className="leading-relaxed whitespace-pre-wrap">{block.content}</p>
    </section>
  );
}

function LinksBlock({ block, theme }: { block: Extract<WebspaceBlock, { type: "links" }>; theme: WebspaceTheme }) {
  return (
    <section className="space-y-4">
      {block.heading ? (
        <h2 className="text-xl font-bold" style={{ fontFamily: "Orbitron, sans-serif" }}>
          {block.heading}
        </h2>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {block.items.map((item) => (
          <a
            key={`${item.label}-${item.url}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
              theme === "clean"
                ? "border-black/10 bg-white hover:border-primary/40"
                : "border-white/10 bg-white/5 hover:border-primary/40"
            }`}
          >
            <span className="font-medium">{item.label}</span>
            <ExternalLink className="h-4 w-4 opacity-60" />
          </a>
        ))}
      </div>
    </section>
  );
}

function ImageBlock({ block, theme }: { block: Extract<WebspaceBlock, { type: "image" }>; theme: WebspaceTheme }) {
  return (
    <figure
      className={`overflow-hidden rounded-2xl border ${
        theme === "clean" ? "border-black/10" : "border-white/10"
      }`}
    >
      <img src={block.url} alt={block.alt ?? ""} className="w-full object-cover max-h-[420px]" />
      {block.caption ? (
        <figcaption className={`px-4 py-3 text-sm ${theme === "clean" ? "text-black/60" : "text-white/60"}`}>
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function WebspaceBlockRenderer({
  blocks,
  theme,
}: {
  blocks: WebspaceBlock[];
  theme: WebspaceTheme;
}) {
  return (
    <div className={`min-h-screen ${themeClasses[theme]}`}>
      <div className="container max-w-4xl py-10 space-y-8">
        {blocks.map((block) => {
          switch (block.type) {
            case "hero":
              return <HeroBlock key={block.id} block={block} theme={theme} />;
            case "text":
              return <TextBlock key={block.id} block={block} theme={theme} />;
            case "links":
              return <LinksBlock key={block.id} block={block} theme={theme} />;
            case "image":
              return <ImageBlock key={block.id} block={block} theme={theme} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
