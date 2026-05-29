'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [nowTimestamp] = useState(() => Date.now())
  
  const [saving, setSaving] = useState(false)      // for Save button
  const [upgrading, setUpgrading] = useState(null) // planId string when upgrading, null when idle
  const [activeTab, setActiveTab] = useState('general')
  
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
      const timer = setTimeout(() => {
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
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [tenant])

  // Handle tab and suspension sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      
      const isSuspended = tenant?.subscription_status === 'suspended' || 
        (tenant?.subscription_status === 'trial' && tenant?.trial_ends_at && new Date() > new Date(tenant.trial_ends_at))
      
      const timer = setTimeout(() => {
        if (isSuspended) {
          setActiveTab('billing')
        } else if (tabParam) {
          setActiveTab(tabParam)
        }
      }, 0)
      return () => clearTimeout(timer)
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
  }, [tenant, supabase, toast])

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
  }, [tenant, supabase])

  // Load contextual data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      const timer = setTimeout(() => {
        fetchTeamMembers()
      }, 0)
      return () => clearTimeout(timer)
    } else if (activeTab === 'branches') {
      const timer = setTimeout(() => {
        fetchBranches()
      }, 0)
      return () => clearTimeout(timer)
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

  // Handle Plan Upgrade checkout — uses unified subscription endpoint
  const handleUpgrade = async (planId) => {
    if (!tenant?.id) return
    // Don't allow re-subscribing to the exact same active plan
    if (tenant?.subscription_status === 'active' && tenant?.subscription_plan === planId) {
      toast.error('Ya estás suscripto a este plan.')
      return
    }
    setUpgrading(planId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          tenantId: tenant.id,
          email: profile?.email || tenant?.email || '',
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
      toast.error(err.message || 'Error al iniciar el pago. Intentá de nuevo.')
    } finally {
      setUpgrading(null)
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

              {/* Sticky Mockup Live Preview Col */}
              <div>
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
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
                  <div style={{ width: '100%' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '2px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Palette size={16} style={{ color: 'var(--color-primary)' }} />
                      Vista Previa de Marca
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Los cambios se verán en tu panel principal así:
                    </p>
                  </div>

                  {/* App Frame Container */}
                  <div style={{
                    width: '100%',
                    height: '330px',
                    borderRadius: '12px',
                    border: '4px solid #1e293b',
                    background: 
                      form.background_preset === 'cosmic' ? '#0c081e' : 
                      form.background_preset === 'ocean' ? '#020d1a' : 
                      form.background_preset === 'midnight' ? '#000000' : '#060e20',
                    display: 'flex',
                    overflow: 'hidden',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    {/* Simulated Mini Sidebar */}
                    <div style={{
                      width: '75px',
                      borderRight: '1px solid rgba(255,255,255,0.08)',
                      background: 
                        form.background_preset === 'cosmic' ? '#0c081e' : 
                        form.background_preset === 'ocean' ? '#020d1a' : 
                        form.background_preset === 'midnight' ? '#000000' : '#060e20',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {/* Logo and name preview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {form.logo_url ? (
                          <img 
                            src={form.logo_url} 
                            alt="Preview" 
                            style={{ width: '14px', height: '14px', borderRadius: '2px', objectFit: 'cover' }} 
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '2px',
                            background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            fontWeight: 800,
                            color: '#fff'
                          }}>
                            {form.name ? form.name.substring(0, 1).toUpperCase() : 'S'}
                          </div>
                        )}
                        <span style={{ fontSize: '7px', fontWeight: 800, color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '45px' }}>
                          {form.name || 'Smart Flow'}
                        </span>
                      </div>

                      {/* Mini sidebar nav list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {[
                          { label: 'Dashboard', active: true },
                          { label: 'Caja', active: false },
                          { label: 'Inventario', active: false }
                        ].map((item, i) => (
                          <div 
                            key={i} 
                            style={{
                              padding: '3px 4px',
                              borderRadius: '3px',
                              fontSize: '6px',
                              fontWeight: item.active ? 700 : 500,
                              background: item.active ? 'rgba(255,255,255,0.06)' : 'transparent',
                              color: item.active ? '#fff' : 'rgba(255,255,255,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              position: 'relative'
                            }}
                          >
                            {item.active && (
                              <div style={{
                                position: 'absolute',
                                left: '-8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '2px',
                                height: '100%',
                                background: form.primary_color,
                                borderRadius: '0 2px 2px 0',
                                boxShadow: `0 0 6px ${form.primary_color}`
                              }} />
                            )}
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: item.active ? form.primary_color : 'rgba(255,255,255,0.2)' }} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simulated Content Area */}
                    <div style={{
                      flex: 1,
                      background: 
                        form.background_preset === 'cosmic' ? '#140e30' : 
                        form.background_preset === 'ocean' ? '#04172e' : 
                        form.background_preset === 'midnight' ? '#09090b' : '#0b1326',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ height: '4px', width: '25px', background: '#fff', borderRadius: '1px' }} />
                        <div style={{ height: '4px', width: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{
                          flex: 1, height: '24px', borderRadius: '4px', padding: '3px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px',
                          background: form.background_preset === 'cosmic' ? '#1d1542' : form.background_preset === 'ocean' ? '#062242' : form.background_preset === 'midnight' ? '#18181b' : '#131b2e',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div style={{ height: '2px', width: '8px', background: 'rgba(255,255,255,0.2)' }} />
                          <div style={{ height: '4px', width: '15px', background: form.secondary_color }} />
                        </div>
                        <div style={{
                          flex: 1, height: '24px', borderRadius: '4px', padding: '3px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px',
                          background: form.background_preset === 'cosmic' ? '#1d1542' : form.background_preset === 'ocean' ? '#062242' : form.background_preset === 'midnight' ? '#18181b' : '#131b2e',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div style={{ height: '2px', width: '10px', background: 'rgba(255,255,255,0.2)' }} />
                          <div style={{ height: '4px', width: '12px', background: '#fff' }} />
                        </div>
                      </div>

                      <div style={{
                        flex: 1, borderRadius: '4px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px',
                        background: form.background_preset === 'cosmic' ? '#1d1542' : form.background_preset === 'ocean' ? '#062242' : form.background_preset === 'midnight' ? '#18181b' : '#131b2e',
                        border: '1px solid rgba(255,255,255,0.04)'
                      }}>
                        <div style={{ height: '2px', width: '20px', background: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3px', paddingBottom: '2px' }}>
                          <div style={{ width: '4px', height: '40%', background: 'rgba(255,255,255,0.1)', borderRadius: '1px' }} />
                          <div style={{ width: '4px', height: '75%', background: form.primary_color, borderRadius: '1px' }} />
                          <div style={{ width: '4px', height: '50%', background: form.primary_color, borderRadius: '1px', opacity: 0.6 }} />
                          <div style={{ width: '4px', height: '90%', background: form.secondary_color, borderRadius: '1px' }} />
                        </div>
                      </div>

                      <div style={{
                        width: '100%', padding: '4px', borderRadius: '3px', textAlign: 'center', color: '#000', fontSize: '5px', fontWeight: 800,
                        background: `linear-gradient(135deg, ${form.primary_color}, ${form.primary_color}dd)`
                      }}>
                        Ajustar Stock
                      </div>
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
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Usuario</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rol</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Ingreso</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingTeam ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              Cargando equipo...
                            </td>
                          </tr>
                        ) : teamMembers.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No hay otros colaboradores registrados.
                            </td>
                          </tr>
                        ) : (
                          teamMembers.map((member) => (
                            <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.875rem' }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '0.8125rem',
                                    color: 'var(--color-primary)'
                                  }}>
                                    {member.full_name ? member.full_name.substring(0, 2).toUpperCase() : 'U'}
                                  </div>
                                  <div style={{ fontWeight: 600, color: '#fff' }}>{member.full_name}</div>
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: member.role === 'owner' ? 'var(--color-primary-light)' : member.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.05)',
                                  color: member.role === 'owner' ? 'var(--color-primary)' : member.role === 'admin' ? '#A855F7' : 'var(--text-secondary)'
                                }}>
                                  <Shield size={12} />
                                  {member.role === 'owner' ? 'Dueño' : member.role === 'admin' ? 'Admin' : 'Cajero'}
                                </span>
                              </td>
                              <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{member.email}</td>
                              <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                <button 
                                  onClick={() => handleDeleteMember(member.id, member.full_name)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-error)',
                                    cursor: 'pointer',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                  disabled={member.id === profile?.id}
                                  title={member.id === profile?.id ? "No puedes eliminarte" : "Eliminar"}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>

              {/* Add/Invite Collaborator Form */}
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Plus size={18} style={{ color: 'var(--color-secondary)' }} />
                    <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Invitar Nuevo Colaborador</h3>
                  </div>
                </div>
                <div className="card-body" style={{ paddingTop: '20px' }}>
                  <form onSubmit={handleInviteUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre Completo</label>
                        <input
                          className="form-input"
                          placeholder="Ej: Juan Pérez"
                          value={inviteForm.full_name}
                          onChange={e => setInviteForm(prev => ({ ...prev, full_name: e.target.value }))}
                          required
                          style={{ marginTop: '6px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Correo Electrónico</label>
                        <input
                          className="form-input"
                          type="email"
                          placeholder="Ej: juan.perez@email.com"
                          value={inviteForm.email}
                          onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          style={{ marginTop: '6px' }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ minWidth: '200px' }}>
                        <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rol Asignado</label>
                        <select
                          className="form-select form-input"
                          value={inviteForm.role}
                          onChange={e => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                          style={{ marginTop: '6px' }}
                        >
                          <option value="cashier">Cajero (Solo acceso a terminal de caja)</option>
                          <option value="admin">Administrador (Acceso total excepto facturas)</option>
                          <option value="owner">Dueño (Acceso y control total del comercio)</option>
                        </select>
                      </div>
                      
                      <button
                        type="submit"
                        className="btn btn-secondary"
                        disabled={inviting}
                        style={{ alignSelf: 'flex-end', height: '46px', padding: '0 24px', fontWeight: 700 }}
                      >
                        {inviting ? 'Procesando...' : '📨 Enviar Invitación'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          )}

          {/* TAB SUCURSALES */}
          {activeTab === 'branches' && (
            <div style={{ minHeight: '400px' }}>
              {tenant?.subscription_plan !== 'enterprise' ? (
                <UpgradePrompt 
                  title="Gestión de Múltiples Sucursales" 
                  description="Administra diferentes locales físicos centralizando el control del stock o manteniendo inventarios independientes. Visualiza reportes financieros para cada punto de venta de forma unificada."
                  requiredPlan="enterprise"
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Branches Table List */}
                  <div className="card">
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building size={18} style={{ color: 'var(--color-primary)' }} />
                        <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Sucursales Configuradas</h3>
                      </div>
                      {!showAddBranch && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowAddBranch(true)}
                          style={{ color: '#000', fontWeight: 700 }}
                        >
                          <Plus size={14} /> Nueva Sucursal
                        </button>
                      )}
                    </div>
                    <div className="card-body" style={{ padding: '0', paddingTop: '10px' }}>
                      
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sucursal</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Dirección</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Teléfono</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingBranches ? (
                              <tr>
                                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                  Cargando sucursales...
                                </td>
                              </tr>
                            ) : branches.length === 0 ? (
                              <tr>
                                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                  No hay sucursales registradas. Crea una nueva sucursal.
                                </td>
                              </tr>
                            ) : (
                              branches.map((branch) => (
                                <tr key={branch.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.875rem' }}>
                                  <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        fontSize: '0.8125rem',
                                        color: 'var(--color-secondary)'
                                      }}>
                                        <Building size={14} />
                                      </div>
                                      <div style={{ fontWeight: 600, color: '#fff' }}>{branch.name}</div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{branch.address || 'Sin dirección registrada'}</td>
                                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{branch.phone || 'Sin teléfono'}</td>
                                  <td style={{ padding: '16px' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 8px',
                                      borderRadius: '9999px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      background: 'var(--color-secondary-light)',
                                      color: 'var(--color-secondary)'
                                    }}>
                                      Activa
                                    </span>
                                  </td>
                                  <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <button 
                                      onClick={async () => {
                                        if (!confirm(`¿Deseas eliminar la sucursal ${branch.name}?`)) return
                                        try {
                                          const { error } = await supabase
                                            .from('branches')
                                            .delete()
                                            .eq('id', branch.id)
                                          if (error) throw error
                                          toast.success('Sucursal eliminada')
                                          fetchBranches()
                                        } catch (err) {
                                          toast.error('Error al eliminar sucursal: ' + err.message)
                                        }
                                      }}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--color-error)',
                                        cursor: 'pointer',
                                        opacity: 0.6,
                                        transition: 'opacity 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </div>

                  {/* Add Branch Card */}
                  {showAddBranch && (
                    <div className="card">
                      <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Agregar Nueva Sucursal</h3>
                      </div>
                      <div className="card-body" style={{ paddingTop: '20px' }}>
                        <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                              <label className="form-label required" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre de Sucursal</label>
                              <input 
                                className="form-input"
                                placeholder="Ej: Sucursal Norte"
                                value={newBranch.name}
                                onChange={e => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
                                required
                                style={{ marginTop: '6px' }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Teléfono</label>
                              <input 
                                className="form-input"
                                placeholder="Ej: +54 9 341 444-4444"
                                value={newBranch.phone}
                                onChange={e => setNewBranch(prev => ({ ...prev, phone: e.target.value }))}
                                style={{ marginTop: '6px' }}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dirección Física</label>
                            <input 
                              className="form-input"
                              placeholder="Ej: Av. Alberdi 456, Rosario"
                              value={newBranch.address}
                              onChange={e => setNewBranch(prev => ({ ...prev, address: e.target.value }))}
                              style={{ marginTop: '6px' }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button 
                              type="button" 
                              className="btn btn-ghost" 
                              onClick={() => setShowAddBranch(false)}
                            >
                              Cancelar
                            </button>
                            <button 
                              type="submit" 
                              className="btn btn-secondary"
                              disabled={creatingBranch}
                            >
                              {creatingBranch ? 'Creando...' : 'Crear Sucursal'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB MERCADO PAGO */}
          {activeTab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Integration Credentials Card */}
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CreditCard size={18} style={{ color: '#009EE3' }} />
                      <h3 className="card-title" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Credenciales de Mercado Pago</h3>
                    </div>
                    {form.mp_access_token ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-secondary)', borderRadius: '9999px' }}>
                        Conectado
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-error)', borderRadius: '9999px' }}>
                        Desconectado
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Vincula tus credenciales oficiales para procesar cobros de ventas utilizando códigos QR generados directamente en la pantalla de la Caja.
                  </p>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Access Token (Producción)</label>
                    <input 
                      className="form-input text-xs" 
                      type="password" 
                      value={form.mp_access_token} 
                      onChange={e => updateForm('mp_access_token', e.target.value)} 
                      placeholder="Ej: APP_USR-87654321..." 
                      style={{ marginTop: '6px', fontFamily: 'monospace' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Public Key (Producción)</label>
                    <input 
                      className="form-input text-xs" 
                      value={form.mp_public_key} 
                      onChange={e => updateForm('mp_public_key', e.target.value)} 
                      placeholder="Ej: APP_USR-12345678..." 
                      style={{ marginTop: '6px', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              </div>

              {/* Documentation Helper Box */}
              <div style={{ 
                padding: '20px', 
                background: 'rgba(0, 158, 227, 0.04)', 
                border: '1px solid rgba(0, 158, 227, 0.15)', 
                borderRadius: 'var(--radius-xl)', 
                display: 'flex', 
                gap: '16px',
                alignItems: 'flex-start'
              }}>
                <Info size={20} style={{ color: '#009EE3', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>¿Cómo obtener tus credenciales?</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                    Ingresa con tu cuenta comercial en Mercado Pago Developers. Ve a &quot;Tus integraciones&quot;, selecciona tu aplicación y entra a &quot;Credenciales de producción&quot; para copiar el Access Token y la Public Key.
                  </p>
                  <a 
                    href="https://www.mercadopago.com.ar/developers" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '0.8125rem', 
                      fontWeight: 700, 
                      color: '#009EE3' 
                    }}
                  >
                    Ir a Mercado Pago Developers <ExternalLink size={12} />
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* TAB FACTURACION (MI SUSCRIPCION) */}
          {activeTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Premium billing card wrapper */}
              <div style={{
                padding: '24px',
                background: 
                  tenant?.subscription_status === 'suspended' ? 'rgba(239, 68, 68, 0.05)' :
                  tenant?.subscription_status === 'trial' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                border: `1px solid ${
                  tenant?.subscription_status === 'suspended' ? 'rgba(239, 68, 68, 0.2)' :
                  tenant?.subscription_status === 'trial' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                }`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Pulsing indicator */}
                  <div style={{ position: 'relative', display: 'flex', width: '12px', height: '12px' }}>
                    <span style={{
                      position: 'absolute',
                      display: 'inline-flex',
                      height: '100%',
                      width: '100%',
                      borderRadius: '50%',
                      background: 
                        tenant?.subscription_status === 'suspended' ? 'var(--color-error)' :
                        tenant?.subscription_status === 'trial' ? '#F59E0B' : 'var(--color-secondary)',
                      opacity: 0.75,
                      animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                    <span style={{
                      position: 'relative',
                      display: 'inline-flex',
                      borderRadius: '50%',
                      height: '12px',
                      width: '12px',
                      background: 
                        tenant?.subscription_status === 'suspended' ? 'var(--color-error)' :
                        tenant?.subscription_status === 'trial' ? '#F59E0B' : 'var(--color-secondary)'
                    }} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                      {tenant?.subscription_status === 'trial' ? 'Período de Prueba Activo' : 
                       tenant?.subscription_status === 'suspended' ? 'Suscripción Bloqueada por Pago' : 'Membresía Activa'}
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Tu negocio está en el plan <strong style={{ textTransform: 'capitalize', color: '#fff' }}>{tenant?.subscription_plan || 'Básico'}</strong>. 
                      {tenant?.subscription_status === 'trial' && tenant?.trial_ends_at && (
                        <> Vence el {new Date(tenant.trial_ends_at).toLocaleDateString()} (Quedan {Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - nowTimestamp) / (24 * 60 * 60 * 1000)))} días).</>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  {tenant?.subscription_status !== 'active' && (
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CreditCard size={14} />
                      Elegí un plan en la tabla de abajo para suscribirte
                    </div>
                  )}
                </div>
              </div>

              {/* Plans pricing table */}
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Planes de Membresía</h3>
                
                <div className="pricing-grid">
                  
                  {/* Plan Básico */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: tenant?.subscription_plan === 'basic' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: tenant?.subscription_plan === 'basic' ? 1 : 0.85,
                    boxShadow: tenant?.subscription_plan === 'basic' ? '0 8px 24px rgba(221, 183, 255, 0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Básico</h4>
                        {tenant?.subscription_plan === 'basic' && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '9999px' }}>
                            Activo
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>$20.000</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>ARS / mes</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                        Ideal para pequeños almacenes o kioscos individuales que inician.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        {[
                          { text: 'Punto de venta y caja rápida', active: true },
                          { text: 'Gestión de stock básico', active: true },
                          { text: 'Registro y cierre de turnos', active: true },
                          { text: 'Reportes iniciales de ventas', active: true },
                          { text: 'Estadísticas avanzadas', active: false },
                          { text: 'Soporte multi-sucursal', active: false },
                        ].map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: feat.active ? 'var(--text-primary)' : 'var(--text-muted)', textDecoration: feat.active ? 'none' : 'line-through' }}>
                            {feat.active ? <Check size={14} style={{ color: 'var(--color-secondary)' }} /> : <span style={{ width: '14px', textAlign: 'center' }}>-</span>}
                            {feat.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: '24px', width: '100%', borderColor: 'var(--border-color)' }}
                      disabled={tenant?.subscription_plan === 'basic' || upgrading === 'basic'}
                      onClick={() => handleUpgrade('basic')}
                    >
                      {upgrading === 'basic' ? 'Procesando...' : tenant?.subscription_plan === 'basic' ? 'Tu Plan Actual' : 'Seleccionar Básico'}
                    </button>
                  </div>

                  {/* Plan Profesional */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxShadow: '0 12px 32px rgba(221, 183, 255, 0.15)',
                    transform: 'scale(1.02)',
                    zIndex: 2,
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: '#000', fontWeight: 800, fontSize: '0.6875rem', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '9999px', letterSpacing: '0.05em' }}>
                      Popular / Recomendado
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '4px' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Profesional</h4>
                        {tenant?.subscription_plan === 'professional' && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '9999px' }}>
                            Activo
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>$35.000</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>ARS / mes</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                        Para comercios medianos que buscan impulsar sus ventas y gestionar cuentas corrientes.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        {[
                          { text: 'Todo lo incluido en Básico', active: true },
                          { text: 'Módulo de estadísticas y analíticas', active: true },
                          { text: 'Registro de ventas en cuotas / crédito', active: true },
                          { text: 'Pedidos pendientes de sucursales', active: true },
                          { text: 'Personalización avanzada de marca', active: true },
                          { text: 'Soporte multi-sucursal central', active: false },
                        ].map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: feat.active ? 'var(--text-primary)' : 'var(--text-muted)', textDecoration: feat.active ? 'none' : 'line-through' }}>
                            {feat.active ? <Check size={14} style={{ color: 'var(--color-secondary)' }} /> : <span style={{ width: '14px', textAlign: 'center' }}>-</span>}
                            {feat.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '24px', width: '100%', background: 'var(--color-primary)', color: '#000', fontWeight: 700 }}
                      disabled={tenant?.subscription_plan === 'professional' || upgrading === 'professional'}
                      onClick={() => handleUpgrade('professional')}
                    >
                      {upgrading === 'professional' ? 'Procesando...' : tenant?.subscription_plan === 'professional' ? 'Tu Plan Actual' : 'Seleccionar Profesional'}
                    </button>
                  </div>

                  {/* Plan Empresa */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: tenant?.subscription_plan === 'enterprise' ? '2px solid var(--color-secondary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: tenant?.subscription_plan === 'enterprise' ? 1 : 0.85,
                    boxShadow: tenant?.subscription_plan === 'enterprise' ? '0 8px 24px rgba(78, 222, 163, 0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Empresa</h4>
                        {tenant?.subscription_plan === 'enterprise' && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', background: 'var(--color-secondary-light)', color: 'var(--color-secondary)', borderRadius: '9999px' }}>
                            Activo
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>$60.000</span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>ARS / mes</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                        Para cadenas de comercios y negocios a gran escala con múltiples sucursales.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        {[
                          { text: 'Todo lo incluido en Profesional', active: true },
                          { text: 'Multi-sucursal centralizada', active: true },
                          { text: 'Inventarios cruzados entre locales', active: true },
                          { text: 'Integración API personalizada', active: true },
                          { text: 'Acceso anticipado a funciones', active: true },
                          { text: 'Soporte prioritario dedicado 24/7', active: true },
                        ].map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: feat.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {feat.active ? <Check size={14} style={{ color: 'var(--color-secondary)' }} /> : <span style={{ width: '14px', textAlign: 'center' }}>-</span>}
                            {feat.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: '24px', width: '100%', borderColor: 'var(--border-color)' }}
                      disabled={tenant?.subscription_plan === 'enterprise' || upgrading === 'enterprise'}
                      onClick={() => handleUpgrade('enterprise')}
                    >
                      {upgrading === 'enterprise' ? 'Procesando...' : tenant?.subscription_plan === 'enterprise' ? 'Tu Plan Actual' : 'Seleccionar Empresa'}
                    </button>
                  </div>
                  
                </div>

              </div>

              {/* Developer/Testing sandbox drawer */}
              <div style={{ marginTop: '40px', borderTop: '1px dashed var(--border-color)', paddingTop: '24px' }}>
                <details style={{ background: '#0a0d16', border: '1px solid rgba(255, 178, 183, 0.1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <summary style={{ padding: '16px', fontWeight: 600, color: 'var(--color-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
                    <Activity size={16} />
                    Herramientas de Desarrollador / Simulación (Modo Sandbox)
                  </summary>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#070a12' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Usa estas utilidades para simular diferentes estados de facturación y probar el comportamiento de cobros y webhooks de Mercado Pago.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('tenants')
                            .update({ 
                              subscription_status: 'active',
                              subscription_plan: 'professional' 
                            })
                            .eq('id', tenant.id)
                          if (!error) {
                            toast.success('¡Suscripción simulada como ACTIVA (Profesional)!')
                            window.location.reload()
                          }
                        }}
                      >
                        ✓ Simular Cuenta Activa (Profesional)
                      </button>
                      
                      <button 
                        className="btn btn-sm" 
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
                        onClick={async () => {
                          const { error } = await supabase
                            .from('tenants')
                            .update({ subscription_status: 'suspended' })
                            .eq('id', tenant.id)
                          if (!error) {
                            toast.warning('¡Cuenta suspendida por falta de pago!')
                            window.location.reload()
                          }
                        }}
                      >
                        ⚠️ Simular Cuenta Suspendida
                      </button>

                      <button 
                        className="btn btn-sm" 
                        style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', color: '#F59E0B' }}
                        onClick={async () => {
                          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                          const { error } = await supabase
                            .from('tenants')
                            .update({ 
                              subscription_status: 'trial', 
                              trial_ends_at: yesterday 
                            })
                            .eq('id', tenant.id)
                          if (!error) {
                            toast.warning('¡Prueba gratis simulada como EXPIRADA!')
                            window.location.reload()
                          }
                        }}
                      >
                        ⏳ Simular Prueba Expirada
                      </button>
                    </div>

                    {/* Informative boxes inside details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                      <div style={{ padding: '12px', background: 'rgba(0, 158, 227, 0.05)', border: '1px solid rgba(0, 158, 227, 0.1)', borderRadius: 'var(--radius-md)' }}>
                        <h5 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#009EE3', marginBottom: '6px' }}>Cobro Automático por Webhook</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Mercado Pago Preapprovals emite notificaciones a <code style={{ color: 'var(--color-primary)' }}>/api/webhooks/mercadopago</code>. El backend procesa el estado de acreditación y reactiva la cuenta.
                        </p>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(37, 211, 102, 0.05)', border: '1px solid rgba(37, 211, 102, 0.1)', borderRadius: 'var(--radius-md)' }}>
                        <h5 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#25D366', marginBottom: '6px' }}>Bot de Alertas WhatsApp</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Las notificaciones de cobro próximo y bloqueo se envían vía SMS/WhatsApp usando la plantilla oficial.
                        </p>
                        <button 
                          className="btn btn-sm"
                          style={{ background: '#25D366', color: '#000', marginTop: '8px', width: '100%', fontWeight: 700 }}
                          onClick={() => {
                            toast.info(`📲 [Simulación Bot] De: Smart Caja Alertas 🤖 → Para: ${tenant?.name || 'Comercio'} — "Tu período de prueba vence pronto. Configurá tu facturación para continuar usando Smart Caja."`)
                          }}
                        >
                          📲 Probar Mensaje Bot
                        </button>
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
