'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, ThumbsUp, MessageCircle, Send, Clock, User, Loader2 } from 'lucide-react'

type Comment = {
  id: string
  user: string
  text: string
  created_at: string
}

type FeedIssue = {
  id: string
  title: string
  description: string
  category: string
  status: string
  address: string
  before_image_url: string | null
  created_at: string
  upvotes: number
  isLiked: boolean
  reported_by_name: string
  comments: Comment[]
}

export default function FeedPage() {
  const [issues, setIssues] = useState<FeedIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newCommentText, setNewCommentText] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          reported_by_profile: profiles!reported_by(full_name),
          comments: comments(
            id,
            text,
            created_at,
            profile: profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedData = (data || []).map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        address: issue.address,
        before_image_url: issue.before_image_url,
        created_at: issue.created_at,
        upvotes: issue.upvotes || 0,
        isLiked: false,
        reported_by_name: issue.reported_by_profile?.full_name || 'Anonymous Citizen',
        comments: (issue.comments || []).map((c: any) => ({
          id: c.id,
          user: c.profile?.full_name || 'Anonymous',
          text: c.text,
          created_at: c.created_at
        })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }))

      setIssues(mappedData)
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

    try {
      // Optimistic UI update
      setIssues(prevIssues =>
        prevIssues.map(i => {
          if (i.id === issueId) {
            return {
              ...i,
              isLiked: newIsLiked,
              upvotes: i.upvotes + increment
            }
          }
          return i
        })
      )

      await supabase
        .from('issues')
        .update({ upvotes: issue.upvotes + increment })
        .eq('id', issueId)
    } catch (err) {
      console.error('Error updating upvote:', err)
    }
  }

  const handleAddComment = async (issueId: string) => {
    const text = newCommentText[issueId]
    if (!text || text.trim() === '') return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert('Please log in to comment!')

      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({
          issue_id: issueId,
          user_id: user.id,
          text: text.trim()
        })
        .select(`
          id,
          text,
          created_at,
          profile: profiles(full_name)
        `)
        .single()

      if (error) throw error

      const profileData = commentData.profile as any
      const userName = (Array.isArray(profileData) ? profileData[0]?.full_name : profileData?.full_name)

      const newComment = {
        id: commentData.id,
        user: userName || 'You',
        text: commentData.text,
        created_at: commentData.created_at
      }

      setIssues(prevIssues =>
        prevIssues.map(issue => {
          if (issue.id === issueId) {
            return {
              ...issue,
              comments: [...issue.comments, newComment]
            }
          }
          return issue
        })
      )

      // Clear input
      setNewCommentText(prev => ({ ...prev, [issueId]: '' }))
    } catch (error: any) {
      alert('Error adding comment: ' + error.message)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-[#0078D4]" />
            <h1 className="text-2xl font-bold text-gray-900">CampusPulse Feed</h1>
          </Link>
          <div className="flex space-x-4">
            <Link href="/map" className="px-4 py-2 text-gray-700 hover:text-[#0078D4] font-medium">Map</Link>
            <Link href="/report" className="px-4 py-2 bg-[#0078D4] text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
              Report Issue
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0078D4]" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <p className="text-lg font-medium text-gray-700">No issues reported yet on campus.</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to report a problem and make our campus better!</p>
          </div>
        ) : (
          issues.map((issue) => (
            <motion.div 
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-tr from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {issue.reported_by_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{issue.reported_by_name}</h3>
                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {getTimeAgo(issue.created_at)}</span>
                      <span>•</span>
                      <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {issue.address}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(issue.status)}`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h2>
                <p className="text-gray-700 mb-4">{issue.description}</p>
              </div>

              {/* Post Image */}
              {issue.before_image_url && (
                <div className="w-full h-64 bg-gray-200">
                  <img 
                    src={issue.before_image_url} 
                    alt={issue.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Actions Bar */}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center space-x-6">
                <button 
                  onClick={() => handleLike(issue.id)}
                  className={`flex items-center space-x-2 transition-colors ${issue.isLiked ? 'text-[#0078D4]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <ThumbsUp className={`w-5 h-5 ${issue.isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{issue.upvotes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{issue.comments.length}</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                {issue.comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {issue.comments.map(comment => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex-1">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-sm text-gray-900">{comment.user}</span>
                            <span className="text-xs text-gray-500">{getTimeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex items-center space-x-2 mt-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Write a comment..." 
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent"
                    value={newCommentText[issue.id] || ''}
                    onChange={(e) => setNewCommentText(prev => ({ ...prev, [issue.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(issue.id) }}
                  />
                  <button 
                    onClick={() => handleAddComment(issue.id)}
                    disabled={!newCommentText[issue.id]?.trim()}
                    className="p-2 bg-[#0078D4] text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  )
}
