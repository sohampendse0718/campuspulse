'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, TrendingUp, Upload, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

type Issue = {
  id: string
  title: string
  description: string
  category: string
  status: string
  latitude: number
  longitude: number
  address: string
  before_image_url: string | null
  after_image_url: string | null
  created_at: string
  resolved_at: string | null
  upvotes: number
  comment_count: number
}

type Profile = {
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [afterImage, setAfterImage] = useState<File | null>(null)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  const checkUserAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in first!')
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'municipal_official') {
        alert('Access denied. Campus Admin/Official role required.')
        router.push('/map')
        return
      }

      setUser(user)
      setProfile(profile)
      fetchIssues()
    } catch (err: any) {
      console.error('Auth check error:', err)
      router.push('/login')
    }
  }

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setIssues(data || [])
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedIssue || !newStatus) return

    setUpdatingStatus(true)

    try {
      let afterImageUrl = selectedIssue.after_image_url

      // Upload after image if provided and status is resolved
      if (afterImage && newStatus === 'resolved') {
        const fileExt = afterImage.name.split('.').pop()
        const fileName = `${user.id}/after_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, afterImage)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName)
        
        afterImageUrl = publicUrl
      }

      // Update issue status
      const updateData: any = {
        status: newStatus,
        assigned_to: user.id,
      }

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        if (afterImageUrl) {
          updateData.after_image_url = afterImageUrl
        }
      }

      const { error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', selectedIssue.id)

      if (error) throw error

      // Create status history entry
      await supabase
        .from('issue_status_history')
        .insert({
          issue_id: selectedIssue.id,
          old_status: selectedIssue.status,
          new_status: newStatus,
          changed_by: user.id,
        })

      alert('Issue status updated successfully!')
      setSelectedIssue(null)
      setNewStatus('')
      setAfterImage(null)
      fetchIssues()
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Analytics calculations
  const totalIssues = issues.length
  const openIssues = issues.filter(i => i.status === 'open').length
  const inProgressIssues = issues.filter(i => i.status === 'in_progress').length
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length
  const resolutionRate = totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0

  // Category data for pie chart
  const categoryData = [
    { name: 'Road', value: issues.filter(i => i.category === 'road').length, color: '#3b82f6' },
    { name: 'Lighting', value: issues.filter(i => i.category === 'lighting').length, color: '#f59e0b' },
    { name: 'Sanitation', value: issues.filter(i => i.category === 'sanitation').length, color: '#10b981' },
    { name: 'Water', value: issues.filter(i => i.category === 'water').length, color: '#06b6d4' },
    { name: 'Other', value: issues.filter(i => i.category === 'other').length, color: '#6b7280' },
  ].filter(item => item.value > 0)

  // Status data for bar chart
  const statusData = [
    { name: 'Open', count: openIssues, color: '#ef4444' },
    { name: 'In Progress', count: inProgressIssues, color: '#eab308' },
    { name: 'Resolved', count: resolvedIssues, color: '#22c55e' },
  ]

  // Trend data (last 7 days)
  const getTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reported: issues.filter(i => i.created_at.split('T')[0] === date).length,
      resolved: issues.filter(i => i.resolved_at?.split('T')[0] === date).length,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0078D4]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-[#0078D4]" />
              <h1 className="text-2xl font-bold text-gray-900">CampusPulse Admin</h1>
            </Link>
            <div className="flex space-x-4">
              <Link href="/map" className="px-4 py-2 text-gray-700 hover:text-[#0078D4]">
                Map View
              </Link>
              <Link href="/feed" className="px-4 py-2 text-gray-700 hover:text-[#0078D4]">
                Feed
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<AlertCircle className="h-8 w-8" />}
            title="Total Issues"
            value={totalIssues}
            color="blue"
          />
          <StatCard
            icon={<Clock className="h-8 w-8" />}
            title="Open"
            value={openIssues}
            color="red"
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="In Progress"
            value={inProgressIssues}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Resolved"
            value={resolvedIssues}
            color="green"
            subtitle={`${resolutionRate}% resolution rate`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0078D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reported" stroke="#ef4444" name="Reported" />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">All Issues</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upvotes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{issue.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{issue.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        issue.status === 'open' ? 'bg-red-100 text-red-800' :
                        issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {issue.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">👍 {issue.upvotes}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedIssue(issue)
                          setNewStatus(issue.status)
                        }}
                        className="text-[#0078D4] hover:text-blue-700 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Manage Issue</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedIssue.title}</h4>
                  <p className="text-gray-600 text-sm">{selectedIssue.description}</p>
                </div>

                {selectedIssue.before_image_url && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Before Image</h4>
                    <img
                      src={selectedIssue.before_image_url}
                      alt="Before"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078D4]"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {newStatus === 'resolved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload After Image (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAfterImage(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                    className="flex-1 py-3 bg-[#0078D4] text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIssue(null)
                      setNewStatus('')
                      setAfterImage(null)
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, title, value, color, subtitle }: any) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    green: 'text-green-600 bg-green-100',
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}
