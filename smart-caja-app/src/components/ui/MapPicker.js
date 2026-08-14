'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export default function MapPicker({ latitude, longitude, onChange, addressText, logoUrl }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimerRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Keep onChange ref up to date without triggering re-initialization
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Sync searchQuery with addressText on initial render or if empty
  useEffect(() => {
    if (addressText && !searchQuery) {
      setSearchQuery(addressText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressText])

  // ====== LEAFLET MAP INITIALIZATION ======
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
      // Use the captured container reference for cleanup (React ref may change)
      const cleanupContainer = mapContainerRef.current
      if (cleanupContainer && cleanupContainer._leaflet_id) {
        delete cleanupContainer._leaflet_id
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl])

  // ====== SYNC MARKER WITH EXTERNAL PROP CHANGES ======
  // When latitude/longitude change from outside (e.g. manual input, or parent state update),
  // move the marker and center the map accordingly.
  useEffect(() => {
    if (!mapInstanceRef.current || !markerInstanceRef.current) return
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (isNaN(lat) || isNaN(lng)) return

    const currentPos = markerInstanceRef.current.getLatLng()
    // Only update if actually different (avoid loops with onChange callback)
    if (Math.abs(currentPos.lat - lat) > 0.000001 || Math.abs(currentPos.lng - lng) > 0.000001) {
      markerInstanceRef.current.setLatLng([lat, lng])
      mapInstanceRef.current.setView([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 15), { animate: true })
    }
  }, [latitude, longitude])

  // ====== RESIZE / VISIBILITY OBSERVER ======
  // Handles the case where the map is inside a hidden tab (Settings) and tiles render as grey.
  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let resizeObserver = null
    let intersectionObserver = null

    const invalidateWhenReady = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false })
      }
    }

    // ResizeObserver: triggers when container dimensions change (e.g. tab becomes visible)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        // Slight delay to let the browser finish layout calculations
        requestAnimationFrame(invalidateWhenReady)
      })
      resizeObserver.observe(container)
    }

    // IntersectionObserver: triggers when container becomes visible in viewport
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(invalidateWhenReady, 100)
          }
        })
      }, { threshold: 0.1 })
      intersectionObserver.observe(container)
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      if (intersectionObserver) intersectionObserver.disconnect()
    }
  }, [loading]) // re-attach after loading finishes

  // ====== GEOCODING: GEOREF ARGENTINA + NOMINATIM FALLBACK ======

  // Tier 1: Georef Argentina (official INDEC/IGN API) — exact cadastral height resolution
  const searchGeorefArgentina = async (query) => {
    try {
      const url = `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(query)}&max=5&campos=nomenclatura,ubicacion`
      const response = await fetch(url)
      if (!response.ok) return null
      const data = await response.json()
      if (data?.direcciones?.length > 0) {
        return data.direcciones.map(d => ({
          display_name: d.nomenclatura,
          lat: d.ubicacion?.lat,
          lon: d.ubicacion?.lon,
          source: 'georef'
        })).filter(d => d.lat && d.lon)
      }
    } catch (err) {
      console.error('[MapPicker] Georef Argentina error:', err)
    }
    return null
  }

  // Tier 2: Nominatim (OpenStreetMap) — improved with Argentina-specific params
  const searchNominatim = async (query) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ar&addressdetails=1`
      const response = await fetch(url)
      if (!response.ok) return null
      const data = await response.json()
      if (data?.length > 0) {
        return data.map(d => ({
          display_name: d.display_name,
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
          source: 'nominatim'
        }))
      }
    } catch (err) {
      console.error('[MapPicker] Nominatim error:', err)
    }
    return null
  }

  // ====== AUTOCOMPLETE WITH DEBOUNCE ======
  const handleSearchInputChange = useCallback((value) => {
    setSearchQuery(value)
    setShowSuggestions(false)
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value.trim() || value.trim().length < 4) {
      setSuggestions([])
      return
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Try Georef Argentina first (best for Argentine addresses with alturas)
      const georefResults = await searchGeorefArgentina(value)
      if (georefResults && georefResults.length > 0) {
        setSuggestions(georefResults)
        setShowSuggestions(true)
        return
      }
      // Fallback to Nominatim
      const nominatimResults = await searchNominatim(value)
      if (nominatimResults && nominatimResults.length > 0) {
        setSuggestions(nominatimResults)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Select a suggestion
  const handleSelectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)

    setSearchQuery(suggestion.display_name)
    setSuggestions([])
    setShowSuggestions(false)
    setErrorMessage('')

    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17, { animate: true })
      markerInstanceRef.current.setLatLng([lat, lng])
    }

    if (onChangeRef.current) {
      onChangeRef.current(lat.toFixed(6), lng.toFixed(6))
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ====== MANUAL SEARCH (BUTTON / ENTER) ======
  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setErrorMessage('')
    setShowSuggestions(false)

    try {
      // Tier 1: Georef Argentina — professional cadastral precision
      const georefResults = await searchGeorefArgentina(searchQuery)
      if (georefResults && georefResults.length > 0) {
        const best = georefResults[0]
        const lat = parseFloat(best.lat)
        const lng = parseFloat(best.lon)

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17, { animate: true })
          markerInstanceRef.current.setLatLng([lat, lng])
        }
        if (onChangeRef.current) {
          onChangeRef.current(lat.toFixed(6), lng.toFixed(6))
        }
        setSearchQuery(best.display_name)
        setSearching(false)
        return
      }

      // Tier 2: Nominatim with Argentina-specific params
      const nominatimResults = await searchNominatim(searchQuery)
      if (nominatimResults && nominatimResults.length > 0) {
        const best = nominatimResults[0]
        const lat = parseFloat(best.lat)
        const lng = parseFloat(best.lon)

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17, { animate: true })
          markerInstanceRef.current.setLatLng([lat, lng])
        }
        if (onChangeRef.current) {
          onChangeRef.current(lat.toFixed(6), lng.toFixed(6))
        }
        setSearching(false)
        return
      }

      // Neither API returned results
      setErrorMessage('No se encontró la dirección. Probá con formato: "Calle Altura, Ciudad" (ej: San Martín 1234, Rosario)')
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
      {/* Search Input Bar with Autocomplete */}
      <div style={{ position: 'relative' }} ref={suggestionsRef}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder="Ej: San Martín 1234, Rosario, Santa Fe"
            style={{ flex: 1, minWidth: '200px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setShowSuggestions(false)
                handleSearch()
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
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

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: '4px',
            background: 'var(--bg-card, #1a1625)',
            border: '1px solid var(--border-color, #2d2640)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}>
            {suggestions.map((s, i) => (
              <button
                key={`${s.lat}-${s.lon}-${i}`}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{
                  flexShrink: 0,
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: s.source === 'georef' ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                }}>
                  📍
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.display_name}
                </span>
                {s.source === 'georef' && (
                  <span style={{
                    flexShrink: 0,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16,185,129,0.1)',
                    color: '#10B981',
                    textTransform: 'uppercase',
                  }}>
                    Catastral
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
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
        * Buscá tu dirección con calle y altura catastral para máxima precisión. También podés hacer clic en el mapa o arrastrar el marcador.
      </p>
    </div>
  )
}
