'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Filter, X, MapPin, ThumbsUp, Clock, AlertTriangle } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: 600,
      background: 'linear-gradient(135deg, #12131C, #1A1B28)',
      borderRadius: 14, border: '1px solid #2A2D3D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12,
    }}>
      <div style={{ width: 32, height: 32, border: '2px solid #2A2D3D', borderTopColor: '#00E5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Loading campus map...</span>
    </div>
  ),
})

type Issue = {
  id: string; title: string; description: string; category: string
  status: string; latitude: number; longitude: number; address: string
  before_image_url: string | null; created_at: string; upvotes: number
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved'
type CategoryFilter = 'all' | 'road' | 'lighting' | 'sanitation' | 'water' | 'other'

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  open: { bg: '#EF444415', color: '#FCA5A5', border: '#EF444440', label: 'Open' },
  in_progress: { bg: '#F59E0B15', color: '#FCD34D', border: '#F59E0B40', label: 'In Progress' },
  resolved: { bg: '#10B98115', color: '#6EE7B7', border: '#10B98140', label: 'Resolved' },
}

const CATEGORY_ICONS: Record<string, string> = {
  road: '🛣️', lighting: '💡', sanitation: '🗑️', water: '💧', other: '📍'
}

export default function MapPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  useEffect(() => {
    fetchIssues()
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => { fetchIssues() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    let filtered = issues
    if (statusFilter !== 'all') filtered = filtered.filter(i => i.status === statusFilter)
    if (categoryFilter !== 'all') filtered = filtered.filter(i => i.category === categoryFilter)
    setFilteredIssues(filtered)
  }, [issues, statusFilter, categoryFilter])

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setIssues(data || [])
    } catch (error) { console.error('Error fetching issues:', error) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', padding: '28px 1.5rem 60px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Page header + Stats */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F2F7', margin: '0 0 4px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Campus Map
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>Real-time issue tracking across GEC</p>
          </div>
          <Link href="/report" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9,
            background: '#00E5FF', color: '#090A0F',
            fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
          }}>
            <AlertTriangle size={14} /> Report Issue
          </Link>
        </div>

        {/* Mini stat bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total', val: issues.length, col: '#00E5FF' },
            { label: 'Open', val: issues.filter(i => i.status === 'open').length, col: '#EF4444' },
            { label: 'In Progress', val: issues.filter(i => i.status === 'in_progress').length, col: '#F59E0B' },
            { label: 'Resolved', val: issues.filter(i => i.status === 'resolved').length, col: '#10B981' },
          ].map(({ label, val, col }) => (
            <div key={label} style={{
              padding: '14px 16px', borderRadius: 12,
              background: '#12131C', border: '1px solid #2A2D3D',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>{val}</div>
              <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter panel */}
        <div style={{
          background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 12,
          padding: '14px 18px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} color="#6B7280" />
              <span style={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: 500 }}>Filters</span>
              {(statusFilter !== 'all' || categoryFilter !== 'all') && (
                <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF', fontSize: '0.72rem' }}>
                  Active
                </span>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #2A2D3D',
              background: 'transparent', color: '#6B7280', cursor: 'pointer', fontSize: '0.8rem',
            }}>
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>
          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              {[
                { label: 'STATUS', val: statusFilter, setter: setStatusFilter, opts: [['all', 'All Status'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved']] },
                { label: 'CATEGORY', val: categoryFilter, setter: setCategoryFilter, opts: [['all', 'All Categories'], ['road', 'Road'], ['lighting', 'Lighting'], ['sanitation', 'Sanitation'], ['water', 'Water'], ['other', 'Other']] },
              ].map(({ label, val, setter, opts }) => (
                <div key={label}>
                  <label style={{ display: 'block', color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
                  <select value={val} onChange={e => setter(e.target.value as any)} style={{
                    width: '100%', padding: '9px 12px', background: '#0D0E18',
                    border: '1px solid #2A2D3D', borderRadius: 8, color: '#F1F2F7',
                    fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                  }}>
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #2A2D3D', marginBottom: 16 }}>
          {loading ? (
            <div style={{ width: '100%', height: 600, background: '#12131C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 32, height: 32, border: '2px solid #2A2D3D', borderTopColor: '#00E5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Loading map...</span>
            </div>
          ) : (
            <MapComponent issues={filteredIssues} onMarkerClick={setSelectedIssue} />
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', padding: '14px 18px', background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 10 }}>
          <span style={{ color: '#6B7280', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>LEGEND:</span>
          {[['#EF4444', 'Open'], ['#F59E0B', 'In Progress'], ['#10B981', 'Resolved']].map(([col, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }} />
              <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 20,
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <h3 style={{ color: '#F1F2F7', fontWeight: 800, fontSize: '1.2rem', margin: '0 0 10px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {selectedIssue.title}
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600,
                    background: STATUS_STYLES[selectedIssue.status]?.bg, color: STATUS_STYLES[selectedIssue.status]?.color, border: `1px solid ${STATUS_STYLES[selectedIssue.status]?.border}`,
                  }}>
                    {STATUS_STYLES[selectedIssue.status]?.label || selectedIssue.status}
                  </span>
                  <span style={{ color: '#9CA3AF', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {CATEGORY_ICONS[selectedIssue.category]} {selectedIssue.category}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedIssue(null)} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #2A2D3D',
                background: '#1E1F2E', color: '#6B7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <X size={15} />
              </button>
            </div>

            {selectedIssue.before_image_url && (
              <img src={selectedIssue.before_image_url} alt={selectedIssue.title}
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, border: '1px solid #2A2D3D', marginBottom: 18, display: 'block' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 5 }}>DESCRIPTION</div>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0, lineHeight: 1.65 }}>{selectedIssue.description}</p>
              </div>
              <div>
                <div style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 5 }}>LOCATION</div>
                <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} color="#6B7280" /> {selectedIssue.address}
                </p>
                <p style={{ color: '#4B5563', fontSize: '0.75rem', margin: 0 }}>
                  {selectedIssue.latitude.toFixed(6)}, {selectedIssue.longitude.toFixed(6)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 20, paddingTop: 14, borderTop: '1px solid #1E1F2E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: '0.85rem' }}>
                  <ThumbsUp size={14} /> {selectedIssue.upvotes} upvotes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: '0.85rem' }}>
                  <Clock size={14} /> {new Date(selectedIssue.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1E1F2E; color: #F1F2F7; }
      `}</style>
    </div>
  )
}
