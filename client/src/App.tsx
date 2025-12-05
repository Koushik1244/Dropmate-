import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RideProvider } from "@/context/RideContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthPage from "@/pages/AuthPage";
import CustomerDashboard from "@/pages/CustomerDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import RideInProgress from "@/pages/RideInProgress";
import NotFound from "@/pages/not-found";

function AuthenticatedRoutes() {
  const { isConnected, userRole } = useAuth();

  if (!isConnected) {
    return <AuthPage />;
  }

  return (
    <RideProvider>
      <Switch>
        {userRole === "customer" && (
          <>
            <Route path="/" component={CustomerDashboard} />
            <Route path="/ride" component={RideInProgress} />
          </>
        )}
        {userRole === "driver" && (
          <>
            <Route path="/" component={DriverDashboard} />
            <Route path="/driver" component={DriverDashboard} />
            <Route path="/ride" component={RideInProgress} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </RideProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <AuthenticatedRoutes />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
