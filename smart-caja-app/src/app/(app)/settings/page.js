'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { 
  Store, 
  Users, 
  MapPin, 
  Palette, 
  CreditCard, 
  Receipt, 
  Save, 
  Plus, 
  Trash2, 
  UploadCloud, 
  ExternalLink, 
  HelpCircle, 
  Info, 
  Smartphone, 
  Shield, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Building,
  Activity,
  Globe,
  Settings
} from 'lucide-react'

export default function SettingsPage() {
  const { tenant, profile, reloadProfile } = useAuth()
  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()
  
  const [saving, setSaving] = useState(false)      // for Save button
  const [upgrading, setUpgrading] = useState(false) // for Upgrade button
  const [activeTab, setActiveTab] = useState('general')
  const [subscribingPlan, setSubscribingPlan] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) {
        setActiveTab(tab)
      }

      const paymentStatus = params.get('payment_status')
      if (paymentStatus === 'success') {
        toast.success('¡Suscripción procesada con éxito! Tu plan ya está activo.')
        window.history.replaceState({}, '', '/settings?tab=billing')
        reloadProfile()
      } else if (paymentStatus === 'failure') {
        toast.error('El pago no se pudo completar. Por favor, intentá nuevamente.')
        window.history.replaceState({}, '', '/settings?tab=billing')
      }
    }
  }, [reloadProfile, toast])

  const handleSubscribe = (planId) => {
    if (!tenant || !profile) return
    
    setSubscribingPlan(planId)
    const planNames = { basic: 'Básico', professional: 'Profesional', enterprise: 'Empresa' }
    const prices = { basic: 20000, professional: 35000, enterprise: 60000 }
    
    router.push(`/billing/checkout?planId=${planId}&planName=${planNames[planId]}&price=${prices[planId]}`)
  }
  
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [form, setForm] = useState({
    name: '',
    business_type: '',
    address: '',
    phone: '',
    primary_color: '#7C3AED',
    secondary_color: '#10B981',
    mp_access_token: '',
    mp_public_key: '',
    currency: 'ARS',
    locale: 'es-AR',
    tax_rate: '21',
    tax_name: 'IVA',
    logo_url: '',
    background_preset: 'matte',
  })

  // Team & Branch states
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'cashier' })
  const [inviting, setInviting] = useState(false)

  const [branches, setBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' })
  const [creatingBranch, setCreatingBranch] = useState(false)
  const [showAddBranch, setShowAddBranch] = useState(false)

  // Sync form state with tenant profile
  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name || '',
        business_type: tenant.business_type || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        primary_color: tenant.theme_config?.primary_color || '#7C3AED',
        secondary_color: tenant.theme_config?.secondary_color || '#10B981',
        mp_access_token: tenant.theme_config?.mp_access_token || '',
        mp_public_key: tenant.theme_config?.mp_public_key || '',
        currency: tenant.theme_config?.currency || 'ARS',
        locale: tenant.theme_config?.locale || 'es-AR',
        tax_rate: tenant.theme_config?.tax_rate !== undefined ? tenant.theme_config.tax_rate.toString() : '21',
        tax_name: tenant.theme_config?.tax_name || 'IVA',
        logo_url: tenant.logo_url || '',
        background_preset: tenant.theme_config?.background_preset || 'matte',
      })
    }
  }, [tenant])

  // Handle tab and suspension sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      
      const isSuspended = tenant?.subscription_status === 'suspended' || 
        (tenant?.subscription_status === 'trial' && tenant?.trial_ends_at && new Date() > new Date(tenant.trial_ends_at))
      
      if (isSuspended) {
        setActiveTab('billing')
      } else if (tabParam) {
        setActiveTab(tabParam)
      }
    }
  }, [tenant])

  // Fetch Team Members
  const fetchTeamMembers = useCallback(async () => {
    if (!tenant?.id) return
    setLoadingTeam(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('full_name', { ascending: true })
      if (error) throw error
      setTeamMembers(data || [])
    } catch (err) {
      console.error('Error fetching team:', err)
      toast.error('Error al cargar colaboradores')
    } finally {
      setLoadingTeam(false)
    }
  }, [tenant?.id])

  // Fetch Branches
  const fetchBranches = useCallback(async () => {
    if (!tenant?.id || tenant.subscription_plan !== 'enterprise') return
    setLoadingBranches(true)
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('Error fetching branches:', err)
    } finally {
      setLoadingBranches(false)
    }
  }, [tenant?.id, tenant?.subscription_plan])

  // Load contextual data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchTeamMembers()
    } else if (activeTab === 'branches') {
      fetchBranches()
    }
  }, [activeTab, fetchTeamMembers, fetchBranches])

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  // Logo Upload to Supabase Storage
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingLogo(true)
    
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      setUploadingLogo(false)
      toast.error('La subida de imagen demoró demasiado. Verifica que el almacenamiento esté configurado.')
    }, 12000)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant.id}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file, { upsert: true })

      if (timedOut) return

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath)

      updateForm('logo_url', publicUrl)
      toast.success('Logo cargado. Guarda los cambios para aplicar en tu cuenta.')
    } catch (err) {
      if (timedOut) return
      console.error(err)
      toast.error('Error al subir imagen. ¿La tabla/storage está habilitada en Supabase?')
    } finally {
      clearTimeout(timeout)
      if (!timedOut) {
        setUploadingLogo(false)
      }
    }
  }

  // Invite Colaborador
  const handleInviteUser = async (e) => {
    e.preventDefault()
    if (!inviteForm.email || !inviteForm.full_name) {
      toast.error('Completa el nombre y correo del colaborador')
      return
    }
    setInviting(true)
    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          full_name: inviteForm.full_name,
          role: inviteForm.role
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar invitación')
      }

      if (data.method === 'admin_invite') {
        toast.success(`¡Invitación enviada por email a ${inviteForm.full_name}!`)
      } else if (data.method === 'fallback_link') {
        // Copiar el enlace al portapapeles
        await navigator.clipboard.writeText(data.inviteLink)
        toast.success(`¡Invitación generada! Enlace copiado al portapapeles para enviar manualmente.`)
      }

      setInviteForm({ full_name: '', email: '', role: 'cashier' })
      fetchTeamMembers()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo invitar al colaborador: ' + err.message)
    } finally {
      setInviting(false)
    }
  }

  // Delete Colaborador
  const handleDeleteMember = async (id, name) => {
    if (id === profile?.id) {
      toast.error('No puedes eliminar tu propio perfil administrador')
      return
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${name} del equipo?`)) return
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      if (error) throw error
      toast.success('Colaborador eliminado del equipo')
      fetchTeamMembers()
    } catch (err) {
      toast.error('Error al remover miembro: ' + err.message)
    }
  }

  // Create Branch (Enterprise)
  const handleCreateBranch = async (e) => {
    e.preventDefault()
    if (!newBranch.name) return
    setCreatingBranch(true)
    try {
      const { error } = await supabase
        .from('branches')
        .insert({
          tenant_id: tenant.id,
          name: newBranch.name,
          address: newBranch.address,
          phone: newBranch.phone
        })
      if (error) throw error
      toast.success(`Sucursal ${newBranch.name} creada exitosamente`)
      setNewBranch({ name: '', address: '', phone: '' })
      setShowAddBranch(false)
      fetchBranches()
    } catch (err) {
      toast.error('Error al crear sucursal: ' + err.message)
    } finally {
      setCreatingBranch(false)
    }
  }

  // Save Tenant settings globally
  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = {
        name: form.name,
        business_type: form.business_type,
        address: form.address,
        phone: form.phone,
        logo_url: form.logo_url,
        theme_config: {
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          currency: form.currency,
          locale: form.locale,
          tax_rate: parseFloat(form.tax_rate) || 0,
          tax_name: form.tax_name,
          mp_access_token: form.mp_access_token,
          mp_public_key: form.mp_public_key,
          background_preset: form.background_preset,
        }
      }

      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenant.id)

      if (error) throw error

      // Apply CSS variables immediately
      document.documentElement.style.setProperty('--color-primary', form.primary_color)
      document.documentElement.style.setProperty('--color-secondary', form.secondary_color)
      
      const bgPreset = form.background_preset
      let base = '#060e20', surface = '#0b1326', card = '#131b2e', cardHover = '#171f33'
      if (bgPreset === 'cosmic') {
        base = '#0c081e'; surface = '#140e30'; card = '#1d1542'; cardHover = '#241b52'
      } else if (bgPreset === 'ocean') {
        base = '#020d1a'; surface = '#04172e'; card = '#062242'; cardHover = '#082a52'
      } else if (bgPreset === 'midnight') {
        base = '#000000'; surface = '#09090b'; card = '#18181b'; cardHover = '#27272a'
      }

      document.documentElement.style.setProperty('--bg-base', base)
      document.documentElement.style.setProperty('--bg-surface', surface)
      document.documentElement.style.setProperty('--bg-card', card)
      document.documentElement.style.setProperty('--bg-card-hover', cardHover)
      document.documentElement.style.setProperty('--bg-sidebar', base)
      document.documentElement.style.setProperty('--bg-input', card)

      if (typeof window !== 'undefined') {
        localStorage.setItem('smartcaja_tenant_currency', form.currency)
        localStorage.setItem('smartcaja_tenant_locale', form.locale)
      }

      // Reload profile with a 5s safety timeout to avoid hanging button
      try {
        await Promise.race([
          reloadProfile(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ])
      } catch (reloadErr) {
        // If reload times out or fails, we still consider the save successful
        // The user's data IS saved in DB - just the in-memory refresh failed
        console.warn('Profile reload after save timed out or failed:', reloadErr.message)
      }

      toast.success('\u2705 Configuración guardada correctamente')
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('Error al guardar configuración: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle Plan Upgrade checkout
  const handleUpgrade = async (plan) => {
    if (!tenant?.id) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          tenant_id: tenant.id
        })
      })
      
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error(data.error || 'Error al generar link de pago')
      }
    } catch (err) {
      console.error(err)
      toast.error('Aun no configuramos los pagos de producción: ' + err.message)
    } finally {
      setUpgrading(false)
    }
  }

  if (profile?.role !== 'owner' && profile?.role !== 'admin') {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔒</div>
        <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem' }}>Acceso Restringido</h3>
        <p style={{ color: 'var(--text-muted)' }}>No tenés permisos para ver esta sección.</p>
      </div>
    )
  }

  const isSuspended = tenant?.subscription_status === 'suspended' || 
    (tenant?.subscription_status === 'trial' && tenant?.trial_ends_at && new Date() > new Date(tenant.trial_ends_at))

  const TABS = isSuspended ? [
    { id: 'billing', label: 'Suscripción', desc: 'Planes y facturación', icon: Receipt },
  ] : [
    { id: 'general', label: 'General', desc: 'Identificación y formatos', icon: Store },
    { id: 'appearance', label: 'Apariencia', desc: 'Logos, temas y preview', icon: Palette },
    { id: 'users', label: 'Equipo', desc: 'Colaboradores y roles', icon: Users },
    { id: 'branches', label: 'Sucursales', desc: 'Puntos de venta', icon: MapPin },
    { id: 'payments', label: 'Mercado Pago', desc: 'Pasarela de cobro', icon: CreditCard },
    { id: 'billing', label: 'Suscripción', desc: 'Planes y facturación', icon: Receipt },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--space-4) var(--space-8) var(--space-4)' }}>
      {/* Dynamic styles to override and adapt */}
      <style>{`
        .settings-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          margin-top: 24px;
        }
        .settings-sidebar {
          display: flex;
          flex-direction: column;
          gap: 6px;
          height: fit-content;
          position: sticky;
          top: 24px;
        }
        .settings-sidebar-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .settings-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }
        .settings-sidebar-btn.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-color: rgba(221, 183, 255, 0.08);
        }
        .appearance-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
        @media (max-width: 900px) {
          .settings-container {
            grid-template-columns: 1fr !important;
          }
          .appearance-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Redesigned Premium Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Configuración
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Administra el perfil de tu comercio, los canales de pago, los colores de tu marca y tu equipo de trabajo.
          </p>
        </div>
        <div>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, var(--color-primary-hover), var(--color-primary))',
              color: '#000',
              fontWeight: 800,
              border: 'none',
              boxShadow: '0 4px 14px rgba(221, 183, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'transform 0.1s ease'
            }}
            onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {saving ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(0,0,0,0.15)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Guardando...
              </div>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      <div className="settings-container">
        {/* Left column Settings Sidebar Menu */}
        <aside className="settings-sidebar">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-sidebar-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : 'inherit' }}>
                    {tab.label}
                  </span>
                  <span style={{ fontSize: '0.7125rem', color: isActive ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: 400, marginTop: '2px', opacity: isActive ? 0.9 : 0.75 }}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            )
          })}
        </aside>

        {/* Right column Content Panel */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB GENERAL */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Card 1: Identificacion del Comercio */}
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Store size={18} style={{ color: 'var(--color-primary)' }} />
                    <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Identificación del Comercio</h3>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
                  <div className="form-group">
                    <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Comercio</label>
                    <input 
                      className="form-input" 
                      value={form.name} 
                      onChange={e => updateForm('name', e.target.value)} 
                      placeholder="Ej: Smart Flow" 
                      style={{ marginTop: '6px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rubro</label>
                      <select 
                        className="form-select form-input" 
                        value={form.business_type} 
                        onChange={e => updateForm('business_type', e.target.value)}
                        style={{ marginTop: '6px' }}
                      >
                        <option value="general">Kiosco / Almacén / General</option>
                        <option value="supermercado">Supermercado</option>
                        <option value="ropa">Ropa / Indumentaria</option>
                        <option value="lubricentro">Lubricentro</option>
                        <option value="farmacia">Farmacia</option>
                        <option value="ferreteria">Ferretería</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Teléfono de Contacto</label>
                      <input 
                        className="form-input" 
                        value={form.phone} 
                        onChange={e => updateForm('phone', e.target.value)} 
                        placeholder="Ej: +54 9 341 555-5555"
                        style={{ marginTop: '6px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dirección Comercial (Aparecerá en los tickets impresos)</label>
                    <input 
                      className="form-input" 
                      value={form.address} 
                      onChange={e => updateForm('address', e.target.value)} 
                      placeholder="Ej: Av. San Martín 1234, Rosario" 
                      style={{ marginTop: '6px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Regionalización e Impuestos */}
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={18} style={{ color: 'var(--color-secondary)' }} />
                    <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Región, Moneda e Impuestos</h3>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Define la configuración del formato de moneda y decimales para la visualización de tus balances en la caja registradora.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Moneda Comercial</label>
                      <select 
                        className="form-select form-input" 
                        value={form.currency} 
                        onChange={e => updateForm('currency', e.target.value)}
                        style={{ marginTop: '6px' }}
                      >
                        <option value="ARS">ARS ($ - Pesos Argentinos)</option>
                        <option value="USD">USD ($ - Dólares)</option>
                        <option value="EUR">EUR (€ - Euros)</option>
                        <option value="MXN">MXN ($ - Pesos Mexicanos)</option>
                        <option value="CLP">CLP ($ - Pesos Chilenos)</option>
                        <option value="COP">COP ($ - Pesos Colombianos)</option>
                        <option value="UYU">UYU ($ - Pesos Uruguayos)</option>
                        <option value="BRL">BRL (R$ - Real Brasileño)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Formato Regional (Locale)</label>
                      <select 
                        className="form-select form-input" 
                        value={form.locale} 
                        onChange={e => updateForm('locale', e.target.value)}
                        style={{ marginTop: '6px' }}
                      >
                        <option value="es-AR">es-AR (Argentina)</option>
                        <option value="en-US">en-US (Estados Unidos)</option>
                        <option value="es-ES">es-ES (España)</option>
                        <option value="es-MX">es-MX (México)</option>
                        <option value="es-CL">es-CL (Chile)</option>
                        <option value="es-CO">es-CO (Colombia)</option>
                        <option value="es-UY">es-UY (Uruguay)</option>
                        <option value="pt-BR">pt-BR (Brasil)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre de Impuesto Local</label>
                      <input 
                        className="form-input" 
                        value={form.tax_name} 
                        onChange={e => updateForm('tax_name', e.target.value)} 
                        placeholder="Ej: IVA, IGV, TAX" 
                        style={{ marginTop: '6px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Porcentaje Tributario (%)</label>
                      <input 
                        className="form-input" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={form.tax_rate} 
                        onChange={e => updateForm('tax_rate', e.target.value)} 
                        placeholder="Ej: 21 (0 para exento)" 
                        style={{ marginTop: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB APARIENCIA */}
          {activeTab === 'appearance' && (
            <div className="appearance-grid">
              
              {/* Form Col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Preset Wallpapers */}
                <div className="card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building size={18} style={{ color: 'var(--color-secondary)' }} />
                      <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Tema del Entorno (Fondo)</h3>
                    </div>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                      {[
                        { id: 'matte', name: 'Gris Matte', color: '#060e20', swatch: ['#060e20', '#0b1326', '#131b2e'] },
                        { id: 'cosmic', name: 'Cósmico', color: '#0c081e', swatch: ['#0c081e', '#140e30', '#1d1542'] },
                        { id: 'ocean', name: 'Azul Océano', color: '#020d1a', swatch: ['#020d1a', '#04172e', '#062242'] },
                        { id: 'midnight', name: 'Midnight (Negro)', color: '#000000', swatch: ['#000000', '#09090b', '#18181b'] }
                      ].map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updateForm('background_preset', preset.id)}
                          style={{
                            background: preset.color,
                            border: form.background_preset === preset.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 8px',
                            cursor: 'pointer',
                            color: '#fff',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: form.background_preset === preset.id ? '0 0 12px rgba(221,183,255,0.15)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          {/* Mini swatch color block */}
                          <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '4px' }}>
                            {preset.swatch.map((c, i) => (
                              <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: c }} />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{preset.name}</span>
                        </button>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Color Schemes */}
                <div className="card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Palette size={18} style={{ color: 'var(--color-primary)' }} />
                      <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Esquema de Colores</h3>
                    </div>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Color Principal</label>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <input 
                            type="color" 
                            value={form.primary_color} 
                            onChange={e => updateForm('primary_color', e.target.value)} 
                            style={{ width: '45px', height: '45px', padding: '0', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'transparent' }} 
                          />
                          <input 
                            className="form-input" 
                            value={form.primary_color} 
                            onChange={e => updateForm('primary_color', e.target.value)} 
                          />
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          Para enlaces, elementos activos del menú e indicadores.
                        </span>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Color Secundario (Éxito)</label>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <input 
                            type="color" 
                            value={form.secondary_color} 
                            onChange={e => updateForm('secondary_color', e.target.value)} 
                            style={{ width: '45px', height: '45px', padding: '0', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'transparent' }} 
                          />
                          <input 
                            className="form-input" 
                            value={form.secondary_color} 
                            onChange={e => updateForm('secondary_color', e.target.value)} 
                          />
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          Para transacciones exitosas, stock positivo y confirmaciones.
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Logo Customizer */}
                <div className="card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <UploadCloud size={18} style={{ color: 'var(--color-primary)' }} />
                      <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Logotipo de la Marca</h3>
                    </div>
                  </div>
                  <div className="card-body" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '20px', alignItems: 'center' }}>
                    {/* Logo display circle */}
                    {form.logo_url ? (
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={form.logo_url} 
                          alt="Logo de la empresa" 
                          onError={(e) => { e.target.style.display = 'none' }}
                          style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-lg)', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                        />
                        <button 
                          onClick={() => updateForm('logo_url', '')}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--color-error)',
                            color: '#000',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: 'none',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                          title="Eliminar logo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-input)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        🏪
                      </div>
                    )}

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cargar Archivo de Imagen</label>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => document.getElementById('logo-upload').click()}
                            disabled={uploadingLogo}
                            style={{ flex: 1 }}
                          >
                            {uploadingLogo ? 'Subiendo...' : '📂 Seleccionar Archivo'}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>O pega la URL directa del logo</label>
                        <input
                          className="form-input text-xs"
                          placeholder="https://ejemplo.com/mi-logo.png"
                          value={form.logo_url}
                          onChange={e => updateForm('logo_url', e.target.value)}
                          style={{ marginTop: '4px', padding: '8px 12px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            {activeTab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#009EE3' }}>Mercado Pago</span> Integración
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                  Vinculá tu cuenta de Mercado Pago para permitir cobros con QR y tarjetas directo desde el sistema.
                </p>
                
                <div className="form-group">
                  <label className="form-label">Access Token (Producción)</label>
                  <input className="form-input" type="password" value={form.mp_access_token} onChange={e => updateForm('mp_access_token', e.target.value)} placeholder="APP_USR-..." />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Public Key (Producción)</label>
                  <input className="form-input" value={form.mp_public_key} onChange={e => updateForm('mp_public_key', e.target.value)} placeholder="APP_USR-..." />
                </div>
                
                <div style={{ padding: 'var(--space-4)', background: 'rgba(0, 158, 227, 0.1)', border: '1px solid rgba(0, 158, 227, 0.2)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
                  <div style={{ fontSize: '0.875rem', color: '#009EE3' }}>
                    <strong>¿Dónde encuentro estas credenciales?</strong><br/>
                    Ingresá a tu cuenta de Mercado Pago Developers {'>'} Tus integraciones {'>'} Credenciales de producción.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem' }}>Estado de Suscripción</h3>
                
                <div style={{ 
                  padding: 'var(--space-6)', 
                  background: tenant?.subscription_status === 'trial' ? 'var(--color-tertiary-light)' : 'var(--color-secondary-light)', 
                  border: `1px solid ${tenant?.subscription_status === 'trial' ? 'var(--color-tertiary)' : 'var(--color-secondary)'}`, 
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  alignItems: 'center',
                  position: 'sticky',
                  top: '24px',
                  height: 'fit-content',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tenant?.subscription_status === 'trial' ? 'var(--color-tertiary)' : 'var(--color-secondary)', marginBottom: '4px' }}>
                      {tenant?.subscription_status === 'trial' ? 'Período de Prueba (Gratis)' : 
                       tenant?.subscription_status === 'active' ? 'Suscripción Activa' :
                       tenant?.subscription_status === 'suspended' ? 'Suscripción Suspendida' : 'Suscripción Cancelada'}
                    </div>
                    <div style={{ color: 'var(--text-primary)' }}>
                      Plan Actual: <strong style={{ textTransform: 'capitalize' }}>
                        {tenant?.subscription_plan === 'basic' ? 'Básico' : 
                         tenant?.subscription_plan === 'professional' ? 'Profesional' : 
                         tenant?.subscription_plan === 'enterprise' ? 'Empresa' : tenant?.subscription_plan}
                      </strong> ({
                        tenant?.subscription_plan === 'basic' ? '$20.000' : 
                        tenant?.subscription_plan === 'professional' ? '$35.000' : 
                        tenant?.subscription_plan === 'enterprise' ? '$60.000' : '$0'
                      } ARS / mes)
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB EQUIPO (USUARIOS) */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Team list table */}
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={18} style={{ color: 'var(--color-primary)' }} />
                    <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Equipo de Colaboradores</h3>
                  </div>
                </div>
                <div className="card-body" style={{ padding: '0', paddingTop: '10px' }}>
                  
                  {tenant?.subscription_status === 'trial' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-primary btn-lg" 
                        disabled={subscribingPlan !== null}
                        onClick={() => handleSubscribe(tenant?.subscription_plan || 'basic')}
                      >
                        {subscribingPlan ? 'Conectando...' : 'Suscribirse ahora'}
                      </button>
                    </div>

                <div style={{ marginTop: 'var(--space-6)' }}>
                  <h4 style={{ marginBottom: 'var(--space-4)', fontSize: '1.125rem', fontWeight: 600 }}>Planes Disponibles</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-6)' }}>
                    {/* Básico */}
                    <div className="card" style={{ 
                      border: tenant?.subscription_plan === 'basic' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', 
                      opacity: 1,
                      background: tenant?.subscription_plan === 'basic' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 'var(--radius-lg)'
                    }}>
                      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-6)' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff', marginBottom: '4px' }}>Básico</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Para iniciar con ventas y stock</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: 'var(--space-4)' }}>$20.000<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mes</span></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 'var(--space-6)', flexGrow: 1, textAlign: 'left' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Punto de Venta (POS)</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Lector Código de Barras</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Inventario (Hasta 500 prod.)</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Apertura/Cierre de Caja</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Impresión de Tickets</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Historial de Ventas</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Dashboard Diario</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> 1 Usuario administrador</div>
                        </div>

                        {tenant?.subscription_plan === 'basic' && tenant?.subscription_status === 'active' ? (
                          <div className="badge badge-success" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}>Plan Activo</div>
                        ) : (
                          <button 
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', padding: '10px' }}
                            disabled={subscribingPlan !== null}
                            onClick={() => handleSubscribe('basic')}
                          >
                            {subscribingPlan === 'basic' ? 'Cargando...' : 'Elegir Básico'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Profesional */}
                    <div className="card" style={{ 
                      border: '2px solid var(--color-primary)', 
                      boxShadow: '0 8px 30px rgba(168, 85, 247, 0.15)',
                      background: tenant?.subscription_plan === 'professional' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 'var(--radius-lg)',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        background: 'var(--color-primary)', 
                        color: '#060e20',
                        fontSize: '0.6875rem', 
                        fontWeight: 800, 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-full)' 
                      }}>
                        MÁS POPULAR
                      </div>

                      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-6)' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff', marginBottom: '4px' }}>Profesional</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Control total y fidelización</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 'var(--space-4)' }}>$35.000<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mes</span></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 'var(--space-6)', flexGrow: 1, textAlign: 'left' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold' }}><span>⚡</span> Todo lo de Básico</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Inventario Ilimitado</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Plan de Cuotas / Cta Cte</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Gestión de Clientes</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Estadísticas Avanzadas</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Descuentos y Promos POS</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Integración Mercado Pago</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Multi-usuario (hasta 3)</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Colores de Marca Personalizados</div>
                        </div>

                        {tenant?.subscription_plan === 'professional' && tenant?.subscription_status === 'active' ? (
                          <div className="badge badge-success" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}>Plan Activo</div>
                        ) : (
                          <button 
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', padding: '10px' }}
                            disabled={subscribingPlan !== null}
                            onClick={() => handleSubscribe('professional')}
                          >
                            {subscribingPlan === 'professional' ? 'Cargando...' : 'Elegir Profesional'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Empresa */}
                    <div className="card" style={{ 
                      border: tenant?.subscription_plan === 'enterprise' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', 
                      opacity: 1,
                      background: tenant?.subscription_plan === 'enterprise' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 'var(--radius-lg)'
                    }}>
                      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-6)' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff', marginBottom: '4px' }}>Empresa</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Gestión multi-local y compras</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: 'var(--space-4)' }}>$60.000<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mes</span></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 'var(--space-6)', flexGrow: 1, textAlign: 'left' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold' }}><span>⚡</span> Todo lo de Profesional</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Múltiples Sucursales</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Registro Compras & Prov.</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Usuarios Invitados Ilimitados</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Reportes Exportables (Excel/PDF)</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Integración API Externa</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span>✅</span> Soporte VIP Prioritario 24/7</div>
                        </div>

                        {tenant?.subscription_plan === 'enterprise' && tenant?.subscription_status === 'active' ? (
                          <div className="badge badge-success" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}>Plan Activo</div>
                        ) : (
                          <button 
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', padding: '10px', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
                            disabled={subscribingPlan !== null}
                            onClick={() => handleSubscribe('enterprise')}
                          >
                            {subscribingPlan === 'enterprise' ? 'Cargando...' : 'Elegir Empresa'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              </div>

            </div>
          )}

        </section>
      </div>
    </div>
  )
}
