'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MapPin, Upload, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'

type Category = 'road' | 'lighting' | 'sanitation' | 'water' | 'other'

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'road', label: 'Road / Infrastructure', emoji: '🛣️', color: '#F59E0B' },
  { value: 'lighting', label: 'Lighting', emoji: '💡', color: '#00E5FF' },
  { value: 'sanitation', label: 'Sanitation', emoji: '🧹', color: '#10B981' },
  { value: 'water', label: 'Water / Plumbing', emoji: '💧', color: '#3B82F6' },
  { value: 'other', label: 'Other', emoji: '📋', color: '#8B5CF6' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: '#12131C', border: '1px solid #2A2D3D',
  borderRadius: 10, color: '#F1F2F7', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  fontFamily: 'inherit',
}

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
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { alert('Please log in first!'); router.push('/login') }
      else setUser(user)
    })
  }, [router])

  const getLocation = () => {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocationLoading(false)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, {
            headers: { 'User-Agent': 'CampusPulse/1.0 (contact@campuspulse.com)' }
          })
          const data = await res.json()
          if (data.display_name) setAddress(data.display_name)
        } catch { setAddress('Location detected') }
      },
      (err) => { alert('Error: ' + err.message); setLocationLoading(false) }
    )
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
    if (!latitude || !longitude) return alert('Please get your location first')
    setLoading(true)
    try {
      let beforeImageUrl = null
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/before_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('issue-images').upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('issue-images').getPublicUrl(fileName)
        beforeImageUrl = publicUrl
      }
      const { error } = await supabase.from('issues').insert({
        title, description, category, latitude, longitude, address, before_image_url: beforeImageUrl, reported_by: user.id
      })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/map'), 2000)
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#090A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #2A2D3D', borderTopColor: '#00E5FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#090A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle2 size={36} color="#10B981" />
      </div>
      <h2 style={{ color: '#F1F2F7', fontWeight: 700, fontSize: '1.4rem', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Issue Reported!</h2>
      <p style={{ color: '#6B7280', margin: 0 }}>Redirecting to map...</p>
    </div>
  )

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', padding: '32px 1rem 60px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 100,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#FCA5A5', fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.06em', marginBottom: 12,
          }}>
            <AlertCircle size={11} /> REPORT AN ISSUE
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F1F2F7', margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            Submit a Campus Issue
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
            Help campus administration identify and resolve problems faster
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#12131C', border: '1px solid #2A2D3D', borderRadius: 20, overflow: 'hidden',
        }}>
          <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Title */}
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                  ISSUE TITLE *
                </label>
                <input
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Broken streetlight near hostel block C"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00E5FF'}
                  onBlur={e => e.target.style.borderColor = '#2A2D3D'}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 12, letterSpacing: '0.04em' }}>
                  CATEGORY *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                  {CATEGORIES.map(({ value, label, emoji, color }) => (
                    <button key={value} type="button" onClick={() => setCategory(value)} style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: category === value ? `${color}15` : '#1E1F2E',
                      border: category === value ? `1px solid ${color}50` : '1px solid #2A2D3D',
                      color: category === value ? color : '#6B7280',
                      fontSize: '0.8rem', fontWeight: 500,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                      transition: 'all 0.2s ease', textAlign: 'left',
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                  DESCRIPTION *
                </label>
                <textarea
                  required rows={4} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail. What's the problem and where exactly is it located?"
                  style={{ ...inputStyle, resize: 'vertical', padding: '12px 14px' }}
                  onFocus={e => e.target.style.borderColor = '#00E5FF'}
                  onBlur={e => e.target.style.borderColor = '#2A2D3D'}
                />
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                  LOCATION *
                </label>
                <button type="button" onClick={getLocation} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                  background: latitude ? 'rgba(16,185,129,0.1)' : 'rgba(0,229,255,0.08)',
                  border: latitude ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(0,229,255,0.3)',
                  color: latitude ? '#10B981' : '#00E5FF',
                  fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s',
                }}>
                  {locationLoading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <MapPin size={15} />}
                  {locationLoading ? 'Detecting location...' : latitude ? 'Location detected ✓' : 'Get My Location'}
                </button>
                {latitude && address && (
                  <div style={{
                    marginTop: 10, padding: '10px 14px', borderRadius: 8,
                    background: '#0D0E18', border: '1px solid #1E1F2E',
                    color: '#9CA3AF', fontSize: '0.78rem', lineHeight: 1.5,
                  }}>
                    📍 {address}
                    <br /><span style={{ color: '#4B5563', fontSize: '0.72rem' }}>{latitude.toFixed(6)}, {longitude?.toFixed(6)}</span>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.04em' }}>
                  PHOTO (OPTIONAL)
                </label>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  background: '#1E1F2E', border: '1px dashed #353851', borderRadius: 10,
                  cursor: 'pointer', color: '#6B7280', fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}>
                  <Upload size={16} />
                  {imageFile ? imageFile.name : 'Click to upload before-photo'}
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
                {imagePreview && (
                  <div style={{ position: 'relative', marginTop: 10 }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, border: '1px solid #2A2D3D', display: 'block' }} />
                    <button type="button" onClick={() => { setImagePreview(null); setImageFile(null) }} style={{
                      position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(9,10,15,0.8)', border: '1px solid #2A2D3D',
                      color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: loading ? '#1E1F2E' : '#00E5FF',
                color: loading ? '#6B7280' : '#090A0F',
                border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease', marginTop: 8,
              }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 25px rgba(0,229,255,0.35)'; (e.currentTarget as HTMLElement).style.background = '#00B8CC' } }}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.background = '#00E5FF' } }}
              >
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting...</>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder, textarea::placeholder { color: #4B5563; }`}</style>
    </div>
  )
}
