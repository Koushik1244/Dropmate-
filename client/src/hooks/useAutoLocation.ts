import { useEffect, useRef, useCallback } from "react";
import type { Location, LocationUpdate } from "@shared/schema";

interface UseAutoLocationProps {
  enabled: boolean;
  currentLocation: Location | null;
  targetLocation: Location | null;
  speed?: number; // km per update cycle
  intervalMs?: number;
  onLocationUpdate: (location: LocationUpdate) => void;
  onArrival?: () => void;
}

/**
 * Hook for automatic mock location movement
 * Simulates driver movement from current position towards target
 * Will be replaced with real GPS in production
 */
export function useAutoLocation({
  enabled,
  currentLocation,
  targetLocation,
  speed = 0.5, // km per update
  intervalMs = 2000,
  onLocationUpdate,
  onArrival,
}: UseAutoLocationProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPosRef = useRef<Location | null>(null);
  const hasArrivedRef = useRef(false);

  // Keep track of current position
  useEffect(() => {
    if (currentLocation) {
      currentPosRef.current = currentLocation;
    }
  }, [currentLocation]);

  const moveTowardsTarget = useCallback(() => {
    if (!currentPosRef.current || !targetLocation) return;

    const current = currentPosRef.current;
    const target = targetLocation;

    // Calculate distance to target (in degrees, roughly)
    const latDiff = target.lat - current.lat;
    const lngDiff = target.lng - current.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // Convert speed to degrees (very rough approximation: 1 degree ≈ 111km)
    const speedInDegrees = speed / 111;

    // Check if arrived (within ~50 meters)
    if (distance < 0.0005) {
      if (!hasArrivedRef.current) {
        hasArrivedRef.current = true;
        onLocationUpdate({
          lat: target.lat,
          lng: target.lng,
          timestamp: Date.now(),
          speed: 0,
        });
        onArrival?.();
      }
      return;
    }

    // Calculate new position moving towards target
    const ratio = Math.min(speedInDegrees / distance, 1);
    const newLat = current.lat + latDiff * ratio;
    const newLng = current.lng + lngDiff * ratio;

    // Add slight randomness to simulate real GPS variation
    const jitter = 0.00005;
    const finalLat = newLat + (Math.random() - 0.5) * jitter;
    const finalLng = newLng + (Math.random() - 0.5) * jitter;

    currentPosRef.current = { lat: finalLat, lng: finalLng };

    // Calculate approximate speed in km/h
    const speedKmh = (speed / (intervalMs / 1000)) * 3600;

    onLocationUpdate({
      lat: finalLat,
      lng: finalLng,
      timestamp: Date.now(),
      speed: speedKmh,
    });
  }, [targetLocation, speed, intervalMs, onLocationUpdate, onArrival]);

  useEffect(() => {
    if (enabled && targetLocation) {
      hasArrivedRef.current = false;
      
      // Initial update
      if (currentPosRef.current) {
        moveTowardsTarget();
      }

      // Set up interval for continuous movement
      intervalRef.current = setInterval(moveTowardsTarget, intervalMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [enabled, targetLocation, intervalMs, moveTowardsTarget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

/**
 * Calculate ETA based on distance and average speed
 */
export function calculateETA(
  currentLocation: Location | null,
  targetLocation: Location | null,
  avgSpeedKmh: number = 30
): { distance: number; eta: number } {
  if (!currentLocation || !targetLocation) {
    return { distance: 0, eta: 0 };
  }

  // Calculate distance in km (using Haversine formula simplified)
  const latDiff = (targetLocation.lat - currentLocation.lat) * 111;
  const lngDiff = (targetLocation.lng - currentLocation.lng) * 111 * 
    Math.cos(currentLocation.lat * Math.PI / 180);
  
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  
  // Calculate ETA in minutes
  const eta = Math.max(1, Math.round((distance / avgSpeedKmh) * 60));

  return {
    distance: Math.round(distance * 10) / 10,
    eta,
  };
}
