'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export default function MapPicker({ latitude, longitude, onChange, addressText, logoUrl }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const initAttemptedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Keep onChange ref up to date without triggering re-initialization
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Sync searchQuery with addressText on initial render or if empty
  useEffect(() => {
    if (addressText && !searchQuery) {
      setSearchQuery(addressText)
    }
  }, [addressText])

  useEffect(() => {
    let active = true

    const initMap = () => {
      if (!active) return
      
      const container = mapContainerRef.current
      if (!container) return

      const L = window.L
      if (!L) {
        setErrorMessage('Error al cargar la biblioteca de mapas.')
        setLoading(false)
        return
      }

      // If we already have a valid map instance on this container, skip
      if (mapInstanceRef.current) {
        setLoading(false)
        return
      }

      // Coordinates fallback (Rosario, Argentina as default matching placeholder)
      const defaultLat = latitude ? parseFloat(latitude) : -32.9442
      const defaultLng = longitude ? parseFloat(longitude) : -60.6505
      const zoomLevel = latitude && longitude ? 16 : 13

      // CRITICAL: Remove any leftover Leaflet internal ID from the DOM container
      // This prevents "Map container is already initialized" when React re-mounts
      if (container._leaflet_id) {
        delete container._leaflet_id
      }

      // Also clear any child elements left by a previous Leaflet instance
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }

      try {
        // Initialize map
        const map = L.map(container, {
          center: [defaultLat, defaultLng],
          zoom: zoomLevel,
        })
        mapInstanceRef.current = map

        // Dark Mode map tiles (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map)

        // Custom pulsing / glowing drop pin icon
        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="position: relative; width: 40px; height: 52px; transform-style: preserve-3d; perspective: 1000px;">
              <!-- Pulsing shadow on the map ground -->
              <div style="
                position: absolute;
                width: 24px;
                height: 10px;
                background: rgba(124, 58, 237, 0.4);
                border-radius: 50%;
                bottom: -5px;
                left: 8px;
                transform: rotateX(60deg);
                animation: shadow-pulse 2s infinite ease-in-out;
                z-index: 1;
                filter: blur(1.5px);
              "></div>
              
              <!-- Floating Drop Pin -->
              <div style="
                position: absolute;
                width: 40px;
                height: 52px;
                bottom: 0;
                left: 0;
                z-index: 2;
                animation: pin-float 2s infinite ease-in-out;
                transform-origin: bottom center;
              ">
                <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                  <defs>
                    <linearGradient id="pin-grad-picker" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="0%" stop-color="#7C3AED" />
                      <stop offset="100%" stop-color="#06b6d4" />
                    </linearGradient>
                    <clipPath id="logo-clip-picker">
                      <circle cx="20" cy="20" r="13" />
                    </clipPath>
                  </defs>
                  
                  <!-- Outer pin path -->
                  <path d="M20 0C9 0 0 9 0 20C0 35 20 52 20 52C20 52 40 35 40 20C40 9 31 0 20 0Z" fill="url(#pin-grad-picker)" />
                  
                  <!-- White inner circle border -->
                  <circle cx="20" cy="20" r="14.5" fill="#ffffff" />
                  
                  <!-- Circular logo or SC text -->
                  ${logoUrl ? `
                  <g clip-path="url(#logo-clip-picker)">
                    <rect x="7" y="7" width="26" height="26" fill="#131b2e" />
                    <image href="${logoUrl}" x="7" y="7" width="26" height="26" preserveAspectRatio="xMidYMid slice" />
                  </g>
                  ` : `
                  <circle cx="20" cy="20" r="13" fill="#1e1b4b" />
                  <text x="20" y="24" font-size="10.5" font-weight="900" font-family="'Outfit', 'Inter', sans-serif" fill="#06b6d4" text-anchor="middle">SC</text>
                  `}
                </svg>
              </div>
            </div>
            <style>
              @keyframes pin-float {
                0% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
                100% { transform: translateY(0); }
              }
              @keyframes shadow-pulse {
                0% { transform: scale(1) rotateX(60deg); opacity: 0.6; }
                50% { transform: scale(0.6) rotateX(60deg); opacity: 0.2; }
                100% { transform: scale(1) rotateX(60deg); opacity: 0.6; }
              }
            </style>
          `,
          iconSize: [40, 52],
          iconAnchor: [20, 52]
        })

        // Add draggable marker
        const marker = L.marker([defaultLat, defaultLng], {
          icon: customIcon,
          draggable: true
        }).addTo(map)
        markerInstanceRef.current = marker

        // Handle marker drag end - use ref to always get latest onChange
        marker.on('dragend', () => {
          const position = marker.getLatLng()
          if (onChangeRef.current) {
            onChangeRef.current(position.lat.toFixed(6), position.lng.toFixed(6))
          }
        })

        // Handle map click to place marker
        map.on('click', (e) => {
          const { lat, lng } = e.latlng
          marker.setLatLng([lat, lng])
          if (onChangeRef.current) {
            onChangeRef.current(lat.toFixed(6), lng.toFixed(6))
          }
        })

        // Fix map render issue inside containers
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 300)

        setLoading(false)
      } catch (err) {
        console.error('Error initializing Leaflet map:', err)
        // If initialization fails, clean up
        if (container._leaflet_id) {
          delete container._leaflet_id
        }
        mapInstanceRef.current = null
        markerInstanceRef.current = null
        setErrorMessage('Error al inicializar el mapa. Intenta recargar la página.')
        setLoading(false)
      }
    }

    const loadLeaflet = () => {
      if (window.L) {
        initMap()
        return
      }

      // Append Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const leafletLink = document.createElement('link')
        leafletLink.id = 'leaflet-css'
        leafletLink.rel = 'stylesheet'
        leafletLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(leafletLink)
      }

      // Append Leaflet JS if not already loading/loaded
      if (!document.getElementById('leaflet-js')) {
        const leafletScript = document.createElement('script')
        leafletScript.id = 'leaflet-js'
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        leafletScript.async = true
        leafletScript.onload = () => {
          if (active) initMap()
        }
        leafletScript.onerror = () => {
          setErrorMessage('Error al cargar scripts de mapa. Revisa tu conexión.')
          setLoading(false)
        }
        document.body.appendChild(leafletScript)
      } else {
        // Script tag exists but might still be loading
        const existingScript = document.getElementById('leaflet-js')
        if (window.L) {
          initMap()
        } else {
          existingScript.addEventListener('load', () => {
            if (active) initMap()
          })
        }
      }
    }

    loadLeaflet()

    return () => {
      active = false
      // Clean up map instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off()
          mapInstanceRef.current.remove()
        } catch (e) {
          // Silently handle - map may already be removed
        }
        mapInstanceRef.current = null
      }
      markerInstanceRef.current = null
      // Clean up the container's leaflet ID
      if (mapContainerRef.current) {
        if (mapContainerRef.current._leaflet_id) {
          delete mapContainerRef.current._leaflet_id
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl])

  // Geolocalize based on search query using Nominatim OpenStreetMap
  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setErrorMessage('')
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        const latitudeVal = parseFloat(lat)
        const longitudeVal = parseFloat(lon)

        // Center map and move marker
        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([latitudeVal, longitudeVal], 16)
          markerInstanceRef.current.setLatLng([latitudeVal, longitudeVal])
        }

        // Notify parent
        if (onChangeRef.current) {
          onChangeRef.current(latitudeVal.toFixed(6), longitudeVal.toFixed(6))
        }
      } else {
        setErrorMessage('No se encontró la dirección en el mapa. Intenta buscar con más detalles (ej: Calle, Altura, Ciudad).')
      }
    } catch (err) {
      console.error('Search location error:', err)
      setErrorMessage('Error de conexión al buscar la dirección.')
    } finally {
      setSearching(false)
    }
  }

  // Auto detect user location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('La geolocalización no está soportada por tu navegador.')
      return
    }

    setSearching(true)
    setErrorMessage('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        
        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16)
          markerInstanceRef.current.setLatLng([lat, lng])
        }
        if (onChangeRef.current) {
          onChangeRef.current(lat.toFixed(6), lng.toFixed(6))
        }
        setSearching(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setErrorMessage('No pudimos acceder a tu ubicación. Asegúrate de dar los permisos necesarios.')
        setSearching(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ej: Av. San Martín 1234, Rosario, Santa Fe, Argentina"
          style={{ flex: 1, minWidth: '200px' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="btn btn-secondary"
          disabled={searching || loading}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {searching ? 'Buscando...' : '🔍 Buscar'}
        </button>
        <button
          type="button"
          onClick={handleDetectLocation}
          className="btn btn-secondary"
          disabled={searching || loading}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'var(--color-primary)' }}
        >
          📍 Mi Ubicación
        </button>
      </div>

      {errorMessage && (
        <div style={{
          color: '#ef4444',
          fontSize: '0.75rem',
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.05)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(239, 68, 68, 0.1)',
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Map Container */}
      <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-card, #131b2e)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            gap: '12px'
          }}>
            <div className="spinner" style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cargando mapa...</span>
          </div>
        )}
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '300px',
            zIndex: 1
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Latitud</label>
          <input
            type="number"
            step="0.000001"
            className="form-input"
            value={latitude || ''}
            onChange={(e) => onChange(e.target.value, longitude)}
            placeholder="-32.9442"
            style={{ marginTop: '4px', fontSize: '0.8125rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Longitud</label>
          <input
            type="number"
            step="0.000001"
            className="form-input"
            value={longitude || ''}
            onChange={(e) => onChange(latitude, e.target.value)}
            placeholder="-60.6505"
            style={{ marginTop: '4px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
        * Haz clic en cualquier lugar del mapa o arrastra el marcador para fijar las coordenadas precisas del comercio.
      </p>
    </div>
  )
}
