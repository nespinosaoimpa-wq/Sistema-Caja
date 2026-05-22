'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
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
    if (tenant?.id) {
      loadData()
    }
  }, [tenant?.id, timeRange])

  const loadData = async () => {
    setLoading(true)
    // Mocking exact data from the screenshot for perfect layout matching
    setStats({
      totalSales: 847500,
      transactions: 234,
      avgTicket: 3621,
      netProfit: 312400,
      profitMargin: 36.8,
      hourlyData: [
        { name: '09:00', value: 30000, isPeak: false },
        { name: '10:00', value: 45000, isPeak: false },
        { name: '12:00', value: 40000, isPeak: false },
        { name: '14:00', value: 85000, isPeak: true },
        { name: '15:00', value: 125000, isPeak: true },
        { name: '17:00', value: 35000, isPeak: false },
        { name: '18:00', value: 45000, isPeak: false },
        { name: '20:00', value: 50000, isPeak: false },
        { name: '21:00', value: 30000, isPeak: false },
      ],
      paymentMethods: [
        { name: 'Débito', value: 45, color: '#A855F7' },
        { name: 'Crédito', value: 30, color: '#10B981' },
        { name: 'Efectivo', value: 20, color: '#FDBA74' },
        { name: 'Otros', value: 5, color: '#3F3F46' }
      ],
      topProducts: [
        { name: 'Café Especial Blend', qty: 142, max: 150 },
        { name: 'Croissant Frances', qty: 98, max: 150 },
        { name: 'Té Matcha Orgánico', qty: 75, max: 150 }
      ],
      stagnantProducts: [
        { name: 'Bebida Energética V2', days: 12 },
        { name: 'Galletas de Avena Miel', days: 8 }
      ]
    })
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
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
              <div className="kpi-change up">↗ +12% vs sem pasada</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Transacciones</span>
                <div className="kpi-icon-box" style={{ color: 'var(--color-primary)' }}>📋</div>
              </div>
              <div className="kpi-value">{stats.transactions}</div>
              <div className="kpi-change up">↗ +8% vs sem pasada</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Ticket Promedio</span>
                <div className="kpi-icon-box" style={{ color: 'var(--color-primary)' }}>🏷️</div>
              </div>
              <div className="kpi-value">${(stats.avgTicket).toLocaleString('es-AR')}</div>
              <div className="kpi-change up">↗ +5% vs sem pasada</div>
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
                      ticks={['09:00', '12:00', '15:00', '18:00', '21:00']} 
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
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>234</div>
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
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
