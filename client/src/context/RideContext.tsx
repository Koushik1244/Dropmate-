import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Ride, RideWithDetails, AvailableRide, Location, LocationUpdate } from "@shared/schema";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

interface RideContextType {
  activeRide: RideWithDetails | null;
  availableRides: AvailableRide[];
  rideHistory: Ride[];
  isLoading: boolean;
  currentLocation: Location | null;
  refreshAvailableRides: () => Promise<void>;
  refreshActiveRide: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  setActiveRide: (ride: RideWithDetails | null) => void;
  subscribeToRide: (rideId: string) => void;
  unsubscribeFromRide: () => void;
  sendLocationUpdate: (location: LocationUpdate) => void;
}

const RideContext = createContext<RideContextType | null>(null);

export function RideProvider({ children }: { children: ReactNode }) {
  const { user, isConnected } = useAuth();
  const [activeRide, setActiveRide] = useState<RideWithDetails | null>(null);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([]);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "location_update" && message.data) {
            setCurrentLocation({
              lat: message.data.lat,
              lng: message.data.lng,
            });
          } else if (message.type === "ride_status" && message.data) {
            setActiveRide(prev => prev ? { ...prev, ...message.data } : null);
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = socket;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }, []);

  // Initialize WebSocket when connected
  useEffect(() => {
    if (isConnected) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isConnected, connectWebSocket]);

  const subscribeToRide = useCallback((rideId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "subscribe",
        rideId,
      }));
    }
  }, []);

  const unsubscribeFromRide = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "unsubscribe",
      }));
    }
  }, []);

  const sendLocationUpdate = useCallback((location: LocationUpdate) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && activeRide) {
      wsRef.current.send(JSON.stringify({
        type: "location_update",
        rideId: activeRide.id,
        data: location,
      }));
    }
  }, [activeRide]);

  const refreshAvailableRides = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const rides = await api.getAvailableRides();
      setAvailableRides(rides);
    } catch (error) {
      console.error("Failed to fetch available rides:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshActiveRide = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const ride = await api.getActiveRide(user.id);
      setActiveRide(ride);
      if (ride) {
        subscribeToRide(ride.id);
      }
    } catch (error) {
      console.error("Failed to fetch active ride:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, subscribeToRide]);

  const refreshHistory = useCallback(async () => {
    if (!user) return;
    try {
      const history = await api.getRideHistory(user.id);
      setRideHistory(history);
    } catch (error) {
      console.error("Failed to fetch ride history:", error);
    }
  }, [user]);

  // Auto-refresh available rides for drivers
  useEffect(() => {
    if (user?.role === "driver" && !activeRide) {
      refreshAvailableRides();
      const interval = setInterval(refreshAvailableRides, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.role, activeRide, refreshAvailableRides]);

  // Fetch active ride and history on mount
  useEffect(() => {
    if (user) {
      refreshActiveRide();
      refreshHistory();
    }
  }, [user, refreshActiveRide, refreshHistory]);

  return (
    <RideContext.Provider
      value={{
        activeRide,
        availableRides,
        rideHistory,
        isLoading,
        currentLocation,
        refreshAvailableRides,
        refreshActiveRide,
        refreshHistory,
        setActiveRide,
        subscribeToRide,
        unsubscribeFromRide,
        sendLocationUpdate,
      }}
    >
      {children}
    </RideContext.Provider>
  );
}

export function useRide() {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error("useRide must be used within a RideProvider");
  }
  return context;
}
