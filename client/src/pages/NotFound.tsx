import { Link } from "wouter";
import { Logo } from "@/components/CadenceNav";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center gap-4">
      <Logo />
      <h1 className="font-display text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Diese Frequenz gibt es nicht.</p>
      <Link href="/" className="text-primary font-semibold hover:underline">
        Zurück zu Cadence
      </Link>
    </div>
  );
}
