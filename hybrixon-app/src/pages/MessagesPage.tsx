import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function MessagesPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <section className="panel-card">
      <h1>Direktnachrichten</h1>
      <p className="muted">
        DMs laufen über die PHP-Engine (18+). Für den vollständigen Chat öffne die klassische Ansicht.
      </p>
      <a className="btn" href="/messages.php">
        Nachrichten öffnen
      </a>
    </section>
  );
}
