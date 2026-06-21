'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { 
  Search, Plus, Phone, Mail, FileText, Calendar, Wrench, 
  Trash2, Edit2, ArrowRight, Clock, ShieldAlert, Heart,
  Car, Eye, MessageSquare, AlertCircle, Sparkles, UserPlus
} from 'lucide-react'
import Link from 'next/link'

export default function VehiclesPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const toast = useToast()

  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [history, setHistory] = useState([]) // Unified history for selected vehicle
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form states - Customer
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custDni, setCustDni] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [custNotes, setCustNotes] = useState('')

  // Form states - Vehicle
  const [vehPlate, setVehPlate] = useState('')
  const [vehBrand, setVehBrand] = useState('')
  const [vehModel, setVehModel] = useState('')
  const [vehYear, setVehYear] = useState('')
  const [vehColor, setVehColor] = useState('')
  const [vehKm, setVehKm] = useState('')
  const [vehDifficulty, setVehDifficulty] = useState('1.00')
  const [vehEngine, setVehEngine] = useState('')
  const [vehFuel, setVehFuel] = useState('')
  const [vehNotes, setVehNotes] = useState('')

  // Form states - Note
  const [noteDesc, setNoteDesc] = useState('')
  const [noteKm, setNoteKm] = useState('')
  const [noteCost, setNoteCost] = useState('')
  const [noteTech, setNoteTech] = useState('')

  const isGated = tenant?.subscription_plan === 'basic'

  const loadData = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      // 1. Fetch active customers
      const { data: custs, error: custsError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
      if (custsError) throw custsError
      setCustomers(custs || [])

      // 2. Fetch all vehicles for tenant
      const { data: vehs, error: vehsError } = await supabase
        .from('vehicles')
        .select('*, vehicle_health(health_score)')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      if (vehsError) throw vehsError
      setVehicles(vehs || [])

    } catch (err) {
      toast.error('Error al cargar la información: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, supabase, toast])

  useEffect(() => {
    if (tenant?.id && !isGated) {
      loadData()
    }
  }, [tenant?.id, isGated, loadData])

  // Load history for a selected vehicle (work orders + manual notes)
  const loadVehicleHistory = useCallback(async (vehicleId) => {
    if (!vehicleId) return
    try {
      // Fetch work orders
      const { data: wos, error: wosError } = await supabase
        .from('work_orders')
        .select('id, order_number, description, total_price, km_at_entry, completed_at, created_at, status, profiles(full_name)')
        .eq('vehicle_id', vehicleId)
        .in('status', ['Finalizado'])
        .order('completed_at', { ascending: false })
      if (wosError) throw wosError

      // Fetch manual notes
      const { data: notes, error: notesError } = await supabase
        .from('vehicle_notes')
        .select('id, description, km, cost, technician, note_type, created_at')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
      if (notesError) throw notesError

      // Format work order entries
      const otEntries = (wos || []).map(wo => ({
        id: wo.id,
        date: wo.completed_at || wo.created_at,
        description: wo.description || 'Servicio técnico registrado',
        km: wo.km_at_entry || 0,
        price: parseFloat(wo.total_price) || 0,
        technician: wo.profiles?.full_name || 'N/A',
        source: 'OT',
        order_number: wo.order_number
      }))

      // Format manual note entries
      const noteEntries = (notes || []).map(n => ({
        id: n.id,
        date: n.created_at,
        description: n.description,
        km: n.km || 0,
        price: parseFloat(n.cost) || 0,
        technician: n.technician || 'N/A',
        source: 'NOTA',
        note_type: n.note_type
      }))

      // Combine and sort by date descending
      const combined = [...otEntries, ...noteEntries].sort((a, b) => new Date(b.date) - new Date(a.date))
      setHistory(combined)

    } catch (err) {
      console.error('[loadVehicleHistory]', err)
      toast.error('Error al cargar historial: ' + err.message)
    }
  }, [supabase, toast])

  useEffect(() => {
    if (selectedVehicle?.id) {
      loadVehicleHistory(selectedVehicle.id)
    } else {
      setHistory([])
    }
  }, [selectedVehicle, loadVehicleHistory])

  // CRUD: Add Customer + Vehicle
  const handleAddCustomerVehicle = async (e) => {
    e.preventDefault()
    if (!custName.trim()) return toast.error('El nombre del cliente es obligatorio')
    if (!vehPlate.trim()) return toast.error('La patente es obligatoria')
    if (!vehBrand.trim() || !vehModel.trim()) return toast.error('Marca y modelo son obligatorios')

    setIsSaving(true)
    try {
      const cleanPlate = vehPlate.trim().toUpperCase()
      
      // Check duplicate license plate
      const duplicate = vehicles.find(v => v.license_plate === cleanPlate)
      if (duplicate) throw new Error(`La patente ${cleanPlate} ya se encuentra registrada.`)

      // 1. Insert customer
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          name: custName.trim(),
          phone: custPhone.trim() || null,
          email: custEmail.trim() || null,
          dni: custDni.trim() || null,
          address: custAddress.trim() || null,
          notes: custNotes.trim() || null,
          balance: 0,
          is_active: true
        })
        .select()
        .single()
      if (custError) throw custError

      // 2. Insert vehicle
      const { data: newVehicleData, error: vehError } = await supabase
        .from('vehicles')
        .insert({
          tenant_id: tenant.id,
          client_id: newCustomer.id,
          license_plate: cleanPlate,
          brand: vehBrand.trim(),
          model: vehModel.trim(),
          year: parseInt(vehYear) || null,
          color: vehColor.trim() || null,
          km: parseInt(vehKm) || 0,
          difficulty_factor: parseFloat(vehDifficulty) || 1.00,
          engine_type: vehEngine.trim() || null,
          fuel_type: vehFuel.trim() || null,
          notes: vehNotes.trim() || null
        })
        .select()
        .single()
      if (vehError) throw vehError

      // 3. Create vehicle health entry
      await supabase
        .from('vehicle_health')
        .insert({
          tenant_id: tenant.id,
          vehicle_id: newVehicleData.id,
          health_score: 100
        })

      toast.success('Cliente y vehículo registrados con éxito')
      setShowAddModal(false)
      
      // Clear forms
      setCustName('')
      setCustPhone('')
      setCustEmail('')
      setCustDni('')
      setCustAddress('')
      setCustNotes('')
      setVehPlate('')
      setVehBrand('')
      setVehModel('')
      setVehYear('')
      setVehColor('')
      setVehKm('')
      setVehDifficulty('1.00')
      setVehEngine('')
      setVehFuel('')
      setVehNotes('')

      loadData()
    } catch (err) {
      toast.error('Error al registrar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // CRUD: Edit Customer
  const handleEditCustomer = async (e) => {
    e.preventDefault()
    if (!custName.trim()) return toast.error('El nombre es obligatorio')

    setIsSaving(true)
    try {
      const { data: updated, error } = await supabase
        .from('customers')
        .update({
          name: custName.trim(),
          phone: custPhone.trim() || null,
          email: custEmail.trim() || null,
          dni: custDni.trim() || null,
          address: custAddress.trim() || null,
          notes: custNotes.trim() || null
        })
        .eq('id', selectedCustomer.id)
        .select()
        .single()
      if (error) throw error

      toast.success('Datos del cliente actualizados')
      setSelectedCustomer(updated)
      setShowEditCustomerModal(false)
      loadData()
    } catch (err) {
      toast.error('Error al actualizar cliente: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // CRUD: Add Vehicle to existing Customer
  const handleAddVehicle = async (e) => {
    e.preventDefault()
    if (!vehPlate.trim()) return toast.error('La patente es obligatoria')
    if (!vehBrand.trim() || !vehModel.trim()) return toast.error('Marca y modelo son obligatorios')

    setIsSaving(true)
    try {
      const cleanPlate = vehPlate.trim().toUpperCase()
      const duplicate = vehicles.find(v => v.license_plate === cleanPlate)
      if (duplicate) throw new Error(`La patente ${cleanPlate} ya se encuentra registrada.`)

      const { data: newVeh, error } = await supabase
        .from('vehicles')
        .insert({
          tenant_id: tenant.id,
          client_id: selectedCustomer.id,
          license_plate: cleanPlate,
          brand: vehBrand.trim(),
          model: vehModel.trim(),
          year: parseInt(vehYear) || null,
          color: vehColor.trim() || null,
          km: parseInt(vehKm) || 0,
          difficulty_factor: parseFloat(vehDifficulty) || 1.00,
          engine_type: vehEngine.trim() || null,
          fuel_type: vehFuel.trim() || null,
          notes: vehNotes.trim() || null
        })
        .select()
        .single()
      if (error) throw error

      await supabase
        .from('vehicle_health')
        .insert({
          tenant_id: tenant.id,
          vehicle_id: newVeh.id,
          health_score: 100
        })

      toast.success('Vehículo agregado con éxito')
      setShowAddVehicleModal(false)
      setVehPlate('')
      setVehBrand('')
      setVehModel('')
      setVehYear('')
      setVehColor('')
      setVehKm('')
      setVehDifficulty('1.00')
      setVehEngine('')
      setVehFuel('')
      setVehNotes('')

      loadData()
    } catch (err) {
      toast.error('Error al agregar vehículo: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // CRUD: Edit Vehicle
  const handleEditVehicle = async (e) => {
    e.preventDefault()
    if (!vehPlate.trim()) return toast.error('La patente es obligatoria')
    if (!vehBrand.trim() || !vehModel.trim()) return toast.error('Marca y modelo son obligatorios')

    setIsSaving(true)
    try {
      const cleanPlate = vehPlate.trim().toUpperCase()
      const duplicate = vehicles.find(v => v.id !== selectedVehicle.id && v.license_plate === cleanPlate)
      if (duplicate) throw new Error(`La patente ${cleanPlate} ya está asociada a otro vehículo.`)

      const { data: updated, error } = await supabase
        .from('vehicles')
        .update({
          license_plate: cleanPlate,
          brand: vehBrand.trim(),
          model: vehModel.trim(),
          year: parseInt(vehYear) || null,
          color: vehColor.trim() || null,
          km: parseInt(vehKm) || 0,
          difficulty_factor: parseFloat(vehDifficulty) || 1.00,
          engine_type: vehEngine.trim() || null,
          fuel_type: vehFuel.trim() || null,
          notes: vehNotes.trim() || null
        })
        .eq('id', selectedVehicle.id)
        .select('*, vehicle_health(health_score)')
        .single()
      if (error) throw error

      toast.success('Vehículo actualizado')
      setSelectedVehicle(updated)
      setShowEditVehicleModal(false)
      loadData()
    } catch (err) {
      toast.error('Error al actualizar vehículo: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // CRUD: Add Note/Reminder
  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteDesc.trim()) return toast.error('La descripción de la nota es requerida')

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('vehicle_notes')
        .insert({
          tenant_id: tenant.id,
          vehicle_id: selectedVehicle.id,
          description: noteDesc.trim(),
          km: parseInt(noteKm) || null,
          cost: parseFloat(noteCost) || 0,
          technician: noteTech.trim() || null,
          note_type: 'MANUAL'
        })
      if (error) throw error

      toast.success('Nota agregada al historial')
      setShowNoteModal(false)
      setNoteDesc('')
      setNoteKm('')
      setNoteCost('')
      setNoteTech('')

      loadVehicleHistory(selectedVehicle.id)
    } catch (err) {
      toast.error('Error al agregar nota: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Filter clients and vehicles in unified list
  const filteredVehiclesList = vehicles.filter(v => {
    const cust = customers.find(c => c.id === v.client_id)
    const searchLower = search.toLowerCase()
    const matchPlate = v.license_plate.toLowerCase().includes(searchLower)
    const matchBrand = v.brand.toLowerCase().includes(searchLower)
    const matchModel = v.model.toLowerCase().includes(searchLower)
    const matchName = cust ? cust.name.toLowerCase().includes(searchLower) : false
    const matchDni = cust?.dni ? cust.dni.includes(searchLower) : false
    
    return !search || matchPlate || matchBrand || matchModel || matchName || matchDni
  })

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
        title="Fichas de Vehículos y Órdenes de Trabajo"
        description="Lleva una hoja de ruta técnica de cada vehículo, calcula comisiones para tus operarios y controla de forma eficiente el flujo de boxes en tu negocio."
        requiredPlan="professional"
      />
    )
  }

  return (
    <div style={{ paddingBottom: 'var(--space-8)' }}>
      
      {/* Header and top tools */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
            Control de Vehículos y Historial de Servicio
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Administrá vehículos, monitorea su salud y lleva un registro técnico detallado de cada servicio realizado.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <UserPlus size={18} /> Registrar Cliente + Vehículo
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: List and Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
              <input
                className="form-input"
                placeholder="🔎 Buscar por Patente, Marca, Modelo, Nombre del Propietario o DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', paddingLeft: '40px' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            </div>

            {/* List Table */}
            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando vehículos...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Vehículo</th>
                      <th style={{ padding: '12px' }}>Patente</th>
                      <th style={{ padding: '12px' }}>Propietario</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Kilometraje</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Salud</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehiclesList.map((veh) => {
                      const owner = customers.find(c => c.id === veh.client_id)
                      const health = veh.vehicle_health?.[0]?.health_score ?? 100
                      const healthColor = health > 80 ? 'var(--color-secondary)' : health > 50 ? 'var(--color-tertiary)' : 'var(--color-error)'

                      return (
                        <tr 
                          key={veh.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)', 
                            fontSize: '0.875rem',
                            background: selectedVehicle?.id === veh.id ? 'rgba(221, 183, 255, 0.04)' : 'transparent',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setSelectedVehicle(veh)
                            if (owner) setSelectedCustomer(owner)
                          }}
                        >
                          <td style={{ padding: '14px 12px' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{veh.brand} {veh.model}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Año {veh.year || 'N/A'}{veh.color ? ` · ${veh.color}` : ''}</div>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ 
                              background: '#1e293b', border: '1px solid #475569', color: '#f8fafc',
                              padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' 
                            }}>
                              {veh.license_plate}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>
                            {owner ? owner.name : 'Sin Propietario'}
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 500, color: '#fff' }}>
                            {(veh.km || 0).toLocaleString()} km
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <span style={{ color: healthColor, fontWeight: 700, fontSize: '0.8125rem', border: `1px solid ${healthColor}`, padding: '2px 6px', borderRadius: '9999px', background: `${healthColor}08` }}>
                              ♥ {health}%
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVehicle(veh)
                                if (owner) setSelectedCustomer(owner)
                              }}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Eye size={14} style={{ marginRight: '4px' }} /> Ver Ficha
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredVehiclesList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No se encontraron vehículos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Ficha del Vehículo & Historial */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {selectedCustomer ? (
            <>
              {/* Propietario Card */}
              <div className="card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ficha Propietario
                  </span>
                  <button 
                    onClick={() => {
                      setCustName(selectedCustomer.name)
                      setCustPhone(selectedCustomer.phone || '')
                      setCustEmail(selectedCustomer.email || '')
                      setCustDni(selectedCustomer.dni || '')
                      setCustAddress(selectedCustomer.address || '')
                      setCustNotes(selectedCustomer.notes || '')
                      setShowEditCustomerModal(true)
                    }}
                    style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: 600 }}
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>{selectedCustomer.name}</div>
                  {selectedCustomer.dni && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}><strong style={{ color: '#fff' }}>DNI/CUIT:</strong> {selectedCustomer.dni}</div>}
                  {selectedCustomer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: '#fff' }}>Tel:</strong> {selectedCustomer.phone}
                      <a 
                        href={getWhatsAppUrl(selectedCustomer.phone, `Hola ${selectedCustomer.name}, te contactamos desde tu taller por tu vehículo.`)}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.06)' }}
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </a>
                    </div>
                  )}
                  {selectedCustomer.email && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} style={{ color: 'var(--text-muted)' }} /> {selectedCustomer.email}</div>}
                  {selectedCustomer.address && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} style={{ color: 'var(--text-muted)' }} /> {selectedCustomer.address}</div>}
                  {selectedCustomer.notes && <div style={{ fontSize: '0.8125rem', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{selectedCustomer.notes}"</div>}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                  <button 
                    onClick={() => {
                      setVehPlate('')
                      setVehBrand('')
                      setVehModel('')
                      setVehYear('')
                      setVehColor('')
                      setVehKm('')
                      setVehDifficulty('1.00')
                      setVehEngine('')
                      setVehFuel('')
                      setVehNotes('')
                      setShowAddVehicleModal(true)
                    }}
                    className="btn btn-ghost btn-sm" 
                    style={{ width: '100%', borderStyle: 'dashed', justifyContent: 'center' }}
                  >
                    <Plus size={14} /> Asociar Nuevo Vehículo
                  </button>
                </div>
              </div>

              {/* Vehículo Detalles & Historial */}
              {selectedVehicle ? (
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                  
                  {/* Vehicle Header details */}
                  <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ 
                          background: '#1e293b', border: '1px solid #475569', color: '#f8fafc',
                          padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' 
                        }}>
                          {selectedVehicle.license_plate}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dificultad: x{selectedVehicle.difficulty_factor}</span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </h3>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {(selectedVehicle.km || 0).toLocaleString()} km acumulados
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setVehPlate(selectedVehicle.license_plate)
                        setVehBrand(selectedVehicle.brand)
                        setVehModel(selectedVehicle.model)
                        setVehYear(selectedVehicle.year || '')
                        setVehColor(selectedVehicle.color || '')
                        setVehKm(selectedVehicle.km || '')
                        setVehDifficulty(selectedVehicle.difficulty_factor?.toString() || '1.00')
                        setVehEngine(selectedVehicle.engine_type || '')
                        setVehFuel(selectedVehicle.fuel_type || '')
                        setVehNotes(selectedVehicle.notes || '')
                        setShowEditVehicleModal(true)
                      }}
                      style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                  </div>

                  {/* Tech specs mini cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Motor</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{selectedVehicle.engine_type || 'No def.'}</div>
                    </div>
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Combustible</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{selectedVehicle.fuel_type || 'No def.'}</div>
                    </div>
                  </div>

                  {/* Actions for Vehicle */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button 
                      onClick={() => setShowNoteModal(true)}
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, padding: '8px', fontSize: '0.8125rem' }}
                    >
                      ➕ Agregar Nota
                    </button>
                    <Link
                      href={`/work-orders?patente=${selectedVehicle.license_plate}&action=new`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, padding: '8px', fontSize: '0.8125rem', gap: '4px' }}
                    >
                      <Wrench size={14} /> Nueva OT <ArrowRight size={12} />
                    </Link>
                  </div>

                  {/* History Timeline */}
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Línea de Tiempo de Servicio
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                      {history.length > 0 ? (
                        history.map((item) => {
                          const isOT = item.source === 'OT'
                          return (
                            <div 
                              key={item.id} 
                              style={{ 
                                background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px',
                                borderLeft: `4px solid ${isOT ? 'var(--color-primary-border)' : 'var(--color-tertiary)'}`
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: isOT ? 'var(--color-primary)' : 'var(--color-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {isOT ? `Orden #${item.order_number}` : `Nota Manual`}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={12} /> {formatDateTime(item.date).split(' ')[0]}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.875rem', color: '#fff', margin: '0 0 8px 0', lineHeight: '1.4' }}>{item.description}</p>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>Operario: <strong>{item.technician}</strong></span>
                                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>{formatCurrency(item.price)}</span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                          <AlertCircle size={32} style={{ opacity: 0.2, margin: '0 auto 8px auto' }} />
                          <div style={{ fontSize: '0.8125rem' }}>Sin historial de servicios técnico.</div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Car size={40} style={{ opacity: 0.1, margin: '0 auto 12px auto' }} />
                  <p style={{ fontSize: '0.875rem' }}>Seleccioná un vehículo del propietario para visualizar sus datos técnicos e historial de servicios.</p>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Eye size={48} style={{ opacity: 0.1, margin: '0 auto 16px auto' }} />
              <p style={{ fontSize: '0.9375rem' }}>Seleccioná un cliente de la lista para ver su ficha de datos y vehículos asociados.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Registrar Cliente + Vehículo */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowAddModal(false)}>
          <form 
            onSubmit={handleAddCustomerVehicle}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '650px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
                Registrar Nuevo Cliente y Vehículo
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>Da de alta al propietario y su unidad técnica de forma unificada.</p>
            </div>

            {/* SECCION CLIENTE */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                1. Datos del Propietario (Cliente)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nombre Completo *</label>
                  <input className="form-input" required placeholder="Ej. Carlos Bianchi" value={custName} onChange={e => setCustName(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Teléfono</label>
                  <input className="form-input" placeholder="Ej. 11-5555-6666" value={custPhone} onChange={e => setCustPhone(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DNI / CUIT</label>
                  <input className="form-input" placeholder="Ej. 20-33444555-9" value={custDni} onChange={e => setCustDni(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</label>
                  <input className="form-input" type="email" placeholder="carlos@email.com" value={custEmail} onChange={e => setCustEmail(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dirección</label>
                <input className="form-input" placeholder="Calle Falsa 123, Santa Fe" value={custAddress} onChange={e => setCustAddress(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notas de Propietario (opcional)</label>
                <input className="form-input" placeholder="Ej: Pago diferido autorizado, cliente frecuente." value={custNotes} onChange={e => setCustNotes(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            {/* SECCION VEHICULO */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                2. Datos del Vehículo
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Patente *</label>
                  <input className="form-input" required placeholder="AA123BB" value={vehPlate} onChange={e => setVehPlate(e.target.value)} style={{ background: 'var(--bg-surface)', textTransform: 'uppercase' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Marca *</label>
                  <input className="form-input" required placeholder="Toyota, Ford, Fiat..." value={vehBrand} onChange={e => setVehBrand(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Modelo *</label>
                  <input className="form-input" required placeholder="Corolla, Focus, Cronos..." value={vehModel} onChange={e => setVehModel(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Año</label>
                  <input className="form-input" type="number" placeholder="2022" value={vehYear} onChange={e => setVehYear(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Color</label>
                  <input className="form-input" placeholder="Gris Plata, Blanco, Negro..." value={vehColor} onChange={e => setVehColor(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kilometraje (km)</label>
                  <input className="form-input" type="number" placeholder="52000" value={vehKm} onChange={e => setVehKm(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Motorización</label>
                  <input className="form-input" placeholder="1.8 16V, 2.0 TDi..." value={vehEngine} onChange={e => setVehEngine(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Combustible</label>
                  <select className="form-select" value={vehFuel} onChange={e => setVehFuel(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                    <option value="">Seleccionar...</option>
                    <option value="Nafta">Nafta</option>
                    <option value="Diesel">Diesel</option>
                    <option value="GNC">GNC</option>
                    <option value="Híbrido/Eléctrico">Híbrido/Eléctrico</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Factor Dificultad MO</label>
                  <select className="form-select" value={vehDifficulty} onChange={e => setVehDifficulty(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                    <option value="1.00">x1.00 (Normal)</option>
                    <option value="1.25">x1.25 (Medio)</option>
                    <option value="1.50">x1.50 (Complejo)</option>
                    <option value="2.00">x2.00 (Especial)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notas de Recepción del Vehículo</label>
                <input className="form-input" placeholder="Ej. Detalle de rayones en paragolpes delantero derecho." value={vehNotes} onChange={e => setVehNotes(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                {isSaving ? 'Registrando...' : 'Registrar'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL: Editar Cliente */}
      {showEditCustomerModal && selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowEditCustomerModal(false)}>
          <form 
            onSubmit={handleEditCustomer}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '500px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>✏️ Editar Propietario</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nombre Completo *</label>
              <input className="form-input" required value={custName} onChange={e => setCustName(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Teléfono</label>
                <input className="form-input" value={custPhone} onChange={e => setCustPhone(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DNI / CUIT</label>
                <input className="form-input" value={custDni} onChange={e => setCustDni(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</label>
              <input className="form-input" type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dirección</label>
              <input className="form-input" value={custAddress} onChange={e => setCustAddress(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notas</label>
              <textarea className="form-input" rows="2" value={custNotes} onChange={e => setCustNotes(e.target.value)} style={{ background: 'var(--bg-surface)', resize: 'none', padding: '8px 12px' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowEditCustomerModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Asociar Nuevo Vehículo */}
      {showAddVehicleModal && selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowAddVehicleModal(false)}>
          <form 
            onSubmit={handleAddVehicle}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '550px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>🚙 Agregar Vehículo a Propietario</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Propietario: <strong>{selectedCustomer.name}</strong></p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Patente *</label>
                <input className="form-input" required placeholder="AA123BB" value={vehPlate} onChange={e => setVehPlate(e.target.value)} style={{ background: 'var(--bg-surface)', textTransform: 'uppercase' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Marca *</label>
                <input className="form-input" required placeholder="Ford, VW..." value={vehBrand} onChange={e => setVehBrand(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Modelo *</label>
                <input className="form-input" required placeholder="Ranger, Golf..." value={vehModel} onChange={e => setVehModel(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Año</label>
                <input className="form-input" type="number" placeholder="2018" value={vehYear} onChange={e => setVehYear(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Color</label>
                <input className="form-input" placeholder="Azul, Blanco..." value={vehColor} onChange={e => setVehColor(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kilometraje (km)</label>
                <input className="form-input" type="number" placeholder="85000" value={vehKm} onChange={e => setVehKm(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Motorización</label>
                <input className="form-input" placeholder="2.0 16v" value={vehEngine} onChange={e => setVehEngine(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dificultad MO</label>
                <select className="form-select" value={vehDifficulty} onChange={e => setVehDifficulty(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                  <option value="1.00">x1.00 (Normal)</option>
                  <option value="1.25">x1.25 (Medio)</option>
                  <option value="1.50">x1.50 (Complejo)</option>
                  <option value="2.00">x2.00 (Especial)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                {isSaving ? 'Agregando...' : 'Asociar Vehículo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Editar Vehículo */}
      {showEditVehicleModal && selectedVehicle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowEditVehicleModal(false)}>
          <form 
            onSubmit={handleEditVehicle}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '550px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>✏️ Editar Vehículo</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Patente *</label>
                <input className="form-input" required value={vehPlate} onChange={e => setVehPlate(e.target.value)} style={{ background: 'var(--bg-surface)', textTransform: 'uppercase' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Marca *</label>
                <input className="form-input" required value={vehBrand} onChange={e => setVehBrand(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Modelo *</label>
                <input className="form-input" required value={vehModel} onChange={e => setVehModel(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Año</label>
                <input className="form-input" type="number" value={vehYear} onChange={e => setVehYear(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Color</label>
                <input className="form-input" value={vehColor} onChange={e => setVehColor(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kilometraje (km)</label>
                <input className="form-input" type="number" value={vehKm} onChange={e => setVehKm(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Motorización</label>
                <input className="form-input" value={vehEngine} onChange={e => setVehEngine(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Combustible</label>
                <select className="form-select" value={vehFuel} onChange={e => setVehFuel(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                  <option value="">Seleccionar...</option>
                  <option value="Nafta">Nafta</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GNC">GNC</option>
                  <option value="Híbrido/Eléctrico">Híbrido/Eléctrico</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Factor Dificultad</label>
                <select className="form-select" value={vehDifficulty} onChange={e => setVehDifficulty(e.target.value)} style={{ background: 'var(--bg-surface)' }}>
                  <option value="1.00">x1.00 (Normal)</option>
                  <option value="1.25">x1.25 (Medio)</option>
                  <option value="1.50">x1.50 (Complejo)</option>
                  <option value="2.00">x2.00 (Especial)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notas del Vehículo</label>
              <input className="form-input" value={vehNotes} onChange={e => setVehNotes(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowEditVehicleModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Nueva Nota / Recordatorio */}
      {showNoteModal && selectedVehicle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowNoteModal(false)}>
          <form 
            onSubmit={handleAddNote}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '450px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>➕ Nueva Nota de Historial</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '-8px' }}>Asociada a: <strong>{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.license_plate})</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción de Nota / Trabajo realizado *</label>
              <textarea 
                className="form-input" 
                required
                rows="3"
                placeholder="Ej. Cambio de bujías y cables de encendido recomendado para el próximo service." 
                value={noteDesc}
                onChange={e => setNoteDesc(e.target.value)}
                style={{ background: 'var(--bg-surface)', resize: 'none', padding: '8px 12px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Kilometraje (km)</label>
                <input className="form-input" type="number" placeholder="Ej. 53500" value={noteKm} onChange={e => setNoteKm(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Costo Cobrado ($)</label>
                <input className="form-input" type="number" step="0.01" placeholder="Ej. 12000" value={noteCost} onChange={e => setNoteCost(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Operario / Técnico Responsable</label>
              <input className="form-input" placeholder="Ej. Pedro Picapiedra" value={noteTech} onChange={e => setNoteTech(e.target.value)} style={{ background: 'var(--bg-surface)' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600 }}
              >
                {isSaving ? 'Guardando...' : 'Guardar Nota'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
