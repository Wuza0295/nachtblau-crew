import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

/** Redirect /profil → own profile or demo user 1 */
export default function ProfileRedirect() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return null;
  const id = isAuthenticated && user?.id ? user.id : 1;
  return <Redirect to={`/profil/${id}`} />;
}
