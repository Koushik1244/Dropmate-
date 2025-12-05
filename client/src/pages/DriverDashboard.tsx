import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Clock, DollarSign, Play, CheckCircle, RefreshCw, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { LiveMap } from "@/components/LiveMap";
import { AvailableRideCard, RideHistoryCard } from "@/components/RideCard";
import { LoadingState, Spinner } from "@/components/Spinner";
import { StarRating } from "@/components/StarRating";
import { RatingPopup } from "@/components/RatingPopup";
import { useAuth } from "@/context/AuthContext";
import { useRide } from "@/context/RideContext";
import { useAutoLocation, calculateETA } from "@/hooks/useAutoLocation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RideStatus, Location } from "@shared/schema";
import { useLocation } from "wouter";

const statusLabels: Record<RideStatus, string> = {
  waiting: "Waiting",
  accepted: "Navigate to Pickup",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const { activeRide, availableRides, rideHistory, isLoading, currentLocation, refreshAvailableRides, refreshActiveRide, refreshHistory, setActiveRide, subscribeToRide, sendLocationUpdate } = useRide();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"available" | "active">("available");
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [completedRide, setCompletedRide] = useState<typeof activeRide>(null);
  const [driverPosition, setDriverPosition] = useState<Location | null>(null);
  const [hasArrivedAtPickup, setHasArrivedAtPickup] = useState(false);

  // Initialize driver position when ride is accepted
  useEffect(() => {
    if (activeRide && activeRide.status === "accepted" && !driverPosition) {
      // Start driver slightly away from pickup
      const offset = 0.008; // About 0.8 km away
      setDriverPosition({
        lat: activeRide.pickup.lat + (Math.random() - 0.5) * offset,
        lng: activeRide.pickup.lng + (Math.random() - 0.5) * offset,
      });
      setHasArrivedAtPickup(false);
    }
  }, [activeRide?.status, activeRide?.pickup, driverPosition]);

  // Handle location updates from auto-mover
  const handleLocationUpdate = useCallback((location: { lat: number; lng: number; timestamp: number; speed?: number }) => {
    setDriverPosition({ lat: location.lat, lng: location.lng });
    sendLocationUpdate(location);
  }, [sendLocationUpdate]);

  // Handle arrival at pickup
  const handleArrivalAtPickup = useCallback(() => {
    setHasArrivedAtPickup(true);
    console.log("[Auto Location] Arrived at pickup location");
  }, []);

  // Auto-move driver towards pickup when ride is accepted
  useAutoLocation({
    enabled: !!activeRide && activeRide.status === "accepted" && !hasArrivedAtPickup,
    currentLocation: driverPosition,
    targetLocation: activeRide?.pickup || null,
    speed: 0.4, // 0.4 km per update cycle
    intervalMs: 1500,
    onLocationUpdate: handleLocationUpdate,
    onArrival: handleArrivalAtPickup,
  });

  // Switch to active tab when ride is accepted
  useEffect(() => {
    if (activeRide) {
      setActiveTab("active");
      subscribeToRide(activeRide.id);
    }
  }, [activeRide?.id, subscribeToRide]);

  // Navigate to in-progress view
  useEffect(() => {
    if (activeRide?.status === "in_progress") {
      setLocation("/ride");
    }
  }, [activeRide?.status, setLocation]);

  // Handle ride completion
  useEffect(() => {
    if (activeRide?.status === "completed" && !showRatingPopup) {
      setCompletedRide(activeRide);
      setShowRatingPopup(true);
    }
  }, [activeRide?.status, showRatingPopup]);

  // Calculate ETA to pickup
  const { distance: distanceToPickup, eta: etaToPickup } = calculateETA(
    driverPosition,
    activeRide?.pickup || null,
    30
  );

  const handleAcceptRide = async (rideId: string) => {
    if (!user) return;
    setIsAccepting(rideId);
    try {
      await api.acceptRide(rideId, { driverId: user.id });
      await refreshActiveRide();
      setActiveTab("active");
      setDriverPosition(null); // Reset to trigger new position
      setHasArrivedAtPickup(false);
    } catch (error) {
      console.error("Failed to accept ride:", error);
    } finally {
      setIsAccepting(null);
    }
  };

  const handleStartRide = async () => {
    if (!activeRide || !user) return;
    setIsStarting(true);
    try {
      await api.startRide(activeRide.id, user.id);
      await refreshActiveRide();
    } catch (error) {
      console.error("Failed to start ride:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!completedRide || !user) return;
    try {
      await api.completeRide(completedRide.id, {
        completedBy: "driver",
        rating,
        feedback,
      });
      setActiveRide(null);
      refreshHistory();
      refreshAvailableRides();
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  const handleRatingClose = () => {
    setShowRatingPopup(false);
    setCompletedRide(null);
    setActiveRide(null);
    setDriverPosition(null);
    refreshHistory();
    refreshAvailableRides();
  };

  if (!user) return <LoadingState message="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "available" ? "default" : "outline"}
            onClick={() => setActiveTab("available")}
            className="flex-1"
            data-testid="tab-available-rides"
          >
            Available Rides
            {availableRides.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {availableRides.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "active" ? "default" : "outline"}
            onClick={() => setActiveTab("active")}
            className="flex-1"
            disabled={!activeRide}
            data-testid="tab-active-ride"
          >
            Active Ride
            {activeRide && (
              <div className="ml-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </Button>
        </div>

        {/* Available Rides Tab */}
        {activeTab === "available" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Nearby Ride Requests</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAvailableRides}
                disabled={isLoading}
                data-testid="button-refresh-rides"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {isLoading && availableRides.length === 0 ? (
              <LoadingState message="Finding available rides..." />
            ) : availableRides.length > 0 ? (
              <div className="space-y-3">
                {availableRides.map((ride) => (
                  <AvailableRideCard
                    key={ride.rideId}
                    ride={ride}
                    onAccept={() => handleAcceptRide(ride.rideId)}
                    isAccepting={isAccepting === ride.rideId}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No rides available right now</p>
                  <p className="text-sm text-muted-foreground">
                    New ride requests will appear here automatically
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Active Ride Tab */}
        {activeTab === "active" && activeRide && (
          <Card className="overflow-hidden" data-testid="active-ride-card">
            {/* Status Header */}
            <div className={cn(
              "p-4 text-white",
              activeRide.status === "accepted" ? "bg-blue-500" : "bg-primary"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  <span className="font-semibold">{statusLabels[activeRide.status]}</span>
                </div>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  #{activeRide.id.slice(0, 8)}
                </Badge>
              </div>
            </div>

            {/* Map */}
            <div className="h-64 w-full relative">
              <LiveMap
                driverLocation={driverPosition || currentLocation}
                pickupLocation={activeRide.pickup}
                dropoffLocation={activeRide.dropoff}
                showRoute
                className="h-full"
              />
              
              {/* Arrival indicator */}
              {hasArrivedAtPickup && activeRide.status === "accepted" && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <Card className="bg-emerald-500 text-white border-0">
                    <CardContent className="p-3 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">You've arrived at the pickup location!</span>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Customer Info */}
              {activeRide.customer && (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                    {activeRide.customer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{activeRide.customer.name}</p>
                    <StarRating rating={activeRide.customer.rating} size="sm" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono">${activeRide.estimatedFare.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Fare</p>
                  </div>
                </div>
              )}

              {/* ETA to pickup (when accepted) */}
              {activeRide.status === "accepted" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                    <p className="text-3xl font-bold font-mono">{distanceToPickup}</p>
                    <p className="text-sm text-muted-foreground">km to pickup</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                    <p className="text-3xl font-bold font-mono">{etaToPickup}</p>
                    <p className="text-sm text-muted-foreground">min ETA</p>
                  </div>
                </div>
              )}

              {/* Staking Info */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Customer Stake: ${activeRide.stakedAmount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Secured in smart contract escrow - released to you upon completion
                  </p>
                </div>
              </div>

              {/* Route Info */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">PICKUP</p>
                    <p className="font-medium">{activeRide.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Navigation className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">DROPOFF</p>
                    <p className="font-medium">{activeRide.dropoff.address}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {activeRide.status === "accepted" && (
                <Button
                  onClick={handleStartRide}
                  disabled={isStarting || !hasArrivedAtPickup}
                  className={cn(
                    "w-full h-14 text-lg font-semibold",
                    hasArrivedAtPickup 
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-muted text-muted-foreground"
                  )}
                  data-testid="button-start-ride"
                >
                  {isStarting ? (
                    <Spinner size="sm" className="border-white border-t-transparent" />
                  ) : hasArrivedAtPickup ? (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start Ride
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 mr-2" />
                      Driving to Pickup...
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ride History */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Rides</h2>
          {rideHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rideHistory.slice(0, 3).map((ride) => (
                <RideHistoryCard key={ride.id} ride={ride} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No completed rides yet</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {/* Rating Popup */}
      {completedRide?.customer && (
        <RatingPopup
          open={showRatingPopup}
          onClose={handleRatingClose}
          onSubmit={handleRatingSubmit}
          targetName={completedRide.customer.name}
          targetRole="customer"
        />
      )}
    </div>
  );
}
