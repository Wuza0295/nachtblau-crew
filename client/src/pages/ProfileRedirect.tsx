import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate(`/profil/${user.id}`);
    } else {
      navigate("/");
    }
  }, [user, loading, navigate]);

  return (
    <div className="py-12 container">
      <div className="h-32 bg-card rounded-xl animate-pulse max-w-3xl mx-auto" />
    </div>
  );
}
