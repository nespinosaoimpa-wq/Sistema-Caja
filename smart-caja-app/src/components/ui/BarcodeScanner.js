'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * BarcodeScanner — Componente de escáner de código de barras por cámara
 * Usa @zxing/browser (ya instalado en package.json)
 * 
 * Props:
 *   isOpen: boolean — controla si el escáner está abierto
 *   onScan(barcode: string) — callback al detectar un código
 *   onClose() — callback al cerrar el escáner
 *   title: string — título opcional (default: "Escanear Código")
 */
export default function BarcodeScanner({ isOpen, onScan, onClose, title = 'Escanear Código' }) {
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)
  const controlsRef = useRef(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [lastScanned, setLastScanned] = useState(null)
  const [scanSuccess, setScanSuccess] = useState(false)
  const beepRef = useRef(null)
  const scanCooldown = useRef(false)

  // Create beep sound via Web Audio API
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(1800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08)
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)
    } catch (e) {
      // Silently fail if Web Audio not available
    }
  }, [])

  // Vibrate device
  const vibrate = useCallback(() => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate([80, 30, 80])
      }
    } catch (e) {}
  }, [])

  const handleScan = useCallback((barcode) => {
    if (scanCooldown.current || barcode === lastScanned) return
    scanCooldown.current = true
    
    playBeep()
    vibrate()
    setScanSuccess(true)
    setLastScanned(barcode)
    
    setTimeout(() => {
      setScanSuccess(false)
      onScan(barcode)
      // Reset cooldown after callback to allow re-scan of same item if needed
      setTimeout(() => {
        scanCooldown.current = false
        setLastScanned(null)
      }, 2000)
    }, 300)
  }, [lastScanned, onScan, playBeep, vibrate])

  useEffect(() => {
    if (!isOpen) {
      // Cleanup on close
      if (controlsRef.current) {
        try { controlsRef.current.stop() } catch(e) {}
        controlsRef.current = null
      }
      setError(null)
      setIsLoading(true)
      setFlashOn(false)
      setScanSuccess(false)
      setLastScanned(null)
      scanCooldown.current = false
      return
    }

    let mounted = true

    const startScanner = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Dynamic import to avoid SSR issues
        const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/browser')
        
        if (!mounted) return

        const codeReader = new BrowserMultiFormatReader()
        codeReaderRef.current = codeReader

        // Get available cameras
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        
        if (!mounted) return
        
        if (!devices || devices.length === 0) {
          setError('No se encontró ninguna cámara en este dispositivo.')
          setIsLoading(false)
          return
        }

        // Prefer back camera
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('trasera') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1] // last camera is usually the back one

        if (!videoRef.current) return

        const controls = await codeReader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (!mounted) return
            if (result) {
              handleScan(result.getText())
            }
            // NotFoundException is normal (no barcode in frame), suppress it
            if (err && err.name !== 'NotFoundException') {
              // Only log unexpected errors
            }
          }
        )

        if (!mounted) {
          try { controls.stop() } catch(e) {}
          return
        }

        controlsRef.current = controls
        setIsLoading(false)

        // Check flash/torch support
        try {
          const stream = videoRef.current?.srcObject
          if (stream) {
            const track = stream.getVideoTracks()[0]
            const capabilities = track?.getCapabilities?.()
            if (capabilities?.torch) setHasFlash(true)
          }
        } catch(e) {}

      } catch (err) {
        if (!mounted) return
        console.error('[BarcodeScanner] Error:', err)
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
          setError('Permiso de cámara denegado. Por favor, habilitá el acceso a la cámara en tu navegador.')
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró cámara disponible.')
        } else {
          setError('Error al iniciar la cámara: ' + (err.message || 'Error desconocido'))
        }
        setIsLoading(false)
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (controlsRef.current) {
        try { controlsRef.current.stop() } catch(e) {}
        controlsRef.current = null
      }
    }
  }, [isOpen, handleScan])

  const toggleFlash = async () => {
    try {
      const stream = videoRef.current?.srcObject
      if (stream) {
        const track = stream.getVideoTracks()[0]
        await track.applyConstraints({ advanced: [{ torch: !flashOn }] })
        setFlashOn(f => !f)
      }
    } catch (e) {}
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.97)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: 'rgba(221,183,255,0.15)',
            border: '1px solid rgba(221,183,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem'
          }}>📷</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{title}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              Apuntá la cámara al código de barras
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '40px', height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: '1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          ✕
        </button>
      </div>

      {/* Video viewfinder */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        aspectRatio: '1/1',
        overflow: 'hidden',
      }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isLoading ? 'brightness(0.3)' : 'none',
            transition: 'filter 0.3s',
          }}
          autoPlay
          playsInline
          muted
        />

        {/* Scanner frame overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Dark vignette corners */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
          
          {/* Scanning frame */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '65%',
            aspectRatio: '3/2',
          }}>
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTop: true, borderLeft: true },
              { top: 0, right: 0, borderTop: true, borderRight: true },
              { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
              { bottom: 0, right: 0, borderBottom: true, borderRight: true },
            ].map((corner, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: '24px', height: '24px',
                ...corner,
                borderColor: scanSuccess ? '#4edea3' : '#ddb7ff',
                borderStyle: 'solid',
                borderTopWidth: corner.borderTop ? '3px' : '0',
                borderBottomWidth: corner.borderBottom ? '3px' : '0',
                borderLeftWidth: corner.borderLeft ? '3px' : '0',
                borderRightWidth: corner.borderRight ? '3px' : '0',
                transition: 'border-color 0.3s',
                borderRadius: corner.borderTop && corner.borderLeft ? '4px 0 0 0' :
                              corner.borderTop && corner.borderRight ? '0 4px 0 0' :
                              corner.borderBottom && corner.borderLeft ? '0 0 0 4px' : '0 0 4px 0',
              }} />
            ))}

            {/* Laser scan line */}
            {!isLoading && !error && (
              <div style={{
                position: 'absolute',
                left: '4px', right: '4px',
                height: '2px',
                background: scanSuccess 
                  ? 'linear-gradient(90deg, transparent, #4edea3, transparent)'
                  : 'linear-gradient(90deg, transparent, #ff4444, #ff4444, transparent)',
                boxShadow: scanSuccess
                  ? '0 0 8px #4edea3, 0 0 20px rgba(78,222,163,0.5)'
                  : '0 0 6px #ff4444, 0 0 16px rgba(255,68,68,0.4)',
                animation: scanSuccess ? 'none' : 'scanLine 2s ease-in-out infinite',
                top: '50%',
                transition: 'background 0.3s, box-shadow 0.3s',
              }} />
            )}

            {/* Success overlay */}
            {scanSuccess && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(78,222,163,0.15)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'fadeInOut 0.3s ease',
              }}>
                <span style={{ fontSize: '2.5rem' }}>✅</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && !error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid rgba(221,183,255,0.2)',
              borderTopColor: '#ddb7ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ color: '#ddb7ff', fontSize: '0.875rem', fontWeight: 500 }}>
              Iniciando cámara...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '16px', padding: '24px', textAlign: 'center',
          }}>
            <span style={{ fontSize: '2.5rem' }}>📷</span>
            <div style={{ color: '#ffb4ab', fontSize: '0.875rem', lineHeight: 1.5, maxWidth: '280px' }}>
              {error}
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                background: 'rgba(221,183,255,0.15)',
                border: '1px solid rgba(221,183,255,0.3)',
                borderRadius: '8px',
                color: '#ddb7ff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '24px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Flash button */}
        {hasFlash && (
          <button
            onClick={toggleFlash}
            style={{
              padding: '10px 24px',
              background: flashOn ? 'rgba(255,220,80,0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${flashOn ? 'rgba(255,220,80,0.5)' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '24px',
              color: flashOn ? '#ffd840' : '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {flashOn ? '⚡' : '🔦'} {flashOn ? 'Apagar Flash' : 'Encender Flash'}
          </button>
        )}

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center' }}>
          EAN-13 · EAN-8 · UPC-A · CODE-128 · QR · y más
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; opacity: 0.8; }
          50%  { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.8; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInOut {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
