import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type UserRole = "admin" | "student" | null;

type AuthContextValue = {
  userRole: UserRole;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = "CampusEventsAI:userRole";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const role = stored === "admin" || stored === "student" ? stored : null;
        if (!cancelled) setUserRole(role);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim();

      if (normalizedEmail === "admin@campus.ma" && password === "admin123") {
        await AsyncStorage.setItem(STORAGE_KEY, "admin");
        setUserRole("admin");
        return;
      }

      if (
        normalizedEmail === "etudiant@campus.ma" &&
        password === "etudiant123"
      ) {
        await AsyncStorage.setItem(STORAGE_KEY, "student");
        setUserRole("student");
        return;
      }

      throw new Error("Identifiants incorrects.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUserRole(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      userRole,
      isLoading,
      login,
      logout,
    }),
    [userRole, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
