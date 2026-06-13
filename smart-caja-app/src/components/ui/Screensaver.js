'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingCart, TrendingUp, Clock, MapPin, X } from 'lucide-react'

export default function Screensaver({ tenant, onClose }) {
  const supabase = createClient()
  const [time, setTime] = useState('')
  const [dateStr, setDateStr] = useState('')
  
  // Real-time stats
  const [stats, setStats] = useState({ count: 0, total: 0, loading: true })
  
  // Map elements
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState('')

  // Positions for anti-burn-in drift
  const [driftPos, setDriftPos] = useState({ x: 0, y: 0 })

  // Coords
  const lat = tenant?.latitude ? parseFloat(tenant.latitude) : null
  const lng = tenant?.longitude ? parseFloat(tenant.longitude) : null

  // 1. Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      
      // Time string HH:MM:SS
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      setTime(`${hours}:${minutes}:${seconds}`)

      // Date string in Spanish: Sábado, 13 de Junio
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      setDateStr(now.toLocaleDateString('es-ES', options))
    }
    
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. Fetch today's sales stats
  useEffect(() => {
    let active = true
    const fetchStats = async () => {
      if (!tenant?.id) return
      
      try {
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        // Query sales count and sum of totals
        const { data, error } = await supabase
          .from('sales')
          .select('total')
          .eq('tenant_id', tenant.id)
          .gte('created_at', startOfToday.toISOString())

        if (error) throw error

        if (active) {
          const count = data?.length || 0
          const total = data?.reduce((sum, item) => sum + parseFloat(item.total || 0), 0) || 0
          setStats({ count, total, loading: false })
        }
      } catch (err) {
        console.error('Error fetching screensaver stats:', err)
        if (active) {
          setStats({ count: 0, total: 0, loading: false })
        }
      }
    }

    fetchStats()
    // Refresh stats every 30 seconds while screensaver is active
    const interval = setInterval(fetchStats, 30000)
    
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [tenant, supabase])

  // 3. Slowly drift UI to prevent screen burn-in (every 10 seconds)
  useEffect(() => {
    const driftInterval = setInterval(() => {
      // Small random offsets within a 15px radius
      const x = (Math.random() - 0.5) * 16
      const y = (Math.random() - 0.5) * 16
      setDriftPos({ x, y })
    }, 12000)

    return () => clearInterval(driftInterval)
  }, [])

  // 4. Initialize Map (Leaflet) if coordinates exist
  useEffect(() => {
    if (!lat || !lng || !mapContainerRef.current) return

    let active = true
    let LeafletLink = null
    let LeafletScript = null

    const initMap = () => {
      if (!active || !mapContainerRef.current) return

      const L = window.L
      if (!L) {
        setMapError('Error de mapa.')
        return
      }

      // Cleanup prior instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('Error cleaning up map in screensaver:', e)
        }
      }

      // Create map with hidden zoom controls for a cleaner look
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false
      }).setView([lat, lng], 15)
      
      mapInstanceRef.current = map

      // High-tech dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map)

      // Pulsing Neon Cyan / Violet Marker
      const pulsingIcon = L.divIcon({
        className: 'screensaver-map-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="
              position: absolute;
              width: 12px;
              height: 12px;
              background-color: #06b6d4;
              border: 2px solid #fff;
              border-radius: 50%;
              top: 6px;
              left: 6px;
              z-index: 5;
              box-shadow: 0 0 10px #06b6d4;
            "></div>
            <div style="
              position: absolute;
              width: 24px;
              height: 24px;
              background-color: rgba(6, 182, 212, 0.4);
              border-radius: 50%;
              animation: marker-pulse-large 2.5s infinite ease-out;
            "></div>
          </div>
          <style>
            @keyframes marker-pulse-large {
              0% { transform: scale(0.3); opacity: 1; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          </style>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      L.marker([lat, lng], { icon: pulsingIcon }).addTo(map)

      // Recalculate layout
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      }, 500)

      setMapLoaded(true)
    }

    const loadLeaflet = () => {
      if (window.L) {
        initMap()
        return
      }

      if (!document.getElementById('leaflet-css')) {
        LeafletLink = document.createElement('link')
        LeafletLink.id = 'leaflet-css'
        LeafletLink.rel = 'stylesheet'
        LeafletLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(LeafletLink)
      }

      LeafletScript = document.createElement('script')
      LeafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      LeafletScript.async = true
      LeafletScript.onload = () => {
        initMap()
      }
      LeafletScript.onerror = () => {
        setMapError('No se pudo cargar el mapa.')
      }
      document.body.appendChild(LeafletScript)
    }

    loadLeaflet()

    return () => {
      active = false
      if (LeafletScript && document.body.contains(LeafletScript)) {
        document.body.removeChild(LeafletScript)
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('Map cleanup error:', e)
        }
      }
    }
  }, [lat, lng])

  // 5. Activity detection for exit
  useEffect(() => {
    let initialTime = Date.now()
    
    // Ignore small mouse moves that can happen on screen wake or vibration
    let lastMouseX = null
    let lastMouseY = null

    const handleInteraction = (e) => {
      // Prevent closing instantly in the first 800ms to avoid clicks that triggered the screensaver closing it
      if (Date.now() - initialTime < 800) return

      if (e.type === 'mousemove') {
        const threshold = 10
        if (lastMouseX !== null && lastMouseY !== null) {
          const deltaX = Math.abs(e.screenX - lastMouseX)
          const deltaY = Math.abs(e.screenY - lastMouseY)
          if (deltaX < threshold && deltaY < threshold) {
            return
          }
        }
        lastMouseX = e.screenX
        lastMouseY = e.screenY
      }

      onClose()
    }

    // Attach listeners
    window.addEventListener('keydown', handleInteraction, true)
    window.addEventListener('mousedown', handleInteraction, true)
    window.addEventListener('mousemove', handleInteraction, true)
    window.addEventListener('touchstart', handleInteraction, true)
    window.addEventListener('scroll', handleInteraction, true)

    return () => {
      window.removeEventListener('keydown', handleInteraction, true)
      window.removeEventListener('mousedown', handleInteraction, true)
      window.removeEventListener('mousemove', handleInteraction, true)
      window.removeEventListener('touchstart', handleInteraction, true)
      window.removeEventListener('scroll', handleInteraction, true)
    }
  }, [onClose])

  // Currency Formatter
  const formatCurrency = (val) => {
    const cur = tenant?.theme_config?.currency || 'ARS'
    const loc = tenant?.theme_config?.locale || 'es-AR'
    return new Intl.NumberFormat(loc, { style: 'currency', currency: cur }).format(val)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at center, #070f2b 0%, #03081a 60%, #000005 100%)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '40px',
      color: '#fff',
      fontFamily: 'var(--font-headline, "Outfit", "Inter", sans-serif)',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {/* Background Animated Nodes Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.15,
        backgroundImage: `radial-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        pointerEvents: 'none'
      }} />

      {/* TOP HEADER: Logo & Brand */}
      <header style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        transform: `translate(${driftPos.x * 0.3}px, ${driftPos.y * 0.3}px)`,
        transition: 'transform 8s ease'
      }}>
        {/* SmartFlow Glowing Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
            filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))'
          }}>
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path d="M20 50 C20 30, 40 20, 50 20 C65 20, 80 35, 80 50 C80 65, 65 80, 50 80 C35 80, 30 70, 20 50 Z" 
                  stroke="url(#logo-gradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  fill="none" 
            />
            <path d="M35 50 C35 42, 42 35, 50 35 C58 35, 65 42, 65 50" 
                  stroke="url(#logo-gradient)" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  fill="none" 
                  opacity="0.7"
            />
            <circle cx="50" cy="50" r="8" fill="#06b6d4" style={{ animation: 'pulse-dot 1.5s infinite alternate' }} />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '0.15em',
              background: 'linear-gradient(90deg, #fff 40%, #a855f7 70%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase'
            }}>
              SmartFlow
            </span>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              Sistema de Gestión
            </span>
          </div>
        </div>

        {/* Manual exit indicator button */}
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            transition: 'all 0.2s',
            backdropFilter: 'blur(4px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          <X size={18} />
        </button>
      </header>

      {/* CENTER WORKSPACE: Split Layout (Clock and Map/Stats) */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1200px',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '60px',
        flexWrap: 'wrap',
        margin: 'auto',
        zIndex: 10,
        transform: `translate(${driftPos.x}px, ${driftPos.y}px)`,
        transition: 'transform 10s ease'
      }}>
        {/* Left Side: Glowing Clock & Date */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          flex: '1 1 400px',
        }}>
          <div style={{
            fontSize: '6.5rem',
            fontWeight: 800,
            fontFamily: 'monospace',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: '#fff',
            textShadow: '0 0 30px rgba(124, 58, 237, 0.4), 0 0 60px rgba(6, 182, 212, 0.2)'
          }}>
            {time}
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.65)',
            marginTop: '16px',
            textTransform: 'capitalize',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={18} style={{ color: '#06b6d4' }} />
            {dateStr}
          </div>

          {/* Commerce detail overlay */}
          <div style={{
            marginTop: '40px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px 20px',
            maxWidth: '380px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Punto de Venta Activo</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginTop: '4px', textTransform: 'capitalize' }}>
              {tenant?.name || 'Smart Caja'}
            </div>
            {tenant?.address && (
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={12} style={{ color: 'var(--color-primary)' }} />
                <span>{tenant.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map & Business Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          flex: '1 1 500px',
          maxWidth: '560px'
        }}>
          {/* Glassmorphic Map Container */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '8px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '240px',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              background: '#040914'
            }}>
              {lat && lng ? (
                <>
                  {!mapLoaded && !mapError && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                      background: '#040914'
                    }}>
                      <div className="spinner" style={{
                        width: '24px', height: '24px',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderTopColor: '#06b6d4', borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    </div>
                  )}
                  {mapError && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)'
                    }}>
                      {mapError}
                    </div>
                  )}
                  <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
                </>
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '24px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)'
                }}>
                  <MapPin size={32} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '12px' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    Comercio no georreferenciado
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '6px', maxWidth: '300px', lineHeight: 1.4 }}>
                    Agrega la ubicación de tu negocio en Configuración General para visualizar el mapa aquí.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Today's Sales glassmorphic dashboard widget */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            padding: '20px 24px',
            backdropFilter: 'blur(12px)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <ShoppingCart size={14} style={{ color: '#a855f7' }} />
                <span>Tickets de hoy</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
                {stats.loading ? '...' : stats.count}
              </div>
            </div>
            <div style={{ paddingLeft: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <TrendingUp size={14} style={{ color: '#06b6d4' }} />
                <span>Facturación hoy</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#06b6d4' }}>
                {stats.loading ? '...' : formatCurrency(stats.total)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: Activity instructions */}
      <footer style={{
        zIndex: 10,
        textAlign: 'center',
        transform: `translate(${driftPos.x * 0.2}px, ${driftPos.y * 0.2}px)`,
        transition: 'transform 8s ease'
      }}>
        <div style={{
          fontSize: '0.8125rem',
          color: 'rgba(255, 255, 255, 0.35)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          animation: 'fade-pulse 2s infinite alternate',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <span>Mueva el mouse o presione una tecla para continuar</span>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0% { transform: scale(0.85); filter: drop-shadow(0 0 2px #06b6d4); }
          100% { transform: scale(1.15); filter: drop-shadow(0 0 10px #06b6d4); }
        }
        @keyframes fade-pulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
