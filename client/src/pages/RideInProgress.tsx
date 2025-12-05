import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Clock, DollarSign, CheckCircle, AlertTriangle, Phone, MessageCircle, Wallet, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { LiveMap } from "@/components/LiveMap";
import { Spinner } from "@/components/Spinner";
import { StarRating } from "@/components/StarRating";
import { RatingPopup } from "@/components/RatingPopup";
import { useAuth } from "@/context/AuthContext";
import { useRide } from "@/context/RideContext";
import { useAutoLocation, calculateETA } from "@/hooks/useAutoLocation";
import { releasePayment, type PaymentResult } from "@/lib/smartContract";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { Location } from "@shared/schema";


export default function RideInProgress() {
  const { user } = useAuth();
  const { activeRide, currentLocation, refreshActiveRide, refreshHistory, setActiveRide, sendLocationUpdate } = useRide();
  const [, setLocation] = useLocation();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [driverPosition, setDriverPosition] = useState<Location | null>(null);
  const [hasArrived, setHasArrived] = useState(false);


  // Initialize driver position
  useEffect(() => {
    if (activeRide && !driverPosition) {
      const initialPos = currentLocation || activeRide.currentLocation || activeRide.pickup;
      setDriverPosition(initialPos);
    }
  }, [activeRide, currentLocation, driverPosition]);


  // Determine the current target (pickup if accepted, dropoff if in_progress)
  const currentTarget = activeRide?.status === "in_progress" 
    ? activeRide.dropoff 
    : activeRide?.pickup;


  // Handle location updates from auto-mover
  const handleLocationUpdate = useCallback((location: { lat: number; lng: number; timestamp: number; speed?: number }) => {
    setDriverPosition({ lat: location.lat, lng: location.lng });
    sendLocationUpdate(location);
  }, [sendLocationUpdate]);


  // Handle arrival at destination
  const handleArrival = useCallback(() => {
    setHasArrived(true);
    console.log("[Auto Location] Arrived at destination");
  }, []);


  // Auto-move driver towards target (only for driver role)
  useAutoLocation({
    enabled: !!activeRide && user?.role === "driver" && activeRide.status === "in_progress" && !hasArrived,
    currentLocation: driverPosition,
    targetLocation: currentTarget || null,
    speed: 0.3, // 0.3 km per update cycle
    intervalMs: 1500,
    onLocationUpdate: handleLocationUpdate,
    onArrival: handleArrival,
  });


  // Redirect if no active ride
  useEffect(() => {
    if (!activeRide) {
      setLocation(user?.role === "driver" ? "/driver" : "/");
    }
  }, [activeRide, user?.role, setLocation]);


  // Reset arrival state when ride starts
  useEffect(() => {
    if (activeRide?.status === "in_progress") {
      setHasArrived(false);
    }
  }, [activeRide?.status]);


  // Calculate distance and ETA
  const { distance, eta } = calculateETA(
    driverPosition || currentLocation || activeRide?.currentLocation || null,
    currentTarget || null,
    35 // Average speed km/h
  );


  // Calculate current fare based on distance traveled
  const calculateCurrentFare = () => {
    if (!activeRide) return 0;
    if (activeRide.status !== "in_progress") return activeRide.estimatedFare;
    
    // Simple fare calculation based on progress
    const totalDistance = calculateETA(activeRide.pickup, activeRide.dropoff, 35).distance;
    const remainingDistance = distance;
    const traveledDistance = Math.max(0, totalDistance - remainingDistance);
    const progress = totalDistance > 0 ? traveledDistance / totalDistance : 0;
    
    return Math.round(activeRide.estimatedFare * Math.min(progress + 0.3, 1) * 100) / 100;
  };


  const currentFare = calculateCurrentFare();


  const handleCompleteRide = async () => {
    if (!activeRide || !user) return;
    setIsCompleting(true);
    
    try {
      // Call smart contract to release payment
      const payment = await releasePayment(
        activeRide.id,
        activeRide.driver?.address || "",
        activeRide.estimatedFare,
        activeRide.stakedAmount
      );
      setPaymentResult(payment);


      // Complete the ride in backend
      await api.completeRide(activeRide.id, {
        completedBy: user.role as "driver" | "customer",
      });
      
      setShowRatingPopup(true);
    } catch (error) {
      console.error("Failed to complete ride:", error);
    } finally {
      setIsCompleting(false);
    }
  };


  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!activeRide || !user) return;
    try {
      await api.completeRide(activeRide.id, {
        completedBy: user.role as "driver" | "customer",
        rating,
        feedback,
      });
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };


  const handleRatingClose = () => {
    setShowRatingPopup(false);
    setPaymentResult(null);
    setActiveRide(null);
    refreshHistory();
    setLocation(user?.role === "driver" ? "/driver" : "/");
  };


  const handlePanic = () => {
    alert("Emergency services have been notified!");
    setShowPanicConfirm(false);
  };


  if (!activeRide) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }


  const isDriver = user?.role === "driver";
  const otherParty = isDriver ? activeRide.customer : activeRide.driver;


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Container - Fixed overflow and layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-x-hidden">
        
        {/* Map Section - Full height with relative positioning for overlays */}
        <div className="lg:w-3/5 h-[50vh] lg:h-[calc(100vh-64px)] relative z-10 overflow-visible">
          <LiveMap
            driverLocation={driverPosition || currentLocation || activeRide.currentLocation}
            pickupLocation={activeRide.pickup}
            dropoffLocation={activeRide.dropoff}
            showRoute
            className="h-full w-full"
            interactive
          />
          
          {/* Status Badge on Map */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <Badge className="bg-primary text-primary-foreground shadow-lg px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2" />
              {activeRide.status === "in_progress" ? "Ride In Progress" : "Heading to Pickup"}
            </Badge>
          </div>

          {/* Arrival notification */}
          {hasArrived && isDriver && (
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
              <Card className="bg-emerald-500 text-white border-0 shadow-lg">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-semibold">You've arrived at the destination!</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="lg:w-2/5 flex flex-col bg-background border-t lg:border-t-0 lg:border-l overflow-hidden z-10">
          
          {/* Other Party Info */}
          {otherParty && (
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0",
                  isDriver 
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                    : "bg-gradient-to-br from-primary to-[hsl(280,75%,50%)]"
                )}>
                  {otherParty.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg truncate">{otherParty.name}</p>
                  <StarRating rating={otherParty.rating} size="sm" showValue />
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="icon" variant="outline" data-testid="button-call">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" data-testid="button-message">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="p-6 grid grid-cols-3 gap-4 border-b flex-shrink-0">
            <div className="text-center">
              <div className="text-3xl font-bold font-mono" data-testid="text-distance">{distance}</div>
              <p className="text-sm text-muted-foreground">km left</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold font-mono" data-testid="text-eta">{eta}</div>
              <p className="text-sm text-muted-foreground">min ETA</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold font-mono text-primary" data-testid="text-fare">
                ${currentFare.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">fare</p>
            </div>
          </div>

          {/* Staking Info */}
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">Escrow Protected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Staked Amount:</span>
                <span className="font-mono font-semibold">${activeRide.stakedAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Funds held in smart contract until ride completion
              </p>
            </div>
          </div>

          {/* Route Info - Scrollable */}
          <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-emerald-600 font-medium">FROM</p>
                <p className="font-medium break-words">{activeRide.pickup.address}</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="h-8 border-l-2 border-dashed border-muted-foreground/30" />
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Navigation className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-blue-600 font-medium">TO</p>
                <p className="font-medium break-words">{activeRide.dropoff.address}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t space-y-3 flex-shrink-0 bg-background">
            {isDriver ? (
              <Button
                onClick={handleCompleteRide}
                disabled={isCompleting || !hasArrived}
                className={cn(
                  "w-full h-14 text-lg font-semibold",
                  hasArrived 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                    : "bg-muted text-muted-foreground"
                )}
                data-testid="button-complete-ride"
              >
                {isCompleting ? (
                  <Spinner size="sm" className="border-white border-t-transparent" />
                ) : hasArrived ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete Ride & Release Payment
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 mr-2" />
                    Driving to Destination...
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setShowPanicConfirm(true)}
                variant="destructive"
                className="w-full h-14 text-lg font-semibold"
                data-testid="button-panic"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Result Modal */}
      {paymentResult && !showRatingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <Wallet className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold">Payment Released!</h3>
              <div className="space-y-2 text-left bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-mono font-semibold">${paymentResult.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction:</span>
                  <span className="font-mono text-xs truncate max-w-[180px]">
                    {paymentResult.transactionHash.slice(0, 20)}...
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Funds transferred from escrow to driver via smart contract
              </p>
              <Button 
                onClick={() => setShowRatingPopup(true)} 
                className="w-full"
                data-testid="button-continue-to-rating"
              >
                Continue to Rating
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Popup */}
      {showRatingPopup && otherParty && (
        <RatingPopup
          open={showRatingPopup}
          onClose={handleRatingClose}
          onSubmit={handleRatingSubmit}
          targetName={otherParty.name}
          targetRole={isDriver ? "customer" : "driver"}
        />
      )}

      {/* Panic Confirmation Dialog */}
      {showPanicConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
              <h3 className="text-lg font-semibold">Emergency Alert</h3>
              <p className="text-sm text-muted-foreground">
                This will notify emergency services and share your location. Only use in genuine emergencies.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPanicConfirm(false)}
                  className="flex-1"
                  data-testid="button-cancel-panic"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handlePanic}
                  className="flex-1"
                  data-testid="button-confirm-panic"
                >
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}