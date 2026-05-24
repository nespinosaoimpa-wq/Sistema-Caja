export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div className="skeleton skeleton-title" style={{ width: '40%', height: '36px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', height: '18px', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-full)' }} />
          <div className="skeleton" style={{ width: '130px', height: '44px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card skeleton-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '130px' }}>
            <div className="skeleton" style={{ width: '50%', height: '16px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '75%', height: '32px', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ width: '40%', height: '14px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        ))}
      </div>

      {/* Content Layout Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
        {/* Main Section */}
        <div className="card skeleton-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '30%', height: '20px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: 'var(--radius-sm)' }} />
          </div>
          <div className="skeleton" style={{ flex: 1, borderRadius: 'var(--radius-md)', minHeight: '260px' }} />
        </div>

        {/* Sidebar/Quick Actions Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card skeleton-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '12px', height: '150px' }}>
            <div className="skeleton" style={{ width: '60%', height: '20px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '90%', height: '14px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-md)', marginTop: 'auto' }} />
          </div>
          <div className="card skeleton-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: '200px' }}>
            <div className="skeleton" style={{ width: '50%', height: '18px', borderRadius: 'var(--radius-sm)' }} />
            {[1, 2, 3].map(j => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeleton" style={{ width: '70%', height: '14px', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton" style={{ width: '40%', height: '10px', borderRadius: 'var(--radius-sm)' }} />
                </div>
                <div className="skeleton" style={{ width: '50px', height: '14px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
