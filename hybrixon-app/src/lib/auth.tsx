import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGetMe, apiLogin, apiLogout, apiRegister, type User } from "./api";

type AuthState = {
  user: User | null;
  brand: { name: string; tagline: string };
  loading: boolean;
  refresh: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: {
    username: string;
    email: string;
    password: string;
    birthdate: string;
    legalOk: boolean;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [brand, setBrand] = useState({ name: "Hybrixon", tagline: "Closer. Freer." });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiGetMe();
    setUser(data.user);
    setBrand(data.brand);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      brand,
      loading,
      refresh,
      login: async (login, password) => {
        const data = await apiLogin(login, password);
        setUser(data.user);
      },
      logout: async () => {
        await apiLogout();
        setUser(null);
      },
      register: async (input) => {
        const data = await apiRegister(input);
        setUser(data.user);
      },
    }),
    [user, brand, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
