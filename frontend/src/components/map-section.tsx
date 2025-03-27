"use client"

import { useState, useEffect, useRef } from "react"
import { MapTabs } from "./map-tabs"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export default function MapSection() {
  const [activeTab, setActiveTab] = useState("dwell")
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Singapore coordinates
  const singaporeCoordinates = [1.3521, 103.8198]
  const initialZoom = 12

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current).setView(singaporeCoordinates as L.LatLngExpression, initialZoom)

      // Add dark theme map tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      // Add Singapore boundary (simplified)
      const singaporeBoundary = L.polygon(
        [
          [1.4486, 103.606],
          [1.4707, 104.0451],
          [1.1454, 104.094],
          [1.1587, 103.5944],
        ],
        {
          color: "#3a3a9f",
          weight: 2,
          fillColor: "#3a3a9f",
          fillOpacity: 0.1,
        },
      ).addTo(map)

      // Add some example markers for traffic hotspots
      const trafficHotspots = [
        { position: [1.3521, 103.8198], name: "Central Business District" },
        { position: [1.3644, 103.9915], name: "Changi Airport" },
        { position: [1.2966, 103.7764], name: "Jurong East" },
        { position: [1.334, 103.8465], name: "Orchard Road" },
        { position: [1.3099, 103.7775], name: "Buona Vista" },
      ]

      // Create custom marker icon
      const markerIcon = L.divIcon({
        className: "custom-marker",
        html: `<div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      // Add markers
      trafficHotspots.forEach((spot) => {
        const marker = L.marker(spot.position as L.LatLngExpression, { icon: markerIcon }).addTo(map)
        marker.bindPopup(`<b>${spot.name}</b><br>Traffic congestion detected`)
      })

      // Save map instance to ref
      mapRef.current = map
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update map visualization based on active tab
  useEffect(() => {
    if (!mapRef.current) return

    // In a real application, you would update the map visualization based on the active tab
    // For example, changing the markers, heatmap, or other overlays

    // Example of how you might update the map based on the active tab
    const map = mapRef.current

    // Clear existing overlays (except base layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return // Keep the base tile layer
      map.removeLayer(layer)
    })

    // Add Singapore boundary again
    const singaporeBoundary = L.polygon(
      [
        [1.4486, 103.606],
        [1.4707, 104.0451],
        [1.1454, 104.094],
        [1.1587, 103.5944],
      ],
      {
        color: "#3a3a9f",
        weight: 2,
        fillColor: "#3a3a9f",
        fillOpacity: 0.1,
      },
    ).addTo(map)

    // Different visualizations based on tab
    if (activeTab === "dwell") {
      // Add dwell time heatmap (simulated)
      const heatmapPoints = [
        [1.3521, 103.8198, 0.8], // CBD - high dwell time
        [1.334, 103.8465, 0.7], // Orchard Road - high dwell time
        [1.2966, 103.7764, 0.5], // Jurong East - medium dwell time
      ]

      // Simulate heatmap with circles
      heatmapPoints.forEach(([lat, lng, intensity]) => {
        L.circle([lat, lng] as L.LatLngExpression, {
          radius: 1000,
          color: "transparent",
          fillColor: "#ff5f5f",
          fillOpacity: intensity as number,
        }).addTo(map)
      })
    } else if (activeTab === "speed") {
      // Add speed visualization (simulated with colored lines)
      const speedRoutes = [
        {
          path: [
            [1.3521, 103.8198],
            [1.334, 103.8465],
          ],
          speed: "slow", // red
        },
        {
          path: [
            [1.3521, 103.8198],
            [1.2966, 103.7764],
          ],
          speed: "medium", // yellow
        },
        {
          path: [
            [1.3521, 103.8198],
            [1.3644, 103.9915],
          ],
          speed: "fast", // green
        },
      ]

      speedRoutes.forEach((route) => {
        const color = route.speed === "slow" ? "#ef4444" : route.speed === "medium" ? "#facc15" : "#4ade80"

        L.polyline(route.path as L.LatLngExpression[], {
          color,
          weight: 5,
          opacity: 0.7,
        }).addTo(map)
      })
    } else if (activeTab === "count") {
      // Add vehicle count visualization (simulated with markers)
      const countLocations = [
        { position: [1.3521, 103.8198], count: 120 },
        { position: [1.334, 103.8465], count: 85 },
        { position: [1.2966, 103.7764], count: 65 },
        { position: [1.3644, 103.9915], count: 40 },
        { position: [1.3099, 103.7775], count: 30 },
      ]

      countLocations.forEach((loc) => {
        const marker = L.marker(loc.position as L.LatLngExpression, {
          icon: L.divIcon({
            className: "count-marker",
            html: `<div class="flex items-center justify-center w-12 h-12 rounded-full bg-[#8a93c0] text-white font-bold border-2 border-white">${loc.count}</div>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          }),
        }).addTo(map)
      })
    }
  }, [activeTab])

  return (
    <div className="relative rounded-lg overflow-hidden h-[300px]">
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Map tabs */}
      <div className="absolute top-4 left-4 z-10">
        <MapTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  )
}

