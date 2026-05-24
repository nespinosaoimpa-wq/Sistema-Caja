'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import UpgradePrompt from '@/components/ui/UpgradePrompt'

export default function SettingsPage() {
  const { tenant, profile, reloadProfile } = useAuth()
  const supabase = createClient()
  const toast = useToast()
  
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    if (tenant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant.id}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath)

      updateForm('logo_url', publicUrl)
      toast.success('Logo cargado. Guarda los cambios para guardarlo en tu cuenta.')
    } catch (err) {
      console.error(err)
      toast.error('Error al subir imagen. ¿La tabla/storage está habilitada en Supabase?')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    
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

      // Update local CSS variables
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

      await reloadProfile()
      toast.success('Configuración guardada correctamente')
    } catch (err) {
      toast.error('Error al guardar configuración: ' + err.message)
    } finally {
      setLoading(false)
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="app-header" style={{ background: 'transparent', borderBottom: 'none', padding: '0 0 var(--space-4) 0' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700 }}>
            Configuración
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Administrá los datos de tu negocio y sistema
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="app-content" style={{ padding: '0' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { id: 'general', label: '🏪 General' },
            { id: 'users', label: '👥 Usuarios' },
            { id: 'branches', label: '🏢 Sucursales' },
            { id: 'appearance', label: '🎨 Apariencia' },
            { id: 'payments', label: '💳 Mercado Pago' },
            { id: 'billing', label: '📄 Mi Suscripción' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-ghost' : ''}`}
              style={{ 
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: activeTab === tab.id ? 'var(--bg-input)' : 'transparent',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card">
          <div className="card-body">
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', marginBottom: 'var(--space-2)' }}>Datos del Negocio</h3>
                
                <div className="form-group">
                  <label className="form-label required">Nombre del Comercio</label>
                  <input className="form-input" value={form.name} onChange={e => updateForm('name', e.target.value)} />
                </div>
                
                <div className="form-group">
                  <label className="form-label required">Rubro</label>
                  <select className="form-select" value={form.business_type} onChange={e => updateForm('business_type', e.target.value)}>
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
                  <label className="form-label">Dirección (aparecerá en los tickets)</label>
                  <input className="form-input" value={form.address} onChange={e => updateForm('address', e.target.value)} placeholder="Ej: Av. San Martín 1234" />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono de contacto</label>
                  <input className="form-input" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', margin: 'var(--space-4) 0' }} />
                
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', marginBottom: 'var(--space-2)' }}>📍 Región, Moneda e Impuestos (Internacionalización)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Configurá los formatos regionales y la tasa tributaria de tu comercio para adecuar los tickets a tu país.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label required">Moneda del Sistema</label>
                    <select className="form-select" value={form.currency} onChange={e => updateForm('currency', e.target.value)}>
                      <option value="ARS">ARS ($ - Pesos Argentinos)</option>
                      <option value="USD">USD ($ - Dólares Estadounidenses)</option>
                      <option value="EUR">EUR (€ - Euros)</option>
                      <option value="MXN">MXN ($ - Pesos Mexicanos)</option>
                      <option value="CLP">CLP ($ - Pesos Chilenos)</option>
                      <option value="COP">COP ($ - Pesos Colombianos)</option>
                      <option value="UYU">UYU ($ - Pesos Uruguayos)</option>
                      <option value="BRL">BRL (R$ - Real Brasileño)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Formato Regional (Locale)</label>
                    <select className="form-select" value={form.locale} onChange={e => updateForm('locale', e.target.value)}>
                      <option value="es-AR">es-AR (Español - Argentina)</option>
                      <option value="en-US">en-US (English - United States)</option>
                      <option value="es-ES">es-ES (Español - España)</option>
                      <option value="es-MX">es-MX (Español - México)</option>
                      <option value="es-CL">es-CL (Español - Chile)</option>
                      <option value="es-CO">es-CO (Español - Colombia)</option>
                      <option value="es-UY">es-UY (Español - Uruguay)</option>
                      <option value="pt-BR">pt-BR (Português - Brasil)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre del Impuesto</label>
                    <input className="form-input" value={form.tax_name} onChange={e => updateForm('tax_name', e.target.value)} placeholder="Ej: IVA, TAX, VAT, GST" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Porcentaje de Impuesto (%)</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={form.tax_rate} onChange={e => updateForm('tax_rate', e.target.value)} placeholder="Ej: 21 (0 para exento)" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem' }}>Gestión de Cajeros y Administradores</h3>
                  <button className="btn btn-primary btn-sm">Invitar Usuario</button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Los usuarios invitados recibirán un correo para crear su contraseña.
                </p>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{profile?.full_name || 'Vos'} (Propietario)</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{profile?.email}</div>
                    </div>
                    <span className="badge badge-primary">Dueño</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div style={{ minHeight: '400px' }}>
                {tenant?.subscription_plan !== 'enterprise' ? (
                  <UpgradePrompt 
                    title="Múltiples Sucursales" 
                    description="Administra diferentes puntos de venta centralizando el inventario o manteniendo stock independiente. Visualiza reportes por cada local."
                    requiredPlan="enterprise"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem' }}>Sucursales del Comercio</h3>
                      <button className="btn btn-primary btn-sm">+ Nueva Sucursal</button>
                    </div>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', background: 'var(--bg-input)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Casa Central</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{form.address || 'Sin dirección'}</div>
                        </div>
                        <span className="badge badge-success">Activa</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', marginBottom: 'var(--space-1)' }}>Personalización Visual</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Personalizá el logo, los colores y el fondo de tu sistema para adaptarlo a tu marca.</p>
                
                {/* Logo Section */}
                <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Logo Actual</label>
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="Logo de la empresa" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        🏪
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: '240px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Logo de tu Emprendimiento (Imagen)</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                          className="btn"
                          style={{ border: '1px solid var(--border-color)', padding: '8px 16px', background: 'rgba(255,255,255,0.03)', color: '#fff', cursor: 'pointer' }}
                          onClick={() => document.getElementById('logo-upload').click()}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? 'Subiendo...' : '📁 Subir Imagen'}
                        </button>
                        {form.logo_url && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ color: 'var(--color-error)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            onClick={() => updateForm('logo_url', '')}
                          >
                            Eliminar Logo
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">O pega la URL del Logo directamente</label>
                      <input
                        className="form-input"
                        placeholder="https://ejemplo.com/mi-logo.png"
                        value={form.logo_url}
                        onChange={e => updateForm('logo_url', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Color Principal</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input type="color" value={form.primary_color} onChange={e => updateForm('primary_color', e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} />
                      <input className="form-input" value={form.primary_color} onChange={e => updateForm('primary_color', e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Color Secundario (Éxito)</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input type="color" value={form.secondary_color} onChange={e => updateForm('secondary_color', e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} />
                      <input className="form-input" value={form.secondary_color} onChange={e => updateForm('secondary_color', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Background Presets Section */}
                <div className="form-group">
                  <label className="form-label">Tema de Fondo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    {[
                      { id: 'matte', name: 'Gris Matte (Original)', color: '#060e20' },
                      { id: 'cosmic', name: 'Violeta Cósmico', color: '#0c081e' },
                      { id: 'ocean', name: 'Azul Océano', color: '#020d1a' },
                      { id: 'midnight', name: 'Negro Puro', color: '#000000' }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => updateForm('background_preset', preset.id)}
                        style={{
                          background: preset.color,
                          border: form.background_preset === preset.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 12px',
                          cursor: 'pointer',
                          color: '#fff',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: form.background_preset === preset.id ? '0 0 12px rgba(221,183,255,0.2)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', border: '3px solid #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {form.background_preset === preset.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#009EE3' }}>Mercado Pago</span> Integración
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                  Vinculá tu cuenta de Mercado Pago para permitir cobros con QR y tarjetas directo desde el sistema (Próximamente).
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.125rem' }}>Estado de Suscripción</h3>
                
                {/* Subscription Status details */}
                <div style={{ 
                  padding: 'var(--space-6)', 
                  background: tenant?.subscription_status === 'trial' ? 'var(--color-tertiary-light)' : tenant?.subscription_status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-secondary-light)', 
                  border: `1px solid ${tenant?.subscription_status === 'trial' ? 'var(--color-tertiary)' : tenant?.subscription_status === 'suspended' ? 'var(--color-error)' : 'var(--color-secondary)'}`, 
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tenant?.subscription_status === 'trial' ? 'var(--color-tertiary)' : tenant?.subscription_status === 'suspended' ? 'var(--color-error)' : 'var(--color-secondary)', marginBottom: '4px' }}>
                      {tenant?.subscription_status === 'trial' ? 'Período de Prueba (Gratis)' : tenant?.subscription_status === 'suspended' ? 'Suscripción Suspendida ⚠️' : 'Suscripción Activa ✓'}
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Plan: <strong style={{ textTransform: 'capitalize' }}>{tenant?.subscription_plan}</strong> (${tenant?.subscription_plan === 'basic' ? '20.000' : tenant?.subscription_plan === 'professional' ? '35.000' : '60.000'} ARS / mes)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {tenant?.subscription_status === 'trial' ? `Finaliza el: ${new Date(tenant?.trial_ends_at).toLocaleDateString()}` : 'Próximo vencimiento de factura: En 30 días'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={async () => {
                        const { error } = await supabase
                          .from('tenants')
                          .update({ 
                            subscription_status: 'active',
                            subscription_plan: 'professional' 
                          })
                          .eq('id', tenant.id)
                        if (!error) {
                          toast.success('Suscripción simulada con éxito!')
                          window.location.reload()
                        }
                      }}
                    >
                      💳 Suscribirse por Mercado Pago
                    </button>
                    
                    <button 
                      className="btn btn-ghost" 
                      style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
                      onClick={async () => {
                        const { error } = await supabase
                          .from('tenants')
                          .update({ subscription_status: 'suspended' })
                          .eq('id', tenant.id)
                        if (!error) {
                          toast.warning('¡Servicio suspendido en modo dev!')
                          window.location.reload()
                        }
                      }}
                    >
                      ⚠️ Simular Suspensión
                    </button>

                    <button 
                      className="btn btn-ghost" 
                      style={{ border: '1px solid var(--color-tertiary)', color: 'var(--color-tertiary)' }}
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
                          toast.warning('Prueba expirada en modo dev!')
                          window.location.reload()
                        }
                      }}
                    >
                      ⏳ Simular Prueba Expirada
                    </button>
                  </div>
                </div>

                {/* Technical details explaining subscription mechanism */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
                  
                  {/* Mercado Pago Subscription Explanation */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#009EE3', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🔗 ¿Cómo funciona el pago de membresías?
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      Las membresías se cobran de forma recurrente utilizando la API de <strong>Mercado Pago Preapprovals</strong>. 
                    </p>
                    <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>Creas un Plan de Suscripción en Mercado Pago con el precio fijado.</li>
                      <li>Al hacer clic en &quot;Suscribirse&quot;, el sistema redirecciona al usuario al checkout oficial.</li>
                      <li>Cuando el abono se acredita, Mercado Pago envía un webhook al sistema en <code style={{ color: 'var(--color-primary)' }}>/api/webhooks/mercadopago</code>.</li>
                      <li>El servidor valida la firma y reactiva la cuenta en Supabase para el negocio.</li>
                    </ol>
                  </div>

                  {/* WhatsApp Message Alert Bot */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#25D366', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🤖 Bot de Alertas de Pago Atrasado (WhatsApp/Email)
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      El sistema cuenta con un script automatizado que realiza chequeos diarios y avisa a los comercios de sus facturas:
                    </p>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      <li><strong>Faltan 3 días:</strong> Alerta preventivo amarillo dentro del panel.</li>
                      <li><strong>Vence hoy:</strong> Envío de correo electrónico automático y alerta vía WhatsApp.</li>
                      <li><strong>Suspendido (1 día de atraso):</strong> Mensaje de WhatsApp bloqueante informando de la suspensión.</li>
                    </ul>
                    
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ background: '#25D366', border: 'none', color: '#000', fontWeight: 700 }}
                      onClick={() => {
                        toast.info('Simulación de Bot enviada!');
                        setTimeout(() => {
                          alert(`[MOCK WHATSAPP BOT]
De: Smart Caja Alertas 🤖
Para: Administrador de ${tenant?.name || 'Comercio'}

Estimado cliente, le recordamos que su período de prueba de Smart Caja vence mañana. Evite el bloqueo automático de su terminal de ventas registrando su medio de pago aquí: https://smartcaja.com.ar/billing-checkout`)
                        }, 500)
                      }}
                    >
                      📲 Probar Mensaje de WhatsApp del Bot
                    </button>
                  </div>

                </div>

                <div style={{ marginTop: 'var(--space-6)' }}>
                  <h4 style={{ marginBottom: 'var(--space-4)', fontSize: '1rem', fontWeight: 700 }}>Planes Disponibles</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="card" style={{ border: tenant?.subscription_plan === 'basic' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', opacity: tenant?.subscription_plan === 'basic' ? 1 : 0.6 }}>
                      <div className="card-body" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Básico</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0' }}>$20.000</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Caja, Inventario básico</div>
                      </div>
                    </div>
                    <div className="card" style={{ border: tenant?.subscription_plan === 'professional' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', opacity: tenant?.subscription_plan === 'professional' ? 1 : 0.6 }}>
                      <div className="card-body" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Profesional</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: 'var(--color-primary)' }}>$35.000</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+ Estadísticas, Cuotas</div>
                      </div>
                    </div>
                    <div className="card" style={{ border: tenant?.subscription_plan === 'enterprise' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', opacity: tenant?.subscription_plan === 'enterprise' ? 1 : 0.6 }}>
                      <div className="card-body" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>Empresa</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: 'var(--color-secondary)' }}>$60.000</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+ Multi-sucursal, API</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
