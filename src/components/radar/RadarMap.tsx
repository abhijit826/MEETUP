"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CampusActivity, RadarCategory } from "@/types/radar";

interface RadarMapProps {
  activities: CampusActivity[];
  selectedActivityId?: string | null;
  onSelectActivity: (activity: CampusActivity) => void;
  userLat?: number;
  userLng?: number;
}

const CATEGORY_COLORS: Record<RadarCategory, string> = {
  Sports: "#ef4444", // Red
  Study: "#3b82f6", // Blue
  Food: "#f97316", // Orange
  Gaming: "#a855f7", // Purple
  Events: "#ec4899", // Pink
  Trips: "#10b981", // Green
  Clubs: "#6366f1", // Indigo
  "Personal Meetups": "#eab308", // Yellow
  Others: "#6b7280", // Gray
};

const CATEGORY_EMOJIS: Record<RadarCategory, string> = {
  Sports: "⚽",
  Study: "📚",
  Food: "🍕",
  Gaming: "🎮",
  Events: "🎉",
  Trips: "🎒",
  Clubs: "🏛️",
  "Personal Meetups": "☕",
  Others: "✨",
};

export default function RadarMap({
  activities,
  selectedActivityId,
  onSelectActivity,
  userLat = 28.6012,
  userLng = 77.2181,
}: RadarMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [userLat, userLng],
        zoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Add dark/sleek tile layer or standard OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add user location pulsing marker
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-purple-500/30 animate-ping"></div>
            <div class="relative w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindTooltip("📍 You (Approximate Location)", { permanent: false, direction: "top" });

      // Add approximate 500m radar boundary circle
      const userCircle = L.circle([userLat, userLng], {
        radius: 400,
        color: "#a855f7",
        weight: 1.5,
        dashArray: "6, 6",
        fillColor: "#a855f7",
        fillOpacity: 0.05,
      }).addTo(map);

      userMarkerRef.current = userMarker;
      userCircleRef.current = userCircle;
      leafletMapRef.current = map;
      
      if (userLat !== 28.6012 || userLng !== 77.2181) {
        hasCenteredRef.current = true;
      }
    } else {
      // Update existing marker and circle coordinates
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      }
      if (userCircleRef.current) {
        userCircleRef.current.setLatLng([userLat, userLng]);
      }

      // Center map initially if a real location is retrieved
      if (!hasCenteredRef.current && (userLat !== 28.6012 || userLng !== 77.2181)) {
        leafletMapRef.current.setView([userLat, userLng], 16);
        hasCenteredRef.current = true;
      }
    }

    const map = leafletMapRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Add activity markers
    activities.forEach((act) => {
      const color = CATEGORY_COLORS[act.category] || "#6b7280";
      const emoji = CATEGORY_EMOJIS[act.category] || "📍";
      const isSelected = selectedActivityId === act.id;

      const markerIcon = L.divIcon({
        className: "custom-activity-marker",
        html: `
          <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-300 ${
            isSelected ? "scale-125 z-50" : "hover:scale-110"
          }">
            <div class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-extrabold text-white shadow-md border border-white" style="background-color: ${color}">
              <span>${emoji}</span>
              <span class="max-w-[70px] truncate">${act.title.split(" ")[0]}</span>
            </div>
            <div class="w-2 h-2 rotate-45 -mt-1 shadow-sm" style="background-color: ${color}"></div>
          </div>
        `,
        iconSize: [100, 36],
        iconAnchor: [50, 36],
      });

      const marker = L.marker([act.latitude, act.longitude], { icon: markerIcon }).addTo(map);

      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${act.latitude},${act.longitude}`;

      const popupContent = document.createElement("div");
      popupContent.className = "p-1 font-sans space-y-2";
      popupContent.innerHTML = `
        <div class="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
          ${act.category} • ${act.approxDistance}
        </div>
        <h4 class="font-extrabold text-xs text-gray-900 leading-tight">${act.title}</h4>
        <p class="text-[11px] text-gray-600 font-medium">📍 ${act.locationName}</p>
        <p class="text-[11px] text-purple-600 font-bold">⏰ ${act.time}</p>
        <div class="flex items-center justify-between pt-1 border-t border-gray-100">
          <span class="text-[10px] text-gray-500 font-semibold">👥 ${act.participantCount} Interested</span>
          <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded-md flex items-center gap-0.5">
            🗺️ Directions
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onSelectActivity(act);
      });

      markersRef.current[act.id] = marker;
    });
  }, [activities, selectedActivityId, onSelectActivity, userLat, userLng]);

  // Pan to selected activity
  useEffect(() => {
    if (selectedActivityId && leafletMapRef.current && markersRef.current[selectedActivityId]) {
      const act = activities.find((a) => a.id === selectedActivityId);
      if (act) {
        leafletMapRef.current.flyTo([act.latitude, act.longitude], 17, {
          animate: true,
          duration: 1,
        });
        markersRef.current[selectedActivityId].openPopup();
      }
    }
  }, [selectedActivityId, activities]);

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <div ref={mapRef} className="w-full h-full min-h-[280px] z-0" />
      <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 text-[10px] font-extrabold text-purple-700 shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Interactive Campus Radar Map
      </div>
    </div>
  );
}
