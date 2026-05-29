'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Upload, Loader2 } from 'lucide-react'

type Category = 'road' | 'lighting' | 'sanitation' | 'water' | 'other'

export default function ReportPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('road')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [address, setAddress] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in first!')
      router.push('/login')
    } else {
      setUser(user)
    }
  }

  const getLocation = () => {
    setLocationLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude)
          setLongitude(pos.coords.longitude)
          setLocationLoading(false)
          reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        },
        (err) => {
          alert('Error getting location: ' + err.message)
          setLocationLoading(false)
        }
      )
    } else alert('Geolocation not supported')
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'CampusPulse/1.0 (contact@CampusPulse.com)' // required by Nominatim
        }
      })
      const data = await res.json()
      if (data.display_name) setAddress(data.display_name)
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      // Fallback
      setAddress('Unknown address (Reverse geocoding failed)')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return alert('Please log in')
    if (!latitude || !longitude) return alert('Please get your location')

    setLoading(true)
    try {
      let beforeImageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/before_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName)

        beforeImageUrl = publicUrl
      }

      const { error } = await supabase
        .from('issues')
        .insert({
          title,
          description,
          category,
          latitude,
          longitude,
          address,
          before_image_url: beforeImageUrl,
          reported_by: user.id
        })

      if (error) throw error

      alert('Issue reported successfully!')
      router.push('/map')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50">
      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30"
      >
        <div className="max-w-6xl mx-auto px-5 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#0078D4]" />
            <h1 className="text-xl font-bold text-gray-900">CampusPulse</h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/map" className="text-gray-700 hover:text-[#0078D4]">Map</Link>
            <Link href="/feed" className="text-gray-700 hover:text-[#0078D4]">Feed</Link>
          </div>
        </div>
      </motion.header>

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl mx-auto px-4 py-10"
      >
        <motion.div
          layout
          className="bg-white rounded-2xl shadow-md p-6 md:p-8"
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 150 }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-gray-800 mb-1"
          >
            Report an Issue
          </motion.h2>
          <p className="text-gray-500 mb-6 text-sm">Help improve your campus by reporting campus problems</p>

          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            {/* Title */}
            <motion.div whileFocus={{ scale: 1.02 }}>
              <label className="font-medium text-gray-700 mb-1 block">Issue Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Broken streetlight near park"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078D4] outline-none"
              />
            </motion.div>

            {/* Category */}
            <motion.div whileFocus={{ scale: 1.02 }}>
              <label className="font-medium text-gray-700 mb-1 block">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078D4] outline-none"
              >
                <option value="road">Road</option>
                <option value="lighting">Lighting</option>
                <option value="sanitation">Sanitation</option>
                <option value="water">Water</option>
                <option value="other">Other</option>
              </select>
            </motion.div>

            {/* Description */}
            <motion.div whileFocus={{ scale: 1.02 }}>
              <label className="font-medium text-gray-700 mb-1 block">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Describe the issue clearly..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078D4] outline-none"
              />
            </motion.div>

            {/* Location */}
            <motion.div>
              <label className="font-medium text-gray-700 mb-1 block">Location *</label>
              <motion.button
                type="button"
                onClick={getLocation}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] text-white rounded-lg hover:bg-blue-700"
              >
                {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {locationLoading ? 'Getting...' : 'Get Location'}
              </motion.button>
              {latitude && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-xs text-gray-600"
                >
                  📍 {latitude.toFixed(5)}, {longitude?.toFixed(5)} <br />
                  {address && <span>{address}</span>}
                </motion.div>
              )}
            </motion.div>

            {/* Image Upload */}
            <motion.div>
              <label className="font-medium text-gray-700 mb-1 block">Photo (Before Image)</label>
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <motion.img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-3 rounded-lg shadow-md object-cover w-full h-48"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="w-full py-2 bg-[#0078D4] text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Report'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
