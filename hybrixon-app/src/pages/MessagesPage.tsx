import { useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { apiOpenDm } from "../lib/api";
import { useAuth } from "../lib/auth";

export function MessagesPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const to = (params.get("to") || "").trim();

  useEffect(() => {
    if (!user || !to) return;
    void apiOpenDm(to)
      .then((r) => {
        window.location.href = r.url;
      })
      .catch(() => {
        // stay on page with classic fallback link
      });
  }, [user, to]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <section className="panel-card">
      <h1>Direktnachrichten</h1>
      <p className="muted">
        PNs starten über Profil oder Klick auf den Namen im Post. Der Chat läuft in der
        klassischen Ansicht (18+).
      </p>
      {to ? (
        <p className="pad-sm">
          Öffne PN an <strong>@{to}</strong>…
        </p>
      ) : null}
      <div className="hero-actions pad-sm">
        <a className="btn" href={to ? `/messages.php?to=${encodeURIComponent(to)}` : "/messages.php"}>
          Nachrichten öffnen
        </a>
        <Link className="btn btn-ghost" to="/">
          Zum Feed
        </Link>
      </div>
    </section>
  );
}
