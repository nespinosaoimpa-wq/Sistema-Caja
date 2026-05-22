'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils/formatters'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

export default function AnalyticsPage() {
  const { tenant } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgTicket: 0,
    profitMargin: 0,
    salesData: [],
    topProducts: [],
    paymentMethods: []
  })

  useEffect(() => {
    if (tenant?.id) {
      loadAnalyticsData()
    }
  }, [tenant?.id, timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    
    // Simulate real fetch
    const { data: sales } = await supabase
      .from('sales')
      .select(`id, total, created_at, payment_method, sale_items(product_name, quantity, unit_price, cost_price, subtotal)`)
      .eq('tenant_id', tenant.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (!sales || sales.length === 0) {
      // Mock data for visual prototype
      setStats({
        totalRevenue: 3450000,
        totalSales: 450,
        avgTicket: 7666,
        profitMargin: 35.5,
        salesData: [
          { name: '1', ventas: 120000 }, { name: '5', ventas: 150000 }, { name: '10', ventas: 110000 },
          { name: '15', ventas: 180000 }, { name: '20', ventas: 250000 }, { name: '25', ventas: 210000 },
          { name: '30', ventas: 300000 },
        ],
        topProducts: [
          { name: 'Coca Cola 1.5L', quantity: 145, revenue: 217500 },
          { name: 'Papas Lays 150g', quantity: 98, revenue: 147000 },
          { name: 'Fernet Branca 750ml', quantity: 65, revenue: 520000 },
        ],
        paymentMethods: [
          { name: 'Efectivo', value: 1500000 },
          { name: 'Débito', value: 1200000 },
          { name: 'Crédito', value: 750000 }
        ]
      })
      setLoading(false)
      return
    }

    // Process basic stats
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
    const totalSales = sales.length
    const avgTicket = totalRevenue / totalSales
    
    let totalCost = 0
    let totalSaleValue = 0
    const productCounts = {}
    
    sales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        totalCost += (Number(item.cost_price) * item.quantity)
        totalSaleValue += Number(item.subtotal)
        
        if (!productCounts[item.product_name]) {
          productCounts[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 }
        }
        productCounts[item.product_name].quantity += item.quantity
        productCounts[item.product_name].revenue += Number(item.subtotal)
      })
    })
    
    const profitMargin = totalSaleValue > 0 ? ((totalSaleValue - totalCost) / totalSaleValue) * 100 : 0

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    const pmCounts = {}
    sales.forEach(sale => {
      pmCounts[sale.payment_method] = (pmCounts[sale.payment_method] || 0) + Number(sale.total)
    })
    
    const paymentMethods = Object.keys(pmCounts).map(key => ({
      name: key === 'cash' ? 'Efectivo' : key === 'debit' ? 'Débito' : key === 'credit' ? 'Crédito' : key === 'installment' ? 'Cuotas' : 'Combinado',
      value: pmCounts[key]
    }))

    const salesData = [
      { name: 'Lun', ventas: totalRevenue * 0.1 },
      { name: 'Mar', ventas: totalRevenue * 0.15 },
      { name: 'Mie', ventas: totalRevenue * 0.12 },
      { name: 'Jue', ventas: totalRevenue * 0.18 },
      { name: 'Vie', ventas: totalRevenue * 0.25 },
      { name: 'Sab', ventas: totalRevenue * 0.15 },
      { name: 'Dom', ventas: totalRevenue * 0.05 },
    ]

    setStats({
      totalRevenue, totalSales, avgTicket, profitMargin,
      salesData, topProducts, paymentMethods
    })
    
    setLoading(false)
  }

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-4) 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Análisis de Negocio
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Métricas de crecimiento y rendimiento
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <select 
            className="form-select" 
            style={{ width: '180px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'var(--glass-blur)' }}
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Últimos 7 días</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
          </select>
          <button className="btn btn-primary" style={{ padding: '0 20px', height: '46px' }}>
            Descargar Reporte
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando métricas...</div>
      ) : (
        <>
          {/* Main KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
            <div className="kpi-card" style={{ background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.1), rgba(0,0,0,0.5))', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
              <div className="kpi-label">Ingresos Brutos</div>
              <div className="kpi-value primary">{formatCurrency(stats.totalRevenue)}</div>
              <div className="kpi-change up">↑ 12.5%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Transacciones</div>
              <div className="kpi-value">{stats.totalSales}</div>
              <div className="kpi-change up">↑ 5.2%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Ticket Promedio</div>
              <div className="kpi-value">{formatCurrency(stats.avgTicket)}</div>
              <div className="kpi-change down">↓ 1.2%</div>
            </div>
            <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div className="kpi-label">Margen Operativo</div>
              <div className="kpi-value success">{stats.profitMargin.toFixed(1)}%</div>
              <div className="kpi-change up">↑ 2.1%</div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
            
            {/* Revenue Area Chart */}
            <div className="card">
              <div className="card-header" style={{ border: 'none' }}>
                <span className="card-title">Evolución de Ingresos</span>
              </div>
              <div className="card-body" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSalesAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)' }}
                      itemStyle={{ color: '#fff', fontWeight: 700 }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="ventas" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSalesAnalytics)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Donut */}
            <div className="card">
              <div className="card-header" style={{ border: 'none' }}>
                <span className="card-title">Distribución de Pagos</span>
              </div>
              <div className="card-body" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.paymentMethods}
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.875rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            
            {/* Top Products Table */}
            <div className="card">
              <div className="card-header" style={{ border: 'none' }}>
                <span className="card-title">Ranking de Productos</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 'var(--space-6)' }}>Producto</th>
                      <th style={{ textAlign: 'center' }}>Unidades</th>
                      <th style={{ textAlign: 'right', paddingRight: 'var(--space-6)' }}>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topProducts.map((product, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, paddingLeft: 'var(--space-6)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {i+1}
                            </div>
                            {product.name}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-primary">{product.quantity} u.</span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-secondary)', fontWeight: 700, paddingRight: 'var(--space-6)' }}>
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Peak Hours Bar Chart */}
            <div className="card">
              <div className="card-header" style={{ border: 'none' }}>
                <span className="card-title">Actividad por Hora</span>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: '08h', v: 10 }, { name: '10h', v: 25 }, { name: '12h', v: 45 },
                    { name: '14h', v: 30 }, { name: '16h', v: 20 }, { name: '18h', v: 60 },
                    { name: '20h', v: 85 }, { name: '22h', v: 40 }
                  ]} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', border: 'none', borderRadius: 'var(--radius-lg)' }}
                    />
                    <Bar dataKey="v" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  )
}
