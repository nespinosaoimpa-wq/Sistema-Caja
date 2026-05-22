'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { formatCurrency } from '@/lib/utils/formatters'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts'

export default function AnalyticsPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')
  
  const [stats, setStats] = useState({
    totalSales: 0,
    transactions: 0,
    avgTicket: 0,
    netProfit: 0,
    profitMargin: 0,
    hourlyData: [],
    paymentMethods: [],
    topProducts: [],
    stagnantProducts: []
  })

  useEffect(() => {
    if (tenant?.id && tenant?.subscription_plan !== 'basic') {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, timeRange])

  async function loadData() {
    setLoading(true)
    try {
      const now = new Date()
      let startDate
      
      if (timeRange === 'day') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (timeRange === 'week') {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      // Fetch sales in period
      const { data: sales } = await supabase
        .from('sales')
        .select('id, total, payment_method, created_at, status')
        .eq('tenant_id', tenant.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      // Fetch sale items with cost for profit calculation
      const saleIds = (sales || []).map(s => s.id)
      const { data: items } = saleIds.length > 0 
        ? await supabase
          .from('sale_items')
          .select('product_name, quantity, unit_price, cost_price, sale_id')
          .eq('tenant_id', tenant.id)
          .in('sale_id', saleIds)
        : { data: [] }

      // Fetch stagnant products
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: stagnant } = await supabase
        .from('products')
        .select('name, last_sold_at')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .or(`last_sold_at.is.null,last_sold_at.lt.${thirtyDaysAgo.toISOString()}`)
        .limit(5)

      // Calculate stats
      const salesList = sales || []
      const itemsList = items || []
      const totalSales = salesList.reduce((sum, s) => sum + (s.total || 0), 0)
      const transactions = salesList.length
      const avgTicket = transactions > 0 ? totalSales / transactions : 0
      
      const totalCost = itemsList.reduce((sum, i) => sum + ((i.cost_price || 0) * (i.quantity || 1)), 0)
      const totalRevenue = itemsList.reduce((sum, i) => sum + ((i.unit_price || 0) * (i.quantity || 1)), 0)
      const netProfit = totalRevenue - totalCost
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0

      // Hourly data
      const hourlyMap = {}
      salesList.forEach(s => {
        const hour = new Date(s.created_at).getHours()
        const key = `${hour.toString().padStart(2, '0')}:00`
        hourlyMap[key] = (hourlyMap[key] || 0) + (s.total || 0)
      })
      const maxHourly = Math.max(...Object.values(hourlyMap), 0)
      const hourlyData = Object.entries(hourlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => ({ name, value, isPeak: value >= maxHourly * 0.7 }))

      // Payment methods
      const pmMap = {}
      salesList.forEach(s => {
        const method = s.payment_method || 'cash'
        pmMap[method] = (pmMap[method] || 0) + 1
      })
      const pmColors = { cash: '#FDBA74', debit: '#A855F7', credit: '#10B981', combined: '#3B82F6', installment: '#F43F5E' }
      const pmLabels = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', combined: 'Combinado', installment: 'Fiado' }
      const totalPm = Object.values(pmMap).reduce((a, b) => a + b, 0)
      const paymentMethods = Object.entries(pmMap).map(([key, count]) => ({
        name: pmLabels[key] || key,
        value: totalPm > 0 ? Math.round(count / totalPm * 100) : 0,
        color: pmColors[key] || '#3F3F46'
      }))

      // Top products
      const productMap = {}
      itemsList.forEach(i => {
        const name = i.product_name
        productMap[name] = (productMap[name] || 0) + (i.quantity || 1)
      })
      const topProducts = Object.entries(productMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      const maxQty = topProducts.length > 0 ? topProducts[0][1] : 1
      const topProductsFormatted = topProducts.map(([name, qty]) => ({ name, qty, max: maxQty }))

      // Stagnant products
      const stagnantProducts = (stagnant || []).map(p => ({
        name: p.name,
        days: p.last_sold_at ? Math.floor((Date.now() - new Date(p.last_sold_at).getTime()) / (1000 * 60 * 60 * 24)) : 30
      }))

      setStats({
        totalSales, transactions, avgTicket: Math.round(avgTicket),
        netProfit, profitMargin: Math.round(profitMargin * 10) / 10,
        hourlyData: hourlyData.length > 0 ? hourlyData : [{ name: 'Sin datos', value: 0, isPeak: false }],
        paymentMethods: paymentMethods.length > 0 ? paymentMethods : [{ name: 'Sin ventas', value: 100, color: '#3F3F46' }],
        topProducts: topProductsFormatted,
        stagnantProducts
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {tenant?.subscription_plan === 'basic' ? (
        <UpgradePrompt 
          title="Análisis Avanzado"
          description="Desbloquea estadísticas detalladas de ventas y productos."
          requiredPlan="professional"
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
          Estadísticas de Ventas
        </h1>
        <div className="toggle-group">
          <button className={`toggle-btn ${timeRange === 'day' ? 'active' : ''}`} onClick={() => setTimeRange('day')}>Hoy</button>
          <button className={`toggle-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>Esta semana</button>
          <button className={`toggle-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>Este mes</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Cargando...</div>
      ) : (
        <>
          {/* Row 1: KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Total Ventas</span>
                <div className="kpi-icon-box" style={{ color: 'var(--color-primary)' }}>🖨️</div>
              </div>
              <div className="kpi-value">${(stats.totalSales).toLocaleString('es-AR')}</div>
              <div className="kpi-change up">Métricas reales en tiempo real</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Transacciones</span>
                <div className="kpi-icon-box" style={{ color: 'var(--color-primary)' }}>📋</div>
              </div>
              <div className="kpi-value">{stats.transactions}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Ticket Promedio</span>
                <div className="kpi-icon-box" style={{ color: 'var(--color-primary)' }}>🏷️</div>
              </div>
              <div className="kpi-value">${(stats.avgTicket).toLocaleString('es-AR')}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Ganancia Neta</span>
                <div className="kpi-icon-box" style={{ color: 'var(--color-secondary)' }}>💵</div>
              </div>
              <div className="kpi-value success">${(stats.netProfit).toLocaleString('es-AR')}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Margen: {stats.profitMargin}%</div>
            </div>
          </div>

          {/* Row 2: Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
            {/* Bar Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Ventas por hora</span>
                <span style={{ color: 'var(--text-muted)' }}>...</span>
              </div>
              <div className="card-body" style={{ height: '300px', paddingTop: 'var(--space-6)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2735" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: '#2A2735' }}
                      dy={10} 
                    />
                    <Tooltip cursor={{ fill: '#1A1822' }} contentStyle={{ background: '#13111A', border: '1px solid #2A2735' }} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {stats.hourlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isPeak ? 'var(--color-primary)' : '#2A2735'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Métodos de Pago</span>
              </div>
              <div className="card-body" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.paymentMethods}
                        innerRadius={70}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {stats.paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>{stats.transactions}</div>
                  </div>
                </div>
                {/* Custom Legend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', padding: '0 16px' }}>
                  {stats.paymentMethods.map((pm, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pm.color }}></div>
                      {pm.name} ({pm.value}%)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Lists */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
            
            {/* Top Products */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Top 5 Productos más vendidos</span>
              </div>
              <div className="card-body">
                {stats.topProducts.map((prod, i) => (
                  <div key={i} style={{ padding: '16px 0', borderBottom: i < 2 ? '1px solid #2A2735' : 'none' }}>
                    <div className="flex justify-between" style={{ marginBottom: '8px', fontSize: '0.875rem' }}>
                      <span style={{ color: '#fff' }}>{prod.name}</span>
                      <span style={{ color: 'var(--color-secondary)' }}>{prod.qty} uds</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${(prod.qty / prod.max) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
                {stats.topProducts.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '16px 0' }}>No hay ventas en este período</div>
                )}
              </div>
            </div>

            {/* Stagnant Products */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Productos Estancados</span>
                <span style={{ color: 'var(--text-muted)' }}>ⓘ</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.stagnantProducts.map((prod, i) => (
                  <div key={i} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' 
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3F2C1D', color: '#FDBA74', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        📦
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>{prod.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sin ventas</div>
                      </div>
                    </div>
                    <div style={{ background: '#3F2C1D', color: '#FDBA74', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6875rem' }}>
                      {prod.days} días
                    </div>
                  </div>
                ))}
                {stats.stagnantProducts.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '16px 0' }}>No hay productos estancados</div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
        </>
      )}
    </div>
  )
}
