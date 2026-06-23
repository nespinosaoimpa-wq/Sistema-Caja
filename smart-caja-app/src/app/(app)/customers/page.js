'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

export default function CustomersPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const toast = useToast()

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Form states for adding customer
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustDni, setNewCustDni] = useState('')
  const [newCustAddress, setNewCustAddress] = useState('')
  const [newCustLocality, setNewCustLocality] = useState('')
  const [newCustNotes, setNewCustNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Form states for editing customer
  const [editCustName, setEditCustName] = useState('')
  const [editCustPhone, setEditCustPhone] = useState('')
  const [editCustEmail, setEditCustEmail] = useState('')
  const [editCustDni, setEditCustDni] = useState('')
  const [editCustAddress, setEditCustAddress] = useState('')
  const [editCustLocality, setEditCustLocality] = useState('')
  const [editCustNotes, setEditCustNotes] = useState('')

  // Filter states
  const [selectedLocality, setSelectedLocality] = useState('')

  // Form states for recording payment
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const isGated = tenant?.subscription_plan === 'basic'

  useEffect(() => {
    if (tenant?.id && !isGated) {
      loadCustomers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, isGated])

  async function loadCustomers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      toast.error('Error al cargar los clientes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async (e) => {
    e.preventDefault()
    if (!newCustName.trim()) return toast.error('El nombre es requerido')
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenant.id,
          name: newCustName.trim(),
          phone: newCustPhone.trim() || null,
          email: newCustEmail.trim() || null,
          dni: newCustDni.trim() || null,
          address: newCustAddress.trim() || null,
          locality: newCustLocality.trim() || null,
          notes: newCustNotes.trim() || null,
          balance: 0,
          is_active: true
        })
      if (error) throw error
      toast.success('Cliente creado con éxito')
      setShowAddModal(false)
      // Reset form
      setNewCustName('')
      setNewCustPhone('')
      setNewCustEmail('')
      setNewCustDni('')
      setNewCustAddress('')
      setNewCustLocality('')
      setNewCustNotes('')
      // Reload
      loadCustomers()
    } catch (err) {
      toast.error('Error al crear el cliente: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentAmount) || 0
    if (amount <= 0) return toast.error('El monto debe ser mayor a cero')
    if (!selectedCustomer) return
    setIsSaving(true)
    try {
      const newBalance = (parseFloat(selectedCustomer.balance) || 0) - amount
      const { error } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', selectedCustomer.id)
      if (error) throw error

      toast.success(`Cobro registrado con éxito para ${selectedCustomer.name}`)
      setShowPayModal(false)
      setPaymentAmount('')
      setPaymentNotes('')
      setSelectedCustomer(null)
      loadCustomers()
    } catch (err) {
      toast.error('Error al registrar el cobro: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCustomer = async (e) => {
    e.preventDefault()
    if (!editCustName.trim()) return toast.error('El nombre es requerido')
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: editCustName.trim(),
          phone: editCustPhone.trim() || null,
          email: editCustEmail.trim() || null,
          dni: editCustDni.trim() || null,
          address: editCustAddress.trim() || null,
          locality: editCustLocality.trim() || null,
          notes: editCustNotes.trim() || null
        })
        .eq('id', selectedCustomer.id)
      if (error) throw error

      toast.success('Cliente actualizado con éxito')
      setShowEditModal(false)
      setSelectedCustomer(null)
      loadCustomers()
    } catch (err) {
      toast.error('Error al actualizar el cliente: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const localities = Array.from(new Set(customers.map(c => c.locality).filter(Boolean))).sort()

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)) ||
      (c.dni && c.dni.includes(search))

    const matchesLocality = !selectedLocality || c.locality === selectedLocality

    return matchesSearch && matchesLocality
  })

  if (isGated) {
    return (
      <UpgradePrompt 
        title="Gestión de Clientes & Cta. Cte."
        description="Fideliza a tus clientes, mantén una libreta digital de deudas y habilita planes de cuotas avanzados."
        requiredPlan="professional"
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
            Clientes y Cuentas Corrientes
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Administrá la base de datos de tus clientes y sus saldos deudores (fiado)
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary" 
          style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)' }}
        >
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Clientes</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
            {loading ? '...' : customers.length}
          </div>
        </div>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Clientes con Deuda</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-tertiary)' }}>
            {loading ? '...' : customers.filter(c => (parseFloat(c.balance) || 0) > 0).length}
          </div>
        </div>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Saldo Total Deudor</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
            {loading ? '...' : formatCurrency(customers.reduce((acc, c) => acc + (parseFloat(c.balance) || 0), 0))}
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <input 
            className="form-input" 
            placeholder="🔎 Buscar por nombre, DNI, email o teléfono..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff' }}
          />
          <select
            className="form-input"
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 12px' }}
          >
            <option value="">📍 Todas las localidades</option>
            {localities.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando clientes...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8125rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Nombre</th>
                  <th style={{ padding: '12px 16px' }}>DNI</th>
                  <th style={{ padding: '12px 16px' }}>Teléfono</th>
                  <th style={{ padding: '12px 16px' }}>Localidad</th>
                  <th style={{ padding: '12px 16px' }}>Email</th>
                  <th style={{ padding: '12px 16px' }}>Última Compra</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Saldo Cta. Cte.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const balanceNum = parseFloat(cust.balance) || 0
                  return (
                    <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{cust.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{cust.dni || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{cust.phone || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{cust.locality || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{cust.email || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {cust.last_purchase_at ? formatDateTime(cust.last_purchase_at).split(' ')[0] : 'Sin compras'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: balanceNum > 0 ? 'var(--color-tertiary)' : 'var(--color-secondary)' }}>
                        {balanceNum > 0 ? formatCurrency(balanceNum) : 'Al día'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => {
                              setSelectedCustomer(cust)
                              setPaymentAmount(balanceNum > 0 ? balanceNum.toString() : '')
                              setShowPayModal(true)
                            }}
                            className="btn btn-primary btn-sm" 
                            style={{ background: 'rgba(78, 222, 163, 0.1)', color: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' }}
                          >
                            💳 Cobrar
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedCustomer(cust)
                              setEditCustName(cust.name || '')
                              setEditCustPhone(cust.phone || '')
                              setEditCustEmail(cust.email || '')
                              setEditCustDni(cust.dni || '')
                              setEditCustAddress(cust.address || '')
                              setEditCustLocality(cust.locality || '')
                              setEditCustNotes(cust.notes || '')
                              setShowEditModal(true)
                            }}
                            className="btn btn-sm" 
                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: '#3b82f6' }}
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron clientes con ese criterio de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: Nuevo Cliente */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowAddModal(false)}>
          <form 
            onSubmit={handleAddCustomer}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '500px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>➕ Agregar Nuevo Cliente</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nombre Completo *</label>
              <input 
                className="form-input" 
                required
                placeholder="Ej. Juan Pérez" 
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DNI / CUIT</label>
                <input 
                  className="form-input" 
                  placeholder="Ej. 20-35444888-9" 
                  value={newCustDni}
                  onChange={e => setNewCustDni(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Teléfono</label>
                <input 
                  className="form-input" 
                  placeholder="Ej. 11-5555-1234" 
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</label>
              <input 
                className="form-input" 
                type="email"
                placeholder="juan@email.com" 
                value={newCustEmail}
                onChange={e => setNewCustEmail(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dirección</label>
                <input 
                  className="form-input" 
                  placeholder="Av. Corrientes 1234" 
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Localidad</label>
                <input 
                  className="form-input" 
                  placeholder="Ej. Pilar" 
                  value={newCustLocality}
                  onChange={e => setNewCustLocality(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notas / Límite de Crédito</label>
              <textarea 
                className="form-input" 
                rows="2"
                placeholder="Notas adicionales sobre este cliente..." 
                value={newCustNotes}
                onChange={e => setNewCustNotes(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', resize: 'none', padding: '8px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
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
                style={{ flex: 1, padding: '12px', fontWeight: 600, background: 'var(--color-primary-hover)' }}
              >
                {isSaving ? 'Guardando...' : 'Crear Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Editar Cliente */}
      {showEditModal && selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => {
          setShowEditModal(false)
          setSelectedCustomer(null)
        }}>
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>✏️ Editar Cliente</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nombre Completo *</label>
              <input 
                className="form-input" 
                required
                placeholder="Ej. Juan Pérez" 
                value={editCustName}
                onChange={e => setEditCustName(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DNI / CUIT</label>
                <input 
                  className="form-input" 
                  placeholder="Ej. 20-35444888-9" 
                  value={editCustDni}
                  onChange={e => setEditCustDni(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Teléfono</label>
                <input 
                  className="form-input" 
                  placeholder="Ej. 11-5555-1234" 
                  value={editCustPhone}
                  onChange={e => setEditCustPhone(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</label>
              <input 
                className="form-input" 
                type="email"
                placeholder="juan@email.com" 
                value={editCustEmail}
                onChange={e => setEditCustEmail(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dirección</label>
                <input 
                  className="form-input" 
                  placeholder="Av. Corrientes 1234" 
                  value={editCustAddress}
                  onChange={e => setEditCustAddress(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Localidad</label>
                <input 
                  className="form-input" 
                  placeholder="Ej. Pilar" 
                  value={editCustLocality}
                  onChange={e => setEditCustLocality(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Notas / Límite de Crédito</label>
              <textarea 
                className="form-input" 
                rows="2"
                placeholder="Notas adicionales sobre este cliente..." 
                value={editCustNotes}
                onChange={e => setEditCustNotes(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', resize: 'none', padding: '8px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedCustomer(null)
                }}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600, background: 'var(--color-primary-hover)' }}
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Registrar Cobro / Pago de Deuda */}
      {showPayModal && selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowPayModal(false)}>
          <form 
            onSubmit={handleRecordPayment}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '400px', width: '100%', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>💳 Registrar Cobro (Cuenta Corriente)</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Cliente: <strong>{selectedCustomer.name}</strong></p>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Saldo deudor actual:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-tertiary)' }}>
                {formatCurrency(parseFloat(selectedCustomer.balance) || 0)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monto a Cobrar ($) *</label>
              <input 
                className="form-input" 
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Ej. 1500" 
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '1.125rem', fontWeight: 700 }}
              />
            </div>

            {paymentAmount && (() => {
              const amountNum = parseFloat(paymentAmount) || 0
              const currentBal = parseFloat(selectedCustomer.balance) || 0
              const remaining = Math.max(0, currentBal - amountNum)
              return (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <span>Saldo Restante:</span>
                  <span style={{ fontWeight: 700, color: remaining > 0 ? 'var(--color-tertiary)' : 'var(--color-secondary)' }}>{formatCurrency(remaining)}</span>
                </div>
              )
            })()}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="btn"
                style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: 600, background: 'var(--color-secondary)' }}
              >
                {isSaving ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
