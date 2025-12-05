import { z } from "zod";

// Location type for GPS coordinates
export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});

export type Location = z.infer<typeof locationSchema>;

// User roles
export type UserRole = "customer" | "driver";

// User schema
export const userSchema = z.object({
  id: z.string(),
  walletAddress: z.string(),
  role: z.enum(["customer", "driver"]),
  reputation: z.number().min(0).max(100),
  completedRides: z.number(),
  avgRating: z.number().min(0).max(5),
  balance: z.number(),
  name: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// Ride status types
export type RideStatus = "waiting" | "accepted" | "in_progress" | "completed" | "cancelled";

// Ride schema
export const rideSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  driverId: z.string().nullable(),
  pickup: locationSchema,
  dropoff: locationSchema,
  estimatedFare: z.number(),
  stakedAmount: z.number(),
  actualFare: z.number().nullable(),
  status: z.enum(["waiting", "accepted", "in_progress", "completed", "cancelled"]),
  currentLocation: locationSchema.nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  customerRating: z.number().min(1).max(5).nullable(),
  driverRating: z.number().min(1).max(5).nullable(),
  customerFeedback: z.string().nullable(),
  driverFeedback: z.string().nullable(),
});

export type Ride = z.infer<typeof rideSchema>;

export const insertRideSchema = rideSchema.omit({ 
  id: true, 
  driverId: true, 
  actualFare: true, 
  status: true,
  currentLocation: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  customerRating: true,
  driverRating: true,
  customerFeedback: true,
  driverFeedback: true,
});
export type InsertRide = z.infer<typeof insertRideSchema>;

// API request/response types
export const authConnectSchema = z.object({
  walletAddress: z.string(),
  role: z.enum(["customer", "driver"]),
});
export type AuthConnectRequest = z.infer<typeof authConnectSchema>;

export const rideRequestSchema = z.object({
  pickup: locationSchema,
  dropoff: locationSchema,
  estimatedFare: z.number(),
  stakedAmount: z.number(),
  customerId: z.string(),
});
export type RideRequestPayload = z.infer<typeof rideRequestSchema>;

export const rideAcceptSchema = z.object({
  driverId: z.string(),
});
export type RideAcceptPayload = z.infer<typeof rideAcceptSchema>;

export const rideCompleteSchema = z.object({
  completedBy: z.enum(["customer", "driver"]),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
});
export type RideCompletePayload = z.infer<typeof rideCompleteSchema>;

// WebSocket message types
export const wsMessageSchema = z.object({
  type: z.enum(["location_update", "ride_status", "subscribe", "unsubscribe"]),
  rideId: z.string().optional(),
  data: z.any().optional(),
});
export type WsMessage = z.infer<typeof wsMessageSchema>;

export const locationUpdateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  timestamp: z.number(),
  speed: z.number().optional(),
});
export type LocationUpdate = z.infer<typeof locationUpdateSchema>;

// Available ride for drivers
export interface AvailableRide {
  rideId: string;
  pickup: Location;
  dropoff: Location;
  fare: number;
  customerRating: number;
  customerName: string;
  distance: number;
}

// Ride with user details
export interface RideWithDetails extends Ride {
  driver?: {
    name: string;
    address: string;
    rating: number;
    reputation: number;
  };
  customer?: {
    name: string;
    address: string;
    rating: number;
  };
}
