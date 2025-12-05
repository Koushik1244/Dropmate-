import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Location } from "@shared/schema";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const driverIcon = new L.DivIcon({
  className: "driver-marker",
  html: `
    <div class="relative">
      <div class="absolute -translate-x-1/2 -translate-y-1/2">
        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[hsl(280,75%,50%)] flex items-center justify-center shadow-lg animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const pickupIcon = new L.DivIcon({
  className: "pickup-marker",
  html: `
    <div class="relative">
      <div class="absolute -translate-x-1/2 -translate-y-full">
        <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-emerald-500 mx-auto -mt-1"></div>
      </div>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

const dropoffIcon = new L.DivIcon({
  className: "dropoff-marker",
  html: `
    <div class="relative">
      <div class="absolute -translate-x-1/2 -translate-y-full">
        <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-blue-500 mx-auto -mt-1"></div>
      </div>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

// Component to update map view
function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [map, center, zoom]);

  return null;
}

interface LiveMapProps {
  driverLocation?: Location | null;
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  showRoute?: boolean;
  className?: string;
  interactive?: boolean;
  onLocationSelect?: (location: Location) => void;
}

export function LiveMap({
  driverLocation,
  pickupLocation,
  dropoffLocation,
  showRoute = false,
  className = "",
  interactive = false,
  onLocationSelect,
}: LiveMapProps) {
  const mapRef = useRef<L.Map>(null);

  // Calculate center based on available locations
  const getCenter = (): [number, number] => {
    if (driverLocation) return [driverLocation.lat, driverLocation.lng];
    if (pickupLocation) return [pickupLocation.lat, pickupLocation.lng];
    if (dropoffLocation) return [dropoffLocation.lat, dropoffLocation.lng];
    // Default to San Francisco
    return [37.7749, -122.4194];
  };

  // Calculate route points
  const routePoints: [number, number][] = [];
  if (showRoute) {
    if (pickupLocation) routePoints.push([pickupLocation.lat, pickupLocation.lng]);
    if (driverLocation) routePoints.push([driverLocation.lat, driverLocation.lng]);
    if (dropoffLocation) routePoints.push([dropoffLocation.lat, dropoffLocation.lng]);
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`} data-testid="live-map">
      <MapContainer
        ref={mapRef}
        center={getCenter()}
        zoom={14}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="h-full w-full"
        style={{ minHeight: "200px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={getCenter()} />

        {/* Driver Marker */}
        {driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={driverIcon}
          />
        )}

        {/* Pickup Marker */}
        {pickupLocation && (
          <Marker
            position={[pickupLocation.lat, pickupLocation.lng]}
            icon={pickupIcon}
          />
        )}

        {/* Dropoff Marker */}
        {dropoffLocation && (
          <Marker
            position={[dropoffLocation.lat, dropoffLocation.lng]}
            icon={dropoffIcon}
          />
        )}

        {/* Route Line */}
        {showRoute && routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "hsl(320, 85%, 50%)",
              weight: 4,
              opacity: 0.8,
              dashArray: "10, 10",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

// Small map thumbnail for ride cards
interface MapThumbnailProps {
  pickup: Location;
  dropoff: Location;
  className?: string;
}

export function MapThumbnail({ pickup, dropoff, className = "" }: MapThumbnailProps) {
  const center: [number, number] = [
    (pickup.lat + dropoff.lat) / 2,
    (pickup.lng + dropoff.lng) / 2,
  ];

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
        <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} />
        <Polyline
          positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
          pathOptions={{
            color: "hsl(320, 85%, 50%)",
            weight: 3,
            opacity: 0.7,
          }}
        />
      </MapContainer>
    </div>
  );
}
