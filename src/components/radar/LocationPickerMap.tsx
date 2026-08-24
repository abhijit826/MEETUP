"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Navigation, Loader2 } from "lucide-react";

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number, addressName?: string) => void;
}

// Quick presets near campus / popular hotspots
const QUICK_PRESETS = [
  { name: "Potheri Railway Station / Campus Gate", lat: 12.8225, lng: 80.0262 },
  { name: "SRM Tech Park Grounds", lat: 12.824, lng: 80.0445 },
  { name: "Central Library Grounds", lat: 12.8231, lng: 80.042 },
  { name: "Student Plaza Canteen", lat: 12.8218, lng: 80.038 },
  { name: "Sports Complex & Football Turf", lat: 12.825, lng: 80.046 },
];

export default function LocationPickerMap({
  lat,
  lng,
  onPick,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const customPinIcon = L.divIcon({
        className: "custom-picker-pin",
        html: `
          <div class="relative flex flex-col items-center animate-bounce">
            <div class="w-8 h-8 rounded-full bg-purple-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black">
              📍
            </div>
            <div class="w-2 h-2 bg-purple-600 rotate-45 -mt-1 shadow-md"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", async (e) => {
        const markerPos = e.target.getLatLng();
        reverseGeocode(markerPos.lat, markerPos.lng);
      });

      map.on("click", (e) => {
        const clickLat = e.latlng.lat;
        const clickLng = e.latlng.lng;
        marker.setLatLng([clickLat, clickLng]);
        reverseGeocode(clickLat, clickLng);
      });

      markerRef.current = marker;
      leafletMapRef.current = map;
    }
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
    if (markerRef.current && leafletMapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMapRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (targetLat: number, targetLng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}`
      );
      const data = await res.json();
      const name = data.display_name
        ? data.display_name.split(",").slice(0, 3).join(",")
        : `Location (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)})`;
      onPick(targetLat, targetLng, name);
    } catch {
      onPick(targetLat, targetLng);
    }
  };

  // Search places via Nominatim with debounce
  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText.trim())}`
      );
      const data = await res.json();
      setSearchResults(data.slice(0, 6) || []);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length > 2) {
      executeSearch(val);
    } else {
      setSearchResults([]);
    }
  };

  // Use Browser GPS Location
  const handleUseCurrentGps = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsLat = pos.coords.latitude;
        const gpsLng = pos.coords.longitude;
        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.flyTo([gpsLat, gpsLng], 17);
          markerRef.current.setLatLng([gpsLat, gpsLng]);
        }
        reverseGeocode(gpsLat, gpsLng);
        setFetchingGps(false);
      },
      (err) => {
        console.error(err);
        alert("Could not fetch GPS location. Please select on map.");
        setFetchingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeSearch(searchQuery);
              }
            }}
            placeholder="Type city, campus, landmark or street..."
            className="w-full py-2 pl-8 pr-8 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:border-purple-500 font-medium"
          />
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          {searching && (
            <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-500 animate-spin" />
          )}
        </div>
        <button
          type="button"
          onClick={handleUseCurrentGps}
          disabled={fetchingGps}
          className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm"
          title="Use My Exact GPS Location"
        >
          {fetchingGps ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <>
              <Navigation size={13} /> GPS
            </>
          )}
        </button>
      </div>

      {/* Instant Location Autocomplete Dropdown */}
      {showDropdown && (searchResults.length > 0 || searchQuery.length === 0) && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-xl p-1.5 space-y-1 max-h-48 overflow-y-auto z-50 relative">
          {searchQuery.length === 0 && (
            <div className="px-2 py-1 text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">
              Popular Nearby Landmark Presets
            </div>
          )}

          {searchResults.length > 0
            ? searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const rLat = parseFloat(r.lat);
                    const rLng = parseFloat(r.lon);
                    if (leafletMapRef.current && markerRef.current) {
                      leafletMapRef.current.flyTo([rLat, rLng], 17);
                      markerRef.current.setLatLng([rLat, rLng]);
                    }
                    const name = r.display_name.split(",").slice(0, 3).join(",");
                    onPick(rLat, rLng, name);
                    setShowDropdown(false);
                    setSearchQuery(name);
                  }}
                  className="p-2 rounded-lg hover:bg-purple-50 text-[11px] font-medium text-gray-800 cursor-pointer flex items-center gap-2 border-b border-gray-50 last:border-0"
                >
                  <MapPin size={13} className="text-purple-500 shrink-0" />
                  <span className="truncate">{r.display_name}</span>
                </div>
              ))
            : QUICK_PRESETS.map((preset, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (leafletMapRef.current && markerRef.current) {
                      leafletMapRef.current.flyTo([preset.lat, preset.lng], 17);
                      markerRef.current.setLatLng([preset.lat, preset.lng]);
                    }
                    onPick(preset.lat, preset.lng, preset.name);
                    setShowDropdown(false);
                    setSearchQuery(preset.name);
                  }}
                  className="p-2 rounded-lg hover:bg-purple-50 text-[11px] font-semibold text-gray-700 cursor-pointer flex items-center gap-2"
                >
                  <MapPin size={13} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{preset.name}</span>
                </div>
              ))}
        </div>
      )}

      {/* Interactive Location Picker Map */}
      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-purple-200 shadow-inner">
        <div ref={mapRef} className="w-full h-full z-0" />
        <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-purple-200 text-[9px] font-extrabold text-purple-700 shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>
          Tap map or drag pin to place exact location
        </div>
      </div>
    </div>
  );
}
