'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, Map, Rss, AlertTriangle, LayoutDashboard, LogIn, UserPlus, LogOut, ShoppingBag } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { href: '/map', label: 'Map', icon: Map },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/report', label: 'Report', icon: AlertTriangle },
  { href: '/bazaar', label: 'Bazaar', icon: ShoppingBag, studentOnly: true },
  { href: '/dashboard', label: 'Admin', icon: LayoutDashboard },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setRole(null)
      }
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      
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

  // Filter links based on whether user is admin (only ground_staff, block_incharge, faculty_coordinator, hod see Admin dashboard)
  const visibleLinks = navLinks.filter(link => {
    if (link.label === 'Admin') {
      return isAdmin
    }
    if ((link as any).studentOnly) {
      return role === 'student'
    }
    return true
  })

  return (
    <header
      style={{
        background: 'rgba(9, 10, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #2A2D3D',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #00E5FF20, #8B5CF630)',
              border: '1px solid #00E5FF50',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px #00E5FF20',
            }}>
              <MapPin size={18} color="#00E5FF" />
            </div>
            <span style={{
              fontSize: '1.2rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              CampusPulse
            </span>
          </Link>

          {/* Nav links */}
          <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: 8,
                    fontSize: '0.875rem', fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    background: active ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    color: active ? '#00E5FF' : '#9CA3AF',
                    border: active ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = '#F1F2F7'
                      ;(e.currentTarget as HTMLElement).style.background = '#1E1F2E'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = '#9CA3AF'
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Auth buttons */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#EF4444'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(239, 68, 68, 0.3)'
                }}
              >
                <LogOut size={14} /> Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#9CA3AF',
                    border: '1px solid #2A2D3D',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLElement).style.color = '#F1F2F7'
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#353851'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.color = '#9CA3AF'
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#2A2D3D'
                  }}
                >
                  <LogIn size={14} /> Login
                </Link>
                <Link
                  href="/signup"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: '#00E5FF',
                    color: '#090A0F',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLElement).style.background = '#00B8CC'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px #00E5FF40'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.background = '#00E5FF'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                  }}
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
