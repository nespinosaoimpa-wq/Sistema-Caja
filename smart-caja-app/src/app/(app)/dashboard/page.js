'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils/formatters'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Bell, Plus, Rocket, MessageSquare, Check, ShoppingCart } from 'lucide-react'

export default function DashboardPage() {
  const { tenant, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [recentSales, setRecentSales] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [stats, setStats] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    monthSales: 0,
    totalProducts: 0,
    openShifts: 0,
    totalShifts: 0,
    totalSales: 0,
    chartData: []
  })

  useEffect(() => {
    if (tenant?.id) {
      loadStats()
    }
  }, [tenant?.id])

  const loadStats = async () => {
    setLoading(true)
    
    try {
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      // Fetch all completed sales (for chart + month + today)
      const { data: sales } = await supabase
        .from('sales')
        .select('total, created_at')
        .eq('tenant_id', tenant.id)
        .eq('status', 'completed')
        .gte('created_at', monthStart)

      // Fetch recent sales for activity feed (real data)
      const { data: latestSales } = await supabase
        .from('sales')
        .select('id, ticket_number, total, payment_method, created_at, profiles:user_id(full_name)')
        .eq('tenant_id', tenant.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch product count
      const { count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      // Fetch products for low stock count check (selecting only necessary columns)
      const { data: stockProducts, error: stockError } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_alert')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)

      if (stockError) {
        console.error('Error fetching stock products for count:', stockError)
      }

      const calculatedLowStockCount = stockProducts
        ? stockProducts.filter(p => p.stock_quantity <= p.min_stock_alert).length
        : 0

      // Fetch open shifts
      const { count: shiftCount } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'open')

      const { count: totalShiftsCount } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      const { count: totalSalesCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      // Calculate KPIs from real data
      let todayTotal = 0
      let yesterdayTotal = 0
      let monthTotal = 0

      const hours = ['08h', '10h', '12h', '14h', '16h', '18h', '20h']
      const hourlyTotals = { '08h': 0, '10h': 0, '12h': 0, '14h': 0, '16h': 0, '18h': 0, '20h': 0 }

      if (sales) {
        sales.forEach(sale => {
          const date = new Date(sale.created_at)
          if (date.toDateString() === today.toDateString()) {
            todayTotal += Number(sale.total)
            const hour = date.getHours()
            const timeLabel = hour < 10 ? '08h' : hour < 12 ? '10h' : hour < 14 ? '12h' : hour < 16 ? '14h' : hour < 18 ? '16h' : hour < 20 ? '18h' : '20h'
            hourlyTotals[timeLabel] += Number(sale.total)
          }
          const yesterday = new Date(today)
          yesterday.setDate(today.getDate() - 1)
          if (date.toDateString() === yesterday.toDateString()) {
            yesterdayTotal += Number(sale.total)
          }
          monthTotal += Number(sale.total)
        })
      }

      const actualProducts = prodCount || 0
      const actualSales = totalSalesCount || 0
      const hasSales = actualSales > 0

      const chartData = hours.map(h => ({
        name: h,
        total: hasSales ? hourlyTotals[h] : (h === '08h' ? 0 : h === '10h' ? 12000 : h === '12h' ? 25000 : h === '14h' ? 18000 : h === '16h' ? 32000 : h === '18h' ? 45000 : 58000)
      }))

      setRecentSales(latestSales || [])
      setLowStockCount(calculatedLowStockCount)
      setStats({
        todaySales: todayTotal,
        yesterdaySales: yesterdayTotal,
        monthSales: monthTotal,
        totalProducts: actualProducts,
        openShifts: shiftCount || 0,
        totalShifts: totalShiftsCount || 0,
        totalSales: actualSales,
        chartData
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Verification of quickstart onboarding steps
  // 1. Configured details if address or custom values set
  const step1Completed = !!(tenant?.address || tenant?.theme_config?.tax_rate !== 21 || tenant?.theme_config?.currency !== 'ARS')
  // 2. Added products
  const step2Completed = stats.totalProducts > 0
  // 3. Opened first shift
  const step3Completed = stats.totalShifts > 0
  // 4. Completed first sale
  const step4Completed = stats.totalSales > 0

  const completedStepsCount = [step1Completed, step2Completed, step3Completed, step4Completed].filter(Boolean).length
  const progressPercent = completedStepsCount * 25
  const showOnboarding = stats.totalSales === 0 || stats.totalProducts === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
      {/* Premium Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Hola, {profile?.full_name?.split(' ')[0] || 'Admin'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Aquí está el resumen de <strong style={{ color: '#fff' }}>{tenant?.name}</strong> al día de hoy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" style={{ borderRadius: 'var(--radius-full)', padding: '10px' }}>
            <Bell size={20} />
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/pos')} style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Nueva Venta
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-2xl)' }} />)}
        </div>
      ) : (
        <>
          {/* Guía de Inicio Rápido interactiva */}
          {showOnboarding && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(26, 22, 37, 0.6) 0%, rgba(11, 19, 38, 0.8) 100%)',
              border: '1px solid rgba(221, 183, 255, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(124, 58, 237, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Rocket size={24} style={{ color: 'var(--color-primary)' }} />
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-headline)', color: '#fff' }}>
                      ¡Bienvenido a tu Smart Caja! Guía de Inicio Rápido
                    </h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Completá estos sencillos pasos para activar tu negocio y comenzar a vender hoy mismo.
                  </p>
                  
                  {/* Progress bar */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>
                      <span>Progreso de configuración</span>
                      <span>{progressPercent}% ({completedStepsCount} de 4)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', transition: 'width 0.5s ease-out', borderRadius: '999px' }} />
                    </div>
                  </div>
                </div>
                
                {/* Support Box */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '320px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} style={{ color: 'var(--color-secondary)' }} /> Soporte Humano por WhatsApp
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    ¿Tenés dudas o querés ayuda para cargar tus productos masivamente? Chateá directo con un asesor real.
                  </p>
                  <a 
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '543425162372'}?text=Hola%20Smart%20Caja!%20Acabo%20de%20registrarme%20y%20necesito%20ayuda%20para%20configurar%20mi%20negocio%20${encodeURIComponent(tenant?.name || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{ background: '#25D366', color: '#fff', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
                  >
                    <MessageSquare size={14} /> Chatear con Soporte
                  </a>
                </div>
              </div>
              
              {/* Checklist Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  {
                    title: '1. Datos del Comercio',
                    desc: 'Configurá dirección, moneda e impuestos.',
                    link: '/settings',
                    actionLabel: 'Ir a Configuración',
                    completed: step1Completed
                  },
                  {
                    title: '2. Cargar Productos',
                    desc: 'Agregá artículos a tu catálogo con stock.',
                    link: '/inventory',
                    actionLabel: 'Cargar Producto',
                    completed: step2Completed
                  },
                  {
                    title: '3. Abrir Caja Registradora',
                    desc: 'Iniciá un turno con tu efectivo inicial.',
                    link: '/pos',
                    actionLabel: 'Abrir Caja / Turno',
                    completed: step3Completed
                  },
                  {
                    title: '4. Registrar Primera Venta',
                    desc: 'Realizá un cobro y emití tu primer ticket.',
                    link: '/pos',
                    actionLabel: 'Ir al Punto de Venta',
                    completed: step4Completed
                  }
                ].map((step, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      background: step.completed ? 'rgba(78, 222, 163, 0.03)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${step.completed ? 'rgba(78, 222, 163, 0.2)' : 'rgba(255,255,255,0.03)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s',
                      opacity: step.completed ? 0.85 : 1
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: step.completed ? 'var(--color-secondary)' : 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: step.completed ? '#000' : 'var(--text-muted)',
                          fontWeight: 700
                        }}>
                          <Check size={12} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: step.completed ? 'var(--color-secondary)' : '#fff', textDecoration: step.completed ? 'line-through' : 'none' }}>
                          {step.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {step.desc}
                      </p>
                    </div>
                    
                    {!step.completed && (
                      <button 
                        onClick={() => router.push(step.link)}
                        className="btn btn-sm btn-ghost" 
                        style={{ 
                          width: '100%', 
                          fontSize: '0.75rem', 
                          padding: '6px', 
                          background: 'rgba(124, 58, 237, 0.1)', 
                          color: 'var(--color-primary)', 
                          border: '1px solid rgba(124, 58, 237, 0.2)',
                          justifyContent: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {step.actionLabel} →
                      </button>
                    )}
                    {step.completed && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', padding: '6px 0' }}>
                        <Check size={14} /> Completado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Alert Banner */}
          {lowStockCount > 0 && (
            <div style={{
              background: 'rgba(255,178,183,0.08)',
              border: '1px solid rgba(255,178,183,0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-error)', fontSize: '0.9375rem' }}>
                    {lowStockCount} producto{lowStockCount > 1 ? 's' : ''} con stock crítico
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '8px' }}>
                    Revisá y reabastecé antes de quedarte sin stock.
                  </span>
                </div>
              </div>
              <button className="btn btn-sm" onClick={() => router.push('/inventory')} style={{ background: 'rgba(255,178,183,0.15)', color: 'var(--color-error)', border: '1px solid rgba(255,178,183,0.3)', whiteSpace: 'nowrap' }}>
                Ver Inventario →
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
            <div className="kpi-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
              <div className="kpi-label">Ventas de Hoy</div>
              <div className="kpi-value primary">{formatCurrency(stats.todaySales)}</div>
              {stats.yesterdaySales > 0 ? (
                <div className={`kpi-change ${stats.todaySales >= stats.yesterdaySales ? 'up' : 'down'}`}>
                  {stats.todaySales >= stats.yesterdaySales ? '↑' : '↓'} {Math.abs(Math.round((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales * 100))}% vs ayer
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Ventas del día actual</div>
              )}
            </div>
            
            <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="kpi-label">Ingresos del Mes</div>
              <div className="kpi-value success">{formatCurrency(stats.monthSales)}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Mes en curso</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Productos en Catálogo</div>
              <div className="kpi-value" style={{ color: '#e2e8f0' }}>{stats.totalProducts}</div>
              <div className="kpi-change" style={{ background: 'transparent', color: 'var(--text-muted)', padding: 0 }}>Gestión de inventario</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Cajas Abiertas</div>
              <div className="kpi-value" style={{ color: '#e2e8f0' }}>{stats.openShifts}</div>
              <div className="kpi-change" style={{ background: 'transparent', color: 'var(--text-muted)', padding: 0 }}>Turnos activos</div>
            </div>
          </div>

          {/* Charts & Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
            
            {/* Main Chart Card */}
            <div className="card">
              <div className="card-header" style={{ border: 'none', paddingBottom: 0 }}>
                <span className="card-title" style={{ fontSize: '1.25rem' }}>Evolución de Ventas (Hoy)</span>
                <select className="form-select btn-sm" style={{ width: 'auto', background: 'rgba(255,255,255,0.05)', border: 'none' }}>
                  <option>Hoy</option>
                  <option>Esta semana</option>
                </select>
              </div>
              <div className="card-body" style={{ height: '380px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18, 18, 28, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                      itemStyle={{ color: '#fff', fontWeight: 700 }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions / Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div className="card" style={{ background: 'linear-gradient(145deg, var(--color-primary-hover), #4C1D95)', borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="card-body" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Punto de Venta</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>Accede rápidamente a la caja registradora para empezar a cobrar.</p>
                    <button className="btn" style={{ background: '#fff', color: 'var(--color-primary)', width: '100%' }} onClick={() => router.push('/pos')}>
                      Abrir Caja →
                    </button>
                  </div>
                  <ShoppingCart size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, transform: 'rotate(-15deg)', zIndex: 1, color: '#fff' }} />
                </div>
              </div>

              <div className="card" style={{ flex: 1 }}>
                <div className="card-header" style={{ border: 'none' }}>
                  <span className="card-title">Últimas Ventas</span>
                  {recentSales.length > 0 && (
                    <button className="btn btn-sm btn-ghost" onClick={() => router.push('/sales')} style={{ fontSize: '0.75rem' }}>Ver todo →</button>
                  )}
                </div>
                <div className="card-body" style={{ padding: '0 var(--space-6)' }}>
                  {recentSales.length === 0 ? (
                    <div style={{ padding: 'var(--space-6) 0', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛒</div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aún no hay ventas registradas.</p>
                      <button className="btn btn-sm btn-primary" style={{ marginTop: '12px' }} onClick={() => router.push('/pos')}>Ir al POS →</button>
                    </div>
                  ) : (
                    recentSales.map((sale, i) => {
                      const mins = Math.floor((Date.now() - new Date(sale.created_at).getTime()) / 60000)
                      const timeAgo = mins < 1 ? 'Ahora' : mins < 60 ? `Hace ${mins} min` : mins < 1440 ? `Hace ${Math.floor(mins/60)}h` : `Hace ${Math.floor(mins/1440)}d`
                      const pmIcons = { cash: '💵', debit: '💳', credit: '💳', transfer: '📲', combined: '🔀', installment: '📋' }
                      return (
                        <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: i < recentSales.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                            {pmIcons[sale.payment_method] || '🛒'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Venta #{sale.ticket_number}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{timeAgo}</div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-secondary)', whiteSpace: 'nowrap' }}>
                            +{formatCurrency(sale.total)}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
