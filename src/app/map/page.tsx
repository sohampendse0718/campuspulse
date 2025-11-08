'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { MapPin, Filter, X } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import map component (Leaflet doesn't work with SSR)
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-200 animate-pulse rounded-lg"></div>
})

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
  created_at: string
  upvotes: number
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved'
type CategoryFilter = 'all' | 'road' | 'lighting' | 'sanitation' | 'water' | 'other'

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

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('issues-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        fetchIssues()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    filterIssues()
  }, [issues, statusFilter, categoryFilter])

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

  const filterIssues = () => {
    let filtered = issues

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter)
    }

    setFilteredIssues(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'resolved': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'road': return '🛣️'
      case 'lighting': return '💡'
      case 'sanitation': return '🗑️'
      case 'water': return '💧'
      default: return '📍'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-[#0078D4]" />
              <h1 className="text-2xl font-bold text-gray-900">CityPulse</h1>
            </Link>
            <div className="flex space-x-4">
              <Link href="/report" className="px-6 py-2 bg-[#0078D4] text-white rounded-lg hover:bg-blue-700 font-medium">
                Report Issue
              </Link>
              <Link href="/feed" className="px-4 py-2 text-gray-700 hover:text-[#0078D4]">
                Feed
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{issues.length}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {issues.filter(i => i.status === 'open').length}
            </div>
            <div className="text-sm text-gray-600">Open</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {issues.filter(i => i.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {issues.filter(i => i.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-[#0078D4] hover:text-blue-700"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078D4]"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078D4]"
                >
                  <option value="all">All Categories</option>
                  <option value="road">Road</option>
                  <option value="lighting">Lighting</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="water">Water</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="w-full h-[600px] bg-gray-200 animate-pulse"></div>
          ) : (
            <MapComponent 
              issues={filteredIssues} 
              onMarkerClick={setSelectedIssue}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Open</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedIssue.title}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(selectedIssue.status)}`}>
                      {selectedIssue.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-2xl">{getCategoryIcon(selectedIssue.category)}</span>
                    <span className="text-sm text-gray-600 capitalize">{selectedIssue.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {selectedIssue.before_image_url && (
                <img
                  src={selectedIssue.before_image_url}
                  alt={selectedIssue.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedIssue.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-600 text-sm">{selectedIssue.address}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {selectedIssue.latitude.toFixed(6)}, {selectedIssue.longitude.toFixed(6)}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Reported</h4>
                  <p className="text-gray-600 text-sm">
                    {new Date(selectedIssue.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="flex items-center space-x-4 pt-4 border-t">
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl">👍</span>
                    <span className="text-gray-600">{selectedIssue.upvotes} upvotes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}