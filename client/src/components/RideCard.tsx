import { MapPin, Clock, DollarSign, Navigation, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import type { Ride, AvailableRide, RideStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

const statusConfig: Record<RideStatus, { label: string; className: string }> = {
  waiting: { label: "Waiting", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  accepted: { label: "Accepted", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface RideCardProps {
  ride: Ride;
  variant?: "compact" | "full";
  showActions?: boolean;
  onCancel?: () => void;
  onClick?: () => void;
}

export function RideCard({
  ride,
  variant = "compact",
  showActions = false,
  onCancel,
  onClick,
}: RideCardProps) {
  const status = statusConfig[ride.status];
  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        "transition-shadow",
        isClickable && "cursor-pointer hover:shadow-lg"
      )}
      onClick={onClick}
      data-testid={`ride-card-${ride.id}`}
    >
      <CardContent className={variant === "compact" ? "p-4" : "p-6"}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Status Badge */}
            <Badge variant="outline" className={cn("border", status.className)}>
              {status.label}
            </Badge>

            {/* Locations */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium">{ride.pickup.address || "Pickup"}</p>
                </div>
              </div>
              <div className="ml-1 h-4 border-l-2 border-dashed border-muted-foreground/30" />
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium">{ride.dropoff.address || "Dropoff"}</p>
                </div>
              </div>
            </div>

            {/* Fare */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-semibold">
                  ${(ride.actualFare || ride.estimatedFare).toFixed(2)}
                </span>
              </div>
              {ride.completedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {new Date(ride.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && ride.status === "waiting" && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              data-testid="button-cancel-ride"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Available ride card for drivers
interface AvailableRideCardProps {
  ride: AvailableRide;
  onAccept: () => void;
  isAccepting?: boolean;
}

export function AvailableRideCard({
  ride,
  onAccept,
  isAccepting = false,
}: AvailableRideCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`available-ride-${ride.rideId}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Customer Info */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(280,75%,50%)]/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Ride Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{ride.customerName}</span>
              <StarRating rating={ride.customerRating} size="sm" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate text-muted-foreground">{ride.pickup.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <span className="truncate text-muted-foreground">{ride.dropoff.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="font-mono font-semibold text-lg">${ride.fare.toFixed(2)}</span>
              <span className="text-muted-foreground">{ride.distance.toFixed(1)} km</span>
            </div>
          </div>

          {/* Accept Button */}
          <Button
            onClick={onAccept}
            disabled={isAccepting}
            className="flex-shrink-0"
            data-testid="button-accept-ride"
          >
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact history card
interface RideHistoryCardProps {
  ride: Ride;
}

export function RideHistoryCard({ ride }: RideHistoryCardProps) {
  const status = statusConfig[ride.status];

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`history-ride-${ride.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Badge variant="outline" className={cn("border text-xs", status.className)}>
            {status.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {ride.completedAt
              ? new Date(ride.completedAt).toLocaleDateString()
              : new Date(ride.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="truncate">{ride.pickup.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="truncate">{ride.dropoff.address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold">
            ${(ride.actualFare || ride.estimatedFare).toFixed(2)}
          </span>
          {ride.driverRating && (
            <StarRating rating={ride.driverRating} size="sm" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
