import { Wallet, LogOut, Sun, Moon, Car, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Header() {
  const { user, walletAddress, disconnect } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(280,75%,50%)]">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-[hsl(280,75%,50%)] bg-clip-text text-transparent">
            DropMate
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Reputation (Driver only) */}
          {user.role === "driver" && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="font-mono">{user.reputation}/100</span>
            </Badge>
          )}

          {/* Balance */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            <span className="text-sm text-muted-foreground">Balance:</span>
            <span className="font-mono font-semibold">${user.balance.toFixed(2)}</span>
          </div>

          {/* Wallet Address */}
          <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm hidden sm:inline">{walletAddress}</span>
            <span className="font-mono text-sm sm:hidden">
              {walletAddress?.slice(0, 6)}...
            </span>
          </div>

          {/* Theme Toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Disconnect */}
          <Button
            size="icon"
            variant="ghost"
            onClick={disconnect}
            data-testid="button-disconnect"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
