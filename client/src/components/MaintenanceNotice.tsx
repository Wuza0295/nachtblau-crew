import { AlertTriangle } from "lucide-react";
import { SITE } from "@/lib/site";

export default function MaintenanceNotice({ compact = false }: { compact?: boolean }) {
  if (!SITE.maintenanceMode) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/40 text-amber-100 ${
        compact ? "p-3 text-sm" : "p-4"
      }`}
      role="status"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden />
      <div>
        <p className="font-semibold">Wartungsmodus</p>
        <p className={compact ? "text-amber-100/90 mt-0.5" : "text-amber-100/90 mt-1"}>
          {SITE.maintenanceMessage} Forum, News und weitere Dienste können eingeschränkt sein.
        </p>
      </div>
    </div>
  );
}
