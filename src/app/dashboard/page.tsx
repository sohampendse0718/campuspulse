'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { TrendingUp, Upload, CheckCircle, Clock, AlertCircle, Loader2, X, BarChart3, Shield } from 'lucide-react'
import BroadcastTicker from '@/components/BroadcastTicker'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

type Issue = {
  id: string; title: string; description: string; category: string
  status: string; location_block: string; escalation_level: number; is_urgent: boolean; deadline: string | null
  latitude: number; longitude: number; address: string
  before_image_url: string | null; after_image_url: string | null
  created_at: string; resolved_at: string | null; upvotes: number; comment_count: number
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  open: { bg: '#EF444415', color: '#FCA5A5', border: '#EF444440', label: 'Open' },
  in_progress: { bg: '#F59E0B15', color: '#FCD34D', border: '#F59E0B40', label: 'In Progress' },
  resolved: { bg: '#10B98115', color: '#6EE7B7', border: '#10B98140', label: 'Resolved' },
}

const ROLE_LEVELS: Record<string, number> = {
  student: 0,
  ground_staff: 1,
  block_incharge: 2,
  faculty_coordinator: 3,
  hod: 4,
}

const ROLE_LABELS: Record<string, string> = {
  ground_staff: 'Level 1: Ground Staff',
  block_incharge: 'Level 2: Block Incharge',
  faculty_coordinator: 'Level 3: Faculty Coord',
  hod: 'Level 4: HOD Department Head',
}

const CHART_THEME = {
  background: 'transparent',
  text: '#9CA3AF',
  grid: '#2A2D3D',
  tooltip: { bg: '#1E1F2E', border: '#353851', color: '#F1F2F7' },
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1E1F2E', border: '1px solid #353851', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem' }}>
      <p style={{ color: '#9CA3AF', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color, margin: 0 }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [afterImage, setAfterImage] = useState<File | null>(null)
  
  const [escalateToNext, setEscalateToNext] = useState(false)
  const [toggleUrgent, setToggleUrgent] = useState(false)
  const [deadlineInput, setDeadlineInput] = useState('')

  useEffect(() => { checkUserAndFetchData() }, [])

  const checkUserAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('Please log in first!'); router.push('/login'); return }
      const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      
      if (profileError || !profile?.role || profile.role === 'student') {
        alert('Access denied. Official authority role required.')
        router.push('/map'); return
      }
      
      setUser(user)
      setUserRole(profile.role)
      fetchIssues(profile.role)
    } catch (err) { router.push('/login') }
  }

  const fetchIssues = async (role: string) => {
    try {
      let query = supabase.from('issues').select('*')
      
      const userLevel = ROLE_LEVELS[role] || 1
      if (userLevel < 4) {
        query = query.eq('escalation_level', userLevel)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setIssues(data || [])
    } catch (error) { console.error('Error fetching issues:', error) }
    finally { setLoading(false) }
  }

  const handleStatusUpdate = async () => {
    if (!selectedIssue) return
    setUpdatingStatus(true)
    try {
      let afterImageUrl = selectedIssue.after_image_url
      if (afterImage && newStatus === 'resolved') {
        const fileExt = afterImage.name.split('.').pop()
        const fileName = `${user.id}/after_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('issue-images').upload(fileName, afterImage)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('issue-images').getPublicUrl(fileName)
        afterImageUrl = publicUrl
      }

      const userLevel = ROLE_LEVELS[userRole] || 1
      let targetEscalationLevel = selectedIssue.escalation_level
      if (escalateToNext && userLevel < 4) {
        targetEscalationLevel = selectedIssue.escalation_level + 1
      }

      const updateData: any = { 
        status: newStatus, 
        assigned_to: user.id,
        escalation_level: targetEscalationLevel
      }

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        if (afterImageUrl) updateData.after_image_url = afterImageUrl
      }

      if (userLevel >= 3) {
        updateData.is_urgent = toggleUrgent
      }

      if (userLevel === 4 && deadlineInput) {
        updateData.deadline = new Date(deadlineInput).toISOString()
      }

      const { error } = await supabase.from('issues').update(updateData).eq('id', selectedIssue.id)
      if (error) throw error

      await supabase.from('issue_status_history').insert({ 
        issue_id: selectedIssue.id, 
        old_status: selectedIssue.status, 
        new_status: newStatus, 
        old_escalation_level: selectedIssue.escalation_level,
        new_escalation_level: targetEscalationLevel,
        changed_by: user.id 
      })

      alert('Issue updated successfully!')
      setSelectedIssue(null)
      setNewStatus('')
      setAfterImage(null)
      setEscalateToNext(false)
      setToggleUrgent(false)
      setDeadlineInput('')
      fetchIssues(userRole)
    } catch (error: any) { alert('Error: ' + error.message) }
    finally { setUpdatingStatus(false) }
  }

  const totalIssues = issues.length
  const openIssues = issues.filter(i => i.status === 'open').length
  const inProgressIssues = issues.filter(i => i.status === 'in_progress').length
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length
  const resolutionRate = totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : '0'

  const categoryData = [
    { name: 'Cleaning', value: issues.filter(i => i.category === 'cleaning').length, color: '#10B981' },
    { name: 'Electrical', value: issues.filter(i => i.category === 'electrical').length, color: '#00E5FF' },
    { name: 'Water Leak', value: issues.filter(i => i.category === 'water_leakage').length, color: '#3B82F6' },
    { name: 'Furniture', value: issues.filter(i => i.category === 'furniture').length, color: '#F59E0B' },
    { name: 'Lab Equip', value: issues.filter(i => i.category === 'lab_equipment').length, color: '#EF4444' },
    { name: 'Wiring/Proj', value: issues.filter(i => i.category === 'wiring_projector').length, color: '#8B5CF6' },
    { name: 'Safety', value: issues.filter(i => i.category === 'safety').length, color: '#F87171' },
    { name: 'Other', value: issues.filter(i => i.category === 'other').length, color: '#A3E635' },
  ].filter(item => item.value > 0)

  const statusData = [
    { name: 'Open', count: openIssues },
    { name: 'In Progress', count: inProgressIssues },
    { name: 'Resolved', count: resolvedIssues },
  ]

  const getTrendData = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reported: issues.filter(i => i.created_at.split('T')[0] === dateStr).length,
        resolved: issues.filter(i => i.resolved_at?.split('T')[0] === dateStr).length,
      }
    })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#090A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #2A2D3D', borderTopColor: '#00E5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', padding: '32px 1.5rem 60px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)',
            }}>
              <Shield size={16} color="#8B5CF6" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F2F7', margin: 0, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
                Admin Dashboard
              </h1>
            </div>
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>
            Campus issue management · {totalIssues} total issues tracked
          </p>
        </div>

        <BroadcastTicker />

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { icon: BarChart3, label: 'Total Issues', val: totalIssues, col: '#00E5FF', sub: null },
            { icon: AlertCircle, label: 'Open', val: openIssues, col: '#EF4444', sub: null },
            { icon: Clock, label: 'In Progress', val: inProgressIssues, col: '#F59E0B', sub: null },
            { icon: CheckCircle, label: 'Resolved', val: resolvedIssues, col: '#10B981', sub: `${resolutionRate}% rate` },
          ].map(({ icon: Icon, label, val, col, sub }) => (
            <div key={label} style={{
              padding: '20px 22px', borderRadius: 14,
              background: '#12131C', border: '1px solid #2A2D3D',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, marginBottom: 14,
                background: `${col}15`, border: `1px solid ${col}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={col} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: col, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>{val}</div>
              <div style={{ color: '#9CA3AF', fontSize: '0.82rem', marginTop: 4 }}>{label}</div>
              {sub && <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: 2 }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="mobile-flex-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 14, padding: '20px 22px' }}>
            <h3 style={{ color: '#F1F2F7', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 20px', fontFamily: "'Space Grotesk', sans-serif" }}>
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1F2E" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#00E5FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 14, padding: '20px 22px' }}>
            <h3 style={{ color: '#F1F2F7', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 20px', fontFamily: "'Space Grotesk', sans-serif" }}>
              Issues by Category
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#353851' }}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 14, padding: '20px 22px', gridColumn: 'span 2' }}>
            <h3 style={{ color: '#F1F2F7', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 20px', fontFamily: "'Space Grotesk', sans-serif" }}>
              7-Day Activity Trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1F2E" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: '0.8rem' }} />
                <Line type="monotone" dataKey="reported" stroke="#EF4444" name="Reported" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" name="Resolved" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues table */}
        <div style={{ background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #1E1F2E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ color: '#F1F2F7', fontWeight: 700, fontSize: '0.95rem', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              Pending Tasks ({ROLE_LABELS[userRole] || 'Authority View'})
            </h3>
            <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{issues.length} items</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Title', 'Block / Location', 'Category', 'Level', 'Status', 'Priority', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
                      textTransform: 'uppercase', background: '#0D0E18', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, idx) => {
                  const st = STATUS_STYLES[issue.status] || STATUS_STYLES.open
                  const isUrgent = issue.is_urgent
                  return (
                    <tr key={issue.id} style={{
                      borderTop: '1px solid #1A1B28',
                      transition: 'background 0.15s',
                      background: isUrgent ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isUrgent ? 'rgba(239, 68, 68, 0.05)' : '#1A1B28'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isUrgent ? 'rgba(239, 68, 68, 0.03)' : 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', color: '#F1F2F7', fontSize: '0.875rem', fontWeight: 500, maxWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isUrgent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 8px #EF4444' }} />}
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#9CA3AF', fontSize: '0.82rem' }}>{issue.location_block || 'N/A'}</td>
                      <td style={{ padding: '14px 20px', color: '#9CA3AF', fontSize: '0.82rem', textTransform: 'capitalize' }}>{issue.category}</td>
                      <td style={{ padding: '14px 20px', color: '#8B5CF6', fontSize: '0.82rem', fontWeight: 600 }}>L{issue.escalation_level}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600,
                          letterSpacing: '0.04em',
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                        }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600,
                          background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(75,85,99,0.15)',
                          color: isUrgent ? '#FCA5A5' : '#9CA3AF',
                          border: isUrgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(75,85,99,0.3)',
                        }}>
                          {isUrgent ? 'Urgent' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button onClick={() => { 
                          setSelectedIssue(issue); 
                          setNewStatus(issue.status);
                          setToggleUrgent(issue.is_urgent);
                          setDeadlineInput(issue.deadline ? new Date(issue.deadline).toISOString().substring(0, 16) : '');
                        }} style={{
                          padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                          background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
                          color: '#00E5FF', fontSize: '0.78rem', fontWeight: 600,
                          transition: 'all 0.2s',
                        }}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manage Modal */}
      {selectedIssue && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 20,
            width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto',
            padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h3 style={{ color: '#F1F2F7', fontWeight: 800, fontSize: '1.2rem', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                Manage Issue & Escalation
              </h3>
              <button onClick={() => { setSelectedIssue(null); setNewStatus(''); setAfterImage(null); setEscalateToNext(false); }} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #2A2D3D',
                background: '#1E1F2E', color: '#6B7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ padding: '16px', background: '#0D0E18', borderRadius: 10, border: '1px solid #1E1F2E' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#8B5CF6', fontSize: '0.72rem', fontWeight: 600 }}>LEVEL {selectedIssue.escalation_level} · {selectedIssue.location_block}</span>
                  {selectedIssue.deadline && (
                    <span style={{ color: '#EF4444', fontSize: '0.72rem', fontWeight: 600 }}>
                      Deadline: {new Date(selectedIssue.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h4 style={{ color: '#F1F2F7', fontWeight: 600, margin: '0 0 6px', fontSize: '0.95rem' }}>{selectedIssue.title}</h4>
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>{selectedIssue.description}</p>
              </div>

              {selectedIssue.before_image_url && (
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>BEFORE IMAGE</div>
                  <img src={selectedIssue.before_image_url} alt="Before" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, border: '1px solid #2A2D3D' }} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                  UPDATE STATUS
                </label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{
                  width: '100%', padding: '11px 14px', background: '#12131C',
                  border: '1px solid #2A2D3D', borderRadius: 10, color: '#F1F2F7',
                  fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
                }}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Escalation Options based on Level */}
              {ROLE_LEVELS[userRole] < 4 && selectedIssue.escalation_level < 4 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <input 
                    type="checkbox" 
                    id="escalateCheck" 
                    checked={escalateToNext} 
                    onChange={e => setEscalateToNext(e.target.checked)} 
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="escalateCheck" style={{ color: '#F1F2F7', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Escalate to Level {selectedIssue.escalation_level + 1} ({
                      selectedIssue.escalation_level === 1 ? 'Block Incharge' :
                      selectedIssue.escalation_level === 2 ? 'Faculty Coordinator' : 'HOD'
                    })
                  </label>
                </div>
              )}

              {/* Urgency Controls for Level 3 and 4 */}
              {ROLE_LEVELS[userRole] >= 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <input 
                    type="checkbox" 
                    id="urgentCheck" 
                    checked={toggleUrgent} 
                    onChange={e => setToggleUrgent(e.target.checked)} 
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="urgentCheck" style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Mark Issue as Urgent / Priority Escalation
                  </label>
                </div>
              )}

              {/* Deadline Configuration for HOD (Level 4) */}
              {ROLE_LEVELS[userRole] === 4 && (
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                    SET RESOLUTION DEADLINE (HOD ONLY)
                  </label>
                  <input 
                    type="datetime-local" 
                    value={deadlineInput} 
                    onChange={e => setDeadlineInput(e.target.value)} 
                    style={{
                      width: '100%', padding: '11px 14px', background: '#12131C',
                      border: '1px solid #2A2D3D', borderRadius: 10, color: '#F1F2F7',
                      fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
              )}

              {newStatus === 'resolved' && (
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                    AFTER IMAGE (OPTIONAL)
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    background: '#1E1F2E', border: '1px dashed #353851', borderRadius: 10,
                    cursor: 'pointer', color: '#6B7280', fontSize: '0.875rem',
                  }}>
                    <Upload size={14} />
                    {afterImage ? afterImage.name : 'Upload after-photo to show resolution'}
                    <input type="file" accept="image/*" onChange={e => setAfterImage(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleStatusUpdate} disabled={updatingStatus} style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: updatingStatus ? '#1E1F2E' : '#00E5FF',
                  color: updatingStatus ? '#6B7280' : '#090A0F',
                  fontWeight: 700, fontSize: '0.9rem', cursor: updatingStatus ? 'not-allowed' : 'pointer',
                }}>
                  {updatingStatus ? 'Updating...' : 'Save Changes'}
                </button>
                <button onClick={() => { setSelectedIssue(null); setNewStatus(''); setAfterImage(null); setEscalateToNext(false); }} style={{
                  padding: '12px 24px', borderRadius: 10,
                  background: '#1E1F2E', border: '1px solid #2A2D3D',
                  color: '#9CA3AF', fontWeight: 600, cursor: 'pointer',
                }}>
                  Cancel
                </button>
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
