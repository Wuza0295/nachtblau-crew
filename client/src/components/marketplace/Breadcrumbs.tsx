import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-4">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-primary transition-colors truncate max-w-[10rem]">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-foreground font-medium truncate max-w-[14rem]" : "truncate"}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
