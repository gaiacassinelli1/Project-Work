import { createContext, ReactNode, useState, useEffect, useContext, FC } from "react";

// ========== TYPE DEFINITIONS ==========

export interface User {
  email: string;
  uid: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

// ========== CONTEXT CREATION ==========

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========== PROVIDER COMPONENT ==========

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simula caricamento da localStorage o servizio autenticazione
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // TODO: Implementare login con backend
      const userData: User = {
        email,
        uid: `uid-${Date.now()}`,
        name: email.split("@")[0],
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // TODO: Implementare logout con backend
      setUser(null);
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // TODO: Implementare signup con backend
      const userData: User = {
        email,
        uid: `uid-${Date.now()}`,
        name: email.split("@")[0],
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    signup,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ========== CUSTOM HOOK ==========

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve essere usato dentro un AuthProvider");
  }
  return context;
};