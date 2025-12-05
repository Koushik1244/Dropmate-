import { useState, useEffect } from "react";
import { MapPin, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Location } from "@shared/schema";
import { cn } from "@/lib/utils";

// Sample locations for demo
const sampleLocations: { name: string; location: Location }[] = [
  { name: "Central Station", location: { lat: 37.7749, lng: -122.4194, address: "Central Station, Downtown" } },
  { name: "Airport Terminal 1", location: { lat: 37.6213, lng: -122.3790, address: "Airport Terminal 1, SFO" } },
  { name: "Golden Gate Bridge", location: { lat: 37.8199, lng: -122.4783, address: "Golden Gate Bridge, SF" } },
  { name: "Fisherman's Wharf", location: { lat: 37.8080, lng: -122.4177, address: "Fisherman's Wharf, SF" } },
  { name: "Union Square", location: { lat: 37.7879, lng: -122.4074, address: "Union Square, Downtown SF" } },
  { name: "Pier 39", location: { lat: 37.8087, lng: -122.4098, address: "Pier 39, San Francisco" } },
  { name: "Castro District", location: { lat: 37.7609, lng: -122.4350, address: "Castro District, SF" } },
  { name: "Mission District", location: { lat: 37.7599, lng: -122.4148, address: "Mission District, SF" } },
];

interface LocationInputProps {
  label: string;
  value: Location | null;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  className?: string;
  type?: "pickup" | "dropoff";
}

export function LocationInput({
  label,
  value,
  onChange,
  placeholder = "Enter location...",
  className,
  type = "pickup",
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value?.address || "");
  const [suggestions, setSuggestions] = useState<typeof sampleLocations>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value?.address) {
      setInputValue(value.address);
    }
  }, [value?.address]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    
    if (query.length > 0) {
      const filtered = sampleLocations.filter(loc =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.location.address?.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      onChange(null);
    }
  };

  const handleSelectLocation = (loc: typeof sampleLocations[0]) => {
    setInputValue(loc.location.address || loc.name);
    onChange(loc.location);
    setShowSuggestions(false);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location",
          };
          setInputValue("Current Location");
          onChange(location);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <div className="relative">
          <MapPin
            className={cn(
              "absolute left-3 top-1/3 -translate-y-1/2 h-4 w-4",
              type === "pickup" ? "text-emerald-500" : "text-blue-500"
            )}
          />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="pl-10 pr-10"
            data-testid={`input-${type}-location`}
          />
         <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2" // These classes are correct
            onClick={handleGetCurrentLocation}
            data-testid={`button-current-location-${type}`}
          >
            <Crosshair className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {suggestions.map((loc, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors flex items-center gap-3"
                onClick={() => handleSelectLocation(loc)}
                data-testid={`suggestion-${type}-${index}`}
              >
                <MapPin
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    type === "pickup" ? "text-emerald-500" : "text-blue-500"
                  )}
                />
                <div>
                  <p className="font-medium text-sm">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.location.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
