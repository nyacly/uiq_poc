'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Map, Marker, MapRef } from 'react-map-gl/mapbox'
import { Button } from './Button'
import { Maximize2, Minimize2, Navigation, Layers, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

// Map bounds interface
interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// Map location interface
interface MapLocation {
  id: string
  latitude: number
  longitude: number
  name: string
  category: string
  rating?: number
  verified?: boolean
  imageUrl?: string
  address?: string
}

// Cluster data interface
interface ClusterFeature {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    cluster: boolean
    cluster_id?: number
    point_count?: number
    locations?: MapLocation[]
  }
}

interface MapModuleProps {
  locations: MapLocation[]
  selectedLocationId?: string
  onLocationSelect?: (location: MapLocation) => void
  onBoundsChange?: (bounds: MapBounds) => void
  className?: string
  mapStyle?: string
  enableClustering?: boolean
  reducedMotion?: boolean
  showControls?: boolean
  initialViewState?: {
    latitude: number
    longitude: number
    zoom: number
  }
}

// Default Queensland center coordinates
const DEFAULT_VIEW_STATE = {
  latitude: -27.4705,
  longitude: 153.0260,
  zoom: 10
}

// Mapbox public token placeholder - this would need to be configured
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export function MapModule({
  locations = [],
  selectedLocationId,
  onLocationSelect,
  onBoundsChange,
  className = '',
  mapStyle = 'mapbox://styles/mapbox/streets-v12',
  enableClustering = true,
  reducedMotion = false,
  showControls = true,
  initialViewState = DEFAULT_VIEW_STATE
}: MapModuleProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState(initialViewState)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSatellite, setShowSatellite] = useState(false)
  const [clusters, setClusters] = useState<ClusterFeature[]>([])
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null)

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  const shouldAnimate = !reducedMotion && !prefersReducedMotion

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) {
      return null
    }

    return locations.find((location) => location.id === selectedLocationId) ?? null
  }, [locations, selectedLocationId])

  // SSR fallback component
  const SSRFallback = () => (
    <div className={cn(
      "bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center",
      "min-h-[400px] w-full",
      className
    )}>
      <div className="text-center text-gray-500">
        <div className="w-12 h-12 mx-auto mb-4 bg-gray-300 rounded opacity-50 flex items-center justify-center">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm">Map loading...</p>
        <p className="text-xs text-gray-400 mt-1">Enable JavaScript to view interactive map</p>
      </div>
    </div>
  )

  // Handle map load
  const handleMapLoad = useCallback(() => {
    if (mapRef.current && onBoundsChange) {
      const bounds = mapRef.current.getBounds()
      if (bounds) {
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        })
      }
    }
  }, [onBoundsChange])

  // Handle viewport change
  const handleViewStateChange = useCallback(({ viewState: newViewState }: { viewState: any }) => {
    setViewState(newViewState)
    
    // Debounced bounds update
    setTimeout(() => {
      if (mapRef.current && onBoundsChange) {
        const bounds = mapRef.current.getBounds()
        if (bounds) {
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          })
        }
      }
    }, 300)
  }, [onBoundsChange])

  // Simple clustering algorithm for demo
  const clusterLocations = useCallback((locations: MapLocation[], zoom: number): ClusterFeature[] => {
    if (!enableClustering || zoom > 14) {
      return locations.map(location => ({
        geometry: {
          coordinates: [location.longitude, location.latitude] as [number, number]
        },
        properties: {
          cluster: false,
          locations: [location]
        }
      }))
    }

    // Simple grid-based clustering
    const clusterMap = new Map<string, MapLocation[]>()
    const precision = Math.max(2, 6 - zoom)
    
    locations.forEach(location => {
      const gridKey = `${Math.round(location.latitude * precision)}:${Math.round(location.longitude * precision)}`
      if (!clusterMap.has(gridKey)) {
        clusterMap.set(gridKey, [])
      }
      clusterMap.get(gridKey)!.push(location)
    })

    return Array.from(clusterMap.entries()).map(([key, clusterLocations]: [string, MapLocation[]]) => {
      if (clusterLocations.length === 1) {
        return {
          geometry: {
            coordinates: [clusterLocations[0].longitude, clusterLocations[0].latitude] as [number, number]
          },
          properties: {
            cluster: false,
            locations: clusterLocations
          }
        }
      }

      // Calculate cluster center
      const avgLat = clusterLocations.reduce((sum: number, loc: MapLocation) => sum + loc.latitude, 0) / clusterLocations.length
      const avgLng = clusterLocations.reduce((sum: number, loc: MapLocation) => sum + loc.longitude, 0) / clusterLocations.length

      return {
        geometry: {
          coordinates: [avgLng, avgLat] as [number, number]
        },
        properties: {
          cluster: true,
          cluster_id: key,
          point_count: clusterLocations.length,
          locations: clusterLocations
        }
      }
    })
  }, [enableClustering])

  // Update clusters when locations or zoom changes
  useEffect(() => {
    const newClusters = clusterLocations(locations, viewState.zoom)
    setClusters(newClusters)
  }, [locations, viewState.zoom, clusterLocations])

  useEffect(() => {
    if (!selectedLocation) {
      return
    }

    setViewState((prev) => ({
      ...prev,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      zoom: Math.max(prev.zoom, 13),
      transitionDuration: shouldAnimate ? 600 : 0,
    }))
  }, [selectedLocation, shouldAnimate])

  // Handle marker click
  const handleMarkerClick = useCallback((cluster: ClusterFeature) => {
    if (cluster.properties.cluster && cluster.properties.point_count! > 1) {
      // Zoom in on cluster
      const [longitude, latitude] = cluster.geometry.coordinates
      setViewState(prev => ({
        ...prev,
        latitude,
        longitude,
        zoom: Math.min(prev.zoom + 2, 18),
        transitionDuration: shouldAnimate ? 500 : 0
      }))
    } else if (cluster.properties.locations && onLocationSelect) {
      // Select single location
      onLocationSelect(cluster.properties.locations[0])
    }
  }, [onLocationSelect, shouldAnimate])

  // Reset view to show all locations
  const resetView = useCallback(() => {
    if (locations.length === 0) return

    const lats = locations.map(loc => loc.latitude)
    const lngs = locations.map(loc => loc.longitude)
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }

    const center = {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.east + bounds.west) / 2
    }

    setViewState(prev => ({
      ...prev,
      ...center,
      zoom: 12,
      transitionDuration: shouldAnimate ? 1000 : 0
    }))
  }, [locations, shouldAnimate])

  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return <SSRFallback />
  }

  // No Mapbox token fallback
  if (!MAPBOX_TOKEN) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg",
        "min-h-[400px] w-full flex items-center justify-center",
        className
      )}>
        <div className="text-center text-blue-700 p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Map className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
          <p className="text-sm text-blue-600 max-w-md">
            {locations.length} business{locations.length !== 1 ? 'es' : ''} found in the area
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Configure NEXT_PUBLIC_MAPBOX_TOKEN to enable interactive mapping
          </p>
        </div>
      </div>
    )
  }

  const currentMapStyle = showSatellite 
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : mapStyle

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleViewStateChange}
        onLoad={handleMapLoad}
        mapStyle={currentMapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        minZoom={8}
        maxZoom={18}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchZoomRotate={false}
      >
        {/* Render clusters and markers */}
        {clusters.map((cluster, index) => {
          const [longitude, latitude] = cluster.geometry.coordinates
          const isCluster = cluster.properties.cluster
          const pointCount = cluster.properties.point_count || 1
          const isSelected = cluster.properties.locations?.some(loc => loc.id === selectedLocationId)
          const isHovered = hoveredCluster === `${latitude}-${longitude}`

          if (isCluster && pointCount > 1) {
            // Cluster marker
            const size = Math.min(40 + (pointCount * 2), 60)
            
            return (
              <Marker
                key={`cluster-${index}`}
                longitude={longitude}
                latitude={latitude}
                onClick={() => handleMarkerClick(cluster)}
              >
                <div
                  className={cn(
                    "rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-200",
                    "flex items-center justify-center text-white font-bold text-sm",
                    "bg-red-500 hover:bg-red-600",
                    isHovered && "scale-110"
                  )}
                  style={{ width: size, height: size }}
                  onMouseEnter={() => setHoveredCluster(`${latitude}-${longitude}`)}
                  onMouseLeave={() => setHoveredCluster(null)}
                >
                  {pointCount}
                </div>
              </Marker>
            )
          } else {
            // Individual location marker
            const location = cluster.properties.locations![0]
            
            return (
              <Marker
                key={`location-${location.id}`}
                longitude={longitude}
                latitude={latitude}
                onClick={() => handleMarkerClick(cluster)}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-200",
                    "flex items-center justify-center text-white text-xs font-bold",
                    isSelected 
                      ? "bg-yellow-500 border-yellow-400 scale-125 shadow-xl" 
                      : "bg-blue-500 hover:bg-blue-600 hover:scale-110",
                    location.verified && "ring-2 ring-green-400"
                  )}
                  onMouseEnter={() => setHoveredCluster(`${latitude}-${longitude}`)}
                  onMouseLeave={() => setHoveredCluster(null)}
                >
                  {location.verified ? '✓' : location.category?.charAt(0) || 'B'}
                </div>
              </Marker>
            )
          }
        })}

        {/* Map controls */}
        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {/* Fullscreen toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white shadow-md hover:shadow-lg"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Map style toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSatellite(!showSatellite)}
              className="bg-white shadow-md hover:shadow-lg"
            >
              <Layers className="w-4 h-4" />
            </Button>

            {/* Reset view */}
            <Button
              size="sm"
              variant="outline"
              onClick={resetView}
              className="bg-white shadow-md hover:shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Current location */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    setViewState(prev => ({
                      ...prev,
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude,
                      zoom: 14,
                      transitionDuration: shouldAnimate ? 1000 : 0
                    }))
                  })
                }
              }}
              className="bg-white shadow-md hover:shadow-lg"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Map>

      {/* Location summary overlay */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{locations.length}</span> 
            {' '}business{locations.length !== 1 ? 'es' : ''}
            {enableClustering && viewState.zoom < 14 && (
              <span className="block text-xs text-gray-500 mt-1">
                Zoom in to see individual locations
              </span>
            )}
          </div>
        </div>
      )}

      {/* Reduced motion indicator */}
      {(reducedMotion || prefersReducedMotion) && (
        <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
          Reduced motion enabled
        </div>
      )}
    </div>
  )
}