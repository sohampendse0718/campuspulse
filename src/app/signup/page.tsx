'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Mail, Lock, User, AlertCircle, ArrowRight, BookOpen, Calendar, Hash } from 'lucide-react'

const RobotScene = dynamic(() => import('@/components/RobotScene'), {
  ssr: false,
  loading: () => null,
})

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'student' | 'ground_staff'>('student')
  const [dept, setDept] = useState('Computer')
  const [year, setYear] = useState('1st Year')
  const [rollNo, setRollNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            full_name: fullName, role,
            dept: role === 'student' ? dept : null,
            year: role === 'student' ? year : null,
            roll_no: role === 'student' ? rollNo : null,
          }
        }
      })
      if (error) throw error
      alert('Signup successful! Please check your email for confirmation if required, then sign in.')
      router.push('/login')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 40px',
    background: '#12131C', border: '1px solid #2A2D3D',
    borderRadius: 10, color: '#F1F2F7', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090A0F',
      position: 'relative',
      display: 'flex',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* ── LEFT PANEL: Robot ── */}
      <div
        className="robot-panel"
        style={{
          flex: '0 0 420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'sticky',
          top: 0,
          height: '100vh',
          padding: '2rem',
        }}
      >
        {/* Glow behind robot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420, height: 420,
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(0,229,255,0.06) 50%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Floor spotlight */}
        <div style={{
          position: 'absolute',
          bottom: '20%', left: '50%',
          transform: 'translateX(-50%)',
          width: 250, height: 35,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)',
          filter: 'blur(10px)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: 380, height: 430, position: 'relative', zIndex: 1 }}>
          <RobotScene />
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: '3rem 2rem 3rem 4rem',
        overflowY: 'auto',
      }}
        className="form-panel"
      >
        <div style={{
          width: '100%', maxWidth: 460,
          background: 'rgba(18,19,28,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #2A2D3D',
          borderRadius: 20, padding: '40px 36px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #8B5CF620, #00E5FF20)',
              border: '1px solid #8B5CF650',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={18} color="#8B5CF6" />
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
              Create your account
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
              Join the GEC community — report and track campus issues
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#FCA5A5', borderRadius: 10, padding: '12px 14px',
              fontSize: '0.85rem', marginBottom: 20,
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>FULL NAME</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                <input id="fullName" type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Soham Pendse" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#8B5CF6'} onBlur={e => e.target.style.borderColor = '#2A2D3D'} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#8B5CF6'} onBlur={e => e.target.style.borderColor = '#2A2D3D'} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                <input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#8B5CF6'} onBlur={e => e.target.style.borderColor = '#2A2D3D'} />
              </div>
            </div>


            {/* Student fields */}
            {role === 'student' && (
              <>
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>DEPARTMENT</label>
                  <div style={{ position: 'relative' }}>
                    <BookOpen size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <select id="dept" value={dept} onChange={e => setDept(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '40px', appearance: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#8B5CF6'} onBlur={e => e.target.style.borderColor = '#2A2D3D'}>
                      {['Computer', 'IT', 'E&C', 'Mechanical', 'Civil', 'Mining', 'Electrical'].map(b => (
                        <option key={b} value={b} style={{ background: '#12131C', color: '#F1F2F7' }}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>YEAR</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <select id="year" value={year} onChange={e => setYear(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '40px', appearance: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#8B5CF6'} onBlur={e => e.target.style.borderColor = '#2A2D3D'}>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                        <option key={y} value={y} style={{ background: '#12131C', color: '#F1F2F7' }}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500, marginBottom: 8, letterSpacing: '0.03em' }}>ROLL NUMBER</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <input id="rollNo" type="text" required value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="e.g., 24B-CO-068" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#8B5CF6'} onBlur={e => e.target.style.borderColor = '#2A2D3D'} />
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: loading ? '#1E1F2E' : 'linear-gradient(135deg, #8B5CF6, #00E5FF)',
              color: loading ? '#6B7280' : '#090A0F',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 25px rgba(139,92,246,0.4)' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #6B7280', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Creating account...
                </>
              ) : (<>Create Account <ArrowRight size={16} /></>)}
            </button>
          </form>

          <div style={{ margin: '24px 0', borderTop: '1px solid #2A2D3D' }} />
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#00E5FF', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, select::placeholder { color: #4B5563; }
        @media (max-width: 768px) {
          .robot-panel { display: none !important; }
          .form-panel {
            justify-content: center !important;
            padding: 2rem 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}
