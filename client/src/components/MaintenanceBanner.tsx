import { AlertTriangle } from "lucide-react";
import { SITE } from "@/lib/site";

export default function MaintenanceBanner() {
  if (!SITE.maintenanceMode) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-[60] w-full border-b border-amber-500/40 bg-amber-950/95 text-amber-50 backdrop-blur-sm"
    >
      <div className="container flex items-center justify-center gap-2 px-4 py-2.5 text-center text-sm font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
        <span>{SITE.maintenanceMessage}</span>
      </div>
    </div>
  );
}
