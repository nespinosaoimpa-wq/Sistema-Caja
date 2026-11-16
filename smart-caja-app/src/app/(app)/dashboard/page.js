'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  Bell, Plus, Rocket, MessageSquare, Check, ShoppingCart, 
  Calendar, Banknote, CreditCard, Split, ClipboardList, 
  Trash2, TrendingUp, TrendingDown, Users, Shield, Clock, 
  AlertTriangle, Package, CheckCircle2, ArrowRight, DollarSign,
  UserCheck, Store
} from 'lucide-react'

export default function DashboardPage() {
  const { tenant, profile } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today') // 'today' | 'week' | 'month'
  
  // Branch states (enterprise)
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [rawData, setRawData] = useState(null)

  const [recentSales, setRecentSales] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)

  // Aggregated dashboard metrics
  const [stats, setStats] = useState({
    periodSalesTotal: 0,
    periodTransactionsCount: 0,
    periodAvgTicket: 0,
    prevPeriodSalesTotal: 0,
    growthPercent: 0,
    // Payment method breakdown
    totalCash: 0,
    cashCount: 0,
    cashPct: 0,
    totalCard: 0,
    cardCount: 0,
    cardPct: 0,
    totalMixed: 0,
    mixedCount: 0,
    mixedPct: 0,
    totalInstallment: 0,
    installmentCount: 0,
    installmentPct: 0,
    // Waste / Desperdicios
    totalWasteCost: 0,
    totalWasteQty: 0,
    wasteItems: [],
    // Net balance
    totalExpenses: 0,
    netBalance: 0,
    // Cash registers / Shifts
    openShiftsCount: 0,
    activeShiftsList: [],
    // Responsible user performance (Dueño vs Empleado)
    cashierStats: [],
    // Catalog stats
    totalProducts: 0,
    chartData: [],
    bestSellers: [],
    topCustomers: [],
    stagnantProducts: []
  })

  const loadStats = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    
    try {
      const today = new Date()
      // Fetch 60 days to cover current period and comparison periods
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)

      // 1. Fetch completed sales with payment details & profile role
      const { data: sales, error: salesErr } = await supabase
        .from('sales')
        .select(`
          id, ticket_number, total, payment_method, payment_details, 
          created_at, source, online_order_id, branch_id, user_id, 
          profiles:user_id (id, full_name, email, role)
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'completed')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (salesErr) console.error('Error fetching sales for dashboard:', salesErr)

      // 2. Fetch all team profiles for this tenant (to differentiate owner vs employees)
      const { data: tenantProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active')
        .eq('tenant_id', tenant.id)

      // 3. Fetch shifts with user profiles
      const { data: allShifts } = await supabase
        .from('shifts')
        .select(`
          id, user_id, branch_id, status, opening_cash, closing_cash, 
          opened_at, closed_at, total_cash_sales, total_transactions, notes, 
          profiles:user_id (id, full_name, role)
        `)
        .eq('tenant_id', tenant.id)
        .gte('opened_at', sixtyDaysAgo.toISOString())
        .order('opened_at', { ascending: false })

      // 4. Products count & stock alerts
      const { count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      const { data: stockProducts } = await supabase
        .from('products')
        .select('stock_quantity, min_stock_alert, control_stock')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)

      // 5. Total sales count
      const { count: totalSalesCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)

      // 6. Sale items of the current month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const { data: monthItems } = await supabase
        .from('sale_items')
        .select('product_name, quantity, subtotal, sales:sale_id(branch_id)')
        .eq('tenant_id', tenant.id)
        .gte('created_at', monthStart)

      // 7. Customers
      const { data: topCusts } = await supabase
        .from('customers')
        .select('id, name, phone, total_purchases, total_spent')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('total_purchases', { ascending: false })
        .limit(5)

      // 8. Expenses
      const { data: expensesData } = await supabase
        .from('cash_movements')
        .select('amount, category, reason, created_at, shift_id, user_id, shifts:shift_id(branch_id)')
        .eq('tenant_id', tenant.id)
        .eq('type', 'expense')
        .gte('created_at', sixtyDaysAgo.toISOString())

      // 9. Waste movements (adjustments with [DESPERDICIO] prefix)
      const { data: wasteData } = await supabase
        .from('stock_movements')
        .select(`
          id, quantity_change, created_at, notes, user_id,
          products:product_id (name, cost_price, unit_label, unit_type)
        `)
        .eq('tenant_id', tenant.id)
        .eq('type', 'adjustment')
        .ilike('notes', '[DESPERDICIO]%')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      // 10. Exchange sales
      const { data: exchangeSalesData } = await supabase
        .from('sales')
        .select('id, ticket_number, created_at, exchange_items, exchange_total, branch_id, user_id')
        .eq('tenant_id', tenant.id)
        .not('exchange_items', 'is', null)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      // 11. Stagnant products
      const { data: stagnantProds } = await supabase
        .from('products')
        .select('name, last_sold_at')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .or(`last_sold_at.is.null,last_sold_at.lt.${sixtyDaysAgo.toISOString()}`)
        .order('last_sold_at', { ascending: true })
        .limit(5)

      setRawData({
        sales: sales || [],
        tenantProfiles: tenantProfiles || [],
        prodCount: prodCount || 0,
        stockProducts: stockProducts || [],
        allShifts: allShifts || [],
        totalSalesCount: totalSalesCount || 0,
        monthItems: monthItems || [],
        topCusts: topCusts || [],
        expensesData: expensesData || [],
        wasteData: wasteData || [],
        exchangeSalesData: exchangeSalesData || [],
        stagnantProds: stagnantProds || []
      })

    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, tenant])

  useEffect(() => {
    if (tenant?.id) {
      loadStats()
    }
  }, [tenant?.id, loadStats])

  useEffect(() => {
    if (tenant?.id && tenant.subscription_plan === 'enterprise') {
      supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')
        .then(({ data }) => {
          if (data) setBranches(data)
        })
    }
  }, [tenant, supabase])

  // Lock branch filter for cashiers with fixed branch
  useEffect(() => {
    if (profile?.branch_id) {
      setSelectedBranch(profile.branch_id)
    }
  }, [profile])

  // Aggregate stats dynamically based on chosen period and branch
  useEffect(() => {
    if (!rawData) return

    const now = new Date()
    const branchFilter = selectedBranch
    const isFiltered = branchFilter !== 'all'

    // 1. Date boundaries for period selection
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)

    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    weekStart.setHours(0, 0, 0, 0)
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    prevWeekStart.setHours(0, 0, 0, 0)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)

    let filterStart = todayStart
    let prevFilterStart = yesterdayStart
    let prevFilterEnd = todayStart

    if (period === 'week') {
      filterStart = weekStart
      prevFilterStart = prevWeekStart
      prevFilterEnd = weekStart
    } else if (period === 'month') {
      filterStart = monthStart
      prevFilterStart = prevMonthStart
      prevFilterEnd = monthStart
    }

    // 2. Branch filtering
    const branchFilteredSales = rawData.sales.filter(sale => {
      if (!isFiltered) return true
      if (branchFilter === 'central') return !sale.branch_id
      return sale.branch_id === branchFilter
    })

    const branchFilteredShifts = rawData.allShifts.filter(shift => {
      if (!isFiltered) return true
      if (branchFilter === 'central') return !shift.branch_id
      return shift.branch_id === branchFilter
    })

    const branchFilteredExpenses = rawData.expensesData.filter(exp => {
      const shiftBranch = exp.shifts?.branch_id
      if (!isFiltered) return true
      if (branchFilter === 'central') return !shiftBranch
      return shiftBranch === branchFilter
    })

    const branchFilteredExchanges = rawData.exchangeSalesData.filter(sale => {
      if (!isFiltered) return true
      if (branchFilter === 'central') return !sale.branch_id
      return sale.branch_id === branchFilter
    })

    // 3. Period Sales
    const periodSales = branchFilteredSales.filter(s => new Date(s.created_at) >= filterStart)
    const prevPeriodSales = branchFilteredSales.filter(s => {
      const d = new Date(s.created_at)
      return d >= prevFilterStart && d < prevFilterEnd
    })

    const periodSalesTotal = periodSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const prevPeriodSalesTotal = prevPeriodSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const periodTransactionsCount = periodSales.length
    const periodAvgTicket = periodTransactionsCount > 0 ? (periodSalesTotal / periodTransactionsCount) : 0

    let growthPercent = 0
    if (prevPeriodSalesTotal > 0) {
      growthPercent = Math.round(((periodSalesTotal - prevPeriodSalesTotal) / prevPeriodSalesTotal) * 100)
    }

    // 4. Payment Methods Breakdown
    // Cash
    const cashSales = periodSales.filter(s => s.payment_method === 'cash')
    const directCash = cashSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const mixedCash = periodSales.filter(s => s.payment_method === 'combined')
      .reduce((sum, s) => sum + Number(s.payment_details?.cash || 0), 0)
    const totalCash = directCash + mixedCash
    const cashCount = cashSales.length
    const cashPct = periodSalesTotal > 0 ? Math.round((totalCash / periodSalesTotal) * 100) : 0

    // Card (Debit + Credit)
    const cardSales = periodSales.filter(s => s.payment_method === 'debit' || s.payment_method === 'credit')
    const directCard = cardSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const mixedCard = periodSales.filter(s => s.payment_method === 'combined')
      .reduce((sum, s) => sum + (Number(s.payment_details?.card || 0) + Number(s.payment_details?.mp || 0)), 0)
    const totalCard = directCard + mixedCard
    const cardCount = cardSales.length
    const cardPct = periodSalesTotal > 0 ? Math.round((totalCard / periodSalesTotal) * 100) : 0

    // Mixed
    const mixedSales = periodSales.filter(s => s.payment_method === 'combined')
    const totalMixed = mixedSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const mixedCount = mixedSales.length
    const mixedPct = periodSalesTotal > 0 ? Math.round((totalMixed / periodSalesTotal) * 100) : 0

    // Installment / Fiado (Cuentas Corrientes)
    const installmentSales = periodSales.filter(s => s.payment_method === 'installment')
    const totalInstallment = installmentSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const installmentCount = installmentSales.length
    const installmentPct = periodSalesTotal > 0 ? Math.round((totalInstallment / periodSalesTotal) * 100) : 0

    // 5. Waste / Desperdicios & Mermas in selected period
    const periodWaste = rawData.wasteData.filter(w => new Date(w.created_at) >= filterStart)
    const manualWasteCost = periodWaste.reduce((sum, w) => {
      const cost = Number(w.products?.cost_price || 0)
      const qty = Math.abs(Number(w.quantity_change || 0))
      return sum + (cost * qty)
    }, 0)
    const manualWasteQty = periodWaste.reduce((sum, w) => sum + Math.abs(Number(w.quantity_change || 0)), 0)

    const periodExchanges = branchFilteredExchanges.filter(s => new Date(s.created_at) >= filterStart)
    let exchangeWasteCost = 0
    let exchangeWasteQty = 0
    periodExchanges.forEach(s => {
      (s.exchange_items || []).forEach(ei => {
        const q = parseFloat(ei.quantity || ei.qty || 0)
        const c = parseFloat(ei.cost_price || 0)
        exchangeWasteCost += (q * c)
        exchangeWasteQty += q
      })
    })

    const totalWasteCost = manualWasteCost + exchangeWasteCost
    const totalWasteQty = manualWasteQty + exchangeWasteQty

    const wasteItems = []
    periodWaste.forEach(w => {
      const cost = Number(w.products?.cost_price || 0)
      const qty = Math.abs(Number(w.quantity_change || 0))
      wasteItems.push({
        id: w.id,
        name: w.products?.name || 'Producto',
        qty,
        unit: w.products?.unit_label || 'un',
        loss: cost * qty,
        reason: w.notes?.replace('[DESPERDICIO] ', '') || 'Merma',
        date: new Date(w.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
      })
    })

    // 6. Expenses in period
    const periodExpenses = branchFilteredExpenses.filter(e => new Date(e.created_at) >= filterStart)
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const netBalance = periodSalesTotal - totalWasteCost - totalExpenses

    // 7. Shifts & Cash Register Control
    const openShifts = branchFilteredShifts.filter(s => s.status === 'open')
    const activeShiftsList = openShifts.map(sh => {
      const cashierProfile = (rawData.tenantProfiles || []).find(p => p.id === sh.user_id) || sh.profiles
      const shiftSales = branchFilteredSales.filter(s => s.shift_id === sh.id)
      const shiftTotal = shiftSales.reduce((sum, s) => sum + Number(s.total || 0), 0)
      const shiftCash = shiftSales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + Number(s.total || 0), 0)
      return {
        id: sh.id,
        user_id: sh.user_id,
        userName: cashierProfile?.full_name || 'Cajero',
        userRole: cashierProfile?.role || 'cashier',
        openedAt: sh.opened_at,
        openingCash: Number(sh.opening_cash || 0),
        shiftTotal,
        shiftCash,
        expectedCash: Number(sh.opening_cash || 0) + shiftCash
      }
    })

    // 8. Responsible User Performance: Dueño vs Empleado (Cajero)
    const userMap = {}
    ;(rawData.tenantProfiles || []).forEach(p => {
      userMap[p.id] = {
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        role: p.role || 'cashier',
        totalSales: 0,
        salesCount: 0,
        cashAmount: 0,
        cardAmount: 0,
        installmentAmount: 0,
        mixedAmount: 0,
        hasOpenShift: openShifts.some(sh => sh.user_id === p.id),
        openShiftCash: openShifts.find(sh => sh.user_id === p.id)?.opening_cash || 0
      }
    })

    periodSales.forEach(s => {
      const uid = s.user_id || 'unknown'
      if (!userMap[uid]) {
        userMap[uid] = {
          id: uid,
          name: s.profiles?.full_name || 'Desconocido',
          email: s.profiles?.email || '',
          role: s.profiles?.role || 'cashier',
          totalSales: 0,
          salesCount: 0,
          cashAmount: 0,
          cardAmount: 0,
          installmentAmount: 0,
          mixedAmount: 0,
          hasOpenShift: openShifts.some(sh => sh.user_id === uid),
          openShiftCash: openShifts.find(sh => sh.user_id === uid)?.opening_cash || 0
        }
      }
      const amt = Number(s.total || 0)
      userMap[uid].totalSales += amt
      userMap[uid].salesCount += 1
      if (s.payment_method === 'cash') userMap[uid].cashAmount += amt
      else if (s.payment_method === 'debit' || s.payment_method === 'credit') userMap[uid].cardAmount += amt
      else if (s.payment_method === 'installment') userMap[uid].installmentAmount += amt
      else if (s.payment_method === 'combined') {
        userMap[uid].mixedAmount += amt
        userMap[uid].cashAmount += Number(s.payment_details?.cash || 0)
        userMap[uid].cardAmount += (Number(s.payment_details?.card || 0) + Number(s.payment_details?.mp || 0))
      }
    })

    const cashierStats = Object.values(userMap)
      .filter(u => u.totalSales > 0 || u.hasOpenShift)
      .map(u => ({
        ...u,
        percent: periodSalesTotal > 0 ? Math.round((u.totalSales / periodSalesTotal) * 100) : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)

    // 9. Chart Evolution Data based on Period
    let chartData = []
    if (period === 'today') {
      const hours = ['08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h']
      const hourlyCash = { '08h': 0, '10h': 0, '12h': 0, '14h': 0, '16h': 0, '18h': 0, '20h': 0, '22h': 0 }
      const hourlyOther = { '08h': 0, '10h': 0, '12h': 0, '14h': 0, '16h': 0, '18h': 0, '20h': 0, '22h': 0 }

      periodSales.forEach(s => {
        const d = new Date(s.created_at)
        const h = d.getHours()
        const label = h < 10 ? '08h' : h < 12 ? '10h' : h < 14 ? '12h' : h < 16 ? '14h' : h < 18 ? '16h' : h < 20 ? '18h' : h < 22 ? '20h' : '22h'
        const amt = Number(s.total || 0)
        if (s.payment_method === 'cash') hourlyCash[label] += amt
        else hourlyOther[label] += amt
      })

      chartData = hours.map(h => ({
        name: h,
        Efectivo: hourlyCash[h],
        TarjetasOtros: hourlyOther[h],
        total: hourlyCash[h] + hourlyOther[h]
      }))
    } else if (period === 'week') {
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        last7Days.push({
          dateStr: d.toDateString(),
          name: dayNames[d.getDay()],
          Efectivo: 0,
          TarjetasOtros: 0,
          total: 0
        })
      }

      periodSales.forEach(s => {
        const sDate = new Date(s.created_at).toDateString()
        const found = last7Days.find(item => item.dateStr === sDate)
        if (found) {
          const amt = Number(s.total || 0)
          if (s.payment_method === 'cash') found.Efectivo += amt
          else found.TarjetasOtros += amt
          found.total += amt
        }
      })
      chartData = last7Days
    } else {
      // Month (Weeks 1 to 5)
      const weeks = [
        { name: 'Sem 1', start: 1, end: 7, Efectivo: 0, TarjetasOtros: 0, total: 0 },
        { name: 'Sem 2', start: 8, end: 14, Efectivo: 0, TarjetasOtros: 0, total: 0 },
        { name: 'Sem 3', start: 15, end: 21, Efectivo: 0, TarjetasOtros: 0, total: 0 },
        { name: 'Sem 4', start: 22, end: 28, Efectivo: 0, TarjetasOtros: 0, total: 0 },
        { name: 'Sem 5', start: 29, end: 31, Efectivo: 0, TarjetasOtros: 0, total: 0 }
      ]
      periodSales.forEach(s => {
        const d = new Date(s.created_at)
        const day = d.getDate()
        const w = weeks.find(item => day >= item.start && day <= item.end)
        if (w) {
          const amt = Number(s.total || 0)
          if (s.payment_method === 'cash') w.Efectivo += amt
          else w.TarjetasOtros += amt
          w.total += amt
        }
      })
      chartData = weeks
    }

    // 10. Low stock products count
    const calculatedLowStockCount = (rawData.stockProducts || [])
      .filter(p => p.control_stock !== false && p.stock_quantity <= p.min_stock_alert).length

    // 11. Recent sales list for quick view
    const latestFive = branchFilteredSales.slice(0, 6)

    setRecentSales(latestFive)
    setLowStockCount(calculatedLowStockCount)
    setStats({
      periodSalesTotal,
      periodTransactionsCount,
      periodAvgTicket,
      prevPeriodSalesTotal,
      growthPercent,
      totalCash,
      cashCount,
      cashPct,
      totalCard,
      cardCount,
      cardPct,
      totalMixed,
      mixedCount,
      mixedPct,
      totalInstallment,
      installmentCount,
      installmentPct,
      totalWasteCost,
      totalWasteQty,
      wasteItems: wasteItems.slice(0, 5),
      totalExpenses,
      netBalance,
      openShiftsCount: openShifts.length,
      activeShiftsList,
      cashierStats,
      totalProducts: rawData.prodCount || 0,
      chartData,
      bestSellers: [],
      topCustomers: rawData.topCusts || [],
      stagnantProducts: (rawData.stagnantProds || []).map(p => ({
        name: p.name,
        days: p.last_sold_at ? Math.floor((Date.now() - new Date(p.last_sold_at).getTime()) / (1000 * 60 * 60 * 24)) : 30
      }))
    })

  }, [rawData, period, selectedBranch, profile, tenant])

  const [nowTimestamp] = useState(() => Date.now())

  // Verification of quickstart onboarding steps
  const step1Completed = !!(tenant?.address || tenant?.theme_config?.tax_rate !== 21 || tenant?.theme_config?.currency !== 'ARS')
  const step2Completed = stats.totalProducts > 0
  const step3Completed = (rawData?.allShifts?.length || 0) > 0
  const step4Completed = (rawData?.totalSalesCount || 0) > 0

  const completedStepsCount = [step1Completed, step2Completed, step3Completed, step4Completed].filter(Boolean).length
  const progressPercent = completedStepsCount * 25
  const showOnboarding = stats.totalProducts === 0 || (rawData?.totalSalesCount || 0) === 0

  const periodLabel = period === 'today' ? 'Hoy' : (period === 'week' ? 'Esta Semana' : 'Este Mes')
  const prevPeriodLabel = period === 'today' ? 'ayer' : (period === 'week' ? 'semana anterior' : 'mes anterior')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
      
      {/* ================= HEADER WITH CLEAN STYLING & ARGENTINA ACCENT ================= */}
      <div style={{
        position: 'relative',
        padding: '28px var(--space-6)',
        borderRadius: 'var(--radius-2xl)',
        background: 'linear-gradient(135deg, #0d1527 0%, #17233d 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute', top: '-40px', right: '20%', width: '220px', height: '120px',
          background: 'rgba(56, 189, 248, 0.08)', filter: 'blur(50px)', pointerEvents: 'none'
        }} />

        {/* User Identity & Greeting */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#fff' }}>
              Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
            </h1>
            
            {/* Clear Role Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 800,
              background: profile?.role === 'owner' ? 'rgba(234, 179, 8, 0.15)' : profile?.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: profile?.role === 'owner' ? '#EAB308' : profile?.role === 'admin' ? '#C084FC' : '#60A5FA',
              border: `1px solid ${profile?.role === 'owner' ? 'rgba(234, 179, 8, 0.35)' : profile?.role === 'admin' ? 'rgba(168, 85, 247, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`
            }}>
              {profile?.role === 'owner' ? '👑 Dueño / Propietario' : profile?.role === 'admin' ? '⚡ Administrador' : '👤 Empleado (Cajero)'}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Control de ventas y balance de <strong style={{ color: '#fff' }}>{tenant?.name}</strong>.</span>
            <span style={{ 
              color: '#38bdf8', fontSize: '0.8125rem', fontWeight: 700, 
              borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '10px' 
            }}>
              🇦🇷 Industria Argentina
            </span>
          </p>
        </div>

        {/* Actions & Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          
          {/* Branch filter (Enterprise) */}
          {tenant?.subscription_plan === 'enterprise' && !profile?.branch_id && (
            <select
              className="form-select btn-sm"
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              style={{
                width: 'auto', background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff',
                padding: '8px 14px', borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <option value="all">Todas las sucursales</option>
              <option value="central">Casa Central (Matriz)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          {/* New Sale Button */}
          <button 
            className="btn btn-primary" 
            onClick={() => router.push('/pos')} 
            style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', height: '42px', fontWeight: 700 }}
          >
            <Plus size={18} /> Cobrar en Caja
          </button>
        </div>
      </div>

      {/* ================= PERIOD SELECTOR TABS (Día / Semanal / Mensual) ================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-card)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
            Período de Análisis:
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            ({period === 'today' ? 'Día de hoy' : period === 'week' ? 'Últimos 7 días' : 'Mes en curso'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-base)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'today', label: '☀️ Hoy (Día)' },
            { id: 'week', label: '📅 Esta Semana' },
            { id: 'month', label: '📊 Este Mes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                background: period === tab.id ? 'var(--color-primary)' : 'transparent',
                color: period === tab.id ? '#fff' : 'var(--text-secondary)',
                boxShadow: period === tab.id ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-2xl)' }} />)}
        </div>
      ) : (
        <>
          {/* ================= ONBOARDING CHECKLIST (IF NEW USER) ================= */}
          {showOnboarding && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(26, 22, 37, 0.7) 0%, rgba(11, 19, 38, 0.85) 100%)',
              border: '1px solid rgba(221, 183, 255, 0.25)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Rocket size={24} style={{ color: 'var(--color-primary)' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      Configuración Inicial de tu Smart Caja
                    </h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Completá los pasos para empezar a vender: cargá productos con código interno o de barras y abrí tu primer turno.
                  </p>
                  
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>
                      <span>Progreso de configuración</span>
                      <span>{progressPercent}% ({completedStepsCount} de 4)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '999px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => router.push('/inventory/new')} style={{ border: '1px solid var(--border-color)' }}>
                    + Cargar Producto
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => router.push('/pos')}>
                    Abrir Caja
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= LOW STOCK ALERT ================= */}
          {lowStockCount > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-error)', fontSize: '0.875rem' }}>
                    {lowStockCount} producto{lowStockCount > 1 ? 's' : ''} con stock bajo o agotado
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginLeft: '8px' }}>
                    Revisá tus existencias para no perder ventas.
                  </span>
                </div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => router.push('/inventory')} style={{ color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.3)' }}>
                Ver Inventario →
              </button>
            </div>
          )}

          {/* ================= 4 MAIN KPI CARDS (PERIOD BALANCE) ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
            
            {/* 1. Total Sales Balance */}
            <div className="kpi-card" style={{ borderColor: 'rgba(139, 92, 246, 0.35)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="kpi-label">Ventas Totales ({periodLabel})</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-value primary" style={{ fontSize: '2rem', marginTop: '4px' }}>
                {formatCurrency(stats.periodSalesTotal)}
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                <span><strong>{stats.periodTransactionsCount}</strong> ventas</span>
                <span>·</span>
                <span>Ticket prom: <strong>{formatCurrency(stats.periodAvgTicket)}</strong></span>
              </div>
              {stats.prevPeriodSalesTotal > 0 && (
                <div className={`kpi-change ${stats.growthPercent >= 0 ? 'up' : 'down'}`} style={{ marginTop: '8px', display: 'inline-block' }}>
                  {stats.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(stats.growthPercent)}% vs {prevPeriodLabel}
                </div>
              )}
            </div>

            {/* 2. Waste / Desperdicios Metric */}
            <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="kpi-label">Desperdicios y Mermas ({periodLabel})</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-error)' }}>
                  <Trash2 size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: 'var(--color-error)', fontSize: '2rem', marginTop: '4px' }}>
                -{formatCurrency(stats.totalWasteCost)}
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                <span>Total descartado: <strong>{stats.totalWasteQty.toFixed(2).replace(/\.00$/, '')} kg / uds</strong></span>
              </div>
              <button 
                onClick={() => router.push('/waste')}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: 700, padding: 0, marginTop: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Registrar Desperdicio →
              </button>
            </div>

            {/* 3. Net Balance */}
            <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.35)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="kpi-label">Balance Neto ({periodLabel})</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="kpi-value success" style={{ fontSize: '2rem', marginTop: '4px' }}>
                {formatCurrency(stats.netBalance)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Ventas ({formatCurrency(stats.periodSalesTotal)}) - Mermas ({formatCurrency(stats.totalWasteCost)})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Gastos operativos: {formatCurrency(stats.totalExpenses)}
              </div>
            </div>

            {/* 4. Cash Register Shift Control */}
            <div className="kpi-card" style={{ borderColor: 'rgba(56, 189, 248, 0.35)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="kpi-label">Cajas y Turnos</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#38bdf8', fontSize: '2rem', marginTop: '4px' }}>
                {stats.openShiftsCount} {stats.openShiftsCount === 1 ? 'Activa' : 'Activas'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {stats.openShiftsCount > 0 ? 'Turnos de caja abiertos' : 'Sin cajas abiertas en este momento'}
              </div>
              <button 
                onClick={() => router.push('/shifts')}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, padding: 0, marginTop: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Control de Caja / Turnos →
              </button>
            </div>

          </div>

          {/* ================= PAYMENT METHODS BREAKDOWN ("Efectivo, Tarjetas, Mixto, Fiado") ================= */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Banknote size={18} style={{ color: 'var(--color-secondary)' }} />
                Desglose por Método de Pago ({periodLabel})
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Total Período: <strong style={{ color: '#fff' }}>{formatCurrency(stats.periodSalesTotal)}</strong>
              </span>
            </div>

            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                
                {/* 1. EFECTIVO */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.04)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      💵 Efectivo (Cash)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-secondary)', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                      {stats.cashPct}%
                    </span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(stats.totalCash)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stats.cashCount} cobros exclusivamente en efectivo
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${stats.cashPct}%`, height: '100%', background: 'var(--color-secondary)', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* 2. TARJETAS / QR */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.04)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      💳 Tarjetas (Débito / Crédito)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                      {stats.cardPct}%
                    </span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(stats.totalCard)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stats.cardCount} cobros con tarjeta / QR
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${stats.cardPct}%`, height: '100%', background: '#60a5fa', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* 3. PAGO MIXTO */}
                <div style={{
                  background: 'rgba(168, 85, 247, 0.04)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔀 Pago Mixto
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                      {stats.mixedPct}%
                    </span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(stats.totalMixed)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stats.mixedCount} ventas divididas (efectivo + tarjeta)
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${stats.mixedPct}%`, height: '100%', background: '#c084fc', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* 4. FIADO (CUENTA CORRIENTE) */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.04)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📋 Fiado (A Cuenta / Cuotas)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                      {stats.installmentPct}%
                    </span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(stats.totalInstallment)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stats.installmentCount} ventas cargadas a cuenta deudora
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${stats.installmentPct}%`, height: '100%', background: '#fbbf24', borderRadius: '3px' }} />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ================= CONTROL DE CAJA Y RESPONSABLES: DUEÑO VS EMPLEADO ================= */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} style={{ color: 'var(--color-primary)' }} />
                  Control de Caja por Responsable ({periodLabel})
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Diferenciación exacta entre lo que vendió el Dueño y cada Empleado/Cajero.
                </p>
              </div>
              <button 
                onClick={() => router.push('/shifts')} 
                className="btn btn-sm btn-ghost"
                style={{ border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
              >
                Historial de Turnos →
              </button>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {stats.cashierStats.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay ventas registradas en este período.
                </div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Responsable</th>
                        <th>Rol</th>
                        <th style={{ textAlign: 'right' }}>Total Vendido</th>
                        <th style={{ textAlign: 'center' }}>Ventas</th>
                        <th style={{ textAlign: 'right' }}>Efectivo</th>
                        <th style={{ textAlign: 'right' }}>Tarjetas</th>
                        <th style={{ textAlign: 'right' }}>Fiado</th>
                        <th style={{ textAlign: 'center' }}>Caja Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.cashierStats.map((cashier) => (
                        <tr key={cashier.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{cashier.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cashier.email}</div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: cashier.role === 'owner' ? 'rgba(234, 179, 8, 0.15)' : cashier.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: cashier.role === 'owner' ? '#EAB308' : cashier.role === 'admin' ? '#C084FC' : '#60A5FA',
                              border: `1px solid ${cashier.role === 'owner' ? 'rgba(234, 179, 8, 0.3)' : cashier.role === 'admin' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                            }}>
                              {cashier.role === 'owner' ? '👑 Dueño' : cashier.role === 'admin' ? '⚡ Admin' : '👤 Empleado'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {formatCurrency(cashier.totalSales)}
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {cashier.percent}% del total
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {cashier.salesCount}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-secondary)', fontWeight: 600 }}>
                            {formatCurrency(cashier.cashAmount)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#60a5fa', fontWeight: 600 }}>
                            {formatCurrency(cashier.cardAmount)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#fbbf24', fontWeight: 600 }}>
                            {formatCurrency(cashier.installmentAmount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {cashier.hasOpenShift ? (
                              <span style={{
                                fontSize: '0.7rem', fontWeight: 700,
                                color: 'var(--color-secondary)', background: 'rgba(16, 185, 129, 0.15)',
                                padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}>
                                🟢 Turno Abierto ({formatCurrency(cashier.openShiftCash)})
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                ⚪ Turno Cerrado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ================= CAJAS REGISTRADORAS ACTIVAS (SI HAY TURNOS ABIERTOS) ================= */}
          {stats.activeShiftsList.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title" style={{ fontSize: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} /> Cajas y Turnos en Marcha en este momento
                </span>
                <button className="btn btn-sm btn-ghost" onClick={() => router.push('/shifts')} style={{ fontSize: '0.75rem' }}>
                  Ir a Arqueo de Caja →
                </button>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {stats.activeShiftsList.map(shift => (
                  <div key={shift.id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9375rem' }}>
                        {shift.userName}
                      </span>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 800,
                        padding: '2px 6px', borderRadius: '8px',
                        background: shift.userRole === 'owner' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: shift.userRole === 'owner' ? '#EAB308' : '#60A5FA'
                      }}>
                        {shift.userRole === 'owner' ? '👑 Dueño' : '👤 Empleado'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Abierta desde: {formatDateTime(shift.openedAt)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                      <span>Fondo inicial:</span>
                      <strong style={{ color: '#fff' }}>{formatCurrency(shift.openingCash)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span>Efectivo cobrado en turno:</span>
                      <strong style={{ color: 'var(--color-secondary)' }}>+{formatCurrency(shift.shiftCash)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 800, marginTop: '2px', color: '#38bdf8' }}>
                      <span>Efectivo esperado en cajón:</span>
                      <span>{formatCurrency(shift.expectedCash)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= CHART & ACTIVITY ROW ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
            
            {/* Sales Evolution Chart */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">
                  Evolución de Ventas ({periodLabel})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {period === 'today' ? 'Por franja horaria' : period === 'week' ? 'Día por día' : 'Semanas del mes'}
                </span>
              </div>
              <div className="card-body" style={{ height: '340px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEfectivo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTarjetas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18, 18, 28, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)' }}
                      itemStyle={{ color: '#fff', fontWeight: 700 }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="Efectivo" stroke="var(--color-secondary)" strokeWidth={2} fillOpacity={1} fill="url(#colorEfectivo)" stackId="1" name="Efectivo" />
                    <Area type="monotone" dataKey="TarjetasOtros" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorTarjetas)" stackId="1" name="Tarjetas / Fiado" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Sales Activity */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">Últimas Ventas</span>
                <button className="btn btn-sm btn-ghost" onClick={() => router.push('/sales')} style={{ fontSize: '0.75rem' }}>
                  Ver todas →
                </button>
              </div>

              <div className="card-body" style={{ padding: '0 var(--space-4)' }}>
                {recentSales.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShoppingCart size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.875rem' }}>Aún no hay ventas registradas.</p>
                  </div>
                ) : (
                  recentSales.map((sale, i) => {
                    const mins = Math.floor((nowTimestamp - new Date(sale.created_at).getTime()) / 60000)
                    const timeAgo = mins < 1 ? 'Ahora' : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins/60)}h` : `${Math.floor(mins/1440)}d`
                    const pmIcons = { cash: '💵', debit: '💳', credit: '💳', transfer: '📲', combined: '🔀', installment: '📋' }
                    const sellerName = sale.profiles?.full_name?.split(' ')[0] || 'Cajero'
                    const isOwnerSale = sale.profiles?.role === 'owner'

                    return (
                      <div key={sale.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 0', borderBottom: i < recentSales.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0
                        }}>
                          {pmIcons[sale.payment_method] || '🛒'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                            Ticket #{sale.ticket_number}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span>{timeAgo}</span>
                            <span>·</span>
                            <span style={{ color: isOwnerSale ? '#EAB308' : 'var(--text-secondary)' }}>
                              {sellerName} {isOwnerSale ? '(Dueño)' : ''}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-secondary)' }}>
                          +{formatCurrency(sale.total)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>

          {/* ================= DESPERDICIOS RECIENTES & PRODUCTOS ESTANCADOS ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            
            {/* Waste List */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={16} style={{ color: 'var(--color-error)' }} />
                  Mermas y Pérdidas del Período
                </span>
                <button className="btn btn-sm btn-ghost" onClick={() => router.push('/waste')} style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
                  Administrar Mermas →
                </button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.wasteItems.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '24px 0' }}>
                    ✅ Sin mermas registradas en este período.
                  </div>
                ) : (
                  stats.wasteItems.map((w, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'rgba(239, 68, 68, 0.03)',
                      border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-md)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>{w.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {w.date} · {w.reason}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--color-error)' }}>-{formatCurrency(w.loss)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{w.qty} {w.unit}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stagnant Products */}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                  Productos sin Rotación (Alerta de Merma)
                </span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.stagnantProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '24px 0' }}>
                    👏 Todos los productos tienen rotación reciente.
                  </div>
                ) : (
                  stats.stagnantProducts.map((p, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'
                    }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>{p.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>Poco o nulo movimiento</div>
                      </div>
                      <div style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {p.days} días sin venta
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  )
}
