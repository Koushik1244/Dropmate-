import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RideProvider } from "@/context/RideContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PolkadotProvider } from "@/context/PolkadotContext"; // NEW

import AuthPage from "@/pages/AuthPage";
import CustomerDashboard from "@/pages/CustomerDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import RideInProgress from "@/pages/RideInProgress";
import NotFound from "@/pages/not-found";

function AuthenticatedRoutes() {
  const { isConnected, userRole } = useAuth();
  if (!isConnected) {
    return <Route path="*" component={AuthPage} />;
  }

  return (
    <>
      {userRole === "customer" && (
        <>
          <Route path="/" component={CustomerDashboard} />
          <Route path="/ride/:id" component={RideInProgress} />
        </>
      )}
      {userRole === "driver" && (
        <>
          <Route path="/" component={DriverDashboard} />
          <Route path="/ride/:id" component={RideInProgress} />
        </>
      )}
      <Route component={NotFound} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PolkadotProvider>
        {/* WRAPPED WITH POLKADOT PROVIDER */}
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <RideProvider>
                <Switch>
                  <Route path="/auth" component={AuthPage} />
                  <Route component={AuthenticatedRoutes} />
                </Switch>
              </RideProvider>
            </AuthProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </PolkadotProvider>
    </QueryClientProvider>
  );
}

export default App;
