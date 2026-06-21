'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { 
  Wrench, Plus, Search, Trash2, Edit2, ShoppingCart, User,
  ShieldAlert, CheckCircle, Printer, X, Sparkles, Award, Play,
  CreditCard, Landmark, Banknote, ClipboardList, Gauge, Clock,
  Eye, AlertCircle, Phone, MessageSquare, Check, HelpCircle
} from 'lucide-react'

export default function WorkOrdersPage() {
  const { tenant, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()

  const [activeShift, setActiveShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workOrders, setWorkOrders] = useState([])
  const [boxes, setBoxes] = useState([])
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [operators, setOperators] = useState([]) // Profiles with role 'mechanic' or 'admin'
  const [products, setProducts] = useState([])

  // Filters state
  const [tab, setTab] = useState('active') // 'active', 'completed', 'cancelled', 'all'
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Current selected entities
  const [selectedWO, setSelectedWO] = useState(null)
  const [selectedChecklist, setSelectedChecklist] = useState(null)
  const [currentWOItems, setCurrentWOItems] = useState([])

  // Form states - New/Edit Work Order
  const [clientSearch, setClientSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [assignedBoxId, setAssignedBoxId] = useState('')
  const [assignedMechanicId, setAssignedMechanicId] = useState('')
  const [kmAtEntry, setKmAtEntry] = useState('')
  const [description, setDescription] = useState('')
  const [diagnostic, setDiagnostic] = useState('')
  const [observations, setObservations] = useState('')
  const [laborBasePrice, setLaborBasePrice] = useState('0')
  const [totalPartsCost, setTotalPartsCost] = useState('0')
  const [isHistorical, setIsHistorical] = useState(false)
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0])

  // Checklist form states
  const [chkDelanteras, setChkDelanteras] = useState(false)
  const [chkTraseras, setChkTraseras] = useState(false)
  const [chkGiro, setChkGiro] = useState(false)
  const [chkAceite, setChkAceite] = useState(false)
  const [chkRefrigerante, setChkRefrigerante] = useState(false)
  const [chkFrenos, setChkFrenos] = useState(false)
  const [chkPresionNeum, setChkPresionNeum] = useState(false)
  const [chkEstadoNeum, setChkEstadoNeum] = useState(false)
  const [chkFrenoMano, setChkFrenoMano] = useState(false)
  const [chkLimpiaparabrisas, setChkLimpiaparabrisas] = useState(false)
  const [chkBateria, setChkBateria] = useState(false)
  const [chkCorreas, setChkCorreas] = useState(false)
  const [presDelIzq, setPresDelIzq] = useState('')
  const [presDelDer, setPresDelDer] = useState('')
  const [presTraIzq, setPresTraIzq] = useState('')
  const [presTraDer, setPresTraDer] = useState('')
  const [checklistObs, setChecklistObs] = useState('')

  // Add Item states
  const [itemSearch, setItemSearch] = useState('')
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [customItemName, setCustomItemName] = useState('')
  const [customItemPrice, setCustomItemPrice] = useState('')
  const [customItemIsLabor, setCustomItemIsLabor] = useState(false)

  // Finalize Form states
  const [finalLabor, setFinalLabor] = useState('0')
  const [finalParts, setFinalParts] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [selectedMechanics, setSelectedMechanics] = useState([]) // For commission splits
  const [manualDiscount, setManualDiscount] = useState(0)

  // Combined payment amounts
  const [combinedCash, setCombinedCash] = useState('')
  const [combinedDebit, setCombinedDebit] = useState('')
  const [combinedCredit, setCombinedCredit] = useState('')

  // Receipt modal state
  const [receiptData, setReceiptData] = useState(null)

  const isGated = tenant?.subscription_plan === 'basic'

  // Load initial data
  const loadData = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      // 1. Fetch active shift
      const { data: shiftData } = await supabase
        .from('shifts')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'open')
        .eq('user_id', profile.id)
        .maybeSingle()
      setActiveShift(shiftData)

      // 2. Fetch work orders with clients & vehicles
      const { data: wos, error: wosError } = await supabase
        .from('work_orders')
        .select('*, customers(*), vehicles(*), boxes(*)')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      if (wosError) throw wosError
      setWorkOrders(wos || [])

      // 3. Fetch boxes
      const { data: bxs } = await supabase
        .from('boxes')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
      setBoxes(bxs || [])

      // 4. Fetch customers
      const { data: custs } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
      setCustomers(custs || [])

      // 5. Fetch vehicles
      const { data: vehs } = await supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', tenant.id)
      setVehicles(vehs || [])

      // 6. Fetch profiles (operators/mechanics)
      const { data: ops } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
      setOperators(ops || [])

      // 7. Fetch active inventory products for parts lookup
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
      setProducts(prods || [])

    } catch (err) {
      console.error('[loadData]', err)
      toast.error('Error al cargar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, profile?.id, supabase, toast])

  useEffect(() => {
    if (tenant?.id && !isGated) {
      loadData()
    }
  }, [tenant?.id, isGated, loadData])

  // Handle URL query parameters for pre-filling a new order
  useEffect(() => {
    if (typeof window !== 'undefined' && vehicles.length > 0 && !loading) {
      const params = new URLSearchParams(window.location.search)
      const patente = params.get('patente')
      const action = params.get('action')
      if (patente && action === 'new') {
        const foundVeh = vehicles.find(v => v.license_plate.toUpperCase() === patente.toUpperCase())
        if (foundVeh) {
          setSelectedCustomerId(foundVeh.client_id)
          setSelectedVehicleId(foundVeh.id)
          setClientSearch(patente)
          setShowNewModal(true)
          // Clean parameters from URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }
  }, [vehicles, loading])

  // Filtered client list for autocomplete
  const filteredClients = useMemo(() => {
    if (!clientSearch) return []
    const term = clientSearch.toLowerCase()
    return customers.filter(c => {
      const matchName = c.name.toLowerCase().includes(term)
      const matchDni = c.dni ? c.dni.includes(term) : false
      const clientVehs = vehicles.filter(v => v.client_id === c.id)
      const matchPlate = clientVehs.some(v => v.license_plate.toLowerCase().includes(term))
      return matchName || matchDni || matchPlate
    }).slice(0, 5)
  }, [clientSearch, customers, vehicles])

  // Filtered vehicles for selected customer
  const customerVehicles = useMemo(() => {
    return vehicles.filter(v => v.client_id === selectedCustomerId)
  }, [selectedCustomerId, vehicles])

  // Filtered products for item autocomplete
  const filteredProducts = useMemo(() => {
    if (!itemSearch) return []
    const term = itemSearch.toLowerCase()
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term))
    ).slice(0, 5)
  }, [itemSearch, products])

  // Filtered work orders by tab and search
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(wo => {
      // Tab filter
      if (tab === 'active' && (wo.status === 'Finalizado' || wo.status === 'Cancelado')) return false
      if (tab === 'completed' && wo.status !== 'Finalizado') return false
      if (tab === 'cancelled' && wo.status !== 'Cancelado') return false

      // Search query filter
      if (searchQuery) {
        const term = searchQuery.toLowerCase()
        const matchNo = wo.order_number?.toString().includes(term)
        const matchDesc = wo.description?.toLowerCase().includes(term)
        const custName = wo.customers?.name?.toLowerCase() || ''
        const matchCust = custName.includes(term)
        const vehPlate = wo.vehicles?.license_plate?.toLowerCase() || ''
        const matchVeh = vehPlate.includes(term) || `${wo.vehicles?.brand} ${wo.vehicles?.model}`.toLowerCase().includes(term)
        return matchNo || matchDesc || matchCust || matchVeh
      }
      return true
    })
  }, [workOrders, tab, searchQuery])

  // Load items for selected WO
  const loadWOItems = async (woId) => {
    try {
      const { data, error } = await supabase
        .from('work_order_items')
        .select('*')
        .eq('work_order_id', woId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setCurrentWOItems(data || [])
    } catch (err) {
      toast.error('Error al cargar repuestos: ' + err.message)
    }
  }

  // Load Checklist for selected WO
  const loadChecklist = async (woId) => {
    try {
      const { data, error } = await supabase
        .from('work_order_checklist')
        .select('*')
        .eq('work_order_id', woId)
        .maybeSingle()
      if (error) throw error

      if (data) {
        setSelectedChecklist(data)
        setChkDelanteras(data.luces_delanteras)
        setChkTraseras(data.luces_traseras)
        setChkGiro(data.luces_giro)
        setChkAceite(data.nivel_aceite)
        setChkRefrigerante(data.nivel_refrigerante)
        setChkFrenos(data.nivel_liquido_frenos)
        setChkPresionNeum(data.presion_neumaticos)
        setChkEstadoNeum(data.estado_neumaticos)
        setChkFrenoMano(data.freno_mano)
        setChkLimpiaparabrisas(data.limpiaparabrisas)
        setChkBateria(data.bateria)
        setChkCorreas(data.correas)
        setPresDelIzq(data.presion_del_izq || '')
        setPresDelDer(data.presion_del_der || '')
        setPresTraIzq(data.presion_tra_izq || '')
        setPresTraDer(data.presion_tra_der || '')
        setChecklistObs(data.observations || '')
      } else {
        setSelectedChecklist(null)
        // Reset checklist inputs
        setChkDelanteras(false)
        setChkTraseras(false)
        setChkGiro(false)
        setChkAceite(false)
        setChkRefrigerante(false)
        setChkFrenos(false)
        setChkPresionNeum(false)
        setChkEstadoNeum(false)
        setChkFrenoMano(false)
        setChkLimpiaparabrisas(false)
        setChkBateria(false)
        setChkCorreas(false)
        setPresDelIzq('')
        setPresDelDer('')
        setPresTraIzq('')
        setPresTraDer('')
        setChecklistObs('')
      }
    } catch (err) {
      toast.error('Error al cargar checklist: ' + err.message)
    }
  }

  // Create Work Order
  const handleCreateWO = async (e) => {
    e.preventDefault()
    if (!selectedCustomerId) return toast.error('Debes seleccionar un cliente')
    if (!selectedVehicleId) return toast.error('Debes seleccionar un vehículo')
    if (!description.trim()) return toast.error('La descripción de la orden es obligatoria')

    setIsSaving(true)
    try {
      const initialLabor = parseFloat(laborBasePrice) || 0
      const initialParts = parseFloat(totalPartsCost) || 0
      const initialTotal = initialLabor + initialParts

      const woData = {
        tenant_id: tenant.id,
        branch_id: activeShift?.branch_id || null,
        client_id: selectedCustomerId,
        vehicle_id: selectedVehicleId,
        box_id: assignedBoxId || null,
        assigned_mechanic_id: assignedMechanicId || null,
        created_by: profile.id,
        status: isHistorical ? 'Finalizado' : (assignedBoxId ? 'En Box' : 'Pendiente'),
        km_at_entry: parseInt(kmAtEntry) || 0,
        description: description.trim(),
        diagnostic: diagnostic.trim() || null,
        observations: observations.trim() || null,
        labor_base_price: initialLabor,
        total_parts_cost: initialParts,
        total_price: initialTotal,
        started_at: assignedBoxId ? new Date().toISOString() : null,
        completed_at: isHistorical ? new Date(customDate).toISOString() : null
      }

      const { data: newWO, error: woError } = await supabase
        .from('work_orders')
        .insert(woData)
        .select()
        .single()
      if (woError) throw woError

      // Initialize empty checklist
      await supabase
        .from('work_order_checklist')
        .insert({
          work_order_id: newWO.id,
          checked_by: profile.id
        })

      toast.success('Orden de Trabajo creada con éxito')
      setShowNewModal(false)
      
      // Reset forms
      setSelectedCustomerId('')
      setSelectedVehicleId('')
      setAssignedBoxId('')
      setAssignedMechanicId('')
      setKmAtEntry('')
      setDescription('')
      setDiagnostic('')
      setObservations('')
      setLaborBasePrice('0')
      setTotalPartsCost('0')
      setClientSearch('')
      setIsHistorical(false)

      loadData()
    } catch (err) {
      toast.error('Error al guardar la orden: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Edit Work Order fields
  const handleEditWO = async (e) => {
    e.preventDefault()
    if (!description.trim()) return toast.error('La descripción de la orden es obligatoria')

    setIsSaving(true)
    try {
      const labor = parseFloat(laborBasePrice) || 0
      const parts = parseFloat(totalPartsCost) || 0
      const total = labor + parts

      const oldStatus = selectedWO.status
      let newStatus = selectedWO.status
      if (oldStatus === 'Pendiente' && assignedBoxId) {
        newStatus = 'En Box'
      } else if (oldStatus === 'En Box' && !assignedBoxId) {
        newStatus = 'Pendiente'
      }

      const updateData = {
        box_id: assignedBoxId || null,
        assigned_mechanic_id: assignedMechanicId || null,
        km_at_entry: parseInt(kmAtEntry) || 0,
        description: description.trim(),
        diagnostic: diagnostic.trim() || null,
        observations: observations.trim() || null,
        labor_base_price: labor,
        total_parts_cost: parts,
        total_price: total,
        status: newStatus
      }

      const { error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', selectedWO.id)
      if (error) throw error

      toast.success('Orden de Trabajo actualizada')
      setShowEditModal(false)
      loadData()
    } catch (err) {
      toast.error('Error al actualizar la orden: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Save Checklist
  const handleSaveChecklist = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const chkData = {
        luces_delanteras: chkDelanteras,
        luces_traseras: chkTraseras,
        luces_giro: chkGiro,
        nivel_aceite: chkAceite,
        nivel_refrigerante: chkRefrigerante,
        nivel_liquido_frenos: chkFrenos,
        presion_neumaticos: chkPresionNeum,
        estado_neumaticos: chkEstadoNeum,
        freno_mano: chkFrenoMano,
        limpiaparabrisas: chkLimpiaparabrisas,
        bateria: chkBateria,
        correas: chkCorreas,
        presion_del_izq: parseFloat(presDelIzq) || null,
        presion_del_der: parseFloat(presDelDer) || null,
        presion_tra_izq: parseFloat(presTraIzq) || null,
        presion_tra_der: parseFloat(presTraDer) || null,
        observations: checklistObs.trim() || null,
        checked_by: profile.id,
        checked_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('work_order_checklist')
        .update(chkData)
        .eq('work_order_id', selectedWO.id)
      if (error) throw error

      toast.success('Checklist guardado con éxito')
      setShowChecklistModal(false)
    } catch (err) {
      toast.error('Error al guardar el checklist: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Add Item to active Work Order
  const handleAddItem = async (product = null) => {
    try {
      let desc = customItemName.trim()
      let price = parseFloat(customItemPrice) || 0
      let isLabor = customItemIsLabor
      let prodId = null
      let unitLabel = 'unidad'

      if (product) {
        desc = product.name
        price = parseFloat(product.sale_price) || 0
        isLabor = false
        prodId = product.id
        unitLabel = product.unit || 'unidad'
      }

      if (!desc) return toast.error('Ingresá una descripción o producto')

      const { data: newItem, error } = await supabase
        .from('work_order_items')
        .insert({
          work_order_id: selectedWO.id,
          product_id: prodId,
          description: desc,
          quantity: 1,
          unit: unitLabel,
          unit_price: price,
          total_price: price,
          is_labor: isLabor
        })
        .select()
        .single()
      if (error) throw error

      // Refresh list and totals
      await loadWOItems(selectedWO.id)
      
      // Update totals on main work order record
      const updatedItems = [...currentWOItems, newItem]
      const laborTotal = updatedItems.filter(i => i.is_labor).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0)
      const partsTotal = updatedItems.filter(i => !i.is_labor).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0)

      await supabase
        .from('work_orders')
        .update({
          labor_base_price: laborTotal,
          total_parts_cost: partsTotal,
          total_price: laborTotal + partsTotal
        })
        .eq('id', selectedWO.id)

      toast.success('Item agregado')
      setCustomItemName('')
      setCustomItemPrice('')
      setCustomItemIsLabor(false)
      setItemSearch('')
      setShowItemDropdown(false)
      loadData()
    } catch (err) {
      toast.error('Error al agregar item: ' + err.message)
    }
  }

  // Remove Item from Work Order
  const handleRemoveItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('work_order_items')
        .delete()
        .eq('id', itemId)
      if (error) throw error

      const updatedItems = currentWOItems.filter(i => i.id !== itemId)
      setCurrentWOItems(updatedItems)

      const laborTotal = updatedItems.filter(i => i.is_labor).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0)
      const partsTotal = updatedItems.filter(i => !i.is_labor).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0)

      await supabase
        .from('work_orders')
        .update({
          labor_base_price: laborTotal,
          total_parts_cost: partsTotal,
          total_price: laborTotal + partsTotal
        })
        .eq('id', selectedWO.id)

      toast.success('Item eliminado')
      loadData()
    } catch (err) {
      toast.error('Error al eliminar item: ' + err.message)
    }
  }

  // Cancel Work Order
  const handleCancelWO = async (wo) => {
    if (!window.confirm(`¿Seguro que querés CANCELAR la orden de trabajo #${wo.order_number}?`)) return
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'Cancelado' })
        .eq('id', wo.id)
      if (error) throw error

      toast.success('Orden de Trabajo Cancelada')
      loadData()
    } catch (err) {
      toast.error('Error al cancelar la orden: ' + err.message)
    }
  }

  // Finalize work order and trigger sale check out
  const handleFinalizeWO = async (e) => {
    e.preventDefault()
    if (!activeShift) return toast.error('Debes abrir un turno de caja primero')

    // Validate combined amounts
    const l = parseFloat(finalLabor) || 0
    const p = parseFloat(finalParts) || 0
    const subtotal = l + p
    const discount = (subtotal * manualDiscount) / 100
    const totalToPay = Math.max(0, subtotal - discount)

    if (paymentMethod === 'combined') {
      const cashAmt = parseFloat(combinedCash) || 0
      const debitAmt = parseFloat(combinedDebit) || 0
      const creditAmt = parseFloat(combinedCredit) || 0
      const sumPaid = cashAmt + debitAmt + creditAmt
      if (Math.abs(sumPaid - totalToPay) > 0.01 && sumPaid < totalToPay) {
        toast.error(`Los montos ingresados (${formatCurrency(sumPaid)}) no cubren el total (${formatCurrency(totalToPay)})`)
        return
      }
    }

    setIsSaving(true)
    try {
      // 1. Update Work Order details and transition to Finalizado
      const { error: woError } = await supabase
        .from('work_orders')
        .update({
          status: 'Finalizado',
          labor_base_price: l,
          total_parts_cost: p,
          total_price: totalToPay,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedWO.id)
      if (woError) throw woError

      // 2. Fetch current items to deduct stock
      const { data: woItems, error: itemsError } = await supabase
        .from('work_order_items')
        .select('*')
        .eq('work_order_id', selectedWO.id)
      if (itemsError) throw itemsError

      // Deduct stock for items bound to inventory products
      for (const item of (woItems || [])) {
        if (item.product_id) {
          const prod = products.find(p => p.id === item.product_id)
          if (prod && prod.control_stock !== false) {
            const currentStock = parseFloat(prod.stock_quantity) || 0
            const newStock = currentStock - parseFloat(item.quantity)

            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id)

            // Stock movement log
            await supabase
              .from('stock_movements')
              .insert({
                tenant_id: tenant.id,
                product_id: item.product_id,
                type: 'sale',
                quantity_change: -parseFloat(item.quantity),
                stock_before: currentStock,
                stock_after: newStock,
                notes: `Venta OT #${selectedWO.order_number}`,
                user_id: profile.id
              })
          }
        }
      }

      // 3. Log employee earnings / commissions
      if (selectedMechanics.length > 0) {
        const shareLabor = l / selectedMechanics.length
        for (const opId of selectedMechanics) {
          const opProfile = operators.find(o => o.id === opId)
          const rate = opProfile ? parseFloat(opProfile.commission_rate || 0) : 0
          const earned = shareLabor * (rate / 100)

          if (earned > 0) {
            await supabase
              .from('employee_earnings')
              .insert({
                tenant_id: tenant.id,
                employee_id: opId,
                work_order_id: selectedWO.id,
                amount_earned: earned,
                description: `Comisión OT #${selectedWO.order_number}`
              })
          }
        }
      }

      // 4. Generate ticket number
      const { data: ticketNum } = await supabase.rpc('generate_ticket_number', { p_tenant_id: tenant.id })
      const finalTicketNumber = ticketNum || `OT-${selectedWO.order_number}`

      // 5. Construct sale details jsonb
      const details = {
        work_order_id: selectedWO.id,
        operator_ids: selectedMechanics,
        discount_percentage: manualDiscount
      }
      if (paymentMethod === 'combined') {
        details.combined = {
          cash: parseFloat(combinedCash) || 0,
          debit: parseFloat(combinedDebit) || 0,
          credit: parseFloat(combinedCredit) || 0
        }
      }

      // 6. Create sale log
      const { data: newSale, error: saleError } = await supabase
        .from('sales')
        .insert({
          tenant_id: tenant.id,
          user_id: profile.id,
          shift_id: activeShift.id,
          branch_id: activeShift.branch_id || null,
          ticket_number: finalTicketNumber,
          subtotal: subtotal,
          discount_type: manualDiscount > 0 ? 'percentage' : null,
          discount_value: manualDiscount || 0,
          discount_amount: discount,
          total: totalToPay,
          payment_method: paymentMethod === 'transfer' ? 'debit' : paymentMethod,
          payment_details: details,
          source: 'work_order',
          work_order_id: selectedWO.id,
          customer_id: selectedWO.client_id
        })
        .select()
        .single()
      if (saleError) throw saleError

      // 7. Create sale items matching work order items
      const saleItemsToInsert = (woItems || []).map(i => ({
        tenant_id: tenant.id,
        sale_id: newSale.id,
        product_id: i.product_id || null,
        product_name: i.description,
        quantity: parseFloat(i.quantity) || 1,
        unit_price: parseFloat(i.unit_price) || 0,
        cost_price: 0, // Costs aren't specifically tracked on checklist items
        subtotal: parseFloat(i.total_price) || 0,
        discount_amount: 0
      }))

      // Also add labor item if it was adjusted manual price and not already in items
      if (woItems.length === 0 && l > 0) {
        saleItemsToInsert.push({
          tenant_id: tenant.id,
          sale_id: newSale.id,
          product_id: null,
          product_name: 'Mano de Obra / Servicios',
          quantity: 1,
          unit_price: l,
          cost_price: 0,
          subtotal: l,
          discount_amount: 0
        })
      }

      if (saleItemsToInsert.length > 0) {
        const { error: saleItemsError } = await supabase
          .from('sale_items')
          .insert(saleItemsToInsert)
        if (saleItemsError) throw saleItemsError
      }

      // 8. Update customer balance if payment is account-current/installment
      if (paymentMethod === 'installment') {
        const cust = customers.find(c => c.id === selectedWO.client_id)
        if (cust) {
          const newBal = (parseFloat(cust.balance) || 0) + totalToPay
          await supabase
            .from('customers')
            .update({ balance: newBal })
            .eq('id', cust.id)
        }
      }

      // 9. Update vehicle health scores & logs
      const { data: currentHealth } = await supabase
        .from('vehicle_health')
        .select('*')
        .eq('vehicle_id', selectedWO.vehicle_id)
        .maybeSingle()

      if (currentHealth) {
        // Boost health on check out or update details
        const updateHealthData = { health_score: Math.min(100, (currentHealth.health_score || 80) + 15) }
        const hasOil = woItems.some(i => i.description.toLowerCase().includes('aceite'))
        const hasTire = woItems.some(i => i.description.toLowerCase().includes('rueda') || i.description.toLowerCase().includes('neumatic'))
        const hasFilter = woItems.some(i => i.description.toLowerCase().includes('filtr'))

        if (hasOil) {
          updateHealthData.last_oil_change = new Date().toISOString()
          updateHealthData.last_oil_change_km = selectedWO.km_at_entry || 0
        }
        if (hasTire) updateHealthData.last_tire_change = new Date().toISOString()
        if (hasFilter) updateHealthData.last_filter_change = new Date().toISOString()

        await supabase
          .from('vehicle_health')
          .update(updateHealthData)
          .eq('vehicle_id', selectedWO.vehicle_id)
      }

      toast.success('Orden de Trabajo finalizada y cobrada!')
      setShowFinalizeModal(false)

      // Open print ticket options
      setReceiptData({
        ticket_number: finalTicketNumber,
        subtotal: subtotal,
        discount: discount,
        total: totalToPay,
        payment_method: paymentMethod,
        operator: selectedMechanics.map(id => operators.find(o => o.id === id)?.full_name).filter(Boolean).join(', ') || 'Sin Asignar',
        customer: selectedWO.customers?.name || 'Cliente',
        vehicle: selectedWO.vehicles?.license_plate || 'N/A',
        items: woItems || []
      })
      setShowReceiptModal(true)

      loadData()
    } catch (err) {
      toast.error('Error al finalizar la orden: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Thermal printing helper
  const printReceipt = () => {
    if (!receiptData) return
    const printWindow = window.open('', '_blank', 'width=320,height=600')
    const now = new Date()
    printWindow.document.write(`
      <html><head><title>Ticket #${receiptData.ticket_number}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; margin: 0; font-size: 12px; color: #000; }
        .line { border-top: 1px dashed #000; margin: 10px 0; }
        h2 { margin: 5px 0; font-size: 16px; text-transform: uppercase; }
        .price { font-size: 20px; font-weight: bold; margin: 8px 0; }
        .flex { display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { border-bottom: 1px solid #000; padding: 4px 0; }
        td { padding: 4px 0; }
      </style></head>
      <body>
        <h2>${tenant?.name || 'SMART CAJA'}</h2>
        <p>${tenant?.address || ''}<br/>Tel: ${tenant?.phone || ''}</p>
        <div class="line"></div>
        <p><strong>TICKET DE TRABAJO</strong></p>
        <div class="line"></div>
        <div class="flex"><span>Nro Ticket:</span><span>#${receiptData.ticket_number}</span></div>
        <div class="flex"><span>Fecha:</span><span>${formatDateTime(now).split(' ')[0]}</span></div>
        <div class="flex"><span>Cliente:</span><span>${receiptData.customer}</span></div>
        <div class="flex"><span>Vehículo:</span><span>${receiptData.vehicle}</span></div>
        <div class="line"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Detalle</th>
              <th style="text-align:center;">Cant</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${receiptData.items.map(i => `
              <tr>
                <td style="text-align:left;">${i.description}</td>
                <td style="text-align:center;">${parseFloat(i.quantity)}</td>
                <td style="text-align:right;">${formatCurrency(parseFloat(i.total_price))}</td>
              </tr>
            `).join('')}
            ${receiptData.items.length === 0 ? `
              <tr>
                <td style="text-align:left;">Mano de Obra & Servicios</td>
                <td style="text-align:center;">1</td>
                <td style="text-align:right;">${formatCurrency(receiptData.subtotal)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        <div class="line"></div>
        ${receiptData.discount > 0 ? `<div class="flex"><span>Subtotal:</span><span>${formatCurrency(receiptData.subtotal)}</span></div>` : ''}
        ${receiptData.discount > 0 ? `<div class="flex"><span>Descuento:</span><span>-${formatCurrency(receiptData.discount)}</span></div>` : ''}
        <div class="flex" style="font-weight:bold;font-size:14px;margin-top:4px;">
          <span>TOTAL:</span>
          <span>${formatCurrency(receiptData.total)}</span>
        </div>
        <div class="line"></div>
        <div class="flex"><span>Pago:</span><span>${receiptData.payment_method.toUpperCase()}</span></div>
        <div class="flex"><span>Operario:</span><span>${receiptData.operator}</span></div>
        <div class="line"></div>
        <p style="font-size:10px;">¡Gracias por su confianza!</p>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300)
  }

  // Format phone for WhatsApp
  const getWhatsAppUrl = (phone, text = '') => {
    if (!phone) return '#'
    const clean = phone.toString().replace(/\D/g, '')
    const finalNumber = clean.length === 10 ? '549' + clean : clean
    return `https://wa.me/${finalNumber}?text=${encodeURIComponent(text)}`
  }

  if (isGated) {
    return (
      <UpgradePrompt 
        title="Órdenes de Trabajo y Recepción de Vehículos"
        description="Agilizá la entrada de vehículos a boxes, controlá las piezas del taller con checklists interactivos y automatizá el pago asignando comisiones por mano de obra."
        requiredPlan="professional"
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={24} style={{ color: 'var(--color-primary)' }} />
            Ordenes de Trabajo (OT)
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Recepción e ingreso de vehículos, seguimiento del estado de boxes, asignación de mecánicos y pasarela de facturación rápida.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              // Pre-fill reset
              setSelectedCustomerId('')
              setSelectedVehicleId('')
              setAssignedBoxId('')
              setAssignedMechanicId('')
              setKmAtEntry('')
              setDescription('')
              setDiagnostic('')
              setObservations('')
              setLaborBasePrice('0')
              setTotalPartsCost('0')
              setClientSearch('')
              setIsHistorical(false)
              setShowNewModal(true)
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Nueva Orden
          </button>
        </div>
      </div>

      {/* Caja Abierta Check Warning */}
      {!activeShift && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600 }}>
          <ShieldAlert size={20} />
          Atención: No hay un turno de caja abierto para tu usuario. Podrás crear órdenes y realizar checklists, pero para cobrarlas/finalizarlas necesitarás que se abra un turno en la sección Caja.
        </div>
      )}

      {/* Filters and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setTab('active')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, color: tab === 'active' ? '#fff' : 'var(--text-muted)', background: tab === 'active' ? 'var(--color-primary-light)' : 'transparent' }}
          >
            Activas
          </button>
          <button 
            onClick={() => setTab('completed')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, color: tab === 'completed' ? '#fff' : 'var(--text-muted)', background: tab === 'completed' ? 'var(--color-primary-light)' : 'transparent' }}
          >
            Finalizadas
          </button>
          <button 
            onClick={() => setTab('cancelled')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, color: tab === 'cancelled' ? '#fff' : 'var(--text-muted)', background: tab === 'cancelled' ? 'var(--color-primary-light)' : 'transparent' }}
          >
            Canceladas
          </button>
          <button 
            onClick={() => setTab('all')}
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, color: tab === 'all' ? '#fff' : 'var(--text-muted)', background: tab === 'all' ? 'var(--color-primary-light)' : 'transparent' }}
          >
            Todas
          </button>
        </div>

        {/* Search */}
        <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
          <input
            className="form-input"
            placeholder="🔎 Buscar por Nro Orden, Cliente, Patente, Marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', paddingLeft: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Orders Grid/List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlignment: 'center', color: 'var(--text-muted)' }}>Cargando órdenes de trabajo...</div>
        ) : filteredWorkOrders.length > 0 ? (
          filteredWorkOrders.map((wo) => {
            const isCompleted = wo.status === 'Finalizado'
            const isCancelled = wo.status === 'Cancelado'
            const isEnBox = wo.status === 'En Box'
            
            const clientPhone = wo.customers?.phone
            const clientName = wo.customers?.name || 'Cliente'
            const licensePlate = wo.vehicles?.license_plate || 'N/A'
            const mechanicName = operators.find(op => op.id === wo.assigned_mechanic_id)?.full_name || 'Sin asignar'
            const boxName = boxes.find(b => b.id === wo.box_id)?.name || 'Sin Box'

            let statusColor = 'var(--color-tertiary)'
            if (isCompleted) statusColor = 'var(--color-secondary)'
            if (isCancelled) statusColor = 'var(--color-error)'
            if (isEnBox) statusColor = 'var(--color-primary)'

            return (
              <div 
                key={wo.id} 
                className="card"
                style={{ 
                  padding: 'var(--space-5)', 
                  display: 'grid', 
                  gridTemplateColumns: '80px 1fr 200px 220px', 
                  gap: '16px',
                  alignItems: 'center',
                  borderLeft: `4px solid ${statusColor}`
                }}
              >
                {/* 1. Order Number & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orden</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>#{wo.order_number}</span>
                  <span style={{ 
                    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: statusColor, 
                    border: `1px solid ${statusColor}`, padding: '2px 6px', borderRadius: '4px', background: `${statusColor}08`, marginTop: '4px' 
                  }}>
                    {wo.status}
                  </span>
                </div>

                {/* 2. Customer & Vehicle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#fff' }}>{clientName}</span>
                    {clientPhone && (
                      <a 
                        href={getWhatsAppUrl(clientPhone, `Hola ${clientName}, te escribimos de Smart Caja sobre la Orden de Trabajo #${wo.order_number} de tu vehículo.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center' }}
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare size={14} />
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                    <span style={{ 
                      background: '#1e293b', border: '1px solid #475569', color: '#f8fafc',
                      padding: '1px 6px', borderRadius: '3px', fontFamily: 'monospace', fontWeight: 700 
                    }}>{licensePlate}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{wo.vehicles?.brand} {wo.vehicles?.model}</span>
                    <span style={{ color: 'var(--text-muted)' }}>({(wo.km_at_entry || 0).toLocaleString()} km)</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    <strong>Problema:</strong> "{wo.description}"
                  </div>
                </div>

                {/* 3. Box & Mechanic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Gauge size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>Box: <strong>{boxName}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <User size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>Mecánico: <strong>{mechanicName}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Clock size={14} />
                    <span>Ingreso: {formatDateTime(wo.created_at)}</span>
                  </div>
                </div>

                {/* 4. Total and Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presupuesto Estimado</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {formatCurrency(wo.total_price)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* Checklist button */}
                    {!isCancelled && (
                      <button 
                        onClick={() => {
                          setSelectedWO(wo)
                          loadChecklist(wo.id)
                          setShowChecklistModal(true)
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', minWidth: '32px' }}
                        title="Ver/Editar Checklist"
                      >
                        <ClipboardList size={16} />
                      </button>
                    )}

                    {/* Manage Items button */}
                    {!isCompleted && !isCancelled && (
                      <button 
                        onClick={() => {
                          setSelectedWO(wo)
                          loadWOItems(wo.id)
                          setShowItemsModal(true)
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', minWidth: '32px', color: 'var(--color-primary)' }}
                        title="Cargar repuestos y mano de obra"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    )}

                    {/* Print ticket button */}
                    <button 
                      onClick={async () => {
                        try {
                          const { data: items } = await supabase
                            .from('work_order_items')
                            .select('*')
                            .eq('work_order_id', wo.id)
                          
                          setReceiptData({
                            ticket_number: `OT-${wo.order_number}`,
                            subtotal: wo.labor_base_price + wo.total_parts_cost,
                            discount: 0,
                            total: wo.total_price,
                            payment_method: 'N/A',
                            operator: mechanicName,
                            customer: clientName,
                            vehicle: licensePlate,
                            items: items || []
                          })
                          setShowReceiptModal(true)
                        } catch (err) {
                          toast.error('Error al preparar impresión: ' + err.message)
                        }
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', minWidth: '32px' }}
                      title="Imprimir Ficha/Ticket"
                    >
                      <Printer size={16} />
                    </button>

                    {/* Edit fields button */}
                    {!isCompleted && !isCancelled && (
                      <button 
                        onClick={() => {
                          setSelectedWO(wo)
                          setAssignedBoxId(wo.box_id || '')
                          setAssignedMechanicId(wo.assigned_mechanic_id || '')
                          setKmAtEntry(wo.km_at_entry || '')
                          setDescription(wo.description)
                          setDiagnostic(wo.diagnostic || '')
                          setObservations(wo.observations || '')
                          setLaborBasePrice(wo.labor_base_price?.toString() || '0')
                          setTotalPartsCost(wo.total_parts_cost?.toString() || '0')
                          setShowEditModal(true)
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', minWidth: '32px' }}
                        title="Editar detalles de la orden"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}

                    {/* Finalize button */}
                    {!isCompleted && !isCancelled && (
                      <button 
                        onClick={() => {
                          setSelectedWO(wo)
                          setFinalLabor(wo.labor_base_price?.toString() || '0')
                          setFinalParts(wo.total_parts_cost?.toString() || '0')
                          setSelectedMechanics(wo.assigned_mechanic_id ? [wo.assigned_mechanic_id] : [])
                          setPaymentMethod('cash')
                          setManualDiscount(0)
                          setCombinedCash('')
                          setCombinedDebit('')
                          setCombinedCredit('')
                          setShowFinalizeModal(true)
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '6px 12px', fontWeight: 700 }}
                      >
                        Finalizar
                      </button>
                    )}

                    {/* Cancel button */}
                    {!isCompleted && !isCancelled && (
                      <button 
                        onClick={() => handleCancelWO(wo)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', minWidth: '32px', color: 'var(--color-error)' }}
                        title="Cancelar Orden"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )
          })
        ) : (
          <div className="card" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardList size={48} style={{ opacity: 0.15, margin: '0 auto 16px auto' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>No se encontraron órdenes de trabajo</div>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Elegí otro filtro o registrá una nueva orden de trabajo.</p>
          </div>
        )}
      </div>

      {/* MODAL: Nueva Orden de Trabajo */}
      {showNewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setShowNewModal(false)}>
          <form 
            onSubmit={handleCreateWO}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '650px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                🛠️ Registrar Nueva Orden de Trabajo
              </h3>
              <button type="button" onClick={() => setShowNewModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Client Lookup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Buscar Cliente o Patente *</label>
              {selectedCustomerId ? (
                <div style={{ 
                  background: 'var(--bg-base)', border: '1px solid var(--border-color)', 
                  padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyBetween: 'space-between', alignItems: 'center' 
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{customers.find(c => c.id === selectedCustomerId)?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {customers.find(c => c.id === selectedCustomerId)?.dni || 'N/A'}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedCustomerId('')
                      setSelectedVehicleId('')
                      setClientSearch('')
                    }}
                    style={{ fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 600 }}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <>
                  <input
                    className="form-input"
                    placeholder="Escribí Nombre, DNI o Patente..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    style={{ background: 'var(--bg-surface)' }}
                  />
                  {clientSearch && filteredClients.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', marginTop: '4px', zIndex: 100, overflow: 'hidden',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                      {filteredClients.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id)
                            setClientSearch('')
                          }}
                          style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyBetween: 'space-between', fontSize: '0.8125rem' }}
                          className="autocomplete-option"
                        >
                          <span style={{ color: '#fff', fontWeight: 600 }}>{c.name} (DNI: {c.dni || 'S/D'})</span>
                          <span style={{ color: 'var(--color-primary)' }}>
                            {vehicles.filter(v => v.client_id === c.id).map(v => v.license_plate).join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {clientSearch && filteredClients.length === 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', marginTop: '4px', zIndex: 100, padding: '12px',
                      textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)'
                    }}>
                      Sin coincidencias. ¿Registraste al cliente en la sección Vehículos?
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Vehicle Select */}
            {selectedCustomerId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vehículo del Cliente *</label>
                <select 
                  className="form-select"
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="">Seleccioná un vehículo...</option>
                  {customerVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Box & Operator splits */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Asignar Box</label>
                <select 
                  className="form-select"
                  value={assignedBoxId}
                  onChange={(e) => setAssignedBoxId(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="">Ninguno / En Espera</option>
                  {boxes.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.status})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Km Actuales del Vehículo</label>
                <input 
                  className="form-input" 
                  type="number"
                  placeholder="Ej. 125000"
                  value={kmAtEntry}
                  onChange={(e) => setKmAtEntry(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mecánico / Operario Asignado</label>
              <select 
                className="form-select"
                value={assignedMechanicId}
                onChange={(e) => setAssignedMechanicId(e.target.value)}
                style={{ background: 'var(--bg-surface)' }}
              >
                <option value="">Sin Asignar</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.full_name} ({op.role === 'mechanic' ? 'Mecánico' : op.role})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción del Problema / Falla *</label>
              <textarea 
                className="form-textarea" 
                required
                placeholder="Ej. Ruido en tren delantero, Service de 10.000km..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ background: 'var(--bg-surface)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Diagnóstico / Inspección Inicial</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Comentarios iniciales del técnico..."
                  rows={2}
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Observaciones / Notas Extra</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Detalles estéticos o advertencias..."
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                />
              </div>
            </div>

            {/* Presupuesto Inicial */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Presupuesto Inicial Estimado
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mano de Obra ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={laborBasePrice}
                    onChange={(e) => setLaborBasePrice(e.target.value)}
                    style={{ background: 'var(--bg-surface)', fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repuestos / Insumos ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={totalPartsCost}
                    onChange={(e) => setTotalPartsCost(e.target.value)}
                    style={{ background: 'var(--bg-surface)', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            {/* Historical Order */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#fff', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={isHistorical} 
                  onChange={() => setIsHistorical(!isHistorical)}
                />
                ¿Registrar como Orden Histórica?
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Marcar esto guardará la orden directamente como FINALIZADA. Utilizado para migrar órdenes antiguas sin pasar por la facturación activa de caja.
              </p>
              {isHistorical && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fecha de Realización</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={customDate} 
                    onChange={e => setCustomDate(e.target.value)}
                    style={{ background: 'var(--bg-surface)' }} 
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyBetween: 'space-between', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowNewModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving}
                style={{ flex: 2, display: 'flex', justify: 'center', alignItems: 'center' }}
              >
                {isSaving ? 'Registrando...' : 'Registrar Ingreso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Editar Orden */}
      {showEditModal && selectedWO && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setShowEditModal(false)}>
          <form 
            onSubmit={handleEditWO}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '650px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                ✏️ Editar Orden de Trabajo #{selectedWO.order_number}
              </h3>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              background: 'var(--bg-base)', border: '1px solid var(--border-color)', 
              padding: '12px', borderRadius: '8px', fontSize: '0.875rem' 
            }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>Propietario: {selectedWO.customers?.name}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Vehículo: {selectedWO.vehicles?.license_plate} · {selectedWO.vehicles?.brand} {selectedWO.vehicles?.model}</div>
            </div>

            {/* Box & Mechanic */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Box Asignado</label>
                <select 
                  className="form-select"
                  value={assignedBoxId}
                  onChange={(e) => setAssignedBoxId(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="">Ninguno / En Espera</option>
                  {boxes.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.status})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kilometraje</label>
                <input 
                  className="form-input" 
                  type="number"
                  value={kmAtEntry}
                  onChange={(e) => setKmAtEntry(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mecánico / Operario Asignado</label>
              <select 
                className="form-select"
                value={assignedMechanicId}
                onChange={(e) => setAssignedMechanicId(e.target.value)}
                style={{ background: 'var(--bg-surface)' }}
              >
                <option value="">Sin Asignar</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.full_name} ({op.role})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción del Trabajo *</label>
              <textarea 
                className="form-textarea" 
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ background: 'var(--bg-surface)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Diagnóstico Técnico</label>
                <textarea 
                  className="form-textarea" 
                  rows={2}
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Observaciones</label>
                <textarea 
                  className="form-textarea" 
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                />
              </div>
            </div>

            {/* Presupuesto Estimado */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Modificar Presupuesto Estimado
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mano de Obra ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={laborBasePrice}
                    onChange={(e) => setLaborBasePrice(e.target.value)}
                    style={{ background: 'var(--bg-surface)', fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repuestos ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={totalPartsCost}
                    onChange={(e) => setTotalPartsCost(e.target.value)}
                    style={{ background: 'var(--bg-surface)', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyBetween: 'space-between', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving}
                style={{ flex: 2, display: 'flex', justify: 'center', alignItems: 'center' }}
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Checklist de Inspección */}
      {showChecklistModal && selectedWO && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setShowChecklistModal(false)}>
          <form 
            onSubmit={handleSaveChecklist}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '650px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              maxHeight: '95vh', overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardList size={22} style={{ color: 'var(--color-primary)' }} />
                Checklist de Entrada — OT #{selectedWO.order_number}
              </h3>
              <button type="button" onClick={() => setShowChecklistModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '8px 0' }}>
              
              {/* Left Column Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  Sistemas Eléctricos & Luces
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkDelanteras} onChange={() => setChkDelanteras(!chkDelanteras)} />
                  Luces Delanteras Altas/Bajas
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkTraseras} onChange={() => setChkTraseras(!chkTraseras)} />
                  Luces Traseras / Stop
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkGiro} onChange={() => setChkGiro(!chkGiro)} />
                  Luces de Giro / Balizas
                </label>
                
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginTop: '8px' }}>
                  Nivel de Fluidos
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkAceite} onChange={() => setChkAceite(!chkAceite)} />
                  Nivel de Aceite Motor
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkRefrigerante} onChange={() => setChkRefrigerante(!chkRefrigerante)} />
                  Nivel de Refrigerante
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkFrenos} onChange={() => setChkFrenos(!chkFrenos)} />
                  Nivel Líquido de Frenos
                </label>
              </div>

              {/* Right Column Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  Seguridad & Mecánica General
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkFrenoMano} onChange={() => setChkFrenoMano(!chkFrenoMano)} />
                  Freno de Mano Operativo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkLimpiaparabrisas} onChange={() => setChkLimpiaparabrisas(!chkLimpiaparabrisas)} />
                  Limpiaparabrisas y Escobillas
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkBateria} onChange={() => setChkBateria(!chkBateria)} />
                  Batería y Bornes Limpios
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkCorreas} onChange={() => setChkCorreas(!chkCorreas)} />
                  Correas Auxiliares / Distribución
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkPresionNeum} onChange={() => setChkPresionNeum(!chkPresionNeum)} />
                  Presión Neumáticos Revisada
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={chkEstadoNeum} onChange={() => setChkEstadoNeum(!chkEstadoNeum)} />
                  Estado de Desgaste (Dibujo)
                </label>
              </div>
            </div>

            {/* Neumaticos Presiones */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Presión de Neumáticos (PSI)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Del. Izq.</label>
                  <input type="number" step="0.1" placeholder="32" className="form-input" value={presDelIzq} onChange={e => setPresDelIzq(e.target.value)} style={{ textAlign: 'center', background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Del. Der.</label>
                  <input type="number" step="0.1" placeholder="32" className="form-input" value={presDelDer} onChange={e => setPresDelDer(e.target.value)} style={{ textAlign: 'center', background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Tra. Izq.</label>
                  <input type="number" step="0.1" placeholder="30" className="form-input" value={presTraIzq} onChange={e => setPresTraIzq(e.target.value)} style={{ textAlign: 'center', background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Tra. Der.</label>
                  <input type="number" step="0.1" placeholder="30" className="form-input" value={presTraDer} onChange={e => setPresTraDer(e.target.value)} style={{ textAlign: 'center', background: 'var(--bg-surface)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Observaciones Generales de la Inspección</label>
              <textarea 
                className="form-textarea" 
                placeholder="Ralladuras, golpes preexistentes, repuesto que falta..."
                rows={2}
                value={checklistObs}
                onChange={(e) => setChecklistObs(e.target.value)}
                style={{ background: 'var(--bg-surface)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyBetween: 'space-between', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowChecklistModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving}
                style={{ flex: 2 }}
              >
                {isSaving ? 'Guardando...' : 'Guardar Checklist'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Cargar Items / Repuestos */}
      {showItemsModal && selectedWO && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setShowItemsModal(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '650px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                📦 Cargar Insumos y Repuestos — OT #{selectedWO.order_number}
              </h3>
              <button type="button" onClick={() => setShowItemsModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Inventory Autocomplete Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Buscar Repuestos en Inventario</label>
              <input
                className="form-input"
                placeholder="🔎 Escribí nombre o código de barra..."
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value)
                  setShowItemDropdown(true)
                }}
                onFocus={() => setShowItemDropdown(true)}
                style={{ background: 'var(--bg-surface)' }}
              />
              {showItemDropdown && itemSearch && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', marginTop: '4px', zIndex: 100, overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleAddItem(p)}
                      style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyBetween: 'space-between', fontSize: '0.8125rem' }}
                      className="autocomplete-option"
                    >
                      <span style={{ color: '#fff', fontWeight: 600 }}>{p.name} ({p.brand || 'Sin marca'})</span>
                      <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(p.sale_price)} · Stock: {p.stock_quantity}</span>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>Sin coincidencias</div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Free Service Input */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                O Cargar Servicio Libre / Mano de Obra
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Descripción del trabajo</label>
                  <input type="text" className="form-input" placeholder="Ej. Cambio bujías cilindro 2" value={customItemName} onChange={e => setCustomItemName(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precio ($)</label>
                  <input type="number" className="form-input" placeholder="2500" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleAddItem(null)} 
                  className="btn btn-primary"
                  style={{ height: '40px' }}
                >
                  Agregar
                </button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '2px' }}>
                <input type="checkbox" checked={customItemIsLabor} onChange={() => setCustomItemIsLabor(!customItemIsLabor)} />
                Es Mano de Obra / Honorario Técnico (genera comisión)
              </label>
            </div>

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Desglose Actual de la Orden
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {currentWOItems.length > 0 ? (
                  currentWOItems.map(item => (
                    <div 
                      key={item.id} 
                      style={{ 
                        background: 'var(--bg-base)', border: '1px solid var(--border-color)', 
                        borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyBetween: 'space-between', alignItems: 'center' 
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{item.description}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.is_labor ? '⚙️ Mano de Obra' : '📦 Repuesto'} · {formatCurrency(item.unit_price)} x {parseFloat(item.quantity)} {item.unit}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {formatCurrency(item.total_price)}
                        </span>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          style={{ color: 'var(--color-error)' }}
                          title="Eliminar item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    No hay productos o servicios cargados.
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justify: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowItemsModal(false)}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                Cerrar y Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Finalizar y Cobrar Orden */}
      {showFinalizeModal && selectedWO && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setShowFinalizeModal(false)}>
          <form 
            onSubmit={handleFinalizeWO}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '550px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                🏁 Cerrar y Cobrar Orden de Trabajo #{selectedWO.order_number}
              </h3>
              <button type="button" onClick={() => setShowFinalizeModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              background: 'var(--bg-base)', border: '1px solid var(--border-color)', 
              padding: '12px', borderRadius: '8px', fontSize: '0.875rem' 
            }}>
              <div><strong>Propietario:</strong> {selectedWO.customers?.name}</div>
              <div><strong>Patente:</strong> {selectedWO.vehicles?.license_plate} · {selectedWO.vehicles?.brand} {selectedWO.vehicles?.model}</div>
            </div>

            {/* Cost Recap & Adjustments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ajustar Mano de Obra ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={finalLabor}
                  onChange={(e) => setFinalLabor(e.target.value)}
                  style={{ background: 'var(--bg-surface)', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ajustar Repuestos ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={finalParts}
                  onChange={(e) => setFinalParts(e.target.value)}
                  style={{ background: 'var(--bg-surface)', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Operator Commission Split Checkbox selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mecánicos a Comisión (Divide Mano de Obra)</label>
              <div style={{ 
                display: 'flex', gap: '8px', flexWrap: 'wrap', 
                padding: '10px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px' 
              }}>
                {operators.map(op => {
                  const isChecked = selectedMechanics.includes(op.id)
                  return (
                    <label 
                      key={op.id}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem',
                        cursor: 'pointer', background: isChecked ? 'var(--color-primary-light)' : 'transparent',
                        padding: '4px 10px', borderRadius: '6px', border: `1px solid ${isChecked ? 'var(--color-primary-border)' : 'var(--border-color)'}`
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedMechanics(prev => prev.filter(id => id !== op.id))
                          } else {
                            setSelectedMechanics(prev => [...prev, op.id])
                          }
                        }}
                      />
                      {op.full_name} ({op.commission_rate}%)
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Método de Pago *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8125rem' }}
                >
                  <Banknote size={16} /> Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit')}
                  className={`btn ${paymentMethod === 'debit' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8125rem' }}
                >
                  <CreditCard size={16} /> Débito
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`btn ${paymentMethod === 'credit' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8125rem' }}
                >
                  <Landmark size={16} /> Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`btn ${paymentMethod === 'transfer' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8125rem', marginTop: '6px' }}
                >
                  <Landmark size={16} /> Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('combined')}
                  className={`btn ${paymentMethod === 'combined' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8125rem', marginTop: '6px' }}
                >
                  <Plus size={16} /> Combinado
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('installment')}
                  className={`btn ${paymentMethod === 'installment' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8125rem', marginTop: '6px' }}
                >
                  <User size={16} /> Cta Corriente
                </button>
              </div>
            </div>

            {/* Combined Amounts */}
            {paymentMethod === 'combined' && (
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Especificar Montos Combinados
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Efectivo ($)</label>
                    <input type="number" className="form-input" value={combinedCash} onChange={e => setCombinedCash(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarjeta Débito ($)</label>
                    <input type="number" className="form-input" value={combinedDebit} onChange={e => setCombinedDebit(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarjeta Crédito ($)</label>
                    <input type="number" className="form-input" value={combinedCredit} onChange={e => setCombinedCredit(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Totales */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal Realizado:</span>
                <span>{formatCurrency((parseFloat(finalLabor) || 0) + (parseFloat(finalParts) || 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Descuento (%):</span>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="100"
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  style={{ width: '60px', padding: '4px', textAlign: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8125rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyBetween: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                <span>TOTAL A COBRAR:</span>
                <span style={{ color: 'var(--color-secondary)' }}>
                  {formatCurrency(Math.max(0, ((parseFloat(finalLabor) || 0) + (parseFloat(finalParts) || 0)) * (1 - manualDiscount / 100)))}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyBetween: 'space-between', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowFinalizeModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving || !activeShift}
                style={{ flex: 2, display: 'flex', justify: 'center', alignItems: 'center' }}
              >
                {isSaving ? 'Procesando...' : 'Confirmar Cobro y Cerrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Printable Receipt View */}
      {showReceiptModal && receiptData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setShowReceiptModal(false)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', color: '#000', borderRadius: '8px',
              maxWidth: '340px', width: '100%', padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '12px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              fontFamily: 'monospace', fontSize: '12px'
            }}
          >
            {/* Header info */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#000', textTransform: 'uppercase' }}>
                {tenant?.name || 'SMART CAJA'}
              </h3>
              <p style={{ margin: 0, color: '#555' }}>
                {tenant?.address || ''}<br/>Tel: {tenant?.phone || ''}
              </p>
              <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>TICKET DE TRABAJO</p>
              <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
            </div>

            {/* Metadata */}
            <div>
              <div><strong>Ticket:</strong> #{receiptData.ticket_number}</div>
              <div><strong>Cliente:</strong> {receiptData.customer}</div>
              <div><strong>Vehículo:</strong> {receiptData.vehicle}</div>
              <div><strong>Operario:</strong> {receiptData.operator}</div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ textAlignment: 'left', padding: '4px 0' }}>Detalle</th>
                  <th style={{ textAlignment: 'center', padding: '4px 0' }}>Cant</th>
                  <th style={{ textAlignment: 'right', padding: '4px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items?.map(i => (
                  <tr key={i.id}>
                    <td style={{ padding: '4px 0' }}>{i.description}</td>
                    <td style={{ textAlign: 'center', padding: '4px 0' }}>{parseFloat(i.quantity)}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCurrency(parseFloat(i.total_price))}</td>
                  </tr>
                ))}
                {(!receiptData.items || receiptData.items.length === 0) && (
                  <tr>
                    <td style={{ padding: '4px 0' }}>Mano de Obra & Servicios</td>
                    <td style={{ textAlign: 'center', padding: '4px 0' }}>1</td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCurrency(receiptData.subtotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {receiptData.discount > 0 && (
                <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
              )}
              {receiptData.discount > 0 && (
                <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
                  <span>Descuento:</span>
                  <span>-{formatCurrency(receiptData.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyBetween: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(receiptData.total)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            <div style={{ textAlign: 'center', color: '#555', fontSize: '10px' }}>
              ¡Gracias por su visita!<br/>
              Smart Caja - Sistema Pos
            </div>

            {/* Action buttons inside print dialog */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => setShowReceiptModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1, borderColor: '#000', color: '#000', padding: '8px' }}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                onClick={printReceipt}
                className="btn btn-primary"
                style={{ flex: 1, background: '#000', color: '#fff', padding: '8px' }}
              >
                Imprimir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
