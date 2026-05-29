'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Upload, MessageSquare, Tag, DollarSign, Phone } from 'lucide-react'

const CATEGORIES = ['Books', 'Electronics', 'Hostel Items', 'Instruments', 'Cycles', 'Others']

interface BazaarCreateModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function BazaarCreateModal({ onClose, onSuccess }: BazaarCreateModalProps) {
  const [type, setType] = useState<'selling' | 'looking_for'>('selling')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Books')
  const [price, setPrice] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim() || !whatsapp.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (!/^\d{10,12}$/.test(whatsapp.replace(/\s+/g, ''))) {
      setError('Enter a valid WhatsApp number (10-12 digits, no spaces).')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to post.')

      let image_url: string | null = null
      if (imageFile && type === 'selling') {
        const ext = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('bazaar-images')
          .upload(fileName, imageFile, { upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('bazaar-images')
          .getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 14)

      const { error: insertError } = await supabase.from('bazaar_items').insert({
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        price: type === 'looking_for' ? 0 : parseFloat(price) || 0,
        whatsapp_number: whatsapp.trim().replace(/\s+/g, ''),
        image_url,
        owner_id: user.id,
        expires_at: expiresAt.toISOString(),
      })

      if (insertError) throw insertError

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0E0F1A',
    border: '1px solid #2A2D3D',
    borderRadius: 10,
    color: '#F1F2F7',
    padding: '10px 14px',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#9CA3AF',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: 6,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#13141F',
        border: '1px solid #2A2D3D',
        borderRadius: 18,
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px 28px 32px',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, color: '#F1F2F7', fontSize: '1.25rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
              Post to GEC Bazaar
            </h2>
            <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.8rem' }}>Your listing expires in 14 days automatically</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#0E0F1A', borderRadius: 10, padding: 4 }}>
          {(['selling', 'looking_for'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.85rem',
                background: type === t ? (t === 'selling' ? '#00E5FF' : '#8B5CF6') : 'transparent',
                color: type === t ? '#090A0F' : '#6B7280',
                transition: 'all 0.2s',
              }}
            >
              {t === 'selling' ? '🏷️ Selling' : '🔍 Looking For'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}><Tag size={10} style={{ marginRight: 4 }} />Title *</label>
            <input
              style={inputStyle}
              placeholder={type === 'selling' ? 'e.g. Engineering Graphics Kit' : 'e.g. Need DLD Textbook'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}><MessageSquare size={10} style={{ marginRight: 4 }} />Description *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Describe the condition, edition, brand, etc."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Price - only for selling */}
          {type === 'selling' && (
            <div>
              <label style={labelStyle}><DollarSign size={10} style={{ marginRight: 4 }} />Price (₹) *</label>
              <input
                style={inputStyle}
                type="number"
                placeholder="e.g. 450"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min="0"
                required
              />
            </div>
          )}

          {/* WhatsApp */}
          <div>
            <label style={labelStyle}><Phone size={10} style={{ marginRight: 4 }} />WhatsApp Number *</label>
            <input
              style={inputStyle}
              placeholder="91XXXXXXXXXX (with country code)"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              required
            />
            <p style={{ color: '#4B5563', fontSize: '0.75rem', margin: '4px 0 0' }}>Buyers will contact you on this number</p>
          </div>

          {/* Image Upload - only for selling */}
          {type === 'selling' && (
            <div>
              <label style={labelStyle}>Photo (optional)</label>
              <label
                htmlFor="bazaar-image"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '20px',
                  border: '2px dashed #2A2D3D', borderRadius: 10,
                  cursor: 'pointer', background: '#0E0F1A',
                  transition: 'border-color 0.2s',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#00E5FF')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2D3D')}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 160 }} />
                ) : (
                  <>
                    <Upload size={24} color="#4B5563" />
                    <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>Click to upload (max 5MB)</span>
                  </>
                )}
              </label>
              <input id="bazaar-image" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>
          )}

          {error && (
            <div style={{ background: '#EF444415', border: '1px solid #EF444440', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 0', borderRadius: 10, border: 'none',
              background: loading ? '#2A2D3D' : (type === 'selling' ? '#00E5FF' : '#8B5CF6'),
              color: loading ? '#6B7280' : '#090A0F',
              fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginTop: 4,
            }}
          >
            {loading ? 'Posting...' : (type === 'selling' ? '🚀 Post Listing' : '📢 Post Request')}
          </button>
        </form>
      </div>
    </div>
  )
}
