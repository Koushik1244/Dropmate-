import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@shared/schema";
import { api } from "@/lib/api";

interface AuthContextType {
  walletAddress: string | null;
  userRole: UserRole | null;
  user: User | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: (role: UserRole) => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for stored session on mount
  useEffect(() => {
    const stored = localStorage.getItem("dropmate_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        setWalletAddress(session.walletAddress);
        setUserRole(session.role);
        setUser(session.user);
      } catch {
        localStorage.removeItem("dropmate_session");
      }
    }
  }, []);

  const connect = useCallback(async (role: UserRole) => {
    setIsConnecting(true);
    try {
      // Simulate wallet connection with MetaMask-style address
      const mockAddress = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
      
      // Connect to backend
      const { user: connectedUser } = await api.connect({
        walletAddress: mockAddress,
        role,
      });

      setWalletAddress(mockAddress);
      setUserRole(role);
      setUser(connectedUser);

      // Store session
      localStorage.setItem("dropmate_session", JSON.stringify({
        walletAddress: mockAddress,
        role,
        user: connectedUser,
      }));
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletAddress(null);
    setUserRole(null);
    setUser(null);
    localStorage.removeItem("dropmate_session");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        walletAddress,
        userRole,
        user,
        isConnected: !!walletAddress && !!user,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
