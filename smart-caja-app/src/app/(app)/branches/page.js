'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'

export default function BranchesPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  
  const loadBranches = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true })

    if (data) setBranches(data)
    setLoading(false)
  }, [supabase, tenant])

  useEffect(() => {
    if (tenant?.id && tenant.subscription_plan === 'enterprise') {
      const timer = setTimeout(() => {
        loadBranches()
      }, 0)
      return () => clearTimeout(timer)
    } else if (tenant) {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [tenant, loadBranches])

  // Verificación de Plan
  if (loading) return <div style={{ padding: 'var(--space-8)' }}>Cargando...</div>
  if (tenant?.subscription_plan !== 'enterprise') {
    return (
      <UpgradePrompt 
        title="Módulo Multi-Sucursal" 
        description="Agrega nuevos puntos de venta bajo una misma administración central. Gestiona inventarios, cajeros y reportes unificados de ventas para cada sucursal."
        requiredPlan="enterprise"
      />
    )
  }

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.5rem', fontWeight: 700 }}>
            🏢 Sucursales
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Administra los puntos de venta de tu negocio
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => router.push('/settings?tab=branches')}>
            + Nueva Sucursal
          </button>
        </div>
      </div>

      <div className="app-content">
        <div className="card">
          <div className="card-body">
            {branches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🏬</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No tienes sucursales</h3>
                <p style={{ color: 'var(--text-muted)' }}>Todavía no has agregado ninguna sucursal adicional. Tu local principal funciona como Casa Central.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {branches.map(b => (
                  <div key={b.id} style={{
                    border: '1px solid var(--border-color)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-input)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '1.125rem' }}>{b.name}</h4>
                      <span className={`badge ${b.is_active ? 'badge-success' : 'badge-error'}`}>
                        {b.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📍 {b.address || 'Sin dirección'}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📞 {b.phone || 'Sin teléfono'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
