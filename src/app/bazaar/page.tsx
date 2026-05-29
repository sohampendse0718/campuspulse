'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BazaarCreateModal from '@/components/BazaarCreateModal'
import {
  ShoppingBag, Search, Plus, BookOpen, Cpu, Home,
  Calculator, Bike, MoreHorizontal, MessageCircle,
  Clock, Package, ArrowLeft,
} from 'lucide-react'

const CATEGORIES = [
  { label: 'All', icon: ShoppingBag },
  { label: 'Books', icon: BookOpen },
  { label: 'Electronics', icon: Cpu },
  { label: 'Hostel Items', icon: Home },
  { label: 'Instruments', icon: Calculator },
  { label: 'Cycles', icon: Bike },
  { label: 'Others', icon: MoreHorizontal },
]

type BazaarItem = {
  id: string
  title: string
  description: string
  price: number
  type: 'selling' | 'looking_for'
  category: string
  whatsapp_number: string
  image_url: string | null
  created_at: string
  expires_at: string
  owner_id: string
  owner_name: string
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#13141F', border: '1px solid #1E1F2E', borderRadius: 16,
      overflow: 'hidden', animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: 180, background: '#1E1F2E' }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 16, background: '#1E1F2E', borderRadius: 6, width: '70%' }} />
        <div style={{ height: 12, background: '#1E1F2E', borderRadius: 6, width: '40%' }} />
        <div style={{ height: 12, background: '#1E1F2E', borderRadius: 6, width: '90%' }} />
        <div style={{ height: 38, background: '#1E1F2E', borderRadius: 10, marginTop: 4 }} />
      </div>
    </div>
  )
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Expiring soon'
  if (days === 1) return '1 day left'
  return `${days}d left`
}

export default function BazaarPage() {
  const router = useRouter()
  const [items, setItems] = useState<BazaarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeType, setActiveType] = useState<'selling' | 'looking_for'>('selling')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [checkingRole, setCheckingRole] = useState(true)

  // Role guard: only students can view this page
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      const userRole = profile?.role ?? 'student'
      if (userRole !== 'student') {
        router.replace('/dashboard')
        return
      }
      setRole(userRole)
      setCheckingRole(false)
    })
  }, [router])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bazaar_items')
        .select(`
          id, title, description, price, type, category,
          whatsapp_number, image_url, created_at, expires_at, owner_id
        `)
        .eq('type', activeType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (activeCategory !== 'All') {
        query = query.eq('category', activeCategory)
      }

      const { data, error } = await query
      if (error) throw error

      // 1. Get unique owner IDs
      const ownerIds = Array.from(new Set((data || []).map((item: any) => item.owner_id)))
      
      // 2. Fetch those profiles separately to bypass the relationship cache error
      const profilesMap: Record<string, string> = {}
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ownerIds)
          
        if (profilesData) {
          profilesData.forEach((p: any) => {
            profilesMap[p.id] = p.full_name
          })
        }
      }

      // 3. Map them together
      const mapped: BazaarItem[] = (data || []).map((item: any) => ({
        ...item,
        owner_name: profilesMap[item.owner_id] || 'GEC Student',
      }))
      setItems(mapped)
    } catch (err: any) {
      console.error('Error fetching bazaar items:', err.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }, [activeCategory, activeType])

  useEffect(() => {
    if (!checkingRole && role === 'student') fetchItems()
  }, [fetchItems, checkingRole, role])

  const filteredItems = items.filter(item => {
    const q = search.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  })

  const handleWhatsApp = (item: BazaarItem) => {
    const msg = item.type === 'selling'
      ? `Hi, I saw your item '${item.title}' on GEC Bazaar. Is it still available?`
      : `Hi, I saw your request for '${item.title}' on GEC Bazaar. I might have this item!`
    window.open(`https://wa.me/${item.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (checkingRole) {
    return (
      <div style={{ background: '#090A0F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh', paddingBottom: 80 }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .bazaar-card { animation: fadeIn 0.35s ease both; transition: transform 0.2s, box-shadow 0.2s; }
        .bazaar-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.4) !important; }
        .wa-btn:hover { background: #25D366 !important; box-shadow: 0 0 20px #25D36640 !important; }
        .cat-btn:hover { background: rgba(0,229,255,0.08) !important; color: #00E5FF !important; }
        input:focus { border-color: #00E5FF !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2A2D3D; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 1.5rem 0' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #00E5FF20, #8B5CF630)',
              border: '1px solid #00E5FF40',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px #00E5FF15',
            }}>
              <ShoppingBag size={22} color="#00E5FF" />
            </div>
            <div>
              <h1 style={{
                margin: 0, fontSize: '1.9rem', fontWeight: 900,
                background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em',
              }}>
                GEC Bazaar
              </h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem' }}>
                Student marketplace · For GECians, by GECians
              </p>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} color="#4B5563" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items, books, electronics..."
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
                background: '#13141F', border: '1px solid #2A2D3D', borderRadius: 10,
                color: '#F1F2F7', fontSize: '0.875rem',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Type Toggle */}
          <div style={{ display: 'flex', background: '#13141F', border: '1px solid #2A2D3D', borderRadius: 10, padding: 3, gap: 2 }}>
            {(['selling', 'looking_for'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap',
                  background: activeType === t ? (t === 'selling' ? '#00E5FF' : '#8B5CF6') : 'transparent',
                  color: activeType === t ? '#090A0F' : '#6B7280',
                  transition: 'all 0.2s',
                }}
              >
                {t === 'selling' ? '🏷️ For Sale' : '🔍 Looking For'}
              </button>
            ))}
          </div>

          {/* Post Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #00E5FF, #00B8CC)',
              color: '#090A0F', fontWeight: 800, fontSize: '0.875rem',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 4px 15px #00E5FF30',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Plus size={16} /> Post Item
          </button>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(({ label, icon: Icon }) => {
            const active = activeCategory === label
            return (
              <button
                key={label}
                className="cat-btn"
                onClick={() => setActiveCategory(label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 100, border: '1px solid',
                  borderColor: active ? '#00E5FF40' : '#2A2D3D',
                  background: active ? 'rgba(0,229,255,0.1)' : '#13141F',
                  color: active ? '#00E5FF' : '#6B7280',
                  fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            border: '1px dashed #2A2D3D', borderRadius: 20,
          }}>
            <Package size={48} color="#2A2D3D" style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#4B5563', margin: '0 0 8px', fontFamily: "'Space Grotesk', sans-serif" }}>
              {search ? 'No results found' : activeType === 'selling' ? 'No items for sale yet' : 'No requests yet'}
            </h3>
            <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0 }}>
              {search ? 'Try a different search term' : 'Be the first to post!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filteredItems.map((item, i) => (
              <div
                key={item.id}
                className="bazaar-card"
                style={{
                  background: '#13141F',
                  border: '1px solid #1E1F2E',
                  borderRadius: 16,
                  overflow: 'hidden',
                  animationDelay: `${i * 0.05}s`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Image area */}
                {item.type === 'selling' && item.image_url ? (
                  <div style={{ height: 180, overflow: 'hidden', background: '#1E1F2E' }}>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  </div>
                ) : (
                  <div style={{
                    height: item.type === 'looking_for' ? 100 : 180,
                    background: item.type === 'looking_for'
                      ? 'linear-gradient(135deg, #8B5CF610, #7C3AED20)'
                      : 'linear-gradient(135deg, #00E5FF08, #1E1F2E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid #1E1F2E',
                  }}>
                    {item.type === 'looking_for'
                      ? <span style={{ fontSize: '2.5rem' }}>🔍</span>
                      : <Package size={40} color="#2A2D3D" />
                    }
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Category + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                      padding: '2px 8px', borderRadius: 100,
                      background: item.type === 'looking_for' ? 'rgba(139,92,246,0.15)' : 'rgba(0,229,255,0.1)',
                      color: item.type === 'looking_for' ? '#A78BFA' : '#00E5FF',
                    }}>
                      {item.category.toUpperCase()}
                    </span>
                    <span style={{ color: '#4B5563', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {getTimeLeft(item.expires_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    margin: 0, color: '#F1F2F7', fontSize: '0.95rem', fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {item.title}
                  </h3>

                  {/* Price or Looking For tag */}
                  {item.type === 'selling' ? (
                    <span style={{ color: '#10B981', fontWeight: 800, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span style={{ color: '#A78BFA', fontWeight: 700, fontSize: '0.8rem' }}>
                      🙋 Looking For Request
                    </span>
                  )}

                  {/* Description */}
                  <p style={{
                    margin: 0, color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {item.description}
                  </p>

                  {/* Posted by */}
                  <p style={{ margin: 0, color: '#374151', fontSize: '0.75rem' }}>
                    Posted by <span style={{ color: '#4B5563', fontWeight: 600 }}>{item.owner_name}</span>
                  </p>

                  {/* WhatsApp CTA */}
                  <button
                    className="wa-btn"
                    onClick={() => handleWhatsApp(item)}
                    style={{
                      marginTop: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 0', borderRadius: 10, border: 'none',
                      background: '#1DAA6115',
                      color: '#25D366',
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.58 3.841 1.58 5.397L2 22l4.748-1.547A9.962 9.962 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 11.999 2zm0 18a7.96 7.96 0 01-4.26-1.234l-.306-.18-3.173 1.034 1.07-3.099-.198-.318A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
                    </svg>
                    {item.type === 'selling' ? 'Message Seller' : 'Contact Buyer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <BazaarCreateModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchItems()
          }}
        />
      )}
    </div>
  )
}
