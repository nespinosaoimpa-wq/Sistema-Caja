'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Gift, Copy, Check, MessageSquare, Users, Award, Clock } from 'lucide-react'

export default function ReferralsPage() {
  const { tenant } = useAuth()
  const [data, setData] = useState({ referral_code: '', referrals: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchReferrals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/referrals')
      if (!res.ok) throw new Error('Error al cargar referidos')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [])

  const referralLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.cajasmart.com.ar'
    return `${origin}/register?ref=${data.referral_code || ''}`
  }, [data.referral_code])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCount = data.referrals.length
    const paidCount = data.referrals.filter(r => r.status === 'paid' || r.status === 'rewarded').length
    const registeredCount = totalCount - paidCount
    
    return {
      total: totalCount,
      paid: paidCount,
      registered: registeredCount,
      monthsEarned: paidCount // 1 month per paid referral
    }
  }, [data.referrals])

  const shareText = `Hola! Te paso el sistema que uso para llevar las ventas y el stock del negocio, se llama Smart Caja. Te da 14 días gratis de prueba y un 30% de descuento en el primer mes si te registrás con este enlace amigo: ${referralLink} - Si tenés alguna duda preguntame y te cuento cómo lo uso.`

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  return (
    <div>
      <style>{`
        .referral-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }
        @media (max-width: 768px) {
          .referral-grid {
            grid-template-columns: 1fr;
          }
        }
        .ref-kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .ref-kpi {
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          text-align: center;
        }
        .ref-kpi-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin-top: 4px;
        }
        .ref-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .ref-badge-registered { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
        .ref-badge-paid { background: rgba(16, 185, 129, 0.12); color: #10B981; }
        .ref-badge-rewarded { background: rgba(124, 58, 237, 0.12); color: #B76DFF; }
      `}</style>

      {/* Header */}
      <div className="app-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={20} style={{ color: 'var(--color-primary)' }} /> Recomendá y Ganá
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Invitá a otros comercios amigos, regalales 30% de descuento y ganá meses de suscripción gratis
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-lg)' }}>
          ❌ Error al cargar referidos: {error}
        </div>
      ) : (
        <div className="referral-grid">
          {/* Share Box */}
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Tu Link de Referido
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 'var(--space-5)' }}>
              Compartí tu código o enlace único. Cuando un comercio se registre e inicie su suscripción activa, se te acreditará **1 mes gratis** a tu cuenta de forma automática.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Enlace para compartir
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    className="form-input" 
                    readOnly 
                    value={referralLink} 
                    style={{ background: 'var(--bg-input)', fontFamily: 'monospace', fontSize: '0.8125rem' }} 
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="btn btn-ghost"
                    style={{ padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {copied ? <Check size={16} style={{ color: '#10B981' }} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Código de Referido
                </label>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', background: 'rgba(255,255,255,0.04)', padding: '6px 16px', borderRadius: '6px', border: '1px dashed var(--border-color)', display: 'inline-block', color: 'var(--color-primary)' }}>
                  {data.referral_code || 'REF-N/A'}
                </span>
              </div>

              <button 
                onClick={shareOnWhatsApp}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', background: '#25D366', border: 'none', color: '#fff', display: 'flex', gap: '8px', padding: '12px' }}
              >
                <MessageSquare size={18} /> Compartir por WhatsApp
              </button>
            </div>
          </div>

          {/* Stats & History Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* KPI statistics */}
            <div className="ref-kpis">
              <div className="ref-kpi">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Registrados</div>
                <div className="ref-kpi-value">{stats.registered}</div>
              </div>
              <div className="ref-kpi" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Pagados</div>
                <div className="ref-kpi-value" style={{ color: '#10B981' }}>{stats.paid}</div>
              </div>
              <div className="ref-kpi" style={{ borderColor: 'rgba(183, 109, 255, 0.3)', background: 'linear-gradient(to bottom, rgba(124,58,237,0.05), transparent)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Meses Gratis</div>
                <div className="ref-kpi-value" style={{ color: 'var(--color-primary)' }}>{stats.monthsEarned}</div>
              </div>
            </div>

            {/* List Table */}
            <div className="card" style={{ padding: 'var(--space-6)', flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> Comercios Recomendados
              </h3>

              {data.referrals.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>
                  <Clock size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                  Aún no recomendaste a ningún comercio.
                  <br />
                  ¡Compartí tu link para empezar a ganar!
                </div>
              ) : (
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '8px', color: 'var(--text-muted)' }}>Negocio</th>
                        <th style={{ padding: '8px', color: 'var(--text-muted)' }}>Registro</th>
                        <th style={{ padding: '8px', color: 'var(--text-muted)', textAlign: 'right' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referrals.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 600, color: '#fff' }}>{r.name}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <span className={`ref-badge ${
                              r.status === 'paid' ? 'ref-badge-paid' :
                              r.status === 'rewarded' ? 'ref-badge-rewarded' : 'ref-badge-registered'
                            }`}>
                              {r.status === 'paid' ? 'Pago' : r.status === 'rewarded' ? 'Bonificado' : 'Registrado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
