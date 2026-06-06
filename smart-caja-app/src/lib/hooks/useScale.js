'use client'

import { useState, useCallback, useEffect } from 'react'

/**
 * useScale — Hook para integración con balanza digital vía Web Serial API
 * Compatible con Chrome/Edge desktop 89+
 * Parsea formatos comunes: "ST,GS, 0.350kg", "000.350 kg", etc.
 */
export default function useScale() {
  const [isSupported, setIsSupported] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [weight, setWeight] = useState(null) // número en kg
  const [unit, setUnit] = useState('kg')
  const [error, setError] = useState(null)
  const [portRef] = useState({ current: null })
  const [readerRef] = useState({ current: null })

  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'serial' in navigator)
  }, [])

  const parseWeight = (line) => {
    // Parsea formatos: "0.350 kg", "350 g", "ST,GS,  0.350kg", "000350G"
    const match = line.match(/(\d+\.?\d*)\s*(kg|g|lb|Kg|KG|G)/i)
    if (!match) return null
    const value = parseFloat(match[1])
    const rawUnit = match[2].toLowerCase()
    if (rawUnit === 'g') return { value: value / 1000, unit: 'kg' }
    if (rawUnit === 'lb') return { value: value * 0.453592, unit: 'kg' }
    return { value, unit: 'kg' }
  }

  const connect = useCallback(async (baudRate = 9600) => {
    if (!isSupported) {
      setError('Tu navegador no soporta Web Serial API. Usá Chrome o Edge en escritorio.')
      return
    }
    try {
      setError(null)
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate })
      portRef.current = port
      setIsConnected(true)

      const decoder = new TextDecoderStream()
      port.readable.pipeTo(decoder.writable)
      const reader = decoder.readable.getReader()
      readerRef.current = reader

      let buffer = ''
      // Read loop
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += value
            const lines = buffer.split(/[\r\n]+/)
            buffer = lines.pop() // keep incomplete line
            for (const line of lines) {
              const parsed = parseWeight(line)
              if (parsed && parsed.value > 0) {
                setWeight(parsed.value)
                setUnit(parsed.unit)
              }
            }
          }
        } catch (e) {
          // Port closed
        }
        setIsConnected(false)
        setWeight(null)
      }
      readLoop()
    } catch (e) {
      if (e.name !== 'NotFoundError') { // user cancelled
        setError('No se pudo conectar a la balanza: ' + e.message)
      }
    }
  }, [isSupported, portRef, readerRef])

  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel()
        readerRef.current = null
      }
      if (portRef.current) {
        await portRef.current.close()
        portRef.current = null
      }
    } catch (e) {}
    setIsConnected(false)
    setWeight(null)
    setError(null)
  }, [portRef, readerRef])

  return { isSupported, isConnected, weight, unit, error, connect, disconnect }
}
