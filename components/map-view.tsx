"use client"

import { useEffect, useRef } from "react"

interface MapLocation {
  id: string
  title: string
  latitude: number
  longitude: number
  price_per_hour: number
}

interface MapViewProps {
  locations: MapLocation[]
  selectedLocation?: string
  onSelectLocation?: (id: string) => void
}

export function MapView({ locations, selectedLocation, onSelectLocation }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Create a simple map visualization using HTML/CSS
    const canvas = document.createElement("canvas")
    canvas.width = mapContainer.current.clientWidth
    canvas.height = 400

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw background
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Find bounds of all locations
    if (locations.length > 0) {
      const lats = locations.map((l) => l.latitude)
      const lons = locations.map((l) => l.longitude)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)

      const latRange = maxLat - minLat || 0.01
      const lonRange = maxLon - minLon || 0.01
      const padding = 0.1

      // Draw markers
      locations.forEach((location) => {
        const x =
          ((location.longitude - minLon + padding * lonRange) / (lonRange + padding * 2 * lonRange)) * canvas.width
        const y =
          ((location.latitude - minLat + padding * latRange) / (latRange + padding * 2 * latRange)) * canvas.height

        // Draw marker circle
        const isSelected = selectedLocation === location.id
        ctx.fillStyle = isSelected ? "#2563eb" : "#60a5fa"
        ctx.beginPath()
        ctx.arc(x, y, isSelected ? 8 : 6, 0, Math.PI * 2)
        ctx.fill()

        // Draw price label
        ctx.fillStyle = "#000"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillText(`$${location.price_per_hour}`, x, y + 16)
      })
    }

    if (mapContainer.current) {
      mapContainer.current.innerHTML = ""
      mapContainer.current.appendChild(canvas)
    }
  }, [locations, selectedLocation])

  return (
    <div className="space-y-4">
      <div
        ref={mapContainer}
        className="border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 cursor-pointer"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {locations.slice(0, 4).map((location) => (
          <button
            key={location.id}
            onClick={() => onSelectLocation?.(location.id)}
            className={`p-3 rounded-lg border-2 transition-colors text-left ${
              selectedLocation === location.id
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                : "border-gray-200 dark:border-slate-700 hover:border-gray-300"
            }`}
          >
            <p className="font-semibold text-sm">{location.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">${location.price_per_hour}/hr</p>
          </button>
        ))}
      </div>
    </div>
  )
}
