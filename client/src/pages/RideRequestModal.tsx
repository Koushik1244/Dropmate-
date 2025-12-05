import { useState, useEffect } from "react";
import { DollarSign, Shield, Info, Wallet, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationInput } from "@/components/LocationInput";
import { LiveMap } from "@/components/LiveMap";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import { stakeForRide, type StakeResult } from "@/lib/smartContract";
import { api } from "@/lib/api";
import type { Location } from "@shared/schema";


interface RideRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}


type RequestStep = "input" | "staking" | "confirming" | "success";


export function RideRequestModal({ open, onClose, onSuccess }: RideRequestModalProps) {
  const { user } = useAuth();
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [step, setStep] = useState<RequestStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [stakeResult, setStakeResult] = useState<StakeResult | null>(null);


  // Calculate fare based on locations
  const calculateFare = (): number => {
    if (!pickup || !dropoff) return 0;
    
    // Simple distance-based calculation
    const distance = Math.sqrt(
      Math.pow(pickup.lat - dropoff.lat, 2) +
      Math.pow(pickup.lng - dropoff.lng, 2)
    ) * 111; // Convert to approximate km
    
    // Base fare + per km rate
    const baseFare = 2.5;
    const perKmRate = 1.5;
    return Math.round((baseFare + distance * perKmRate) * 100) / 100;
  };


  const estimatedFare = calculateFare();
  const stakedAmount = Math.round(estimatedFare * 1.15 * 100) / 100; // 15% buffer


  const handleSubmit = async () => {
    if (!pickup || !dropoff || !user) return;
    
    setError(null);
    
    try {
      // Step 1: Stake tokens via smart contract
      setStep("staking");
      const stake = await stakeForRide(
        `ride_${Date.now()}`,
        stakedAmount,
        user.walletAddress || ""
      );
      setStakeResult(stake);


      // Step 2: Create ride request on backend
      setStep("confirming");
      await api.requestRide({
        pickup,
        dropoff,
        estimatedFare,
        stakedAmount,
        customerId: user.id,
      });


      // Step 3: Success
      setStep("success");
      
      // Auto-close after showing success
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError("Failed to request ride. Please try again.");
      setStep("input");
      console.error("Ride request failed:", err);
    }
  };


  const handleClose = () => {
    if (step === "staking" || step === "confirming") return; // Don't allow closing during transaction
    
    setPickup(null);
    setDropoff(null);
    setError(null);
    setStep("input");
    setStakeResult(null);
    onClose();
  };


  const isValid = pickup && dropoff && estimatedFare > 0;


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto" data-testid="ride-request-modal">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>Request a Ride</DialogTitle>
              <DialogDescription>
                Enter your pickup and dropoff locations
              </DialogDescription>
            </DialogHeader>


            <div className="space-y-6 py-4">
              {/* Location Inputs */}
              <LocationInput
                label="Pickup Location"
                value={pickup}
                onChange={setPickup}
                placeholder="Where should we pick you up?"
                type="pickup"
              />


              <LocationInput
                label="Dropoff Location"
                value={dropoff}
                onChange={setDropoff}
                placeholder="Where are you going?"
                type="dropoff"
              />


              {/* Map Preview - Responsive Height */}
              {(pickup || dropoff) && (
              <div className="h-40 sm:h-48 rounded-xl border border-border overflow-hidden">
                <LiveMap
                  pickupLocation={pickup}
                  dropoffLocation={dropoff}
                  showRoute={!!(pickup && dropoff)}
                  className="h-full w-full"
                />
              </div>
              )}


              {/* Fare Estimate */}
              {isValid && (
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-[hsl(280,75%,50%)]/10 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">Estimated Fare</span>
                      </div>
                      <span className="text-3xl font-bold font-mono" data-testid="text-estimated-fare">
                        ${estimatedFare.toFixed(2)}
                      </span>
                    </div>
                  </div>


                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Stake Required: ${stakedAmount.toFixed(2)}</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        This amount will be held in a smart contract escrow. 
                        The fare is deducted upon ride completion, and any excess is refunded.
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive text-sm">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>


            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-request"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="min-w-[160px] bg-gradient-to-r from-primary to-[hsl(280,75%,50%)]"
                data-testid="button-confirm-request"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Stake & Request
              </Button>
            </DialogFooter>
          </>
        )}


        {step === "staking" && (
          <div className="py-12 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[hsl(280,75%,50%)] flex items-center justify-center flex-shrink-0">
                <Wallet className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Staking Tokens...</h3>
              <p className="text-muted-foreground mt-2">
                Locking ${stakedAmount.toFixed(2)} in smart contract escrow
              </p>
            </div>
            <Spinner size="md" className="mx-auto" />
            <p className="text-xs text-muted-foreground">
              Please wait while the transaction is being processed
            </p>
          </div>
        )}


        {step === "confirming" && (
          <div className="py-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto flex-shrink-0">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Stake Confirmed!</h3>
              <p className="text-muted-foreground mt-2">
                Finding a driver for your ride...
              </p>
            </div>
            {stakeResult && (
              <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2 text-sm border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Staked:</span>
                  <span className="font-mono font-semibold">${stakeResult.stakedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction:</span>
                  <span className="font-mono text-xs truncate max-w-[180px]">
                    {stakeResult.transactionHash.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between break-all">
                  <span className="text-muted-foreground">Escrow:</span>
                  <span className="font-mono text-xs">{stakeResult.escrowAddress}</span>
                </div>
              </div>
            )}
            <Spinner size="sm" className="mx-auto" />
          </div>
        )}


        {step === "success" && (
          <div className="py-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto flex-shrink-0">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ride Requested!</h3>
              <p className="text-muted-foreground mt-2">
                Looking for nearby drivers...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}