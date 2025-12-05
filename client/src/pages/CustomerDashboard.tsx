import { useState, useEffect } from "react";
import { MapPin, Navigation, Clock, DollarSign, AlertTriangle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { LiveMap } from "@/components/LiveMap";
import { RideHistoryCard } from "@/components/RideCard";
import { LoadingState, Spinner } from "@/components/Spinner";
import { StarRating } from "@/components/StarRating";
import { RatingPopup } from "@/components/RatingPopup";
import { RideRequestModal } from "./RideRequestModal";
import { useAuth } from "@/context/AuthContext";
import { useRide } from "@/context/RideContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RideStatus } from "@shared/schema";
import { useLocation } from "wouter";

const statusConfig: Record<RideStatus, { label: string; color: string }> = {
  waiting: { label: "Finding Driver...", color: "bg-amber-500" },
  accepted: { label: "Driver En Route", color: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-primary" },
  completed: { label: "Completed", color: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-destructive" },
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { activeRide, rideHistory, currentLocation, refreshActiveRide, refreshHistory, setActiveRide, subscribeToRide } = useRide();
  const [, setLocation] = useLocation();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [completedRide, setCompletedRide] = useState<typeof activeRide>(null);

  // Subscribe to active ride updates
  useEffect(() => {
    if (activeRide?.id) {
      subscribeToRide(activeRide.id);
    }
  }, [activeRide?.id, subscribeToRide]);

  // Handle ride completion
  useEffect(() => {
    if (activeRide?.status === "completed" && !showRatingPopup) {
      setCompletedRide(activeRide);
      setShowRatingPopup(true);
    }
  }, [activeRide?.status, showRatingPopup]);

  // Navigate to in-progress view
  useEffect(() => {
    if (activeRide?.status === "in_progress") {
      setLocation("/ride");
    }
  }, [activeRide?.status, setLocation]);

  const handleCancelRide = async () => {
    if (!activeRide || !user) return;
    setIsCancelling(true);
    try {
      await api.cancelRide(activeRide.id, user.id);
      setActiveRide(null);
      refreshHistory();
    } catch (error) {
      console.error("Failed to cancel ride:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!completedRide || !user) return;
    try {
      await api.completeRide(completedRide.id, {
        completedBy: "customer",
        rating,
        feedback,
      });
      setActiveRide(null);
      refreshHistory();
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  const handleRatingClose = () => {
    setShowRatingPopup(false);
    setCompletedRide(null);
    setActiveRide(null);
    refreshHistory();
  };

  if (!user) return <LoadingState message="Loading dashboard..." />;

  const status = activeRide ? statusConfig[activeRide.status] : null;

  // Calculate estimated arrival
  const getEstimatedArrival = () => {
    if (!activeRide?.currentLocation || !activeRide?.pickup) return null;
    // Simple distance calculation (would use routing API in production)
    const distance = Math.sqrt(
      Math.pow(activeRide.currentLocation.lat - activeRide.pickup.lat, 2) +
      Math.pow(activeRide.currentLocation.lng - activeRide.pickup.lng, 2)
    ) * 111; // Approximate km
    const minutes = Math.round(distance * 3); // 3 min per km estimate
    return minutes;
  };

  const eta = getEstimatedArrival();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Active Ride Section */}
        {activeRide && status && (
          <Card className="overflow-hidden" data-testid="active-ride-card">
            {/* Status Header */}
            <div className={cn("p-4 text-white", status.color)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  <span className="font-semibold">{status.label}</span>
                </div>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  #{activeRide.id.slice(0, 8)}
                </Badge>
              </div>
            </div>

            {/* Map */}
            <div className="h-64 w-full">
              <LiveMap
                driverLocation={currentLocation || activeRide.currentLocation}
                pickupLocation={activeRide.pickup}
                dropoffLocation={activeRide.dropoff}
                showRoute={activeRide.status !== "waiting"}
                className="h-full"
              />
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Driver Info (when accepted) */}
              {activeRide.driver && (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-[hsl(280,75%,50%)] flex items-center justify-center text-white font-bold text-lg">
                    {activeRide.driver.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{activeRide.driver.name}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={activeRide.driver.rating} size="sm" />
                      <span className="text-sm text-muted-foreground">
                        ({activeRide.driver.reputation}/100 rep)
                      </span>
                    </div>
                  </div>
                  {eta && activeRide.status === "accepted" && (
                    <div className="text-right">
                      <p className="text-2xl font-bold">{eta} min</p>
                      <p className="text-sm text-muted-foreground">ETA</p>
                    </div>
                  )}
                </div>
              )}

              {/* Waiting Animation */}
              {activeRide.status === "waiting" && (
                <div className="flex flex-col items-center py-4">
                  <div className="relative">
                    <Spinner size="lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium">...</span>
                    </div>
                  </div>
                  <p className="mt-4 text-muted-foreground">
                    Finding a driver for you...
                  </p>
                </div>
              )}

              {/* Route Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-3 w-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="font-medium">{activeRide.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-3 w-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dropoff</p>
                    <p className="font-medium">{activeRide.dropoff.address}</p>
                  </div>
                </div>
              </div>

              {/* Fare Info */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Estimated Fare</span>
                </div>
                <span className="text-2xl font-bold font-mono">
                  ${activeRide.estimatedFare.toFixed(2)}
                </span>
              </div>

              {/* Cancel Button */}
              {(activeRide.status === "waiting" || activeRide.status === "accepted") && (
                <Button
                  variant="outline"
                  onClick={handleCancelRide}
                  disabled={isCancelling}
                  className="w-full"
                  data-testid="button-cancel-ride"
                >
                  {isCancelling ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Ride
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Request Ride Button (when no active ride) */}
        {!activeRide && (
          <div className="text-center space-y-6">
            <div className="p-8 bg-gradient-to-br from-primary/10 via-background to-[hsl(280,75%,50%)]/10 rounded-2xl">
              <h2 className="text-2xl font-bold mb-2">Ready to go?</h2>
              <p className="text-muted-foreground mb-6">
                Request a ride and get matched with a nearby driver
              </p>
              <Button
                onClick={() => setShowRequestModal(true)}
                className="h-16 px-12 text-lg font-semibold bg-gradient-to-r from-primary to-[hsl(280,75%,50%)] hover:opacity-90 transition-opacity"
                data-testid="button-request-ride"
              >
                <Navigation className="h-5 w-5 mr-3" />
                Request Ride
              </Button>
            </div>
          </div>
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
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No ride history yet</p>
                <p className="text-sm text-muted-foreground">
                  Your completed rides will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {/* Request Modal */}
      <RideRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          setShowRequestModal(false);
          refreshActiveRide();
        }}
      />

      {/* Rating Popup */}
      {completedRide?.driver && (
        <RatingPopup
          open={showRatingPopup}
          onClose={handleRatingClose}
          onSubmit={handleRatingSubmit}
          targetName={completedRide.driver.name}
          targetRole="driver"
        />
      )}
    </div>
  );
}
