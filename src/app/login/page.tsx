'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Mail, Lock, AlertCircle, ArrowRight, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      if (profile?.role === 'municipal_official') {
        router.push('/dashboard')
      } else {
        router.push('/map')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#090A0F', padding: '2rem 1rem', position: 'relative',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0, 229, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.025) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      {/* Glow blobs */}
      <div style={{ position: 'fixed', top: '20%', left: '15%', width: 400, height: 400, background: 'radial-gradient(circle, #00E5FF06, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, #8B5CF606, transparent 70%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 440,
        background: 'rgba(18, 19, 28, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #2A2D3D',
        borderRadius: 20,
        padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #00E5FF20, #8B5CF630)',
            border: '1px solid #00E5FF50',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px #00E5FF20',
          }}>
            <MapPin size={18} color="#00E5FF" />
          </div>
          <span style={{
            fontSize: '1.1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            CampusPulse
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F1F2F7', margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5', borderRadius: 10, padding: '12px 14px',
            fontSize: '0.85rem', marginBottom: 20,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>
              EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '12px 14px 12px 40px',
                  background: '#12131C', border: '1px solid #2A2D3D',
                  borderRadius: 10, color: '#F1F2F7', fontSize: '0.9rem',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => e.target.style.borderColor = '#00E5FF'}
                onBlur={e => e.target.style.borderColor = '#2A2D3D'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 14px 12px 40px',
                  background: '#12131C', border: '1px solid #2A2D3D',
                  borderRadius: 10, color: '#F1F2F7', fontSize: '0.9rem',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => e.target.style.borderColor = '#00E5FF'}
                onBlur={e => e.target.style.borderColor = '#2A2D3D'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#1E1F2E' : '#00E5FF',
              color: loading ? '#6B7280' : '#090A0F',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
              marginTop: 4,
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.background = '#00B8CC'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 25px rgba(0,229,255,0.35)'
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.background = '#00E5FF'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid #6B7280', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Signing in...
              </>
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ margin: '24px 0', borderTop: '1px solid #2A2D3D' }} />

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#00E5FF', fontWeight: 600, textDecoration: 'none' }}>
            Create one <Zap size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4B5563; }
      `}</style>
    </div>
  )
}
