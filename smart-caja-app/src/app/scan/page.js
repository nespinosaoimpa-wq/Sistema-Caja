'use client'

import { useEffect, useState, useRef, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import BarcodeScanner from '@/components/ui/BarcodeScanner'
import { createClient } from '@/lib/supabase/client'

function ScannerApp() {
  const searchParams = useSearchParams()
  const session = searchParams.get('session')
  const supabase = useMemo(() => createClient(), [])
  
  const channelRef = useRef(null)
  const [cashierName, setCashierName] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) {
      setError('No session ID provided in the URL. Escaneá el código QR desde la PC de la caja.')
      return
    }

    const channel = supabase.channel(`pos_scan_${session}`)

    channel
      .on('broadcast', { event: 'pong' }, (payload) => {
        setConnected(true)
        if (payload.payload?.cashier_name) {
          setCashierName(payload.payload.cashier_name)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Send ping to POS to let it know we are ready
          channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: {}
          })
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, supabase])

  const handleScan = (barcode) => {
    if (channelRef.current && connected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'scanned',
        payload: { barcode }
      })
    } else {
      console.warn('Scanned but not connected to POS yet')
    }
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ffb4ab', textAlign: 'center', fontFamily: 'sans-serif', background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <h3 style={{ marginBottom: '10px' }}>Error de Conexión</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {!connected && (
        <div style={{ position: 'fixed', top: 10, left: 0, right: 0, zIndex: 999999, textAlign: 'center', color: '#fff', background: 'rgba(0,0,0,0.7)', padding: '8px', fontSize: '0.9rem', borderRadius: '8px', margin: '0 20px' }}>
          Conectando con la caja...
        </div>
      )}
      {connected && (
        <div style={{ position: 'fixed', top: 10, left: 0, right: 0, zIndex: 999999, textAlign: 'center', color: '#4edea3', background: 'rgba(0,0,0,0.7)', padding: '8px', fontSize: '0.9rem', borderRadius: '8px', margin: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>🟢</span> Vinculado a caja {cashierName ? `(${cashierName})` : ''}
        </div>
      )}
      
      <BarcodeScanner 
        isOpen={true} 
        onScan={handleScan} 
        onClose={() => {}} 
        title="Escáner Remoto"
      />
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', color: '#ddb7ff', background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando escáner...</div>}>
      <ScannerApp />
    </Suspense>
  )
}
