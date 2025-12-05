# DropMate MVP - Decentralized Ride-Sharing Platform

## Overview

DropMate is a minimal viable product (MVP) for a decentralized ride-sharing application built on Web3 principles with blockchain integration. The application connects customers and drivers through a real-time platform with wallet-based authentication, live GPS tracking, and smart contract-powered payments.

**Core Purpose**: Facilitate peer-to-peer ride-sharing with blockchain-backed payments and reputation systems, eliminating traditional intermediaries while ensuring trust through smart contracts.

**Key Features**:
- Wallet-based authentication (MetaMask, Stellar)
- Real-time ride matching between customers and drivers
- Live GPS tracking with WebSocket updates
- Smart contract escrow for ride payments
- Reputation and rating system
- Mock location simulation for development

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: 
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom Polkadot-inspired gradient theme
- Design system follows Material Design principles with fintech aesthetics

**State Management Strategy**:
- React Context API for global state (AuthContext, RideContext, ThemeContext)
- Local component state with useState for UI interactions
- TanStack React Query for server state management and caching
- No Redux or complex state management libraries

**Routing**: Wouter for lightweight client-side routing with role-based route protection

**Key Context Providers**:
- `AuthContext`: Manages wallet connection, user authentication, and role (customer/driver)
- `RideContext`: Handles active rides, available rides, ride history, and WebSocket subscriptions
- `ThemeContext`: Light/dark theme toggling with localStorage persistence

**Real-time Communication**: WebSocket connection for live GPS updates and ride status changes, managed within RideContext with automatic reconnection logic

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API endpoints with `/api` prefix for all backend routes

**Key API Endpoints**:
- `/api/auth/connect` - Wallet-based authentication
- `/api/rides/request` - Create new ride request
- `/api/rides/available` - Get available rides for drivers
- `/api/rides/:id/accept` - Driver accepts a ride
- `/api/rides/:id/start` - Start ride in progress
- `/api/rides/:id/complete` - Complete ride and trigger payment
- `/api/user/:id/profile` - User profile and stats

**WebSocket Server**: Dedicated WebSocket server mounted at `/ws` path using the `ws` library
- Supports ride subscription model (subscribe/unsubscribe by ride ID)
- Broadcasts location updates to subscribed clients
- Handles ride status updates in real-time

**Build Strategy**: 
- Server bundled with esbuild for production
- Selective bundling of dependencies (allowlist approach) to reduce cold start times
- Client built separately with Vite
- Development mode uses Vite middleware for HMR

### Data Storage Solutions

**Current Implementation**: In-memory storage using TypeScript Maps (`MemStorage` class)

**Storage Interface**: `IStorage` interface defines all data operations, allowing easy migration to persistent databases

**Data Models**:
- **Users**: Wallet address, role (customer/driver), reputation score, completed rides, ratings, balance
- **Rides**: Customer/driver IDs, pickup/dropoff locations, fare amounts, status, timestamps, ratings
- **Locations**: Latitude/longitude coordinates with optional address strings

**Database Preparation**: 
- Drizzle ORM configured for PostgreSQL migration
- Schema defined in `shared/schema.ts` using Zod for validation
- Migration directory structure ready (`drizzle.config.ts`)
- Note: Current implementation uses in-memory storage; PostgreSQL can be added later

**Session Management**: 
- Client-side session storage using localStorage
- Session persists wallet address, user role, and user object
- Server-side session support prepared with `connect-pg-simple` package

### Authentication and Authorization

**Authentication Method**: Wallet-based authentication (Web3 paradigm)

**Supported Wallets**: MetaMask, Stellar (simulated in MVP)

**Authentication Flow**:
1. User selects role (customer or driver)
2. Mock wallet connection generates Ethereum-style address
3. Backend creates or retrieves user profile
4. Session stored in localStorage with wallet address and role
5. All subsequent requests use this session

**Authorization**: Role-based route protection
- Customer routes: dashboard, ride request modal, active ride view
- Driver routes: dashboard with available rides, navigation mode
- Routes enforced in `App.tsx` using AuthenticatedRoutes component

**Security Considerations**:
- Production implementation will integrate actual Web3 wallet providers
- Smart contract addresses will be environment-configured
- CORS and rate limiting packages included but not configured in MVP

### External Dependencies

**Blockchain/Web3**:
- Prepared for Stellar network integration with Soroban smart contracts
- Mock smart contract functions in `client/src/lib/smartContract.ts`
- Escrow staking and payment release mechanisms designed but not deployed
- Production will use actual contract addresses via environment variables

**Mapping Service**: 
- Leaflet.js for interactive maps
- React-Leaflet for React integration
- Custom marker icons for drivers, pickup, and dropoff locations
- OpenStreetMap tiles as base layer

**UI Component Libraries**:
- Radix UI primitives (@radix-ui/react-*) for accessible components
- Shadcn/ui as component collection built on Radix
- Lucide React for icons
- React Hook Form with Zod resolvers for form validation

**Development Tools**:
- Replit-specific plugins for development environment
- Vite dev server with HMR
- TypeScript for type safety across full stack
- ESBuild for server bundling

**Real-time Communication**:
- Native WebSocket API (browser) on client
- `ws` library on server
- Protocol: JSON messages with type-based routing

**Styling and Theming**:
- Tailwind CSS with custom configuration
- PostCSS with Autoprefixer
- CSS variables for theme customization
- Polkadot-inspired gradient color scheme

**Location Simulation**: 
- Custom `useAutoLocation` hook for simulating GPS movement
- Calculates movement vectors toward target destinations
- ETA calculations based on distance and speed
- Production will replace with actual GPS/geolocation APIs

**Future Integration Points**:
- Email service (Nodemailer included)
- Payment processing (Stripe included)
- AI features (OpenAI, Google Generative AI included)
- File uploads (Multer configured)