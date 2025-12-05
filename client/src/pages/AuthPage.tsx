import { useState } from "react";
import { Car, Wallet, User, Truck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Spinner } from "@/components/Spinner";
import type { UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const { connect, isConnecting } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!selectedRole) return;

    setError(null);
    try {
      await connect(selectedRole);
    } catch (err) {
      setError("Failed to connect wallet. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Polkadot-inspired gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-[hsl(280,75%,50%)]/20" />
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[hsl(280,75%,50%)]/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow"
        data-testid="button-theme-toggle-auth"
      >
        {theme === "light" ? "Dark" : "Light"}
      </button>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(280,75%,50%)] flex items-center justify-center shadow-xl shadow-primary/25">
            <Car className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[hsl(280,75%,50%)] bg-clip-text text-transparent">
              DropMate
            </h1>
            <p className="text-muted-foreground mt-2">
              Decentralized Ride-Sharing
            </p>
          </div>
        </div>

        {/* Role Selection */}
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Choose Your Role</h2>
              <p className="text-sm text-muted-foreground">
                Select how you want to use DropMate
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole("customer")}
                className={cn(
                  "relative p-6 rounded-xl border-2 transition-all text-left",
                  "hover:shadow-lg hover:border-primary/50",
                  selectedRole === "customer"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border",
                )}
                data-testid="button-role-customer"
              >
                <div className="space-y-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      selectedRole === "customer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Customer</h3>
                    <p className="text-xs text-muted-foreground">
                      Request rides
                    </p>
                  </div>
                </div>
                {selectedRole === "customer" && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("driver")}
                className={cn(
                  "relative p-6 rounded-xl border-2 transition-all text-left",
                  "hover:shadow-lg hover:border-primary/50",
                  selectedRole === "driver"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border",
                )}
                data-testid="button-role-driver"
              >
                <div className="space-y-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      selectedRole === "driver"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Driver</h3>
                    <p className="text-xs text-muted-foreground">
                      Accept rides
                    </p>
                  </div>
                </div>
                {selectedRole === "driver" && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p
                className="text-sm text-destructive text-center"
                data-testid="text-error"
              >
                {error}
              </p>
            )}

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={!selectedRole || isConnecting}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-[hsl(280,75%,50%)] hover:opacity-90 transition-opacity"
              data-testid="button-connect-wallet"
            >
              {isConnecting ? (
                <div className="flex items-center gap-3">
                  <Spinner
                    size="sm"
                    className="border-white border-t-transparent"
                  />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  <span>Connect Wallet</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>

            {/* Wallet Info */}
            <p className="text-xs text-center text-muted-foreground">
              Connect your MetaMask or Stellar wallet to continue
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Powered by Stellar Network
        </p>
      </div>
    </div>
  );
}
