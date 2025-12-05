import type { 
  User, 
  InsertUser, 
  Ride, 
  InsertRide, 
  Location, 
  AvailableRide, 
  RideWithDetails,
  RideStatus 
} from "@shared/schema";
import { randomUUID } from "crypto";

// Sample names for demo
const sampleNames = [
  "Alex Rivera", "Jordan Chen", "Sam Williams", "Taylor Kim", 
  "Morgan Davis", "Casey Lee", "Riley Johnson", "Quinn Murphy"
];

function getRandomName(): string {
  return sampleNames[Math.floor(Math.random() * sampleNames.length)];
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Ride operations
  createRide(ride: InsertRide & { customerId: string }): Promise<Ride>;
  getRide(id: string): Promise<Ride | undefined>;
  getRideWithDetails(id: string): Promise<RideWithDetails | undefined>;
  updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined>;
  getAvailableRides(): Promise<AvailableRide[]>;
  getActiveRide(userId: string): Promise<RideWithDetails | undefined>;
  getRideHistory(userId: string): Promise<Ride[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rides: Map<string, Ride>;

  constructor() {
    this.users = new Map();
    this.rides = new Map();
    
    // Create some demo rides
    this.seedDemoData();
  }

  private seedDemoData() {
    // Create demo drivers
    const demoDrivers: User[] = [
      {
        id: "demo-driver-1",
        walletAddress: "0xdriver1...abc",
        role: "driver",
        reputation: 78,
        completedRides: 45,
        avgRating: 4.7,
        balance: 245.50,
        name: "Marcus Chen",
      },
      {
        id: "demo-driver-2",
        walletAddress: "0xdriver2...def",
        role: "driver",
        reputation: 92,
        completedRides: 120,
        avgRating: 4.9,
        balance: 890.25,
        name: "Sarah Johnson",
      },
    ];

    demoDrivers.forEach(driver => this.users.set(driver.id, driver));

    // Create some waiting rides for drivers to accept
    const demoRides: Ride[] = [
      {
        id: "demo-ride-1",
        customerId: "demo-customer-1",
        driverId: null,
        pickup: { lat: 37.7849, lng: -122.4094, address: "Market Street, Downtown" },
        dropoff: { lat: 37.6213, lng: -122.3790, address: "Airport Terminal 1, SFO" },
        estimatedFare: 28.50,
        stakedAmount: 32.78,
        actualFare: null,
        status: "waiting",
        currentLocation: null,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        customerRating: null,
        driverRating: null,
        customerFeedback: null,
        driverFeedback: null,
      },
      {
        id: "demo-ride-2",
        customerId: "demo-customer-2",
        driverId: null,
        pickup: { lat: 37.8080, lng: -122.4177, address: "Fisherman's Wharf, SF" },
        dropoff: { lat: 37.7879, lng: -122.4074, address: "Union Square, Downtown" },
        estimatedFare: 12.75,
        stakedAmount: 14.66,
        actualFare: null,
        status: "waiting",
        currentLocation: null,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        customerRating: null,
        driverRating: null,
        customerFeedback: null,
        driverFeedback: null,
      },
      {
        id: "demo-ride-3",
        customerId: "demo-customer-3",
        driverId: null,
        pickup: { lat: 37.7609, lng: -122.4350, address: "Castro District, SF" },
        dropoff: { lat: 37.8199, lng: -122.4783, address: "Golden Gate Bridge" },
        estimatedFare: 18.25,
        stakedAmount: 20.99,
        actualFare: null,
        status: "waiting",
        currentLocation: null,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        customerRating: null,
        driverRating: null,
        customerFeedback: null,
        driverFeedback: null,
      },
    ];

    demoRides.forEach(ride => this.rides.set(ride.id, ride));

    // Create demo customers for these rides
    const demoCustomers: User[] = [
      {
        id: "demo-customer-1",
        walletAddress: "0xcustomer1...xyz",
        role: "customer",
        reputation: 65,
        completedRides: 12,
        avgRating: 4.5,
        balance: 150.00,
        name: "Emma Thompson",
      },
      {
        id: "demo-customer-2",
        walletAddress: "0xcustomer2...uvw",
        role: "customer",
        reputation: 88,
        completedRides: 34,
        avgRating: 4.8,
        balance: 75.50,
        name: "David Park",
      },
      {
        id: "demo-customer-3",
        walletAddress: "0xcustomer3...rst",
        role: "customer",
        reputation: 72,
        completedRides: 8,
        avgRating: 4.3,
        balance: 200.00,
        name: "Lisa Wang",
      },
    ];

    demoCustomers.forEach(customer => this.users.set(customer.id, customer));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      name: insertUser.name || getRandomName(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Ride operations
  async createRide(rideData: InsertRide & { customerId: string }): Promise<Ride> {
    const id = randomUUID();
    const ride: Ride = {
      id,
      customerId: rideData.customerId,
      driverId: null,
      pickup: rideData.pickup,
      dropoff: rideData.dropoff,
      estimatedFare: rideData.estimatedFare,
      stakedAmount: rideData.stakedAmount,
      actualFare: null,
      status: "waiting",
      currentLocation: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      customerRating: null,
      driverRating: null,
      customerFeedback: null,
      driverFeedback: null,
    };
    this.rides.set(id, ride);
    return ride;
  }

  async getRide(id: string): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getRideWithDetails(id: string): Promise<RideWithDetails | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;

    const customer = ride.customerId ? await this.getUser(ride.customerId) : undefined;
    const driver = ride.driverId ? await this.getUser(ride.driverId) : undefined;

    return {
      ...ride,
      customer: customer ? {
        name: customer.name || "Customer",
        address: customer.walletAddress,
        rating: customer.avgRating,
      } : undefined,
      driver: driver ? {
        name: driver.name || "Driver",
        address: driver.walletAddress,
        rating: driver.avgRating,
        reputation: driver.reputation,
      } : undefined,
    };
  }

  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;
    
    const updatedRide = { ...ride, ...updates };
    this.rides.set(id, updatedRide);
    return updatedRide;
  }

  async getAvailableRides(): Promise<AvailableRide[]> {
    const waitingRides = Array.from(this.rides.values())
      .filter(ride => ride.status === "waiting");
    
    const availableRides: AvailableRide[] = [];
    
    for (const ride of waitingRides) {
      const customer = await this.getUser(ride.customerId);
      
      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(ride.pickup.lat - ride.dropoff.lat, 2) +
        Math.pow(ride.pickup.lng - ride.dropoff.lng, 2)
      ) * 111;

      availableRides.push({
        rideId: ride.id,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        fare: ride.estimatedFare,
        customerRating: customer?.avgRating || 4.0,
        customerName: customer?.name || "Customer",
        distance: Math.round(distance * 10) / 10,
      });
    }

    return availableRides;
  }

  async getActiveRide(userId: string): Promise<RideWithDetails | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const activeStatuses: RideStatus[] = ["waiting", "accepted", "in_progress"];
    
    const activeRide = Array.from(this.rides.values()).find(ride => {
      if (!activeStatuses.includes(ride.status)) return false;
      
      if (user.role === "customer") {
        return ride.customerId === userId;
      } else {
        return ride.driverId === userId;
      }
    });

    if (!activeRide) return undefined;
    
    return this.getRideWithDetails(activeRide.id);
  }

  async getRideHistory(userId: string): Promise<Ride[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    return Array.from(this.rides.values())
      .filter(ride => {
        if (ride.status !== "completed" && ride.status !== "cancelled") return false;
        
        if (user.role === "customer") {
          return ride.customerId === userId;
        } else {
          return ride.driverId === userId;
        }
      })
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
      .slice(0, 10);
  }
}

export const storage = new MemStorage();
