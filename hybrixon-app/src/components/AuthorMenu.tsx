import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiOpenDm } from "../lib/api";
import { useAuth } from "../lib/auth";

type Props = {
  username: string;
  displayName?: string;
};

export function AuthorMenu({ username, displayName }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const label = displayName && displayName !== "" ? displayName : `@${username}`;
  const isSelf = user?.username.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const startDm = async () => {
    setError("");
    try {
      const res = await apiOpenDm(username);
      window.location.href = res.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "PN nicht möglich");
    }
  };

  return (
    <div className="author-menu" ref={root}>
      <button
        type="button"
        className="author-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? (
        <div className="author-menu-panel" role="menu">
          <Link to={`/u/${username}`} role="menuitem" onClick={() => setOpen(false)}>
            Profil ansehen
          </Link>
          {!isSelf && user ? (
            <button type="button" className="author-menu-btn" role="menuitem" onClick={() => void startDm()}>
              Nachricht schreiben
            </button>
          ) : null}
          {!isSelf && !user ? (
            <Link to="/login" role="menuitem" onClick={() => setOpen(false)}>
              Anmelden für PN
            </Link>
          ) : null}
          {error ? <span className="muted">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
