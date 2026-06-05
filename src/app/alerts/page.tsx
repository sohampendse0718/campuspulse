'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Megaphone, AlertCircle, Calendar, User, Trash2, Send, Plus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Broadcast = {
  id: string
  title: string
  message: string
  alert_level: 'critical' | 'warning' | 'info'
  category: string
  created_at: string
  created_by_profile: {
    full_name: string
    role: string
  }
}

const ALERT_STYLES = {
  critical: { bg: 'rgba(239, 68, 68, 0.05)', border: 'rgba(239, 68, 68, 0.25)', color: '#EF4444', text: '#FCA5A5', glow: '#EF444420', label: 'Critical Alert' },
  warning: { bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.25)', color: '#F59E0B', text: '#FCD34D', glow: '#F59E0B20', label: 'Important Notice' },
  info: { bg: 'rgba(0, 229, 255, 0.05)', border: 'rgba(0, 229, 255, 0.25)', color: '#00E5FF', text: '#E0F7FA', glow: '#00E5FF20', label: 'Announcement' }
}

const CATEGORIES = [
  'Holiday Notice',
  'Exam Schedule Postponement',
  'Water Supply Interruption',
  'Power Cut Notice',
  'Academic Circular',
  'General Announcement'
]

export default function AlertsPage() {
  const router = useRouter()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [alertLevel, setAlertLevel] = useState<'critical' | 'warning' | 'info'>('info')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert('Please log in to view notices!')
        router.replace('/login')
        return
      }
      setUserId(session.user.id)
      fetchProfile(session.user.id)
      fetchBroadcasts()
    })
  }, [router])

  const fetchProfile = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single()
      setRole(data?.role || 'student')
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBroadcasts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('campus_broadcasts')
        .select(`
          *,
          created_by_profile: profiles!created_by(full_name, role)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBroadcasts(data || [])
    } catch (err: any) {
      console.error('Error fetching broadcasts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('campus_broadcasts')
        .insert({
          title: title.trim(),
          message: message.trim(),
          alert_level: alertLevel,
          category,
          created_by: userId
        })

      if (error) throw error

      // Call API to send emails to all registered users
      fetch('/api/broadcast-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          alert_level: alertLevel,
          category,
          sender_name: broadcasts[0]?.created_by_profile?.full_name || 'Department Head' // Fallback
        }),
      }).catch(err => console.error("Failed to send email broadcast", err));

      setTitle('')
      setMessage('')
      setAlertLevel('info')
      setCategory(CATEGORIES[0])
      setShowAddModal(false)
      fetchBroadcasts()
      alert('Broadcast published successfully!')
    } catch (err: any) {
      alert('Failed to publish: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) return

    try {
      const { error } = await supabase
        .from('campus_broadcasts')
        .delete()
        .eq('id', id)

      if (error) throw error
      setBroadcasts(prev => prev.filter(b => b.id !== id))
    } catch (err: any) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const getFormattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isHod = role === 'hod'

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', padding: '40px 1.5rem 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Header navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{
              width: 36, height: 36, borderRadius: 8, background: '#1E1F2E',
              border: '1px solid #2A2D3D', color: '#9CA3AF', display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F1F2F7'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9CA3AF'}
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F1F2F7', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Campus Alerts & Notices
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: '2px 0 0' }}>
                Official announcements from Head of Departments
              </p>
            </div>
          </div>

          {isHod && (
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#EF4444', color: '#090A0F', fontWeight: 700,
                fontSize: '0.85rem', padding: '8px 16px', borderRadius: 8,
                border: 'none', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 6, transition: 'all 0.2s',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)'
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#DC2626'
                el.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.35)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#EF4444'
                el.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.15)'
              }}
            >
              <Plus size={14} /> New Alert
            </button>
          )}
        </div>

        {/* Alerts list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 36, height: 36, border: '2px solid #2A2D3D', borderTopColor: '#EF4444', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : broadcasts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 32px', background: '#12131C',
            border: '1px dashed #2A2D3D', borderRadius: 16
          }}>
            <Megaphone size={40} color="#2A2D3D" style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#F1F2F7', margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>No Active Broadcasts</h3>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>There are currently no urgent campus-wide announcements.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {broadcasts.map(broadcast => {
              const style = ALERT_STYLES[broadcast.alert_level] || ALERT_STYLES.info
              return (
                <div 
                  key={broadcast.id}
                  style={{
                    background: '#12131C',
                    border: `1px solid ${style.border}`,
                    borderRadius: 16,
                    padding: '24px',
                    position: 'relative',
                    boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 10px ${style.glow}`,
                    transition: 'transform 0.2s',
                  }}
                >
                  {/* HOD Delete option */}
                  {isHod && (
                    <button 
                      onClick={() => handleDeleteBroadcast(broadcast.id)}
                      title="Delete Announcement"
                      style={{
                        position: 'absolute', top: 20, right: 20,
                        background: 'none', border: 'none', color: '#6B7280',
                        cursor: 'pointer', padding: 6, borderRadius: 6,
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.color = '#EF4444'
                        el.style.background = 'rgba(239, 68, 68, 0.08)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.color = '#6B7280'
                        el.style.background = 'transparent'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  {/* Top badges */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                      color: style.color, background: `${style.color}15`,
                      border: `1px solid ${style.border}`, padding: '3px 10px', borderRadius: 100
                    }}>
                      {style.label}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600, color: '#9CA3AF',
                      background: '#1E1F2E', border: '1px solid #2A2D3D',
                      padding: '3px 10px', borderRadius: 100
                    }}>
                      {broadcast.category}
                    </span>
                  </div>

                  {/* Title & Message */}
                  <h3 style={{
                    color: '#F1F2F7', fontSize: '1.2rem', fontWeight: 700,
                    margin: '0 0 10px', fontFamily: "'Space Grotesk', sans-serif"
                  }}>
                    {broadcast.title}
                  </h3>
                  <p style={{
                    color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.65,
                    margin: '0 0 20px', whiteSpace: 'pre-wrap'
                  }}>
                    {broadcast.message}
                  </p>

                  {/* Footer (Author + date) */}
                  <div style={{
                    borderTop: '1px solid #1E1F2E', paddingTop: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12, color: '#6B7280', fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={12} color="#00E5FF" />
                      <span>Posted by <strong style={{ color: '#9CA3AF' }}>{broadcast.created_by_profile?.full_name || 'Department Head'}</strong> (HOD)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} />
                      <span>{getFormattedDate(broadcast.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Announcement Creator Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}>
            <div style={{
              background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 20,
              width: '100%', maxWidth: 540, padding: 32, boxSizing: 'border-box',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)', animation: 'modalIn 0.25s ease'
            }}>
              <style>{`
                @keyframes modalIn {
                  from { opacity: 0; transform: scale(0.96); }
                  to { opacity: 1; transform: scale(1); }
                }
              `}</style>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Megaphone size={18} color="#EF4444" />
                  <h3 style={{ color: '#F1F2F7', fontWeight: 800, fontSize: '1.2rem', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Publish Campus Announcement
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: '1px solid #2A2D3D',
                    background: '#1E1F2E', color: '#6B7280', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F1F2F7'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Category & Alert Level Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                      NOTICE CATEGORY
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', background: '#1E1F2E',
                        border: '1px solid #2A2D3D', borderRadius: 8, color: '#F1F2F7',
                        fontSize: '0.85rem', outline: 'none', cursor: 'pointer'
                      }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                      ALERT LEVEL
                    </label>
                    <select
                      value={alertLevel}
                      onChange={e => setAlertLevel(e.target.value as any)}
                      style={{
                        width: '100%', padding: '11px 14px', background: '#1E1F2E',
                        border: '1px solid #2A2D3D', borderRadius: 8, color: '#F1F2F7',
                        fontSize: '0.85rem', outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="info">📢 Announcement (Cyan / Info)</option>
                      <option value="warning">⚠️ Important Notice (Yellow / Warning)</option>
                      <option value="critical">🚨 Critical Alert (Red / Critical)</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                    ANNOUNCEMENT TITLE
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Water Supply Interruption in IT and Computer Blocks"
                    style={{
                      width: '100%', padding: '11px 14px', background: '#1E1F2E',
                      border: '1px solid #2A2D3D', borderRadius: 8, color: '#F1F2F7',
                      fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#EF4444'}
                    onBlur={e => e.target.style.borderColor = '#2A2D3D'}
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                    BROADCAST MESSAGE
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Provide detailed description of the announcement..."
                    style={{
                      width: '100%', padding: '11px 14px', background: '#1E1F2E',
                      border: '1px solid #2A2D3D', borderRadius: 8, color: '#F1F2F7',
                      fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                      boxSizing: 'border-box', fontFamily: 'inherit'
                    }}
                    onFocus={e => e.target.style.borderColor = '#EF4444'}
                    onBlur={e => e.target.style.borderColor = '#2A2D3D'}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1, padding: '13px', borderRadius: 10, border: 'none',
                      background: submitting ? '#1E1F2E' : '#EF4444',
                      color: submitting ? '#6B7280' : '#090A0F',
                      fontWeight: 700, fontSize: '0.9rem',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Send size={14} /> {submitting ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '13px 20px', borderRadius: 10,
                      background: '#1E1F2E', border: '1px solid #2A2D3D',
                      color: '#9CA3AF', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
