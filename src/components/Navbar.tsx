'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, Map, Rss, AlertTriangle, LayoutDashboard, LogIn, UserPlus, LogOut, ShoppingBag, BookOpen, User, MoreHorizontal, Megaphone } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { href: '/map', label: 'Map', icon: Map },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/report', label: 'Report', icon: AlertTriangle },
  { href: '/bazaar', label: 'Bazaar', icon: ShoppingBag, studentOnly: true },
  { href: '/dashboard', label: 'Admin', icon: LayoutDashboard },
]

// ── Three-dot user menu ────────────────────────────────────────────────────
function ThreeDotMenu({ role, onLogout }: { role: string | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isStudent = role === 'student'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="User menu"
        style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(0,229,255,0.08)' : '#1E1F2E',
          border: open ? '1px solid rgba(0,229,255,0.35)' : '1px solid #2A2D3D',
          color: open ? '#00E5FF' : '#9CA3AF',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = '#2A2D3D'
            ;(e.currentTarget as HTMLElement).style.color = '#F1F2F7'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = '#1E1F2E'
            ;(e.currentTarget as HTMLElement).style.color = '#9CA3AF'
          }
        }}
      >
        <MoreHorizontal size={16} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#12131C',
          border: '1px solid #2A2D3D',
          borderRadius: 12,
          minWidth: 200,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.06)',
          zIndex: 200,
          overflow: 'hidden',
          animation: 'dropIn 0.15s ease',
        }}>
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Profile */}
          <DropItem
            href="/profile"
            icon={<User size={14} />}
            label="Profile"
            sub="View your activity & stats"
            color="#00E5FF"
            onClick={() => setOpen(false)}
          />

          {/* Notes — for all logged-in users */}
          <DropItem
            href="/notes"
            icon={<BookOpen size={14} />}
            label="Study Pool"
            sub={isStudent ? 'Notes, PYQs, Tutoring' : 'Browse academic resources'}
            color="#A78BFA"
            onClick={() => setOpen(false)}
          />

          {/* Notice/Alerts — for all logged-in users */}
          <DropItem
            href="/alerts"
            icon={<Megaphone size={14} />}
            label="Notice / Alerts"
            sub={role === 'hod' ? 'Broadcast & view announcements' : 'View campus announcements'}
            color="#EF4444"
            onClick={() => setOpen(false)}
          />

          {/* Divider */}
          <div style={{ height: 1, background: '#1E1F2E', margin: '4px 0' }} />

          {/* Logout */}
          <button
            onClick={() => { setOpen(false); onLogout() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '11px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.07)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', flexShrink: 0 }}>
              <LogOut size={13} color="#EF4444" />
            </div>
            <div>
              <div style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.875rem' }}>Logout</div>
              <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>Sign out of CampusPulse</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

function DropItem({ href, icon, label, sub, color, onClick }: {
  href: string; icon: React.ReactNode; label: string; sub: string; color: string; onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', textDecoration: 'none', transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1A1B28'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15`, color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ color: '#F1F2F7', fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
        <div style={{ color: '#6B7280', fontSize: '0.72rem' }}>{sub}</div>
      </div>
    </Link>
  )
}

// ── Main Navbar ────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setRole(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setRole(null)
    })

    return () => { subscription.unsubscribe() }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (error) throw error
      setRole(data?.role ?? 'student')
    } catch (err) {
      console.error('Error fetching navbar profile:', err)
      setRole('student')
    }
  }

  const handleLogout = async () => {
    const firstConfirm = window.confirm('Are you sure you want to log out?')
    if (!firstConfirm) return
    const secondConfirm = window.confirm('Are you really sure?')
    if (!secondConfirm) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = role && role !== 'student'

  const visibleLinks = navLinks.filter(link => {
    if (link.label === 'Admin')       return isAdmin
    if ((link as any).studentOnly)    return role === 'student'
    return true
  })

  return (
    <header style={{
      background: 'rgba(9, 10, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #2A2D3D',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #00E5FF20, #8B5CF630)', border: '1px solid #00E5FF50', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px #00E5FF20' }}>
              <MapPin size={18} color="#00E5FF" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>
              CampusPulse
            </span>
          </Link>

          {/* Nav links */}
          <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s ease', background: active ? 'rgba(0, 229, 255, 0.1)' : 'transparent', color: active ? '#00E5FF' : '#9CA3AF', border: active ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent' }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#F1F2F7'; (e.currentTarget as HTMLElement).style.background = '#1E1F2E' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
                >
                  <Icon size={14} /> {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side auth */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <ThreeDotMenu role={role} onLogout={handleLogout} />
            ) : (
              <>
                <Link href="/login"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, color: '#9CA3AF', border: '1px solid #2A2D3D', textDecoration: 'none', transition: 'all 0.2s ease', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F1F2F7'; (e.currentTarget as HTMLElement).style.borderColor = '#353851' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLElement).style.borderColor = '#2A2D3D' }}
                >
                  <LogIn size={14} /> Login
                </Link>
                <Link href="/signup"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, background: '#00E5FF', color: '#090A0F', textDecoration: 'none', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#00B8CC'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px #00E5FF40' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#00E5FF'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <UserPlus size={14} /> Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
