import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <section className="panel-card">
      <h1>@{user.username}</h1>
      <ul className="profile-list">
        <li>
          <span>Status</span>
          <strong>{user.ageVerified ? "Soft-18+ freigeschaltet" : "Standard"}</strong>
        </li>
        <li>
          <span>Mitglied seit</span>
          <strong>{user.createdAt ? user.createdAt.slice(0, 10) : "—"}</strong>
        </li>
      </ul>
      <div className="hero-actions">
        <a className="btn btn-ghost" href="/profile.php">
          Erweitertes Profil
        </a>
        <Link className="btn btn-ghost" to="/compose">
          Posten
        </Link>
        <button type="button" className="btn btn-danger" onClick={() => void logout()}>
          Logout
        </button>
      </div>
    </section>
  );
}
