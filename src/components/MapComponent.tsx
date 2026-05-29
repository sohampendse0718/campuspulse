'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Issue = {
  id: string
  title: string
  description: string
  category: string
  status: string
  latitude: number
  longitude: number
  address: string
  before_image_url: string | null
  created_at: string
  upvotes: number
}

type MapComponentProps = {
  issues: Issue[]
  onMarkerClick: (issue: Issue) => void
}

export default function MapComponent({ issues, onMarkerClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current) {
      // GEC Campus Bounds
      const southWest = L.latLng(15.4112961, 73.9764297);
      const northEast = L.latLng(15.4293129, 73.9835992);
      const bounds = L.latLngBounds(southWest, northEast);
      
      const defaultCenter: [number, number] = [15.4202821, 73.9804854] // GEC Campus Center
      
      mapRef.current = L.map('map', {
        center: defaultCenter,
        zoom: 16,
        minZoom: 15,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add markers for each issue
    issues.forEach(issue => {
      if (issue.latitude && issue.longitude) {
        const color = getMarkerColor(issue.status)
        const icon = createCustomIcon(color, issue.category)
        
        const marker = L.marker([issue.latitude, issue.longitude], { icon })
          .addTo(mapRef.current!)
          .on('click', () => onMarkerClick(issue))

        // Add popup
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${issue.title}</h3>
            <p style="font-size: 14px; color: #666; margin-bottom: 8px;">${issue.description.substring(0, 100)}...</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                ${issue.status.replace('_', ' ').toUpperCase()}
              </span>
              <span style="font-size: 12px; color: #666;">${getCategoryIcon(issue.category)} ${issue.category}</span>
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
              👍 ${issue.upvotes} upvotes
            </div>
          </div>
        `)

        markersRef.current.push(marker)
      }
    })

    // Fit bounds to show all markers if there are any
    if (issues.length > 0 && markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current)
      mapRef.current.fitBounds(group.getBounds().pad(0.1))
    }

    return () => {
      // Cleanup markers on unmount
      markersRef.current.forEach(marker => marker.remove())
    }
  }, [issues, onMarkerClick])

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'open': return '#ef4444' // red
      case 'in_progress': return '#eab308' // yellow
      case 'resolved': return '#22c55e' // green
      default: return '#6b7280' // gray
    }
  }

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'road': return '🛣️'
      case 'lighting': return '💡'
      case 'sanitation': return '🗑️'
      case 'water': return '💧'
      default: return '📍'
    }
  }

  const createCustomIcon = (color: string, category: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 16px;
          ">${getCategoryIcon(category)}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  }

  return (
    <div 
      id="map" 
      style={{ 
        width: '100%', 
        height: '600px',
        zIndex: 1 
      }}
    />
  )
}
