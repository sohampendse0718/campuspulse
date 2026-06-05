'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Megaphone, AlertCircle, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Broadcast = {
  id: string
  title: string
  message: string
  alert_level: 'critical' | 'warning' | 'info'
  category: string
  created_at: string
}

const ALERT_STYLES = {
  critical: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', color: '#EF4444', text: '#FCA5A5', glow: '#EF444430' },
  warning: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', color: '#F59E0B', text: '#FCD34D', glow: '#F59E0B30' },
  info: { bg: 'rgba(0, 229, 255, 0.08)', border: 'rgba(0, 229, 255, 0.25)', color: '#00E5FF', text: '#E0F7FA', glow: '#00E5FF30' }
}

export default function BroadcastTicker() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    fetchBroadcasts()

    // Subscribe to real-time changes on announcements
    const channel = supabase.channel('realtime-broadcasts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campus_broadcasts' }, () => {
        fetchBroadcasts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchBroadcasts = async () => {
    try {
      const { data, error } = await supabase
        .from('campus_broadcasts')
        .select('id, title, message, alert_level, category, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setBroadcasts(data || [])
    } catch (err) {
      console.error('Error fetching broadcasts:', err)
    }
  }

  if (closed || broadcasts.length === 0) return null

  const current = broadcasts[currentIndex]
  const style = ALERT_STYLES[current.alert_level] || ALERT_STYLES.info

  const nextAlert = () => {
    setCurrentIndex(prev => (prev + 1) % broadcasts.length)
  }

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      boxShadow: `0 0 20px ${style.glow}`,
      borderRadius: 12,
      padding: '12px 18px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      animation: 'slideIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${style.color}18`,
          border: `1px solid ${style.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: style.color, flexShrink: 0
        }}>
          {current.alert_level === 'critical' ? <AlertCircle size={15} /> : <Megaphone size={14} />}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
              color: style.color, background: `${style.color}10`,
              padding: '2px 8px', borderRadius: 4, border: `1px solid ${style.border}`
            }}>
              {current.category}
            </span>
            <strong style={{ color: '#F1F2F7', fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current.title}
            </strong>
          </div>
          <p style={{ color: style.text, fontSize: '0.8rem', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {current.message}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Link href="/alerts" style={{
          fontSize: '0.78rem', color: style.color, fontWeight: 600,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2,
          padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s'
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${style.color}10`}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          View All <ChevronRight size={12} />
        </Link>

        {broadcasts.length > 1 && (
          <button 
            onClick={nextAlert}
            title="Next Announcement"
            style={{
              background: '#1E1F2E', border: '1px solid #2A2D3D',
              borderRadius: 6, color: '#9CA3AF', padding: '4px 8px',
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            Next ({currentIndex + 1}/{broadcasts.length})
          </button>
        )}

        <button 
          onClick={() => setClosed(true)}
          style={{
            background: 'none', border: 'none', color: '#6B7280',
            cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center'
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F1F2F7'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
