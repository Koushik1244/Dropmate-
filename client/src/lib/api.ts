import type { 
  User, 
  Ride, 
  RideWithDetails, 
  AvailableRide, 
  AuthConnectRequest,
  RideRequestPayload,
  RideAcceptPayload,
  RideCompletePayload 
} from "@shared/schema";

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
}

export const api = {
  // Auth endpoints
  connect: async (data: AuthConnectRequest): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE}/auth/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // User endpoints
  getProfile: async (userId: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/user/${userId}/profile`);
    return handleResponse(response);
  },

  // Ride endpoints
  requestRide: async (data: RideRequestPayload): Promise<Ride> => {
    const response = await fetch(`${API_BASE}/rides/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAvailableRides: async (): Promise<AvailableRide[]> => {
    const response = await fetch(`${API_BASE}/rides/available`);
    return handleResponse(response);
  },

  getRide: async (rideId: string): Promise<RideWithDetails> => {
    const response = await fetch(`${API_BASE}/rides/${rideId}`);
    return handleResponse(response);
  },

  acceptRide: async (rideId: string, data: RideAcceptPayload): Promise<Ride> => {
    const response = await fetch(`${API_BASE}/rides/${rideId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  startRide: async (rideId: string, driverId: string): Promise<Ride> => {
    const response = await fetch(`${API_BASE}/rides/${rideId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId }),
    });
    return handleResponse(response);
  },

  completeRide: async (rideId: string, data: RideCompletePayload): Promise<Ride> => {
    const response = await fetch(`${API_BASE}/rides/${rideId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  cancelRide: async (rideId: string, userId: string): Promise<Ride> => {
    const response = await fetch(`${API_BASE}/rides/${rideId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return handleResponse(response);
  },

  getRideHistory: async (userId: string): Promise<Ride[]> => {
    const response = await fetch(`${API_BASE}/rides/history/${userId}`);
    return handleResponse(response);
  },

  getActiveRide: async (userId: string): Promise<RideWithDetails | null> => {
    const response = await fetch(`${API_BASE}/rides/active/${userId}`);
    if (response.status === 404) return null;
    return handleResponse(response);
  },
};
