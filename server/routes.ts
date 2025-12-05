import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  authConnectSchema, 
  rideRequestSchema, 
  rideAcceptSchema, 
  rideCompleteSchema,
  wsMessageSchema,
  type LocationUpdate 
} from "@shared/schema";
import { z } from "zod";

// Store WebSocket connections by ride ID
const rideSubscriptions = new Map<string, Set<WebSocket>>();

// Store the current location for each ride
const rideLocations = new Map<string, LocationUpdate>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // WebSocket server for real-time GPS updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let subscribedRideId: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const parsed = wsMessageSchema.safeParse(data);
        
        if (!parsed.success) {
          console.error('Invalid WebSocket message:', parsed.error);
          return;
        }

        const { type, rideId, data: messageData } = parsed.data;

        switch (type) {
          case 'subscribe':
            if (rideId) {
              // Unsubscribe from previous ride
              if (subscribedRideId) {
                const prevSubs = rideSubscriptions.get(subscribedRideId);
                if (prevSubs) {
                  prevSubs.delete(ws);
                  if (prevSubs.size === 0) {
                    rideSubscriptions.delete(subscribedRideId);
                  }
                }
              }

              // Subscribe to new ride
              subscribedRideId = rideId;
              if (!rideSubscriptions.has(rideId)) {
                rideSubscriptions.set(rideId, new Set());
              }
              rideSubscriptions.get(rideId)!.add(ws);
              
              // Send current location if available
              const currentLocation = rideLocations.get(rideId);
              if (currentLocation) {
                ws.send(JSON.stringify({
                  type: 'location_update',
                  data: currentLocation,
                }));
              }
            }
            break;

          case 'unsubscribe':
            if (subscribedRideId) {
              const subs = rideSubscriptions.get(subscribedRideId);
              if (subs) {
                subs.delete(ws);
                if (subs.size === 0) {
                  rideSubscriptions.delete(subscribedRideId);
                }
              }
              subscribedRideId = null;
            }
            break;

          case 'location_update':
            if (rideId && messageData) {
              const locationUpdate: LocationUpdate = {
                lat: messageData.lat,
                lng: messageData.lng,
                timestamp: messageData.timestamp || Date.now(),
                speed: messageData.speed,
              };
              
              // Store current location
              rideLocations.set(rideId, locationUpdate);

              // Update ride in storage
              storage.updateRide(rideId, {
                currentLocation: {
                  lat: locationUpdate.lat,
                  lng: locationUpdate.lng,
                },
              });

              // Broadcast to all subscribers
              const subscribers = rideSubscriptions.get(rideId);
              if (subscribers) {
                const broadcastMessage = JSON.stringify({
                  type: 'location_update',
                  data: locationUpdate,
                });
                
                subscribers.forEach((client) => {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(broadcastMessage);
                  }
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Clean up subscriptions
      if (subscribedRideId) {
        const subs = rideSubscriptions.get(subscribedRideId);
        if (subs) {
          subs.delete(ws);
          if (subs.size === 0) {
            rideSubscriptions.delete(subscribedRideId);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Helper to broadcast ride status updates
  function broadcastRideStatus(rideId: string, status: any) {
    const subscribers = rideSubscriptions.get(rideId);
    if (subscribers) {
      const message = JSON.stringify({
        type: 'ride_status',
        data: status,
      });
      
      subscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Auth endpoints
  app.post('/api/auth/connect', async (req, res) => {
    try {
      const parsed = authConnectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid request', errors: parsed.error.errors });
      }

      const { walletAddress, role } = parsed.data;

      // Check if user exists
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          walletAddress,
          role,
          reputation: 50 + Math.floor(Math.random() * 30), // 50-80
          completedRides: 0,
          avgRating: 4.0 + Math.random() * 0.8, // 4.0-4.8
          balance: 100 + Math.random() * 200, // 100-300
        });
      }

      // Generate a simple token (in production, use JWT)
      const token = `token_${user.id}_${Date.now()}`;

      res.json({ token, user });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User profile endpoint
  app.get('/api/user/:userId/profile', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Ride endpoints
  app.post('/api/rides/request', async (req, res) => {
    try {
      const parsed = rideRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid request', errors: parsed.error.errors });
      }

      const ride = await storage.createRide(parsed.data);
      res.json(ride);
    } catch (error) {
      console.error('Ride request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/rides/available', async (req, res) => {
    try {
      const rides = await storage.getAvailableRides();
      res.json(rides);
    } catch (error) {
      console.error('Available rides error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/rides/active/:userId', async (req, res) => {
    try {
      const ride = await storage.getActiveRide(req.params.userId);
      if (!ride) {
        return res.status(404).json({ message: 'No active ride' });
      }
      res.json(ride);
    } catch (error) {
      console.error('Active ride error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/rides/history/:userId', async (req, res) => {
    try {
      const history = await storage.getRideHistory(req.params.userId);
      res.json(history);
    } catch (error) {
      console.error('Ride history error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/rides/:rideId', async (req, res) => {
    try {
      const ride = await storage.getRideWithDetails(req.params.rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      res.json(ride);
    } catch (error) {
      console.error('Get ride error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/rides/:rideId/accept', async (req, res) => {
    try {
      const parsed = rideAcceptSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid request', errors: parsed.error.errors });
      }

      const { driverId } = parsed.data;
      const { rideId } = req.params;

      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      if (ride.status !== 'waiting') {
        return res.status(400).json({ message: 'Ride is no longer available' });
      }

      // Check if driver already has an active ride
      const existingActiveRide = await storage.getActiveRide(driverId);
      if (existingActiveRide) {
        return res.status(400).json({ message: 'You already have an active ride' });
      }

      const driver = await storage.getUser(driverId);
      
      // Set initial driver location near pickup
      const initialLocation = {
        lat: ride.pickup.lat + (Math.random() - 0.5) * 0.02,
        lng: ride.pickup.lng + (Math.random() - 0.5) * 0.02,
      };

      const updatedRide = await storage.updateRide(rideId, { 
        driverId, 
        status: 'accepted',
        currentLocation: initialLocation,
      });

      // Broadcast status update
      broadcastRideStatus(rideId, { 
        status: 'accepted', 
        driverId,
        currentLocation: initialLocation,
        driver: driver ? {
          name: driver.name || 'Driver',
          address: driver.walletAddress,
          rating: driver.avgRating,
          reputation: driver.reputation,
        } : undefined,
      });

      res.json(updatedRide);
    } catch (error) {
      console.error('Accept ride error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/rides/:rideId/start', async (req, res) => {
    try {
      const { rideId } = req.params;
      const { driverId } = req.body;

      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      if (ride.status !== 'accepted') {
        return res.status(400).json({ message: 'Ride cannot be started' });
      }

      if (ride.driverId !== driverId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const updatedRide = await storage.updateRide(rideId, { 
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        currentLocation: ride.pickup,
      });

      // Broadcast status update
      broadcastRideStatus(rideId, { 
        status: 'in_progress',
        startedAt: updatedRide?.startedAt,
      });

      res.json(updatedRide);
    } catch (error) {
      console.error('Start ride error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/rides/:rideId/complete', async (req, res) => {
    try {
      const parsed = rideCompleteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid request', errors: parsed.error.errors });
      }

      const { rideId } = req.params;
      const { completedBy, rating, feedback } = parsed.data;

      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      const updates: Partial<typeof ride> = {};
      
      if (ride.status === 'in_progress' && !ride.completedAt) {
        updates.status = 'completed';
        updates.completedAt = new Date().toISOString();
        updates.actualFare = ride.estimatedFare;
      }

      if (completedBy === 'customer' && rating) {
        updates.driverRating = rating;
        updates.customerFeedback = feedback || null;
        
        // Update driver's average rating
        if (ride.driverId) {
          const driver = await storage.getUser(ride.driverId);
          if (driver) {
            const newAvgRating = (driver.avgRating * driver.completedRides + rating) / (driver.completedRides + 1);
            await storage.updateUser(ride.driverId, {
              avgRating: Math.round(newAvgRating * 10) / 10,
              completedRides: driver.completedRides + 1,
              reputation: Math.min(100, driver.reputation + 2),
            });
          }
        }
      } else if (completedBy === 'driver' && rating) {
        updates.customerRating = rating;
        updates.driverFeedback = feedback || null;
        
        // Update customer's average rating
        const customer = await storage.getUser(ride.customerId);
        if (customer) {
          const newAvgRating = (customer.avgRating * customer.completedRides + rating) / (customer.completedRides + 1);
          await storage.updateUser(ride.customerId, {
            avgRating: Math.round(newAvgRating * 10) / 10,
            completedRides: customer.completedRides + 1,
            reputation: Math.min(100, customer.reputation + 2),
          });
        }
      }

      const updatedRide = await storage.updateRide(rideId, updates);

      // Broadcast status update
      if (updates.status === 'completed') {
        broadcastRideStatus(rideId, { status: 'completed' });
        
        // Clean up location data
        rideLocations.delete(rideId);
      }

      res.json(updatedRide);
    } catch (error) {
      console.error('Complete ride error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/rides/:rideId/cancel', async (req, res) => {
    try {
      const { rideId } = req.params;
      const { userId } = req.body;

      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      if (ride.status !== 'waiting' && ride.status !== 'accepted') {
        return res.status(400).json({ message: 'Ride cannot be cancelled' });
      }

      if (ride.customerId !== userId && ride.driverId !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const updatedRide = await storage.updateRide(rideId, { 
        status: 'cancelled',
        completedAt: new Date().toISOString(),
      });

      // Broadcast status update
      broadcastRideStatus(rideId, { status: 'cancelled' });
      
      // Clean up
      rideLocations.delete(rideId);

      res.json(updatedRide);
    } catch (error) {
      console.error('Cancel ride error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
// Add to routes.ts

import { PolkadotEscrowService } from './services/polkadot.service';

let polkadotService: PolkadotEscrowService | null = null;

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Initialize Polkadot service
  try {
    polkadotService = new PolkadotEscrowService({
      rpcEndpoint: process.env.POLKADOT_RPC || 'wss://rococo-rpc.polkadot.io',
      contractAddress: process.env.RIDE_ESCROW_CONTRACT || '',
      backendPrivateKey: process.env.BACKEND_PRIVATE_KEY,
    });
    await polkadotService.initialize();
  } catch (error) {
    console.warn('⚠️ Polkadot service unavailable (optional):', error);
  }

  // ... existing WebSocket code ...

  /**
   * POST /api/orders/:rideId/confirm-delivery-chain
   * Release funds to driver after geofence check
   */
  app.post('/api/orders/:rideId/confirm-delivery-chain', async (req, res) => {
    try {
      if (!polkadotService) {
        return res.status(503).json({ message: 'Blockchain service unavailable' });
      }

      const { rideId } = req.params;
      const { driverId, customerLat, customerLng, dropLat, dropLng } = req.body;

      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      // Verify geofence
      const distance = Math.sqrt(
        Math.pow(customerLat - dropLat, 2) + Math.pow(customerLng - dropLng, 2)
      ) * 111; // Convert to km

      if (distance > 0.05) { // 50 meters
        return res.status(400).json({ message: 'Not at destination yet' });
      }

      // Call Polkadot contract
      const result = await polkadotService.confirmDelivery(rideId);

      // Update ride
      const updatedRide = await storage.updateRide(rideId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        releaseTxHash: result.hash,
      });

      // Broadcast completion
      broadcastRideStatus(rideId, { status: 'completed' });

      res.json({
        ride: updatedRide,
        transaction: { hash: result.hash, blockNumber: result.blockNumber },
      });
    } catch (error) {
      console.error('Confirm delivery error:', error);
      res.status(500).json({ message: 'Failed to confirm delivery' });
    }
  });
}
