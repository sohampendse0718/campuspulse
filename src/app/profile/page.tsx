'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MapPin, BookOpen, ThumbsUp, Calendar, Clock, Download, ExternalLink, Shield } from 'lucide-react'

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  student:              { label: 'Student',              color: '#00E5FF', bg: 'rgba(0,229,255,0.1)',   border: 'rgba(0,229,255,0.3)'   },
  ground_staff:         { label: 'Ground Staff',         color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  block_incharge:       { label: 'Block Incharge',       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  faculty_coordinator:  { label: 'Faculty Coordinator',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
  hod:                  { label: 'HOD',                  color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
}

const STATUS_COLORS: Record<string, string> = {
  open:        '#EF4444',
  in_progress: '#F59E0B',
  resolved:    '#10B981',
}

const NOTE_TYPE_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  notes:             { label: 'Notes',            color: '#8B5CF6', emoji: '📝' },
  pyq:               { label: 'PYQ',              color: '#F59E0B', emoji: '📋' },
  internal_test:     { label: 'Internal Test',    color: '#10B981', emoji: '📊' },
  tutoring_offer:    { label: 'Tutoring Offer',   color: '#00E5FF', emoji: '🎓' },
  tutoring_request:  { label: 'Tutoring Request', color: '#EC4899', emoji: '🙋' },
}

function getTimeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function Spinner() {
  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #2A2D3D', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile]     = useState<any>(null)
  const [issues, setIssues]       = useState<any[]>([])
  const [notes, setNotes]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'issues' | 'notes'>('issues')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.replace('/login'); return }

      const uid = session.user.id

      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      setProfile({ ...prof, email: session.user.email })

      const isStudent = (prof?.role ?? 'student') === 'student'

      // Issues: students → reported, staff → assigned/managed
      if (isStudent) {
        const { data } = await supabase
          .from('issues')
          .select('id, title, status, category, created_at, upvotes')
          .eq('reported_by', uid)
          .order('created_at', { ascending: false })
        setIssues(data || [])
      } else {
        const { data } = await supabase
          .from('issues')
          .select('id, title, status, category, created_at, upvotes, escalation_level, location_block')
          .eq('assigned_to', uid)
          .order('created_at', { ascending: false })
        setIssues(data || [])
      }

      // Notes: only for students
      if (isStudent) {
        const { data } = await supabase
          .from('study_notes')
          .select('id, title, type, subject, branch, semester, upvotes, created_at, file_url, file_name, resource_link, exam_year, exam_subtype')
          .eq('uploaded_by', uid)
          .order('created_at', { ascending: false })
        setNotes(data || [])
      }

      setLoading(false)
    })
  }, [router])

  if (loading) return <Spinner />
  if (!profile) return null

  const roleMeta   = ROLE_META[profile.role] ?? ROLE_META.student
  const isStudent  = profile.role === 'student'
  const totalUpvotes = notes.reduce((s: number, n: any) => s + (n.upvotes || 0), 0)
  const resolved   = issues.filter((i: any) => i.status === 'resolved').length

  const initials = (profile.full_name || 'GEC')
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', padding: '40px 1.5rem 80px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        .profile-row { animation: fadeIn 0.28s ease both; transition: background 0.15s; }
        .profile-row:hover { background: #1A1B28 !important; }
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* ── Profile Card ── */}
        <div style={{ background: 'linear-gradient(135deg, #12131C 0%, #1A1B28 100%)', border: '1px solid #2A2D3D', borderRadius: 20, padding: '32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 240, height: 240, background: `radial-gradient(circle, ${roleMeta.color}08, transparent 70%)`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #00E5FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.7rem', fontWeight: 900, color: '#090A0F',
              fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0,
              boxShadow: `0 0 28px rgba(139,92,246,0.35)`,
            }}>
              {initials}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: '0 0 5px', color: '#F1F2F7', fontWeight: 800, fontSize: '1.45rem', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name || 'Campus Member'}
              </h1>
              <p style={{ margin: '0 0 12px', color: '#6B7280', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.email}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, background: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.border}` }}>
                  <Shield size={11} /> {roleMeta.label}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4B5563', fontSize: '0.75rem' }}>
                  <Calendar size={12} />
                  Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Student specific metadata */}
              {isStudent && (profile.dept || profile.year || profile.roll_no) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  {profile.dept && (
                    <span style={{ background: '#12131C', border: '1px solid #2A2D3D', color: '#9CA3AF', padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      🏢 {profile.dept}
                    </span>
                  )}
                  {profile.year && (
                    <span style={{ background: '#12131C', border: '1px solid #2A2D3D', color: '#9CA3AF', padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      🎓 {profile.year}
                    </span>
                  )}
                  {profile.roll_no && (
                    <span style={{ background: '#12131C', border: '1px solid #2A2D3D', color: '#00E5FF', padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      🆔 {profile.roll_no}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: isStudent ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 12, marginTop: 28 }}>
            <StatBox
              value={issues.length}
              label={isStudent ? 'Issues Reported' : 'Issues Managed'}
              color="#00E5FF"
            />
            {isStudent ? (
              <>
                <StatBox value={notes.length}     label="Resources Uploaded" color="#A78BFA" />
                <StatBox value={totalUpvotes}      label="Total Upvotes"       color="#10B981" />
              </>
            ) : (
              <StatBox value={resolved} label="Issues Resolved" color="#10B981" />
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 14, padding: 4 }}>
          <TabBtn
            active={activeTab === 'issues'}
            color="#00E5FF"
            emoji={isStudent ? '📍' : '🛠️'}
            label={`${isStudent ? 'My Issues' : 'Managed Issues'} (${issues.length})`}
            onClick={() => setActiveTab('issues')}
          />
          {isStudent && (
            <TabBtn
              active={activeTab === 'notes'}
              color="#A78BFA"
              emoji="📚"
              label={`My Resources (${notes.length})`}
              onClick={() => setActiveTab('notes')}
            />
          )}
        </div>

        {/* ── Issues ── */}
        {activeTab === 'issues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {issues.length === 0 ? (
              <EmptyState icon="📍" message={isStudent ? 'No issues reported yet.' : 'No issues managed yet.'} />
            ) : issues.map((issue: any, i: number) => {
              const sc = STATUS_COLORS[issue.status] || '#9CA3AF'
              return (
                <div
                  key={issue.id}
                  className="profile-row"
                  style={{ padding: '16px 20px', background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, animationDelay: `${i * 0.035}s`, animation: 'fadeIn 0.28s ease both' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#F1F2F7', fontWeight: 600, fontSize: '0.9rem', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {issue.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {issue.category && (
                        <span style={{ color: '#6B7280', fontSize: '0.73rem', textTransform: 'capitalize' }}>{issue.category}</span>
                      )}
                      {issue.location_block && (
                        <span style={{ color: '#4B5563', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={9} /> {issue.location_block}
                        </span>
                      )}
                      {issue.escalation_level && (
                        <span style={{ color: '#8B5CF6', fontSize: '0.72rem', fontWeight: 600 }}>L{issue.escalation_level}</span>
                      )}
                      <span style={{ color: '#374151', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> {getTimeAgo(issue.created_at)}
                      </span>
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.03em', color: sc, background: `${sc}15`, border: `1px solid ${sc}40`, whiteSpace: 'nowrap' }}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Notes ── */}
        {activeTab === 'notes' && isStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.length === 0 ? (
              <EmptyState icon="📚" message="No resources uploaded yet. Head to Study Pool to contribute!" />
            ) : notes.map((note: any, i: number) => {
              const ntl = NOTE_TYPE_LABELS[note.type] || NOTE_TYPE_LABELS.notes
              return (
                <div
                  key={note.id}
                  className="profile-row"
                  style={{ padding: '16px 20px', background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, animationDelay: `${i * 0.035}s`, animation: 'fadeIn 0.28s ease both' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + type badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: '0.67rem', fontWeight: 700, background: `${ntl.color}15`, color: ntl.color }}>
                        {ntl.emoji} {ntl.label}
                      </span>
                      <span style={{ color: '#F1F2F7', fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        {note.title}
                      </span>
                    </div>
                    {/* Meta */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: '#8B5CF6', fontSize: '0.72rem', fontWeight: 600 }}>{note.branch}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.72rem' }}>Sem {note.semester}</span>
                      <span style={{ color: '#4B5563', fontSize: '0.72rem' }}>{note.subject}</span>
                      {note.exam_year && <span style={{ color: '#FCD34D', fontSize: '0.72rem', fontWeight: 600 }}>{note.exam_year}</span>}
                      {note.exam_subtype && <span style={{ color: '#6B7280', fontSize: '0.72rem', textTransform: 'uppercase' }}>{note.exam_subtype.replace(/_/g, ' ')}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#374151', fontSize: '0.72rem' }}>
                        <Clock size={10} /> {getTimeAgo(note.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00E5FF', fontSize: '0.8rem', fontWeight: 700 }}>
                      <ThumbsUp size={12} /> {note.upvotes}
                    </span>
                    {note.file_url && (
                      <a
                        href={note.file_url}
                        download={note.file_name || true}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '5px 11px', borderRadius: 6, background: 'rgba(139,92,246,0.12)', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(139,92,246,0.3)', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.22)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.12)'}
                      >
                        <Download size={11} /> Download
                      </a>
                    )}
                    {note.resource_link && (
                      <a
                        href={note.resource_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '5px 11px', borderRadius: 6, background: 'rgba(0,229,255,0.08)', color: '#00E5FF', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(0,229,255,0.25)', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.16)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.08)'}
                      >
                        <ExternalLink size={11} /> Open
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helper components ────────────────────────────────────────────────────────
function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '18px 12px', background: '#0D0E18', borderRadius: 12, border: '1px solid #1E1F2E' }}>
      <div style={{ fontSize: '2rem', fontWeight: 900, color, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#6B7280', fontSize: '0.72rem', marginTop: 5 }}>{label}</div>
    </div>
  )
}

function TabBtn({ active, color, emoji, label, onClick }: { active: boolean; color: string; emoji: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: active ? `${color}15` : 'transparent', color: active ? color : '#6B7280' }}
    >
      <span>{emoji}</span> {label}
    </button>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #2A2D3D', borderRadius: 16 }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{icon}</div>
      <p style={{ color: '#4B5563', margin: 0, fontSize: '0.9rem' }}>{message}</p>
    </div>
  )
}
