'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Download, ExternalLink, ThumbsUp,
  Clock, Upload, X, Loader2
} from 'lucide-react'

const BRANCHES = ['Computer', 'IT', 'E&C', 'Mechanical', 'Civil', 'Mining', 'Electrical']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]

const TABS = [
  { key: 'all',              label: 'All Resources',      emoji: '📚' },
  { key: 'notes',            label: 'Notes',              emoji: '📝' },
  { key: 'pyq',              label: 'PYQs',               emoji: '📋' },
  { key: 'internal_test',    label: 'Internal Tests',     emoji: '📊' },
  { key: 'tutoring_offer',   label: 'Tutoring Offers',    emoji: '🎓' },
  { key: 'tutoring_request', label: 'Tutoring Requests',  emoji: '🙋' },
]

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  notes:             { label: 'Notes',             color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  emoji: '📝' },
  pyq:               { label: 'PYQ',               color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', emoji: '📋' },
  internal_test:     { label: 'Internal Test',     color: '#10B981', bg: 'rgba(16,185,129,0.12)',  emoji: '📊' },
  tutoring_offer:    { label: 'Tutoring ✅',        color: '#00E5FF', bg: 'rgba(0,229,255,0.12)',   emoji: '🎓' },
  tutoring_request:  { label: 'Tutoring 🙋',        color: '#EC4899', bg: 'rgba(236,72,153,0.12)', emoji: '🙋' },
}

type StudyNote = {
  id: string
  title: string
  subject: string
  branch: string
  semester: number
  type: string
  description: string | null
  resource_link: string | null
  file_url: string | null
  file_name: string | null
  whatsapp_number: string | null
  exam_year: number | null
  exam_subtype: string | null
  tags: string[] | null
  upvotes: number
  created_at: string
  uploaded_by: string
  uploader_name: string
  isUpvoted: boolean
}

function SkeletonCard() {
  return (
    <div style={{ background: '#13141F', border: '1px solid #1E1F2E', borderRadius: 16, padding: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ height: 22, width: 100, background: '#1E1F2E', borderRadius: 100 }} />
        <div style={{ height: 16, width: 48, background: '#1E1F2E', borderRadius: 6 }} />
      </div>
      <div style={{ height: 18, background: '#1E1F2E', borderRadius: 6, width: '80%', marginBottom: 8 }} />
      <div style={{ height: 14, background: '#1E1F2E', borderRadius: 6, width: '55%', marginBottom: 14 }} />
      <div style={{ height: 12, background: '#1E1F2E', borderRadius: 6, width: '95%', marginBottom: 6 }} />
      <div style={{ height: 12, background: '#1E1F2E', borderRadius: 6, width: '70%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <div style={{ height: 20, width: 60, background: '#1E1F2E', borderRadius: 4 }} />
        <div style={{ height: 20, width: 50, background: '#1E1F2E', borderRadius: 4 }} />
      </div>
      <div style={{ height: 36, background: '#1E1F2E', borderRadius: 8 }} />
    </div>
  )
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

// ─────────────────────────────────────────────────────────────────────────────
// Upload Modal
// ─────────────────────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess, userId }: {
  onClose: () => void
  onSuccess: () => void
  userId: string
}) {
  const [form, setForm] = useState({
    title: '', subject: '', branch: '', semester: '',
    type: 'notes', description: '', resource_link: '',
    whatsapp_number: '', exam_year: '', exam_subtype: '', tags: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const isTutoring = form.type === 'tutoring_offer' || form.type === 'tutoring_request'
  const isPYQ      = form.type === 'pyq'
  const isIT       = form.type === 'internal_test'
  const needsFile  = !isTutoring

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async () => {
    if (!form.title || !form.subject || !form.branch || !form.semester) {
      setError('Please fill in Title, Subject, Branch and Semester.'); return
    }
    if (needsFile && !file && !form.resource_link) {
      setError('Please upload a file OR provide a resource link.'); return
    }
    if (isTutoring && !form.whatsapp_number) {
      setError('WhatsApp number is required for tutoring posts.'); return
    }

    setUploading(true); setError('')
    try {
      let fileUrl: string | null = null
      let fileName: string | null = null

      if (file) {
        const ext  = file.name.split('.').pop()
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('note-files').upload(path, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('note-files').getPublicUrl(path)
        fileUrl  = publicUrl
        fileName = file.name
      }

      const { error: insErr } = await supabase.from('study_notes').insert({
        title:          form.title.trim(),
        subject:        form.subject.trim(),
        branch:         form.branch,
        semester:       parseInt(form.semester),
        type:           form.type,
        description:    form.description.trim() || null,
        resource_link:  form.resource_link.trim() || null,
        file_url:       fileUrl,
        file_name:      fileName,
        whatsapp_number: form.whatsapp_number.trim() || null,
        exam_year:      (isPYQ || isIT) && form.exam_year ? parseInt(form.exam_year) : null,
        exam_subtype:   (isPYQ || isIT) ? (form.exam_subtype || null) : null,
        tags:           form.tags.trim()
                          ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
                          : null,
        uploaded_by:    userId,
      })

      if (insErr) throw insErr
      onSuccess()
    } catch (e: any) {
      setError(e.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px',
    background: '#0D0E18', border: '1px solid #2A2D3D', borderRadius: 8,
    color: '#F1F2F7', fontSize: '0.875rem', transition: 'border-color 0.2s',
  }
  const lbl: React.CSSProperties = {
    display: 'block', color: '#9CA3AF', fontSize: '0.7rem',
    fontWeight: 700, marginBottom: 6, letterSpacing: '0.06em',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 20,
        width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', padding: 28,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#F1F2F7', fontWeight: 800, fontSize: '1.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>
            📤 Upload Resource
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #2A2D3D', background: '#1E1F2E', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Type */}
          <div>
            <label style={lbl}>TYPE *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="notes">📝 Notes</option>
              <option value="pyq">📋 Previous Year Question (PYQ)</option>
              <option value="internal_test">📊 Internal Test (IT1 / IT2)</option>
              <option value="tutoring_offer">🎓 Tutoring Offer — I can teach</option>
              <option value="tutoring_request">🙋 Tutoring Request — I need help</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={lbl}>TITLE *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. DSA Unit 3 — Trees & Graphs (2024)" style={inp} />
          </div>

          {/* Subject */}
          <div>
            <label style={lbl}>SUBJECT *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Data Structures & Algorithms" style={inp} />
          </div>

          {/* Branch + Semester */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>BRANCH *</label>
              <select value={form.branch} onChange={e => set('branch', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select Branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>SEMESTER *</label>
              <select value={form.semester} onChange={e => set('semester', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select Sem</option>
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          {/* PYQ / IT extra fields */}
          {(isPYQ || isIT) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>YEAR</label>
                <select value={form.exam_year} onChange={e => set('exam_year', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Select Year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>{isIT ? 'TEST TYPE' : 'EXAM TYPE'}</label>
                {isIT ? (
                  <select value={form.exam_subtype} onChange={e => set('exam_subtype', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select Type</option>
                    <option value="it1">IT1 — Internal Test 1</option>
                    <option value="it2">IT2 — Internal Test 2</option>
                  </select>
                ) : (
                  <select value={form.exam_subtype} onChange={e => set('exam_subtype', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select Type</option>
                    <option value="end_sem">End Semester</option>
                    <option value="mid_sem">Mid Semester</option>
                    <option value="makeup">Makeup Exam</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label style={lbl}>DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder={isTutoring
                ? 'Describe what you can teach / what help you need, your availability, preferred mode...'
                : 'Briefly describe what topics are covered in this resource...'
              }
              rows={3}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* File Upload */}
          {needsFile && (
            <div>
              <label style={lbl}>UPLOAD FILE (PDF, DOC, PPT, IMAGE)</label>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#0D0E18', border: '1px dashed #2A2D3D', borderRadius: 8, cursor: 'pointer', color: file ? '#A78BFA' : '#6B7280', fontSize: '0.875rem', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#8B5CF6'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#2A2D3D'}
              >
                <Upload size={15} />
                {file ? (
                  <span style={{ fontWeight: 600, color: '#A78BFA' }}>{file.name}</span>
                ) : (
                  <span>Click to choose file — PDF, DOCX, PPT, JPG, PNG</span>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx,.txt"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {/* Resource Link */}
          {needsFile && (
            <div>
              <label style={lbl}>OR SHARE A LINK (GOOGLE DRIVE, NOTION, MEGA…)</label>
              <input
                value={form.resource_link}
                onChange={e => set('resource_link', e.target.value)}
                placeholder="https://drive.google.com/file/..."
                style={inp}
              />
              <div style={{ color: '#4B5563', fontSize: '0.72rem', marginTop: 4 }}>
                You can provide both a file upload AND a link
              </div>
            </div>
          )}

          {/* WhatsApp (tutoring) */}
          {isTutoring && (
            <div>
              <label style={lbl}>WHATSAPP NUMBER * (with country code, no spaces)</label>
              <input
                value={form.whatsapp_number}
                onChange={e => set('whatsapp_number', e.target.value)}
                placeholder="919876543210"
                type="tel"
                style={inp}
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label style={lbl}>TAGS (COMMA SEPARATED)</label>
            <input
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="DSA, Sorting, Binary Tree, Graphs, Unit 3"
              style={inp}
            />
          </div>

          {error && (
            <div style={{ color: '#FCA5A5', fontSize: '0.82rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              style={{
                flex: 1, padding: '13px', borderRadius: 10, border: 'none',
                background: uploading ? '#1E1F2E' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                color: uploading ? '#6B7280' : '#fff',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {uploading
                ? (<><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading…</>)
                : (<><Upload size={15} /> Upload Resource</>)
              }
            </button>
            <button
              onClick={onClose}
              style={{ padding: '13px 20px', borderRadius: 10, background: '#1E1F2E', border: '1px solid #2A2D3D', color: '#9CA3AF', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Notes Page
// ─────────────────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes]               = useState<StudyNote[]>([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('all')
  const [activeBranch, setActiveBranch] = useState('All')
  const [activeSem, setActiveSem]       = useState(0)   // 0 = All
  const [activeYear, setActiveYear]     = useState(0)   // 0 = All
  const [search, setSearch]             = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [currentUser, setCurrentUser]   = useState<any>(null)

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.replace('/login'); return }
      setCurrentUser(session.user)
    })
  }, [router])

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('study_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (activeTab !== 'all')  query = query.eq('type', activeTab)
      if (activeBranch !== 'All') query = query.eq('branch', activeBranch)
      if (activeSem !== 0)      query = query.eq('semester', activeSem)
      if (activeYear !== 0)     query = query.eq('exam_year', activeYear)

      const { data, error } = await query
      if (error) throw error

      const ids = Array.from(new Set((data || []).map((n: any) => n.uploaded_by)))
      const nameMap: Record<string, string> = {}
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids)
        profs?.forEach((p: any) => { nameMap[p.id] = p.full_name })
      }

      setNotes((data || []).map((n: any) => ({
        ...n,
        uploader_name: nameMap[n.uploaded_by] || 'GEC Student',
        isUpvoted: false,
      })))
    } catch (err: any) {
      console.error('Error fetching notes:', err.message)
    } finally {
      setLoading(false)
    }
  }, [activeTab, activeBranch, activeSem, activeYear])

  useEffect(() => {
    if (currentUser) fetchNotes()
  }, [fetchNotes, currentUser])

  const handleUpvote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const upvoted = !note.isUpvoted
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, isUpvoted: upvoted, upvotes: n.upvotes + (upvoted ? 1 : -1) } : n
    ))
    await supabase.from('study_notes').update({ upvotes: note.upvotes + (upvoted ? 1 : -1) }).eq('id', noteId)
  }

  const filteredNotes = notes.filter(note => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      note.title.toLowerCase().includes(q) ||
      note.subject.toLowerCase().includes(q) ||
      (note.description || '').toLowerCase().includes(q) ||
      (note.tags || []).some(t => t.toLowerCase().includes(q)) ||
      note.branch.toLowerCase().includes(q)
    )
  })

  const showYearFilter = activeTab === 'pyq' || activeTab === 'internal_test' || activeTab === 'all'

  if (!currentUser) return null

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', paddingBottom: 80 }}>
      <style>{`
        @keyframes pulse  { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin   { to { transform: rotate(360deg) } }
        .note-card { animation: fadeIn 0.3s ease both; transition: transform 0.2s, box-shadow 0.2s; }
        .note-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.45) !important; }
        .tab-btn:hover { background: rgba(139,92,246,0.06) !important; color: #C4B5FD !important; }
        .pill-btn:hover { border-color: rgba(0,229,255,0.4) !important; color: #00E5FF !important; }
        .sem-btn:hover  { border-color: rgba(139,92,246,0.4) !important; color: #A78BFA !important; }
        .yr-btn:hover   { border-color: rgba(245,158,11,0.4) !important; color: #FCD34D !important; }
        input:focus, textarea:focus, select:focus { border-color: #00E5FF !important; outline: none; box-shadow: 0 0 0 3px rgba(0,229,255,0.07); }
        select option { background: #1E1F2E; color: #F1F2F7; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #2A2D3D; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 1.5rem 0' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(0,229,255,0.2))', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}>
                <span style={{ fontSize: '1.5rem' }}>📚</span>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, background: 'linear-gradient(135deg, #A78BFA, #00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}>
                  GEC Study Pool
                </h1>
              </div>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>
              Notes · PYQs · Internal Tests · Peer Tutoring — for GECians, by GECians
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(139,92,246,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(139,92,246,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.35)' }}
          >
            <Plus size={16} /> Upload Resource
          </button>
        </div>

        {/* ── Search ── */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} color="#4B5563" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, subject, tags, or branch…"
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12, background: '#13141F', border: '1px solid #2A2D3D', borderRadius: 12, color: '#F1F2F7', fontSize: '0.9rem', transition: 'border-color 0.2s, box-shadow 0.2s' }}
          />
        </div>

        {/* ── Type Tabs ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => { setActiveTab(tab.key); setActiveYear(0) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s', borderColor: activeTab === tab.key ? 'rgba(139,92,246,0.5)' : '#2A2D3D', background: activeTab === tab.key ? 'rgba(139,92,246,0.12)' : '#13141F', color: activeTab === tab.key ? '#A78BFA' : '#6B7280' }}
            >
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Branch */}
          <div>
            <div style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>BRANCH</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', ...BRANCHES].map(b => (
                <button
                  key={b}
                  className="pill-btn"
                  onClick={() => setActiveBranch(b)}
                  style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap', borderColor: activeBranch === b ? 'rgba(0,229,255,0.45)' : '#2A2D3D', background: activeBranch === b ? 'rgba(0,229,255,0.1)' : '#13141F', color: activeBranch === b ? '#00E5FF' : '#6B7280' }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Semester */}
          <div>
            <div style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>SEMESTER</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[0, ...SEMESTERS].map(s => (
                <button
                  key={s}
                  className="sem-btn"
                  onClick={() => setActiveSem(s)}
                  style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap', borderColor: activeSem === s ? 'rgba(139,92,246,0.45)' : '#2A2D3D', background: activeSem === s ? 'rgba(139,92,246,0.1)' : '#13141F', color: activeSem === s ? '#A78BFA' : '#6B7280' }}
                >
                  {s === 0 ? 'All' : `Sem ${s}`}
                </button>
              ))}
            </div>
          </div>

          {/* Year */}
          {showYearFilter && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>YEAR (PYQ / IT)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[0, ...YEARS].map(y => (
                  <button
                    key={y}
                    className="yr-btn"
                    onClick={() => setActiveYear(y)}
                    style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap', borderColor: activeYear === y ? 'rgba(245,158,11,0.45)' : '#2A2D3D', background: activeYear === y ? 'rgba(245,158,11,0.1)' : '#13141F', color: activeYear === y ? '#FCD34D' : '#6B7280' }}
                  >
                    {y === 0 ? 'All' : y}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Result count ── */}
        <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: 16 }}>
          {loading ? 'Loading resources…' : `${filteredNotes.length} resource${filteredNotes.length !== 1 ? 's' : ''} found`}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', border: '1px dashed #2A2D3D', borderRadius: 20 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
            <h3 style={{ color: '#4B5563', margin: '0 0 8px', fontFamily: "'Space Grotesk', sans-serif" }}>
              {search ? 'No matching resources' : 'No resources uploaded yet'}
            </h3>
            <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0 }}>
              {search ? 'Try different keywords or clear the search.' : 'Be the first to contribute to GEC Study Pool!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredNotes.map((note, i) => {
              const tc        = TYPE_CONFIG[note.type] || TYPE_CONFIG.notes
              const isTutor   = note.type === 'tutoring_offer' || note.type === 'tutoring_request'
              const hasFile   = !!note.file_url
              const hasLink   = !!note.resource_link
              return (
                <div
                  key={note.id}
                  className="note-card"
                  style={{ background: '#13141F', border: '1px solid #1E1F2E', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, animationDelay: `${i * 0.04}s` }}
                >
                  {/* Type + Semester */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', background: tc.bg, color: tc.color }}>
                      {tc.emoji} {tc.label}
                    </span>
                    <span style={{ color: '#4B5563', fontSize: '0.72rem', fontWeight: 600 }}>
                      Sem {note.semester}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ margin: 0, color: '#F1F2F7', fontSize: '0.97rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                    {note.title}
                  </h3>

                  {/* Meta chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,229,255,0.08)', color: '#00E5FF', fontSize: '0.7rem', fontWeight: 700 }}>{note.branch}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#1E1F2E', color: '#9CA3AF', fontSize: '0.7rem' }}>{note.subject}</span>
                    {note.exam_year && (
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#FCD34D', fontSize: '0.7rem', fontWeight: 700 }}>{note.exam_year}</span>
                    )}
                    {note.exam_subtype && (
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: '#1E1F2E', color: '#6B7280', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        {note.exam_subtype.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {note.description && (
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {note.description}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {note.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{ padding: '2px 7px', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: '#A78BFA', fontSize: '0.67rem', fontWeight: 500 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#4B5563', fontSize: '0.73rem' }}>
                        by <span style={{ color: '#6B7280', fontWeight: 600 }}>{note.uploader_name}</span>
                      </span>
                      <span style={{ color: '#374151', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> {getTimeAgo(note.created_at)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Upvote */}
                      <button
                        onClick={() => handleUpvote(note.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.2s', borderColor: note.isUpvoted ? 'rgba(0,229,255,0.4)' : '#2A2D3D', background: note.isUpvoted ? 'rgba(0,229,255,0.08)' : '#1E1F2E', color: note.isUpvoted ? '#00E5FF' : '#6B7280' }}
                      >
                        <ThumbsUp size={12} style={{ fill: note.isUpvoted ? '#00E5FF' : 'none' }} />
                        {note.upvotes}
                      </button>

                      {/* Action buttons */}
                      {isTutor ? (
                        note.whatsapp_number && (
                          <button
                            onClick={() => {
                              const msg = note.type === 'tutoring_offer'
                                ? `Hi! I saw your tutoring offer for '${note.subject}' on GEC Study Pool.`
                                : `Hi! I saw your tutoring request for '${note.subject}' on GEC Study Pool. I can help!`
                              window.open(`https://wa.me/${note.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank')
                            }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: 'none', background: '#1DAA6115', color: '#25D366', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#1DAA6115'; e.currentTarget.style.color = '#25D366' }}
                          >
                            💬 Contact
                          </button>
                        )
                      ) : (
                        <>
                          {hasFile && (
                            <a
                              href={note.file_url!}
                              download={note.file_name || true}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', color: '#A78BFA', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', border: '1px solid rgba(139,92,246,0.3)', transition: 'all 0.2s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.22)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.12)'}
                            >
                              <Download size={12} /> Download
                            </a>
                          )}
                          {hasLink && (
                            <a
                              href={note.resource_link!}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, background: 'rgba(0,229,255,0.08)', color: '#00E5FF', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', border: '1px solid rgba(0,229,255,0.25)', transition: 'all 0.2s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.16)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.08)'}
                            >
                              <ExternalLink size={12} /> Open Link
                            </a>
                          )}
                          {!hasFile && !hasLink && (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', fontSize: '0.75rem' }}>
                              No download available
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchNotes() }}
          userId={currentUser.id}
        />
      )}
    </div>
  )
}
