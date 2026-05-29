'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { MapPin, ThumbsUp, MessageCircle, Send, Clock, User, AlertTriangle, RefreshCw } from 'lucide-react'

type Comment = { id: string; user: string; text: string; created_at: string }
type FeedIssue = {
  id: string; title: string; description: string; category: string
  status: string; address: string; before_image_url: string | null
  created_at: string; upvotes: number; isLiked: boolean
  reported_by_name: string; comments: Comment[]
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  open: { bg: '#EF444415', color: '#FCA5A5', border: '#EF444440', label: 'Open' },
  in_progress: { bg: '#F59E0B15', color: '#FCD34D', border: '#F59E0B40', label: 'In Progress' },
  resolved: { bg: '#10B98115', color: '#6EE7B7', border: '#10B98140', label: 'Resolved' },
}
const CATEGORY_COLORS: Record<string, string> = {
  road: '#F59E0B', lighting: '#00E5FF', sanitation: '#10B981', water: '#3B82F6', other: '#8B5CF6'
}

export default function FeedPage() {
  const [issues, setIssues] = useState<FeedIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [newCommentText, setNewCommentText] = useState<{ [key: string]: string }>({})
  const [activeFilter, setActiveFilter] = useState<string>('all')

  useEffect(() => { fetchFeed() }, [])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('issues')
        .select(`*, reported_by_profile: profiles!reported_by(full_name), comments: comments(id, text, created_at, profile: profiles(full_name))`)
        .order('created_at', { ascending: false })

      if (error) throw error
      const mapped = (data || []).map((issue: any) => ({
        id: issue.id, title: issue.title, description: issue.description, category: issue.category,
        status: issue.status, address: issue.address, before_image_url: issue.before_image_url,
        created_at: issue.created_at, upvotes: issue.upvotes || 0, isLiked: false,
        reported_by_name: issue.reported_by_profile?.full_name || 'Anonymous Student',
        comments: (issue.comments || []).map((c: any) => ({
          id: c.id, user: c.profile?.full_name || 'Anonymous', text: c.text, created_at: c.created_at
        })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }))
      setIssues(mapped)
    } catch (error) {
      console.error('Error fetching feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (issueId: string) => {
    const issue = issues.find(i => i.id === issueId)
    if (!issue) return
    const newIsLiked = !issue.isLiked
    const increment = newIsLiked ? 1 : -1
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, isLiked: newIsLiked, upvotes: i.upvotes + increment } : i))
    await supabase.from('issues').update({ upvotes: issue.upvotes + increment }).eq('id', issueId)
  }

  const handleAddComment = async (issueId: string) => {
    const text = newCommentText[issueId]
    if (!text?.trim()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert('Please log in to comment!')
      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({ issue_id: issueId, user_id: user.id, text: text.trim() })
        .select(`id, text, created_at, profile: profiles(full_name)`).single()
      if (error) throw error
      const profileData = commentData.profile as any
      const userName = (Array.isArray(profileData) ? profileData[0]?.full_name : profileData?.full_name)
      setIssues(prev => prev.map(issue => issue.id === issueId
        ? { ...issue, comments: [...issue.comments, { id: commentData.id, user: userName || 'You', text: commentData.text, created_at: commentData.created_at }] }
        : issue
      ))
      setNewCommentText(prev => ({ ...prev, [issueId]: '' }))
    } catch (error: any) {
      alert('Error adding comment: ' + error.message)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const filteredIssues = activeFilter === 'all' ? issues : issues.filter(i => i.status === activeFilter)

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', padding: '0 0 60px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 1rem 0' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F1F2F7', margin: '0 0 4px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
                Campus Feed
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>
                {issues.length} issues reported · Live updates
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/report" style={{
                padding: '8px 18px', borderRadius: 8,
                background: '#00E5FF', color: '#090A0F',
                fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <AlertTriangle size={14} /> Report Issue
              </Link>
              <button onClick={fetchFeed} style={{
                padding: '8px 12px', borderRadius: 8, background: '#1E1F2E',
                border: '1px solid #2A2D3D', color: '#9CA3AF', cursor: 'pointer',
              }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved']].map(([val, label]) => (
              <button key={val} onClick={() => setActiveFilter(val)} style={{
                padding: '5px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 500,
                background: activeFilter === val ? 'rgba(0,229,255,0.12)' : '#1E1F2E',
                color: activeFilter === val ? '#00E5FF' : '#6B7280',
                border: activeFilter === val ? '1px solid rgba(0,229,255,0.35)' : '1px solid #2A2D3D',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, border: '2px solid #2A2D3D', borderTopColor: '#00E5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '56px 32px',
            background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 16,
          }}>
            <AlertTriangle size={36} color="#2A2D3D" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6B7280', fontSize: '0.95rem', margin: 0 }}>No issues found for this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredIssues.map((issue) => {
              const statusStyle = STATUS_STYLES[issue.status] || STATUS_STYLES.open
              const catColor = CATEGORY_COLORS[issue.category] || '#8B5CF6'
              return (
                <div key={issue.id} style={{
                  background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 16, overflow: 'hidden',
                }}>
                  {/* Post header */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E1F2E' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${catColor}30, ${catColor}60)`,
                        border: `1px solid ${catColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: catColor, fontWeight: 700, fontSize: '0.9rem',
                      }}>
                        {issue.reported_by_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#F1F2F7', fontWeight: 600, fontSize: '0.9rem' }}>{issue.reported_by_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: '0.75rem', marginTop: 2 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} /> {getTimeAgo(issue.created_at)}
                          </span>
                          <span>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MapPin size={10} /> {issue.address?.split(',')[0] || 'GEC Campus'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`,
                      }}>
                        {issue.category}
                      </span>
                      <span style={{
                        padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600,
                        letterSpacing: '0.04em',
                        background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px 20px' }}>
                    <h2 style={{ color: '#F1F2F7', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 8px', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {issue.title}
                    </h2>
                    <p style={{ color: '#9CA3AF', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>{issue.description}</p>
                  </div>

                  {/* Image */}
                  {issue.before_image_url && (
                    <div style={{ margin: '0 20px 16px', borderRadius: 10, overflow: 'hidden', border: '1px solid #2A2D3D' }}>
                      <img src={issue.before_image_url} alt={issue.title} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ padding: '12px 20px', borderTop: '1px solid #1E1F2E', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => handleLike(issue.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                      cursor: 'pointer', color: issue.isLiked ? '#00E5FF' : '#6B7280', fontSize: '0.875rem', fontWeight: 500,
                      padding: 0, transition: 'color 0.2s',
                    }}>
                      <ThumbsUp size={15} style={{ fill: issue.isLiked ? '#00E5FF' : 'none' }} /> {issue.upvotes}
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: '0.875rem' }}>
                      <MessageCircle size={15} /> {issue.comments.length}
                    </span>
                  </div>

                  {/* Comments */}
                  <div style={{ background: '#0D0E18', borderTop: '1px solid #1E1F2E', padding: '16px 20px' }}>
                    {issue.comments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                        {issue.comments.map(comment => (
                          <div key={comment.id} style={{ display: 'flex', gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                              background: '#1E1F2E', border: '1px solid #2A2D3D',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <User size={13} color="#6B7280" />
                            </div>
                            <div style={{ background: '#12131C', border: '1px solid #1E1F2E', borderRadius: 10, padding: '8px 12px', flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: '#F1F2F7', fontWeight: 600, fontSize: '0.78rem' }}>{comment.user}</span>
                                <span style={{ color: '#4B5563', fontSize: '0.72rem' }}>{getTimeAgo(comment.created_at)}</span>
                              </div>
                              <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment input */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text" placeholder="Add a comment..."
                        value={newCommentText[issue.id] || ''}
                        onChange={e => setNewCommentText(prev => ({ ...prev, [issue.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddComment(issue.id) }}
                        style={{
                          flex: 1, padding: '9px 14px', background: '#12131C',
                          border: '1px solid #2A2D3D', borderRadius: 8,
                          color: '#F1F2F7', fontSize: '0.82rem', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = '#00E5FF'}
                        onBlur={e => e.target.style.borderColor = '#2A2D3D'}
                      />
                      <button
                        onClick={() => handleAddComment(issue.id)}
                        disabled={!newCommentText[issue.id]?.trim()}
                        style={{
                          width: 34, height: 34, borderRadius: 8, border: 'none',
                          background: newCommentText[issue.id]?.trim() ? '#00E5FF' : '#1E1F2E',
                          color: newCommentText[issue.id]?.trim() ? '#090A0F' : '#4B5563',
                          cursor: newCommentText[issue.id]?.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.2s',
                        }}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #4B5563; }`}</style>
    </div>
  )
}
