'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { 
  Maximize, Minimize, Search, Zap, Edit, Banknote, CreditCard, Landmark, Split, Calendar, 
  ShoppingCart, User, Clock, Trash2, Printer, Package, ArrowLeftRight, CheckCircle
} from 'lucide-react'
import QuickProductModal from '@/components/ui/QuickProductModal'
import useScale from '@/lib/hooks/useScale'
import VariantPickerModal from '@/components/ui/VariantPickerModal'
import BarcodeScanner from '@/components/ui/BarcodeScanner'

export default function POSPage() {
  const { tenant, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()
  
  const barcodeInputRef = useRef(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState(null)
  
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [splitCash, setSplitCash] = useState('')
  const [splitDebit, setSplitDebit] = useState('')
  const [splitCredit, setSplitCredit] = useState('')
  const [discountType, setDiscountType] = useState(null)
  const [discountValue, setDiscountValue] = useState('')
  
  // Custom states for premium billing
  const [customers, setCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [mixedCash, setMixedCash] = useState('')
  const [mixedCard, setMixedCard] = useState('')
  const [mixedMP, setMixedMP] = useState('')

  // Camera barcode scanner state
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [quickProductBarcode, setQuickProductBarcode] = useState('')
  const [showQuickProduct, setShowQuickProduct] = useState(false)

  // Receipt modal state
  const [receiptData, setReceiptData] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const stateRef = useRef({ showReceipt })

  useEffect(() => {
    stateRef.current = { showReceipt }
  }, [showReceipt])

  // Fullscreen and POSnet integration states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [posnetMode, setPosnetMode] = useState('integrated') // 'integrated' | 'manual'
  const [showPosnetSimulator, setShowPosnetSimulator] = useState(false)
  const [posnetStep, setPosnetStep] = useState(0) // 0: connecting, 1: swipe, 2: processing, 3: approved, 99: manual voucher modal
  const [posnetCardBrand, setPosnetCardBrand] = useState('VISA')
  const [posnetVoucher, setPosnetVoucher] = useState('')
  const [manualVoucher, setManualVoucher] = useState('')
  const [showCatalog, setShowCatalog] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  // Installment/Accounts Receivable states
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)
  const [installmentForm, setInstallmentForm] = useState({ customer_name: '', customer_phone: '', total_installments: 1, interest_rate: 0 })

  // Order (Pedido) modal state
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState({ customer_name: '', customer_phone: '', delivery_date: '', advance_payment: '' })
  const [savingOrder, setSavingOrder] = useState(false)
  // Scale state
  const { isSupported: scaleSupported, isConnected: scaleConnected, weight: scaleWeight, error: scaleError, connect: connectScale, disconnect: disconnectScale } = useScale()

  // Variant picker state
  const [showVariantPicker, setShowVariantPicker] = useState(false)
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null)

  // Mobile scanner states
  const [mobileSessionId, setMobileSessionId] = useState('')
  const [isMobileConnected, setIsMobileConnected] = useState(false)
  const [showMobileScannerModal, setShowMobileScannerModal] = useState(false)
  const addToCartRef = useRef(null)

  // Loaded order states
  const [loadedOrderId, setLoadedOrderId] = useState(null)
  const [loadedOrder, setLoadedOrder] = useState(null)

  // Fetch order helper
  const fetchOrder = useCallback(async (orderId) => {
    try {
      const { data: order, error } = await supabase
        .from('online_orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error
      if (order) {
        setLoadedOrder(order)
        const orderItems = Array.isArray(order.items) ? order.items : []
        const newCart = []

        for (const item of orderItems) {
          const { data: product } = await supabase
            .from('products')
            .select('*, categories(name, icon)')
            .eq('id', item.product_id)
            .single()

          if (product) {
            newCart.push({
              ...product,
              qty: item.qty,
              sale_price: item.unit_price,
              subtotal: item.qty * item.unit_price,
              target_amount: (item.qty * item.unit_price).toFixed(2),
              variant_id: item.variant_id || null,
              variant_label: item.variant_label || null
            })
          }
        }

        if (newCart.length > 0) {
          setCart(newCart)
          toast.success(`Pedido #${order.order_number} de ${order.customer_name} cargado en caja`)
        }
      }
    } catch (err) {
      console.error('[fetchOrder]', err)
      toast.error('Error al cargar el pedido en la caja')
    }
  }, [supabase, toast])

  // Generate session ID on mount and check for loaded order
  useEffect(() => {
    setMobileSessionId(Math.random().toString(36).substring(2, 10) + Date.now().toString(36))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !tenant?.id) return
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('order_id')
    if (orderId) {
      setLoadedOrderId(orderId)
      fetchOrder(orderId)
      
      const url = new URL(window.location.href)
      url.searchParams.delete('order_id')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [tenant?.id, fetchOrder])

  const confirmInstallmentSale = async () => {
    if (!installmentForm.customer_name.trim()) {
      toast.error('Por favor ingresá el nombre del cliente')
      return
    }
    setShowInstallmentModal(false)
    const interestRate = parseFloat(installmentForm.interest_rate) || 0
    await executeSaveSale(null, null, {
      customer_name: installmentForm.customer_name,
      customer_phone: installmentForm.customer_phone,
      total_installments: parseInt(installmentForm.total_installments) || 1,
      interest_rate: interestRate
    })
  }

  const handleSaveAsOrder = async () => {
    if (!orderForm.customer_name.trim()) {
      toast.error('Ingresá el nombre del cliente')
      return
    }
    if (cart.length === 0) return
    setSavingOrder(true)
    try {
      const total = cartTotal
      const advance = parseFloat(orderForm.advance_payment) || 0

      // Fetch count of orders for the tenant to generate order number
      const { count, error: countError } = await supabase
        .from('online_orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      if (countError) throw countError

      const orderNumber = `POS-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: orderData, error: orderError } = await supabase
        .from('online_orders')
        .insert({
          tenant_id: tenant.id,
          user_id: profile.id,
          order_number: orderNumber,
          customer_name: orderForm.customer_name.trim(),
          customer_phone: orderForm.customer_phone.trim() || null,
          delivery_mode: 'pickup',
          items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            qty: item.qty,
            unit_price: item.sale_price,
            variant_id: item.variant_id || null,
            variant_label: item.variant_label || null,
            subtotal: item.subtotal
          })),
          subtotal: total,
          total: total,
          notes: `Pedido creado desde Caja. Saldo pendiente: ${formatCurrency(total - advance)}`,
          status: 'pending',
          payment_status: advance > 0 ? 'partial' : 'unpaid',
          source: 'pos',
          delivery_date: orderForm.delivery_date || null,
          advance_payment: advance
        })
        .select()
        .single()

      if (orderError) throw orderError

      toast.success(`¡Pedido de ${orderForm.customer_name} guardado! Seña: ${formatCurrency(advance)}`)
      setShowOrderModal(false)
      setOrderForm({ customer_name: '', customer_phone: '', delivery_date: '', advance_payment: '' })
      setCart([])
    } catch (err) {
      console.error('[handleSaveAsOrder]', err)
      toast.error('Error al guardar el pedido: ' + err.message)
    } finally {
      setSavingOrder(false)
    }
  }

  const posContainerRef = useRef(null)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === posContainerRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('pos-fullscreen')
    } else {
      document.body.classList.remove('pos-fullscreen')
    }
    return () => {
      document.body.classList.remove('pos-fullscreen')
    }
  }, [isFullscreen])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (posContainerRef.current?.requestFullscreen) {
        posContainerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => toast.error(`Error al activar pantalla completa: ${err.message}`))
      }
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const loadData = useCallback(async () => {
    if (!tenant?.id || !profile?.id) return

    const cacheKeyShift = `smartcaja_shift_${tenant.id}_${profile.id}`
    const cacheKeyProds = `smartcaja_products_${tenant.id}`
    const cacheKeyCusts = `smartcaja_customers_${tenant.id}`

    // 1. Stale-While-Revalidate: Load from local cache immediately
    if (typeof window !== 'undefined') {
      const cachedShift = localStorage.getItem(cacheKeyShift)
      const cachedProds = localStorage.getItem(cacheKeyProds)
      const cachedCusts = localStorage.getItem(cacheKeyCusts)

      if (cachedShift || cachedProds || cachedCusts) {
        if (cachedShift) {
          try {
            setActiveShift(JSON.parse(cachedShift))
          } catch (e) {}
        }
        if (cachedProds) {
          try {
            setProducts(JSON.parse(cachedProds))
          } catch (e) {}
        }
        if (cachedCusts) {
          try {
            setCustomers(JSON.parse(cachedCusts))
          } catch (e) {}
        }
        setLoading(false)
      } else {
        setLoading(true)
      }
    } else {
      setLoading(true)
    }

    // 2. Fetch fresh data from Supabase in the background
    try {
      // Fetch shift status (maybeSingle is safe)
      const { data: shiftData } = await supabase
        .from('shifts')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'open')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (shiftData) {
        setActiveShift(shiftData)
        localStorage.setItem(cacheKeyShift, JSON.stringify(shiftData))
      } else {
        setActiveShift(null)
        localStorage.removeItem(cacheKeyShift)
      }

      // Fetch products catalog
      const { data: prods } = await supabase
        .from('products')
        .select('*, categories(name, icon)')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')

      if (prods) {
        setProducts(prods)
        localStorage.setItem(cacheKeyProds, JSON.stringify(prods))
      }

      // Fetch active customers
      const { data: custs } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')

      if (custs) {
        setCustomers(custs)
        localStorage.setItem(cacheKeyCusts, JSON.stringify(custs))
      }
    } catch (err) {
      console.error('Error refreshing POS data in background:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, tenant, profile])

  useEffect(() => {
    if (tenant?.id) {
      const timer = setTimeout(() => {
        loadData()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [tenant?.id, loadData])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.id !== 'barcode-scanner') {
        if (e.key !== 'Escape') return
      }

      const { showReceipt } = stateRef.current

      switch (e.key) {
        case 'F2':
          e.preventDefault()
          setPaymentMethod('cash')
          break
        case 'F3':
          e.preventDefault()
          setPaymentMethod('debit')
          break
        case 'F4':
          e.preventDefault()
          setPaymentMethod('credit')
          break
        case 'F6':
          e.preventDefault()
          setPaymentMethod('transfer')
          break
        case 'F12':
        case 'Enter':
          if (e.target.tagName === 'INPUT') return
          e.preventDefault()
          const confirmBtn = document.getElementById('btn-confirm-sale')
          if (confirmBtn && !confirmBtn.disabled) confirmBtn.click()
          break
        case 'Escape':
          e.preventDefault()
          if (showReceipt) setShowReceipt(false)
          else {
            setCart([])
            setLoadedOrderId(null)
            setLoadedOrder(null)
          }
          break
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (e.target.tagName === 'INPUT') return
            if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
              barcodeInputRef.current.focus()
            }
          }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isDecimalProduct = (product) => {
    return product.unit_type === 'weight' || product.unit_type === 'volume'
  }

  const addToCart = (product, variant = null) => {
    if (product.has_variants && !variant) {
      setSelectedProductForVariants(product)
      setShowVariantPicker(true)
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && (!variant || item.variant_id === variant.id))
      const unitPrice = variant ? (Number(product.sale_price) + Number(variant.extra_price || 0)) : Number(product.sale_price)
      
      if (existing) {
        // If scale is connected and it's a weight product, override qty with scale weight
        const increment = (scaleConnected && product.unit_type === 'weight' && scaleWeight > 0) ? scaleWeight : (isDecimalProduct(product) ? 1 : 1)
        const newQty = (scaleConnected && product.unit_type === 'weight' && scaleWeight > 0) ? scaleWeight : existing.qty + increment
        const subtotal = newQty * unitPrice
        return prev.map(item => 
          (item.id === product.id && (!variant || item.variant_id === variant.id)) ? { ...item, qty: newQty, subtotal, target_amount: subtotal.toFixed(2) } : item
        )
      }

      const initialQty = (scaleConnected && product.unit_type === 'weight' && scaleWeight > 0) ? scaleWeight : 1
      const subtotal = initialQty * unitPrice
      return [...prev, { 
        ...product, 
        qty: initialQty, 
        sale_price: unitPrice, // Overwrite sale_price if variant has extra_price
        subtotal,
        target_amount: subtotal.toFixed(2),
        variant_id: variant?.id || null,
        variant_label: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : null,
        variant_stock_quantity: variant ? variant.stock_quantity : null
      }]
    })
  }

  // Keep addToCart and products references updated to avoid effect re-subscriptions
  useEffect(() => {
    addToCartRef.current = addToCart
  })

  const productsRef = useRef(products)
  useEffect(() => {
    productsRef.current = products
  }, [products])

  // Supabase Realtime Broadcast for Mobile Barcode Scanner
  useEffect(() => {
    if (!tenant?.id || !mobileSessionId) return

    const channel = supabase.channel(`pos_scan_${mobileSessionId}`)

    channel
      .on('broadcast', { event: 'scanned' }, ({ payload }) => {
        const { barcode } = payload
        if (barcode && addToCartRef.current) {
          // Play beep sound via Web Audio API
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.setValueAtTime(1600, ctx.currentTime)
            gain.gain.setValueAtTime(0.08, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
            osc.start()
            osc.stop(ctx.currentTime + 0.1)
          } catch (e) {}

          const exactMatch = productsRef.current.find(p => p.barcode === barcode || p.reference_code === barcode)
          if (exactMatch) {
            addToCartRef.current(exactMatch)
            toast.success(`[Celular] "${exactMatch.name}" agregado`)
          } else {
            toast.warning(`[Celular] Código "${barcode}" no encontrado`)
          }
        }
      })
      .on('broadcast', { event: 'ping' }, () => {
        setIsMobileConnected(true)
        toast.success('📱 ¡Cámara del celular vinculada con éxito!')
        // Respond with a pong to let mobile phone know who we are
        channel.send({
          type: 'broadcast',
          event: 'pong',
          payload: { cashier_name: profile?.full_name || 'Cajero' }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mobileSessionId, tenant?.id, profile?.full_name, supabase, toast])

  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!searchTerm) return
    const exactMatch = products.find(p => p.barcode === searchTerm || p.reference_code === searchTerm)
    if (exactMatch) {
      addToCart(exactMatch)
      setSearchTerm('')
      return
    }

    const matches = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.reference_code && p.reference_code.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (matches.length > 0) {
      addToCart(matches[0])
      setSearchTerm('')
    } else {
      // If it looks like a barcode (mostly digits/alphanumeric, short), offer to create product
      const looksLikeBarcode = /^[a-zA-Z0-9\-]{4,20}$/.test(searchTerm.trim())
      if (looksLikeBarcode) {
        setQuickProductBarcode(searchTerm.trim())
        setShowQuickProduct(true)
        setSearchTerm('')
      } else {
        toast.warning('Producto no encontrado')
      }
    }
  }

  // Handle camera scan result
  const handleCameraScan = useCallback((barcode) => {
    setShowCameraScanner(false)
    
    // First try exact match
    const exactMatch = products.find(p => p.barcode === barcode || p.reference_code === barcode)
    if (exactMatch) {
      addToCart(exactMatch)
      toast.success(`"${exactMatch.name}" agregado al carrito`)
      return
    }

    // Not found → open quick product creation
    setQuickProductBarcode(barcode)
    setShowQuickProduct(true)
  }, [products, toast]) // Note: removed addToCart from dependencies to avoid loop, it's safe to call directly in component scope if not wrapped

  // Handle saving a quick product (from camera scan)
  const handleQuickProductSaved = useCallback((product, addToCartFlag) => {
    setShowQuickProduct(false)
    setQuickProductBarcode('')
    
    // Add the new product to the local products list
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id)
      if (exists) return prev
      return [...prev, product]
    })

    if (addToCartFlag) {
      addToCart(product)
      toast.success(`"${product.name}" creado y agregado al carrito`)
    }
  }, [addToCart, toast])

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(isDecimalProduct(item) ? 0.001 : 1, item.qty + delta)
        const subtotal = newQty * item.sale_price
        return { ...item, qty: newQty, subtotal, target_amount: subtotal.toFixed(2) }
      }
      return item
    }))
  }

  const updateQtyDirect = (id, value) => {
    const numVal = parseFloat(value)
    if (isNaN(numVal) || numVal <= 0) return
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const subtotal = numVal * item.sale_price
        return { ...item, qty: numVal, subtotal, target_amount: subtotal.toFixed(2) }
      }
      return item
    }))
  }

  const updateQtyByAmount = (id, amountStr) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const amount = parseFloat(amountStr)
        if (isNaN(amount) || amount <= 0) {
          return { ...item, target_amount: amountStr, qty: 0, subtotal: 0 }
        }
        const newQty = parseFloat((amount / item.sale_price).toFixed(3))
        return { ...item, target_amount: amountStr, qty: newQty, subtotal: amount }
      }
      return item
    }))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id))

  const filteredProducts = products.filter(p => 
    !searchTerm || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.reference_code && p.reference_code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const calculateDiscountAmount = () => {
    const val = parseFloat(discountValue) || 0
    if (discountType === 'percentage') return (cartSubtotal * val) / 100
    if (discountType === 'fixed') return val
    return 0
  }
  const discountAmount = calculateDiscountAmount()
  const cartTotal = Math.max(0, cartSubtotal - discountAmount)
  const finalTotal = cartTotal

  const cashReceivedNum = parseFloat(cashReceived) || 0
  const cashChange = cashReceivedNum - cartTotal

  // Build receipt HTML for thermal printer (80mm)
  const buildReceiptHTML = (saleData, items, loadedOrderInfo = null) => {
    const now = new Date()
    const dateStr = formatDateTime(now)
    const itemsHTML = items.map(item => {
      const unitLabel = item.unit_label || (item.unit_type === 'weight' ? 'kg' : item.unit_type === 'volume' ? 'L' : 'u')
      const qtyStr = isDecimalProduct(item) ? `${item.qty.toFixed(3)} ${unitLabel}` : `${item.qty} ${unitLabel}`
      return `<tr>
        <td style="text-align:left;padding:2px 0;">${item.name}</td>
        <td style="text-align:center;padding:2px 0;">${qtyStr}</td>
        <td style="text-align:right;padding:2px 0;">${formatCurrency(item.sale_price)}</td>
        <td style="text-align:right;padding:2px 0;">${formatCurrency(item.subtotal)}</td>
      </tr>`
    }).join('')

    let discountHTML = ''
    if (saleData.discount_amount > 0) {
      const discValLabel = saleData.discount_type === 'percentage' ? `${saleData.discount_value}%` : formatCurrency(saleData.discount_value)
      discountHTML = `<div style="display:flex;justify-content:space-between;color:#555;"><span>Descuento (${discValLabel}):</span><span>-${formatCurrency(saleData.discount_amount)}</span></div>`
    }

    let paymentInfo = ''
    if (paymentMethod === 'cash') {
      paymentInfo = `
        <div style="display:flex;justify-content:space-between;"><span>Recibido:</span><span>${formatCurrency(saleData.cash_received || 0)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>Vuelto:</span><span>${formatCurrency(saleData.cash_change || 0)}</span></div>
      `
    } else if (paymentMethod === 'mixed') {
      const details = saleData.payment_details || {}
      paymentInfo = `
        <div style="margin-left:8px;font-size:10px;color:#555;">
          <div style="display:flex;justify-content:space-between;"><span>- Efectivo:</span><span>${formatCurrency(details.cash || 0)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>- Tarjeta:</span><span>${formatCurrency(details.card || 0)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>- Mercado Pago:</span><span>${formatCurrency(details.mp || 0)}</span></div>
        </div>
      `
    } else if (paymentMethod === 'installment') {
      const client = customers.find(c => c.id === selectedCustomerId)
      paymentInfo = `
        <div style="margin-top:4px;border-top:1px solid #000;padding-top:4px;">
          <div>Cliente: ${client ? client.name : 'Cliente Registrado'}</div>
          <div style="font-weight:bold;">Nuevo Saldo Deudor: ${formatCurrency(client ? (parseFloat(client.balance) || 0) + saleData.total : saleData.total)}</div>
        </div>
      `
    } else if (paymentMethod === 'debit' || paymentMethod === 'credit') {
      const details = saleData?.payment_details || {}
      paymentInfo = `
        <div style="display:flex;justify-content:space-between;"><span>Tarjeta:</span><span>${details.card_brand || 'N/A'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>Cupón:</span><span>#${details.voucher_number || 'N/A'}</span></div>
      `
    } else if (paymentMethod === 'combined') {
      const details = saleData?.payment_details || {}
      const splits = details.splits || []
      const splitsHTML = splits.map(s => {
        const label = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', transfer: 'Transferencia' }[s.method] || s.method
        return `<div style="display:flex;justify-content:space-between;font-size:11px;color:#555;"><span>- ${label}:</span><span>${formatCurrency(s.amount)}</span></div>`
      }).join('')
      paymentInfo = `
        <div style="margin-top:2px;">
          <div style="font-weight:bold;font-size:11px;">Desglose Pago Mixto:</div>
          ${splitsHTML}
        </div>
      `
    }

    const payMethodLabel = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', mixed: 'Mixto', installment: 'Fiado (Cta. Cte.)' }[paymentMethod] || paymentMethod

    return `
      <div style="font-family:'Courier New',Courier,monospace;width:72mm;padding:4mm;font-size:12px;color:#000;background:#fff;">
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-size:16px;font-weight:bold;">${tenant?.name || 'Mi Negocio'}</div>
          <div style="font-size:10px;color:#555;margin-bottom:4px;">Ticket de Venta</div>
          <div style="font-size:10px;font-weight:bold;color:#ff3b30;border:1px solid #ff3b30;padding:2px 4px;display:inline-block;border-radius:3px;">TICKET NO FISCAL</div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:11px;margin-bottom:6px;">
          <div>Fecha: ${dateStr}</div>
          <div>Ticket: #${saleData.ticket_number}</div>
          <div>Cajero: ${profile?.full_name || 'N/A'}</div>
          <div>Origen: ${loadedOrderInfo ? `Pedido #${loadedOrderInfo.order_number} (${{
            online: 'Tienda Online',
            whatsapp: 'WhatsApp',
            phone: 'Teléfono',
            preventista: 'Preventa',
            pos: 'Pedido Caja'
          }[loadedOrderInfo.source] || loadedOrderInfo.source})` : 'Caja de Negocio'}</div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="border-bottom:1px solid #000;">
              <th style="text-align:left;padding:2px 0;">Prod</th>
              <th style="text-align:center;padding:2px 0;">Cant</th>
              <th style="text-align:right;padding:2px 0;">P.U.</th>
              <th style="text-align:right;padding:2px 0;">Subt</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:12px;">
          <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${formatCurrency(cartTotal)}</span></div>
          ${discountHTML}
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;margin:4px 0;"><span>TOTAL:</span><span>${formatCurrency(saleData.total)}</span></div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="font-size:11px;">
          <div style="display:flex;justify-content:space-between;"><span>Método de pago:</span><span>${payMethodLabel}</span></div>
          ${paymentInfo}
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="text-align:center;font-size:10px;color:#555;margin-top:8px;">
          ¡Gracias por su compra!
        </div>
        <div style="text-align:center;font-size:9px;color:#777;margin-top:6px;font-weight:bold;">
          TICKET NO FISCAL<br/>DOCUMENTO NO VÁLIDO COMO FACTURA
        </div>
      </div>
    `
  }

  const handlePrintReceipt = () => {
    if (!receiptData) return
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket #${receiptData.ticket_number}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: 80mm auto; margin: 0; }
            }
            body { margin: 0; padding: 0; background: #fff; }
          </style>
        </head>
        <body>
          ${receiptData.receiptHTML}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const startPosnetSimulation = () => {
    setIsProcessing(true)
    setPosnetStep(0)
    setShowPosnetSimulator(true)
    
    setTimeout(() => {
      setPosnetStep(1) // Swipe card
      setTimeout(() => {
        setPosnetStep(2) // Processing
        setTimeout(() => {
          const brands = ['VISA', 'MASTERCARD', 'MAESTRO', 'CABAL']
          const selectedBrand = brands[Math.floor(Math.random() * brands.length)]
          const voucher = Math.floor(100000 + Math.random() * 900000).toString()
          
          setPosnetCardBrand(selectedBrand)
          setPosnetVoucher(voucher)
          setPosnetStep(3) // Approved
          
          setTimeout(() => {
            setShowPosnetSimulator(false)
            executeSaveSale(voucher, selectedBrand)
          }, 1500)
        }, 1500)
      }, 1500)
    }, 1000)
  }

  const executeSaveSale = async (voucher = null, brand = null, installmentDetails = null) => {
    setIsProcessing(true)
    try {
      // eslint-disable-next-line react-hooks/purity
      const ticketNumber = Date.now().toString().slice(-8)
      const dbPaymentMethod = paymentMethod === 'mixed' ? 'combined' : paymentMethod
      
      let paymentDetails = {}
      if (paymentMethod === 'mixed') {
        paymentDetails = {
          cash: parseFloat(mixedCash) || 0,
          card: parseFloat(mixedCard) || 0,
          mp: parseFloat(mixedMP) || 0
        }
      } else if (paymentMethod === 'debit' || paymentMethod === 'credit') {
        paymentDetails = {
          card_brand: brand || 'N/A',
          voucher_number: voucher || 'N/A',
          integrated: posnetMode === 'integrated',
          terminal_id: 'POSNET-4819'
        }
      } else if (paymentMethod === 'transfer') {
        paymentDetails = {
          card_brand: 'Transferencia',
          voucher_number: 'N/A',
          integrated: false,
          is_transfer: true
        }
      }

      const salePayload = {
        tenant_id: tenant.id, 
        user_id: profile.id, 
        shift_id: activeShift.id,
        ticket_number: ticketNumber,
        subtotal: cartTotal, 
        discount_type: discountType || null,
        discount_value: parseFloat(discountValue) || 0,
        discount_amount: discountAmount,
        total: finalTotal, 
        payment_method: dbPaymentMethod, 
        status: 'completed',
        customer_id: selectedCustomerId || null,
        payment_details: paymentDetails,
        online_order_id: loadedOrderId || null,
        source: (loadedOrderId && loadedOrder) ? (loadedOrder.source || 'online') : 'caja'
      }

      if (paymentMethod === 'cash') {
        salePayload.cash_received = cashReceivedNum
        salePayload.cash_change = cashChange
      } else if (paymentMethod === 'mixed') {
        const c = parseFloat(mixedCash) || 0
        const d = parseFloat(mixedCard) || 0
        const m = parseFloat(mixedMP) || 0
        salePayload.cash_received = c
        salePayload.cash_change = Math.max(0, (c + d + m) - finalTotal)
      }

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert(salePayload)
        .select()
        .single()

      if (saleError) throw saleError

      const itemsToInsert = cart.map(item => ({
        sale_id: saleData.id, 
        tenant_id: tenant.id, 
        product_id: item.id, 
        product_name: item.name,
        quantity: item.qty, 
        unit_price: item.sale_price, 
        cost_price: item.cost_price, 
        subtotal: item.subtotal,
        variant_id: item.variant_id || null
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      // Insert into installment_plans if paymentMethod === 'installment'
      if (paymentMethod === 'installment' && installmentDetails) {
        const baseAmount = finalTotal
        const interestRate = parseFloat(installmentDetails.interest_rate) || 0
        const totalAmount = interestRate > 0 ? baseAmount * (1 + interestRate / 100) : baseAmount
        const totalInstallments = installmentDetails.total_installments
        const installmentAmount = totalAmount / totalInstallments

        const { error: instError } = await supabase
          .from('installment_plans')
          .insert({
            tenant_id: tenant.id,
            sale_id: saleData.id,
            customer_name: installmentDetails.customer_name,
            customer_phone: installmentDetails.customer_phone,
            total_amount: totalAmount,
            paid_amount: 0,
            remaining_amount: totalAmount,
            total_installments: totalInstallments,
            paid_installments: 0,
            installment_amount: installmentAmount,
            status: 'active'
          })

        if (instError) {
          console.error('[POS] Error inserting installment plan:', instError)
          toast.error('Venta registrada pero hubo un error al crear el plan de cuotas.')
        }
      }

      // Nota: El descuento de stock ahora se realiza automáticamente mediante triggers en la base de datos (016_deduct_stock_variants_trigger).

      // Update customer balance if installment
      if (paymentMethod === 'installment') {
        const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
        if (selectedCustomer) {
          const newBalance = (parseFloat(selectedCustomer.balance) || 0) + finalTotal
          const { error: customerError } = await supabase
            .from('customers')
            .update({ 
              balance: newBalance,
              last_purchase_at: new Date().toISOString()
            })
            .eq('id', selectedCustomerId)
          if (customerError) throw customerError
        }
      }

      // Update online order if loaded from URL
      if (loadedOrderId && loadedOrder) {
        try {
          const { error: orderUpdateError } = await supabase
            .from('online_orders')
            .update({
              status: 'delivered',
              payment_status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', loadedOrderId)

          if (orderUpdateError) throw orderUpdateError

          // If the order was already confirmed/preparing/ready, stock was already deducted.
          // Since the trigger on sale_items has deducted stock again, we add the stock back to offset it.
          if (['confirmed', 'preparing', 'ready'].includes(loadedOrder.status)) {
            for (const item of cart) {
              if (item.control_stock === false) continue
              const { data: prod } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', item.id)
                .single()

              if (prod) {
                await supabase
                  .from('products')
                  .update({ stock_quantity: Number(prod.stock_quantity) + Number(item.qty) })
                  .eq('id', item.id)
              }

              if (item.variant_id) {
                const { data: variant } = await supabase
                  .from('product_variants')
                  .select('stock_quantity')
                  .eq('id', item.variant_id)
                  .single()

                if (variant) {
                  await supabase
                    .from('product_variants')
                    .update({ stock_quantity: Number(variant.stock_quantity) + Number(item.qty) })
                    .eq('id', item.variant_id)
                }
              }
            }
          }

          toast.success(`Pedido #${loadedOrder.order_number} entregado y pagado`)
          setLoadedOrderId(null)
          setLoadedOrder(null)
        } catch (err) {
          console.error('[POS] Error updating online order:', err)
          toast.error('Venta completada pero error al actualizar pedido online.')
        }
      }

      // Build receipt and store ticket
      const receiptHTML = buildReceiptHTML(saleData, cart, loadedOrder)
      
      // Insert into tickets table
      await supabase.from('tickets').insert({
        sale_id: saleData.id,
        tenant_id: tenant.id,
        ticket_content: receiptHTML,
        printed_count: 0
      })

      // Show receipt modal
      setReceiptData({
        ticket_number: ticketNumber,
        saleData,
        items: [...cart],
        total: finalTotal,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? cashReceivedNum : (paymentMethod === 'mixed' ? (parseFloat(mixedCash) || 0) : 0),
        cashChange: paymentMethod === 'cash' ? cashChange : (paymentMethod === 'mixed' ? Math.max(0, ((parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) + (parseFloat(mixedMP) || 0)) - finalTotal) : 0),
        receiptHTML,
        date: new Date()
      })
      setShowReceipt(true)

      toast.success('¡Venta completada!')
      setCart([])
      setSearchTerm('')
      setCashReceived('')
      setDiscountType(null)
      setDiscountValue('')
      setMixedCash('')
      setMixedCard('')
      setMixedMP('')
      setSelectedCustomerId('')
      
      // Reload products to refresh stock quantities
      loadData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!activeShift) return toast.error('Debes abrir un turno de caja primero')

    // 1b. Stock validation before checkout
    const outOfStock = cart.filter(item => {
      if (item.control_stock === false) return false
      const stockToCheck = item.variant_id ? item.variant_stock_quantity : item.stock_quantity
      return item.qty > (stockToCheck || 0)
    })
    if (outOfStock.length > 0) {
      const names = outOfStock.map(i => `"${i.name}${i.variant_label ? ' ' + i.variant_label : ''}" (pedido: ${i.qty}, stock: ${i.variant_id ? i.variant_stock_quantity : i.stock_quantity})`).join(', ')
      toast.error(`Stock insuficiente para: ${names}`)
      return
    }

    // 1c. Cash validation
    if (paymentMethod === 'cash') {
      if (cashReceivedNum < finalTotal) {
        toast.error('El monto recibido es menor al total')
        return
      }
    }

    // Mixed/Combined validation
    if (paymentMethod === 'mixed') {
      const c = parseFloat(mixedCash) || 0
      const d = parseFloat(mixedCard) || 0
      const m = parseFloat(mixedMP) || 0
      const totalPaid = c + d + m
      if (Math.abs(totalPaid - finalTotal) > 0.01 && totalPaid < finalTotal) {
        toast.error(`El pago mixto ingresado (${formatCurrency(totalPaid)}) no cubre el total de la venta (${formatCurrency(finalTotal)})`)
        return
      }
    }

    // Installment/Fiado validation
    if (paymentMethod === 'installment') {
      if (!selectedCustomerId) {
        toast.error('Debes seleccionar un cliente para realizar una venta al fiado (cuotas)')
        return
      }
      
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
      setInstallmentForm({ 
        customer_name: selectedCustomer ? selectedCustomer.name : '', 
        customer_phone: selectedCustomer ? (selectedCustomer.phone || '') : '', 
        total_installments: 1,
        interest_rate: 0
      })
      setShowInstallmentModal(true)
    } else if (paymentMethod === 'debit' || paymentMethod === 'credit') {
      if (posnetMode === 'integrated') {
        startPosnetSimulation()
      } else {
        setPosnetStep(99) // Opens manual voucher dialog
      }
    } else {
      executeSaveSale(null, null)
    }
  }

  // Category filtering
  const [activeCategory, setActiveCategory] = useState('Todos')
  const uniqueCategories = ['Todos', ...new Set(products.map(p => p.categories?.name).filter(Boolean))]

  const filteredProductsByCategory = filteredProducts.filter(p => 
    activeCategory === 'Todos' || p.categories?.name === activeCategory
  )

  return (
    <>
      <style>{`
        .pos-container {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: var(--space-6);
          align-items: start;
          padding-bottom: var(--space-8);
        }
        @media (max-width: 1024px) {
          .pos-container {
            grid-template-columns: 1fr;
          }
        }
        .pos-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
        }
        .pos-right {
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          position: sticky;
          top: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .search-wrapper {
          position: relative;
          width: 100%;
        }
        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          margin-top: 6px;
          max-height: 320px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        .autocomplete-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: var(--transition);
        }
        .autocomplete-item:last-child {
          border-bottom: none;
        }
        .autocomplete-item:hover {
          background: var(--bg-card-hover);
        }
        .cart-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: var(--space-2);
        }
        .cart-table th {
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-muted);
          font-size: 0.8125rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cart-table td {
          padding: 16px 8px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .cart-table tr:last-child td {
          border-bottom: none;
        }
      `}</style>
      <div ref={posContainerRef} className="pos-container">
        
        {/* LEFT SIDE - Search, Cart Table, & Optional Catalog */}
        <div className="pos-left">
          
          {/* Header Controls (Lector, Fullscreen, Catalog Toggle) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button"
                onClick={() => setShowCatalog(!showCatalog)}
                className="btn btn-ghost"
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem' 
                }}
              >
                {showCatalog ? '👁️ Ocultar Catálogo' : '👁️ Mostrar Catálogo'}
              </button>

              <button 
                type="button"
                onClick={() => setShowMobileScannerModal(true)}
                className="btn btn-ghost"
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: isMobileConnected ? '#10B981' : 'var(--text-secondary)'
                }}
              >
                <span>{isMobileConnected ? '🟢' : '📱'}</span>
                {isMobileConnected ? 'Celular Vinculado' : 'Escanear con Celular'}
              </button>

              <button 
                type="button"
                onClick={toggleFullscreen}
                className="btn btn-ghost"
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem' 
                }}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                {isFullscreen ? 'Salir de Fullscreen' : 'Pantalla Completa'}
              </button>
            </div>

            <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setPosnetMode('integrated')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: posnetMode === 'integrated' ? '#fff' : 'var(--text-muted)',
                  background: posnetMode === 'integrated' ? 'var(--color-primary-light)' : 'transparent',
                  border: posnetMode === 'integrated' ? '1px solid var(--color-primary)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition)'
                }}
              >
                <Zap size={14} /> POSnet Simulado
              </button>
              <button
                type="button"
                onClick={() => setPosnetMode('manual')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: posnetMode === 'manual' ? '#fff' : 'var(--text-muted)',
                  background: posnetMode === 'manual' ? 'var(--color-primary-light)' : 'transparent',
                  border: posnetMode === 'manual' ? '1px solid var(--color-primary)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition)'
                }}
              >
                <Edit size={14} /> Manual
              </button>
            </div>
          </div>

          {/* Search bar with Camera Scan button and Autocomplete Dropdown */}
          <div className="search-wrapper">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <form onSubmit={handleBarcodeSubmit} style={{ flex: 1 }}>
                <div className="form-input-icon">
                  <span className="input-icon" style={{ top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} />
                  </span>
                  <input 
                    id="barcode-scanner"
                    ref={barcodeInputRef}
                    className="form-input" 
                    placeholder="Buscar por nombre, rubro, código o escanear código de barras..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '1rem', padding: '14px 16px 14px 42px' }}
                    autoFocus
                  />
                </div>
              </form>
              {/* Camera scan button */}
              <button
                type="button"
                className="scan-cam-btn"
                onClick={() => setShowCameraScanner(true)}
                title="Escanear código de barras con cámara"
              >
                📷 <span style={{ display: 'none' }}>Escanear</span>
                <span style={{ fontSize: '0.8125rem' }}>Cámara</span>
              </button>
            </div>

            {/* Dropdown list */}
            {showDropdown && searchTerm.trim() !== '' && filteredProducts.length > 0 && (
              <div className="autocomplete-dropdown">
                {filteredProducts.slice(0, 8).map(product => (
                  <div 
                    key={product.id} 
                    className="autocomplete-item"
                    onClick={() => {
                      if (product.has_variants) {
                        setSelectedProductForVariants(product)
                        setShowVariantPicker(true)
                      } else {
                        addToCart(product)
                      }
                      setSearchTerm('')
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.2rem' }}>{product.categories?.icon || '📦'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{product.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {product.categories?.name || 'Sin Categoría'}{product.control_stock !== false ? ` · Stock: ${product.stock_quantity}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-secondary)', fontSize: '0.95rem' }}>{formatCurrency(product.sale_price)}</div>
                      {(product.barcode || product.reference_code) && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {product.barcode || product.reference_code}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div style={{ overflowX: 'auto', flex: 1, minHeight: '200px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', height: '200px', gap: '8px' }}>
                <ShoppingCart size={32} />
                <span>Añade productos para cobrar. Escanea o busca en el campo superior.</span>
              </div>
            ) : (
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Precio</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                    <th style={{ textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '1.2rem' }}>{item.categories?.icon || '📦'}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9375rem' }}>
                            {item.name}
                            {item.variant_label && <span style={{ fontSize: '0.7rem', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', marginLeft: '6px' }}>{item.variant_label}</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.categories?.name || 'Sin Categoría'}{item.control_stock !== false ? ` · Stock: ${item.stock_quantity}` : ''}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        {formatCurrency(item.sale_price)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isDecimalProduct(item) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {/* Input de peso */}
                              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)', position: 'relative', paddingRight: '24px' }}>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={item.qty}
                                  onChange={(e) => updateQtyDirect(item.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateQtyDirect(item.id, e.target.value)
                                    } else if (e.key === 't' && item.unit_type === 'weight' && scaleConnected && scaleWeight > 0) {
                                      e.preventDefault()
                                      updateQtyDirect(item.id, scaleWeight)
                                    }
                                  }}
                                  style={{
                                    width: '70px', padding: '6px', textAlign: 'center',
                                    background: 'transparent', border: 'none',
                                    color: '#fff', fontWeight: 600, fontSize: '0.875rem'
                                  }}
                                />
                                <div style={{ position: 'absolute', right: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                                  {item.unit_label || (item.unit_type === 'weight' ? 'kg' : 'l')}
                                </div>
                              </div>
                              
                              {/* Input de monto inverso */}
                              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(78, 222, 163, 0.05)', borderRadius: '6px', border: '1px dashed rgba(78, 222, 163, 0.3)', position: 'relative', paddingLeft: '14px', width: '94px' }}>
                                <div style={{ position: 'absolute', left: '6px', fontSize: '0.75rem', color: 'var(--color-secondary)', pointerEvents: 'none', fontWeight: 600 }}>$</div>
                                <input
                                  type="number"
                                  placeholder="Monto"
                                  value={item.target_amount || ''}
                                  onChange={(e) => updateQtyByAmount(item.id, e.target.value)}
                                  style={{
                                    width: '100%', padding: '4px 6px', textAlign: 'center',
                                    background: 'transparent', border: 'none',
                                    color: 'var(--color-secondary)', fontWeight: 600, fontSize: '0.8125rem',
                                    outline: 'none'
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              <button type="button" onClick={() => updateQty(item.id, -1)} style={{ padding: '4px 10px', color: 'var(--text-secondary)' }}>−</button>
                              <span style={{ width: '24px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>{item.qty}</span>
                              <button type="button" onClick={() => updateQty(item.id, 1)} style={{ padding: '4px 10px', color: 'var(--text-secondary)' }}>+</button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          style={{ color: 'var(--color-error)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Optional Visual Catalog Grid */}
          {showCatalog && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
              {/* Category Buttons */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: 'var(--space-4)' }}>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: activeCategory === cat ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      border: `1px solid ${activeCategory === cat ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      transition: 'var(--transition)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Cargando catálogo...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                  {filteredProductsByCategory.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => {
                        if (product.has_variants) {
                          setSelectedProductForVariants(product)
                          setShowVariantPicker(true)
                        } else {
                          addToCart(product)
                        }
                      }}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        textAlign: 'center',
                        position: 'relative',
                        opacity: (product.control_stock !== false && product.stock_quantity <= 0) ? 0.5 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary-border)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {product.categories?.name && (
                        <div style={{ 
                          position: 'absolute', top: '0', right: '12px', 
                          background: 'rgba(78, 222, 163, 0.1)', color: 'var(--color-secondary)',
                          padding: '2px 8px', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px',
                          fontSize: '0.625rem', fontWeight: 600
                        }}>
                          {product.categories.name}
                        </div>
                      )}
                      
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '50%', 
                        background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', marginBottom: '10px', marginTop: '8px',
                        border: '1px solid var(--border-highlight)'
                      }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          product.categories?.icon || '📦'
                        )}
                      </div>

                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', minHeight: '34px' }} className="truncate">
                        {product.name}
                      </div>

                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                        {formatCurrency(product.sale_price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Checkout Panel */}
        <div className="pos-right">
          {/* Panel Header */}
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '4px', fontFamily: 'var(--font-headline)' }}>Resumen de Venta</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> {profile?.full_name || 'Vendedor'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '100px', padding: '6px 12px', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>

          {/* Panel Body */}
          <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stats Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
              <span>Líneas: {cart.length}</span>
              <span>Productos totales: {cartItemsCount}</span>
            </div>

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(cartSubtotal)}</span>
            </div>
            
            {/* Discounts Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                <span>Descuento</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button"
                    onClick={() => { setDiscountType(discountType === 'percentage' ? null : 'percentage'); setDiscountValue(''); }}
                    style={{ 
                      border: '1px solid var(--border-color)', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem',
                      background: discountType === 'percentage' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                      color: discountType === 'percentage' ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Porcentaje (%)
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setDiscountType(discountType === 'fixed' ? null : 'fixed'); setDiscountValue(''); }}
                    style={{ 
                      border: '1px solid var(--border-color)', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem',
                      background: discountType === 'fixed' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                      color: discountType === 'fixed' ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Monto Fijo ($)
                  </button>
                </div>
              </div>
              
              {discountType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {discountType === 'percentage' ? 'Porcentaje %:' : 'Monto $:'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    placeholder={discountType === 'percentage' ? '10' : '500'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                      fontWeight: 600
                    }}
                  />
                  {discountValue && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-tertiary)', fontWeight: 600 }}>
                      - {formatCurrency(discountAmount)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* IVA Tax */}
            {tenant?.theme_config?.tax_rate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span>{tenant?.theme_config?.tax_name || 'IVA'} ({tenant?.theme_config?.tax_rate}%) Incluido</span>
                <span>{formatCurrency((cartTotal * Number(tenant.theme_config.tax_rate)) / (100 + Number(tenant.theme_config.tax_rate)))}</span>
              </div>
            )}

            {/* Final Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-headline)' }}>TOTAL</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                {formatCurrency(finalTotal)}
              </span>
            </div>

            {/* Installment Customer Selector */}
            {paymentMethod === 'installment' && (
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', margin: '4px 0' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Asociar Cliente (Cuenta Corriente)</div>
                
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Saldo: {formatCurrency(parseFloat(c.balance) || 0)})
                    </option>
                  ))}
                </select>

                {selectedCustomerId && (() => {
                  const client = customers.find(c => c.id === selectedCustomerId)
                  if (!client) return null
                  return (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <div>📱 Teléfono: {client.phone || 'N/A'}</div>
                      <div>DNI: {client.dni || 'N/A'}</div>
                      <div style={{ fontWeight: 600 }}>Saldo Deudor Actual: <span style={{ color: (parseFloat(client.balance) || 0) > 0 ? 'var(--color-tertiary)' : 'var(--color-secondary)' }}>{formatCurrency(parseFloat(client.balance) || 0)}</span></div>
                      <div style={{ fontWeight: 700, color: '#fff', marginTop: '4px' }}>Nuevo Saldo: {formatCurrency((parseFloat(client.balance) || 0) + finalTotal)}</div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Mixed Payment Details Inputs */}
            {paymentMethod === 'mixed' && (
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', margin: '4px 0' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Desglose de Pago Mixto</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', width: '90px', color: 'var(--text-secondary)' }}>💵 Efectivo:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={mixedCash}
                    onChange={(e) => setMixedCash(e.target.value)}
                    style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', width: '90px', color: 'var(--text-secondary)' }}>💳 Tarjeta:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={mixedCard}
                    onChange={(e) => setMixedCard(e.target.value)}
                    style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', width: '90px', color: 'var(--text-secondary)' }}>📱 MP / QR:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={mixedMP}
                    onChange={(e) => setMixedMP(e.target.value)}
                    style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ingresado: {formatCurrency((parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) + (parseFloat(mixedMP) || 0))}</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: Math.abs(((parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) + (parseFloat(mixedMP) || 0)) - finalTotal) < 0.01 ? 'var(--color-secondary)' : 'var(--color-tertiary)' 
                  }}>
                    Resta: {formatCurrency(Math.max(0, finalTotal - ((parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) + (parseFloat(mixedMP) || 0))))}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '4px 0' }}>
              {[
                { id: 'cash', label: 'Efectivo (F2)', icon: <Banknote size={18} /> },
                { id: 'debit', label: 'Débito (F3)', icon: <CreditCard size={18} /> },
                { id: 'credit', label: 'Crédito (F4)', icon: <Landmark size={18} /> },
                { id: 'transfer', label: 'Transf. (F6)', icon: <ArrowLeftRight size={18} /> },
                { id: 'combined', label: 'Mixto', icon: <Split size={18} /> },
                { id: 'installment', label: 'Cuotas', icon: <Calendar size={18} /> }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 'var(--radius-md)',
                    background: paymentMethod === method.id ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                    border: `1px solid ${paymentMethod === method.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    color: paymentMethod === method.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    transition: 'var(--transition)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{method.icon}</span>
                  <span style={{ fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase' }}>{method.label}</span>
                </button>
              ))}
            </div>

            {/* Cash Received Input */}
            {paymentMethod === 'cash' && (
              <div style={{ margin: '4px 0' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Efectivo Recibido (opcional)</label>
                <div className="form-input-icon">
                  <span className="input-icon" style={{ color: 'var(--color-secondary)' }}>$</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Dejar vacío si paga con cambio exacto"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    style={{ padding: '8px 12px 8px 32px' }}
                  />
                </div>
                {cashReceived && parseFloat(cashReceived) >= finalTotal && (
                  <div style={{ marginTop: '8px', fontSize: '0.9375rem', color: 'var(--color-secondary)', fontWeight: 600, textAlign: 'right' }}>
                    Vuelto a entregar: {formatCurrency(parseFloat(cashReceived) - finalTotal)}
                  </div>
                )}
              </div>
            )}

            {/* Combined/Split Payment Inputs */}
            {paymentMethod === 'combined' && (
              <div style={{ margin: '4px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Monto a pagar con cada medio:</label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Efectivo</div>
                  <div className="form-input-icon" style={{ flex: 1 }}>
                    <span className="input-icon" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input type="number" className="form-input" style={{ padding: '8px 8px 8px 32px' }} value={splitCash} onChange={e => setSplitCash(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Débito</div>
                  <div className="form-input-icon" style={{ flex: 1 }}>
                    <span className="input-icon" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input type="number" className="form-input" style={{ padding: '8px 8px 8px 32px' }} value={splitDebit} onChange={e => setSplitDebit(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Crédito</div>
                  <div className="form-input-icon" style={{ flex: 1 }}>
                    <span className="input-icon" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input type="number" className="form-input" style={{ padding: '8px 8px 8px 32px' }} value={splitCredit} onChange={e => setSplitCredit(e.target.value)} />
                  </div>
                </div>

                {(() => {
                  const sum = Number(splitCash || 0) + Number(splitDebit || 0) + Number(splitCredit || 0)
                  const diff = finalTotal - sum
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8125rem', fontWeight: 600, color: Math.abs(diff) < 0.01 ? 'var(--color-secondary)' : 'var(--color-error)' }}>
                      <span>Ingresado: {formatCurrency(sum)}</span>
                      {diff > 0 ? <span>Falta: {formatCurrency(diff)}</span> : diff < 0 ? <span>Sobra: {formatCurrency(Math.abs(diff))}</span> : <span>¡Completo!</span>}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button 
                id="btn-confirm-sale"
                type="button"
                className="glow-primary" 
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  fontSize: '1.1rem',
                  fontWeight: 700, 
                  borderRadius: 'var(--radius-lg)',
                  background: cart.length === 0 ? 'var(--bg-surface)' : 'var(--color-primary-hover)',
                  color: cart.length === 0 ? 'var(--text-muted)' : '#fff',
                  border: 'none',
                  pointerEvents: cart.length === 0 ? 'none' : 'auto',
                  transition: 'var(--transition)',
                  cursor: 'pointer'
                }}
                onClick={handleCheckout}
                disabled={isProcessing || cart.length === 0}
              >
                {isProcessing ? 'Procesando...' : `Cobrar ${formatCurrency(finalTotal)} (Enter) →`}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  type="button"
                  className="glow-secondary"
                  style={{ 
                    padding: '12px', 
                    fontSize: '0.85rem',
                    fontWeight: 600, 
                    borderRadius: 'var(--radius-md)',
                    background: cart.length === 0 ? 'var(--bg-surface)' : 'rgba(16, 185, 129, 0.05)',
                    color: cart.length === 0 ? 'var(--text-muted)' : 'var(--color-secondary)',
                    border: `1px solid ${cart.length === 0 ? 'transparent' : 'var(--color-secondary)'}`,
                    pointerEvents: cart.length === 0 ? 'none' : 'auto',
                    transition: 'var(--transition)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowOrderModal(true)}
                  disabled={isProcessing || cart.length === 0}
                >
                  📝 Pedido
                </button>

                <button 
                  type="button"
                  className="btn-ghost"
                  style={{ 
                    padding: '12px', 
                    fontSize: '0.85rem',
                    fontWeight: 600, 
                    borderRadius: 'var(--radius-md)',
                    background: cart.length === 0 ? 'var(--bg-surface)' : 'rgba(239, 68, 68, 0.05)',
                    color: cart.length === 0 ? 'var(--text-muted)' : 'var(--color-error)',
                    border: `1px solid ${cart.length === 0 ? 'transparent' : 'rgba(239, 68, 68, 0.2)'}`,
                    pointerEvents: cart.length === 0 ? 'none' : 'auto',
                    transition: 'var(--transition)',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setCart([]); setLoadedOrderId(null); setLoadedOrder(null); }}
                  disabled={isProcessing || cart.length === 0}
                >
                  🗑️ Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal (Unchanged structurally, kept dark theme compatible) */}
      {showReceipt && receiptData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowReceipt(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '440px', width: '100%', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal header */}
            <div style={{ 
              padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={20} style={{ color: 'var(--color-secondary)' }} /> Venta Completada
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Ticket #{receiptData.ticket_number}
                </p>
              </div>
              <div style={{ 
                background: 'rgba(78, 222, 163, 0.15)', color: 'var(--color-secondary)', 
                padding: '6px 12px', borderRadius: 'var(--radius-full)', 
                fontSize: '0.8125rem', fontWeight: 600 
              }}>
                {formatCurrency(receiptData.total)}
              </div>
            </div>

            {/* Receipt preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              <div style={{ 
                background: '#fff', borderRadius: 'var(--radius-md)', 
                padding: '16px', color: '#000', fontSize: '12px',
                fontFamily: "'Courier New', Courier, monospace"
              }}>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{tenant?.name || 'Mi Negocio'}</div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Ticket de Venta</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ff3b30', border: '1px solid #ff3b30', padding: '2px 4px', display: 'inline-block', borderRadius: '3px' }}>TICKET NO FISCAL</div>
                </div>
                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                <div style={{ fontSize: '11px', marginBottom: '8px' }}>
                  <div>Fecha: {formatDateTime(receiptData.date)}</div>
                  <div>Ticket: #{receiptData.ticket_number}</div>
                  <div>Cajero: {profile?.full_name || 'N/A'}</div>
                </div>
                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                
                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                      <th style={{ textAlign: 'left', padding: '2px 0' }}>Prod</th>
                      <th style={{ textAlign: 'center', padding: '2px 0' }}>Cant</th>
                      <th style={{ textAlign: 'right', padding: '2px 0' }}>P.U.</th>
                      <th style={{ textAlign: 'right', padding: '2px 0' }}>Subt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, i) => {
                      const unitLabel = item.unit_label || (item.unit_type === 'weight' ? 'kg' : item.unit_type === 'volume' ? 'L' : 'u')
                      const qtyStr = isDecimalProduct(item) ? `${item.qty.toFixed(3)} ${unitLabel}` : `${item.qty} ${unitLabel}`
                      return (
                         <tr key={i}>
                          <td style={{ textAlign: 'left', padding: '3px 0' }}>{item.name}</td>
                          <td style={{ textAlign: 'center', padding: '3px 0' }}>{qtyStr}</td>
                          <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(item.sale_price)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '2px 0' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.items.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                </div>
                {receiptData.saleData?.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', margin: '2px 0' }}>
                    <span>Descuento ({receiptData.saleData?.discount_type === 'percentage' ? `${receiptData.saleData?.discount_value}%` : formatCurrency(receiptData.saleData?.discount_value)}):</span>
                    <span>-{formatCurrency(receiptData.saleData?.discount_amount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

                <div style={{ fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Método:</span>
                    <span>{{ cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', mixed: 'Mixto', installment: 'Fiado (Cta. Cte.)' }[receiptData.paymentMethod] || receiptData.paymentMethod}</span>
                  </div>
                  {receiptData.paymentMethod === 'cash' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Recibido:</span>
                        <span>{formatCurrency(receiptData.cashReceived)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Vuelto:</span>
                        <span>{formatCurrency(receiptData.cashChange)}</span>
                      </div>
                    </>
                  )}
                  {receiptData.paymentMethod === 'mixed' && (
                    <div style={{ marginLeft: '8px', color: '#555', fontSize: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>- Efectivo:</span>
                        <span>{formatCurrency(receiptData.saleData?.payment_details?.cash || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>- Tarjeta:</span>
                        <span>{formatCurrency(receiptData.saleData?.payment_details?.card || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>- Mercado Pago:</span>
                        <span>{formatCurrency(receiptData.saleData?.payment_details?.mp || 0)}</span>
                      </div>
                      {receiptData.cashChange > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#000', fontSize: '11px', marginTop: '2px' }}>
                          <span>Vuelto (Efectivo):</span>
                          <span>{formatCurrency(receiptData.cashChange)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {receiptData.paymentMethod === 'installment' && (
                    <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #ccc' }}>
                      <div>Cliente: {customers.find(c => c.id === selectedCustomerId)?.name || 'Cliente Registrado'}</div>
                      <div style={{ fontWeight: 'bold' }}>Nuevo Saldo: {formatCurrency(receiptData.total + (parseFloat(customers.find(c => c.id === selectedCustomerId)?.balance) || 0))}</div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

                <div style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
                  ¡Gracias por su compra!
                </div>
                <div style={{ textAlign: 'center', fontSize: '9px', color: '#777', marginTop: '6px', fontWeight: 'bold' }}>
                  TICKET NO FISCAL<br/>DOCUMENTO NO VÁLIDO COMO FACTURA
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ 
              padding: '16px 24px', borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: '12px'
            }}>
               <button
                className="btn"
                onClick={() => setShowReceipt(false)}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                  fontSize: '0.9375rem', fontWeight: 600
                }}
              >
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePrintReceipt}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                  fontSize: '0.9375rem', fontWeight: 600,
                  background: 'var(--color-primary-hover)'
                }}
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POSnet Card Terminal Simulator Modal */}
      {showPosnetSimulator && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#12121e', borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--color-primary)',
            maxWidth: '400px', width: '100%', padding: '32px',
            textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Conexión POSnet Integrada
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                Terminal POS-9938
              </h3>
            </div>

            <div style={{
              background: '#040914', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', padding: '24px', minHeight: '180px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '16px'
            }}>
              {posnetStep === 0 && (
                <>
                  <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                  <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                  `}</style>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Iniciando comunicación...
                  </div>
                </>
              )}

              {posnetStep === 1 && (
                <>
                  <div style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>💳</div>
                  <style>{`
                    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
                  `}</style>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      Acerque o ingrese tarjeta
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 800 }}>
                      Monto a cobrar: {formatCurrency(cartTotal)}
                    </div>
                  </div>
                </>
              )}

              {posnetStep === 2 && (
                <>
                  <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: 'var(--color-secondary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                      Transfiriendo fondos...
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No retire la tarjeta de la terminal.
                    </div>
                  </div>
                </>
              )}

              {posnetStep === 3 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--color-secondary)', margin: '12px 0' }}>
                    <CheckCircle size={56} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '4px' }}>
                      Pago Aprobado
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Tarjeta: <strong style={{ color: '#fff' }}>{posnetCardBrand}</strong> | Cupón: <strong style={{ color: '#fff' }}>#{posnetVoucher}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {scaleSupported && (
                <button 
                  className={`btn ${scaleConnected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => scaleConnected ? disconnectScale() : connectScale()}
                  title={scaleConnected ? "Desconectar Balanza" : "Conectar Balanza Digital"}
                  style={{ padding: '0 12px', fontSize: '0.875rem' }}
                >
                  ⚖️ {scaleConnected ? `${scaleWeight || '0.000'} kg` : 'Balanza'}
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Pantalla Completa"
                style={{ padding: '0 12px' }}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {posnetStep !== 3 && (
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', padding: '12px' }}
                  onClick={() => {
                    setShowPosnetSimulator(false)
                    setIsProcessing(false)
                  }}
                >
                  Cancelar Cobro
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POSnet Manual Voucher Entry Modal */}
      {posnetStep === 99 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#12121e', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)',
            maxWidth: '400px', width: '100%', padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                Registrar Cupón POSnet
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Ingrese los datos del ticket emitido por la terminal física.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label required">Número de Cupón / Operación</label>
              <input 
                className="form-input" 
                placeholder="Ej. 048293" 
                value={manualVoucher}
                onChange={e => setManualVoucher(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Marca de Tarjeta</label>
              <select 
                className="form-select"
                value={posnetCardBrand}
                onChange={e => setPosnetCardBrand(e.target.value)}
              >
                <option value="VISA">VISA</option>
                <option value="MASTERCARD">MASTERCARD</option>
                <option value="MAESTRO">MAESTRO</option>
                <option value="CABAL">CABAL</option>
                <option value="AMERICAN EXPRESS">AMERICAN EXPRESS</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, padding: '12px' }}
                onClick={() => {
                  setPosnetStep(0)
                  setIsProcessing(false)
                  setManualVoucher('')
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
                onClick={() => {
                  if (!manualVoucher) {
                    toast.warning('Ingresa el número de cupón')
                    return
                  }
                  const voucher = manualVoucher
                  setManualVoucher('')
                  setPosnetStep(0)
                  executeSaveSale(voucher, posnetCardBrand)
                }}
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstallmentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: 'var(--space-6)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-4)', color: '#fff' }}>
              📋 Registrar Plan de Cuotas (Fiado)
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Completá los datos del cliente para crear el saldo pendiente en Cuentas Corrientes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Nombre del Cliente</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: Juan Pérez"
                  value={installmentForm.customer_name}
                  onChange={e => setInstallmentForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono (opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: 3424123456"
                  value={installmentForm.customer_phone}
                  onChange={e => setInstallmentForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Cantidad de Cuotas</label>
                  <select 
                    className="form-select"
                    value={installmentForm.total_installments}
                    onChange={e => setInstallmentForm(prev => ({ ...prev, total_installments: parseInt(e.target.value) || 1 }))}
                  >
                    <option value={1}>1 Pago (Al Fiado)</option>
                    <option value={2}>2 Cuotas</option>
                    <option value={3}>3 Cuotas</option>
                    <option value={4}>4 Cuotas</option>
                    <option value={6}>6 Cuotas</option>
                    <option value={12}>12 Cuotas</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Interés (%)</label>
                  <div className="form-input-icon">
                    <span className="input-icon" style={{ color: 'var(--color-tertiary)' }}>%</span>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      max="200"
                      step="0.5"
                      placeholder="0"
                      value={installmentForm.interest_rate === 0 ? '' : installmentForm.interest_rate}
                      onChange={e => setInstallmentForm(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Live calculation summary */}
            {(() => {
              const interestRate = parseFloat(installmentForm.interest_rate) || 0
              const baseTotal = cartTotal
              const totalWithInterest = interestRate > 0 ? baseTotal * (1 + interestRate / 100) : baseTotal
              const numCuotas = parseInt(installmentForm.total_installments) || 1
              const perCuota = totalWithInterest / numCuotas
              return (
                <div style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '12px 16px',
                  marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total venta:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(baseTotal)}</span>
                  </div>
                  {interestRate > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--color-tertiary)' }}>+ Interés ({interestRate}%):</span>
                      <span style={{ color: 'var(--color-tertiary)', fontWeight: 600 }}>+ {formatCurrency(totalWithInterest - baseTotal)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>Total a cobrar:</span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: interestRate > 0 ? 'var(--color-tertiary)' : 'var(--color-secondary)' }}>
                      {formatCurrency(totalWithInterest)}
                    </span>
                  </div>
                  {numCuotas > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Por cuota:</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(perCuota)} × {numCuotas}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1 }}
                onClick={() => {
                  setShowInstallmentModal(false)
                  setPaymentMethod('cash')
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontWeight: 700 }}
                onClick={confirmInstallmentSale}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========== ORDER (PEDIDO) MODAL ========== */}
      {showOrderModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowOrderModal(false) } }}
        >
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)', padding: '32px',
            width: '100%', maxWidth: '460px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', margin: '0 auto 12px'
              }}>📋</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                Guardar como Pedido
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {cart.length} producto{cart.length !== 1 ? 's' : ''} · Total: <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(cartTotal)}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nombre del cliente *
                </label>
                <input
                  className="form-input"
                  placeholder="Ej: Juan Pérez"
                  value={orderForm.customer_name}
                  onChange={e => setOrderForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Teléfono (opcional)
                </label>
                <input
                  className="form-input"
                  placeholder="Ej: 3424123456"
                  value={orderForm.customer_phone}
                  onChange={e => setOrderForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Fecha de entrega
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={orderForm.delivery_date}
                    onChange={e => setOrderForm(prev => ({ ...prev, delivery_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Seña / Anticipo ($)
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={orderForm.advance_payment}
                    onChange={e => setOrderForm(prev => ({ ...prev, advance_payment: e.target.value }))}
                  />
                </div>
              </div>

              {orderForm.advance_payment && parseFloat(orderForm.advance_payment) > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 'var(--radius-md)', padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Saldo pendiente:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>
                    {formatCurrency(cartTotal - (parseFloat(orderForm.advance_payment) || 0))}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => { setShowOrderModal(false); setOrderForm({ customer_name: '', customer_phone: '', delivery_date: '', advance_payment: '' }) }}
                disabled={savingOrder}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2, fontWeight: 700 }}
                onClick={handleSaveAsOrder}
                disabled={savingOrder || !orderForm.customer_name.trim()}
              >
                {savingOrder ? '⏳ Guardando...' : '📋 Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MOBILE SCANNER MODAL ========== */}
      {showMobileScannerModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowMobileScannerModal(false) } }}
        >
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)', padding: '32px',
            width: '100%', maxWidth: '400px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)', textAlign: 'center'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: isMobileConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59,130,246,0.1)', 
                border: isMobileConnected ? '2px solid rgba(16, 185, 129, 0.3)' : '2px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', margin: '0 auto 12px'
              }}>
                {isMobileConnected ? '🟢' : '📱'}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                {isMobileConnected ? 'Celular Vinculado' : 'Escanear con Celular'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
                {isMobileConnected 
                  ? 'Tu celular está listo para escanear códigos de barras. Todo lo que escanees se agregará automáticamente.'
                  : 'Escanea el código QR con la cámara de tu celular para usarlo como lector de códigos de barras.'}
              </p>
              
              {!isMobileConnected && (
                <div style={{ 
                  background: '#fff', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  display: 'inline-block',
                  marginBottom: '16px'
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/scan?session=${mobileSessionId}`)}`} 
                    alt="QR Scanner"
                    style={{ display: 'block', width: '200px', height: '200px' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowMobileScannerModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <VariantPickerModal 
        isOpen={showVariantPicker} 
        product={selectedProductForVariants} 
        onSelect={(product, variant) => addToCart(product, variant)} 
        onClose={() => { setShowVariantPicker(false); setSelectedProductForVariants(null) }} 
      />

      {showQuickProduct && (
        <QuickProductModal 
          isOpen={showQuickProduct} 
          onClose={() => setShowQuickProduct(false)} 
          barcode={quickProductBarcode} 
          onSaved={handleQuickProductSaved} 
        />
      )}

      {/* ===== CAMERA BARCODE SCANNER ===== */}
      <BarcodeScanner
        isOpen={showCameraScanner}
        onScan={handleCameraScan}
        onClose={() => setShowCameraScanner(false)}
        title="Escanear Código de Barras"
      />
    </>
  )
}
