'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Bell, Users, TrendingUp, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react'

export default function Home() {
  const [currentImg, setCurrentImg] = useState(0)
  const images = ['/images/1.png', '/images/2.png', '/images/3.png']

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % images.length)
    }, 6500)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div style={{ background: '#090A0F', minHeight: '100vh' }}>

      {/* Grid background overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 229, 255, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 229, 255, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Radial glow blobs */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, #00E5FF08 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '40%', right: '5%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, #8B5CF608 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 1.5rem 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            background: 'rgba(0, 229, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            marginBottom: 32,
            fontSize: '0.8rem', fontWeight: 500, color: '#00E5FF',
            letterSpacing: '0.05em',
          }}>
            <Zap size={12} />
            GEC CAMPUS ISSUE TRACKER — LIVE
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(3rem, 7vw, 6rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            marginBottom: 24,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #F1F2F7 30%, #9CA3AF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Report.{' '}
            </span>
            <span style={{
              background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Resolve.
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #F1F2F7 30%, #9CA3AF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Rebuild.
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem', color: '#9CA3AF',
            maxWidth: 560, margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Bridge the gap between students and campus administration. Report infrastructure issues, track resolutions, and make GEC better — together.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/report" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 10,
              background: '#00E5FF', color: '#090A0F',
              fontWeight: 700, fontSize: '1rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 0 rgba(0,229,255,0)',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#00B8CC'
                el.style.boxShadow = '0 0 30px rgba(0,229,255,0.4)'
                el.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#00E5FF'
                el.style.boxShadow = '0 0 0 rgba(0,229,255,0)'
                el.style.transform = 'none'
              }}
            >
              Report an Issue <ArrowRight size={16} />
            </Link>
            <Link href="/map" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 10,
              background: 'transparent', color: '#00E5FF',
              border: '1px solid rgba(0, 229, 255, 0.35)',
              fontWeight: 600, fontSize: '1rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'rgba(0, 229, 255, 0.08)'
                el.style.boxShadow = '0 0 20px rgba(0,229,255,0.15)'
                el.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'transparent'
                el.style.boxShadow = 'none'
                el.style.transform = 'none'
              }}
            >
              View Campus Map
            </Link>
          </div>
        </div>
      </section>

      {/* BENTO GRID - Campus Images + Stats */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="bento-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 16,
          }}>
            {/* Unified campus image slideshow tile */}
            <div style={{
              gridColumn: 'span 8', gridRow: 'span 3',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #2A2D3D',
              position: 'relative',
              minHeight: 480,
              background: 'linear-gradient(135deg, #12131C, #1A1B28)',
            }}>
              {images.map((src, idx) => (
                <img
                  key={src}
                  src={src}
                  alt={`GEC Campus ${idx + 1}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: currentImg === idx ? 0.85 : 0,
                    transition: 'opacity 1s ease-in-out',
                    zIndex: 0,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ))}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(9,10,15,0.9) 0%, rgba(9,10,15,0.2) 50%, transparent 100%)',
                zIndex: 1,
              }} />
              <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 2 }}>
                <div style={{ color: '#00E5FF', fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: 4, fontWeight: 700 }}>CAMPUS</div>
                <div style={{ color: '#F1F2F7', fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em', marginBottom: 4 }}>
                  Goa College of Engineering
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Farmagudi, Ponda, Goa</span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#353851' }} />
                  <span style={{ color: '#8B5CF6' }}>Image {currentImg + 1} of 3</span>
                </div>
              </div>

              {/* Progress Indicator dots */}
              <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 2, display: 'flex', gap: 6 }}>
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: currentImg === idx ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: currentImg === idx ? '#00E5FF' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Stat tile 1 */}
            <div style={{
              gridColumn: 'span 4',
              borderRadius: 16, padding: '24px',
              background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(0,229,255,0.03))',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 148,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart3 size={20} color="#00E5FF" />
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00E5FF', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>85%</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.82rem', marginTop: 4 }}>Resolution Rate</div>
              </div>
            </div>

            {/* Stat tile 2 */}
            <div style={{
              gridColumn: 'span 4',
              borderRadius: 16, padding: '24px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.03))',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 148,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={20} color="#8B5CF6" />
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#A78BFA', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>500+</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.82rem', marginTop: 4 }}>Campus Students</div>
              </div>
            </div>

            {/* Stat tile 3 */}
            <div style={{
              gridColumn: 'span 4',
              borderRadius: 16, padding: '24px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 148,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={20} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34D399', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>Live</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.82rem', marginTop: 4 }}>Real-Time Updates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 1.5rem 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 100,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
              color: '#A78BFA', fontSize: '0.75rem', fontWeight: 600,
              letterSpacing: '0.1em', marginBottom: 16,
            }}>
              PLATFORM FEATURES
            </div>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
              color: '#F1F2F7', letterSpacing: '-0.03em',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Built for the GEC Community
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: MapPin, color: '#00E5FF', bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)', title: 'Location-Based', desc: 'Report issues with precise GPS coordinates, pinned to the exact campus location.' },
              { icon: Bell, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', title: 'Real-Time Updates', desc: 'Instant status sync as officials update, resolve, and close campus issues.' },
              { icon: Users, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', title: 'Community Driven', desc: 'Upvote and comment on issues to help prioritize what matters most on campus.' },
              { icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', title: 'Admin Analytics', desc: 'Transparent dashboards with live charts on resolution rates and category trends.' },
            ].map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div key={title} style={{
                padding: '28px 24px', borderRadius: 16,
                background: bg, border: `1px solid ${border}`,
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${bg}`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                  background: `${color}20`, border: `1px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ color: '#F1F2F7', fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {title}
                </h3>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 1.5rem 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
              color: '#F1F2F7', letterSpacing: '-0.03em',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { n: '01', title: 'Report', desc: 'Snap a photo, describe the issue, pin your location on campus.', color: '#00E5FF' },
              { n: '02', title: 'Track', desc: 'Watch the issue on the live map as campus admin is notified.', color: '#8B5CF6' },
              { n: '03', title: 'Resolve', desc: 'See before-and-after photos when administration resolves it.', color: '#10B981' },
            ].map(({ n, title, desc, color }) => (
              <div key={n} style={{
                padding: '32px 28px', borderRadius: 16,
                background: '#12131C', border: '1px solid #2A2D3D',
                position: 'relative',
              }}>
                <div style={{
                  fontSize: '3.5rem', fontWeight: 900, lineHeight: 1,
                  color: `${color}20`,
                  fontFamily: "'Space Grotesk', sans-serif",
                  marginBottom: 16,
                }}>
                  {n}
                </div>
                <h3 style={{
                  color: '#F1F2F7', fontWeight: 700, fontSize: '1.2rem',
                  marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {title}
                </h3>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
                  {desc}
                </p>
                <div style={{
                  position: 'absolute', top: 24, right: 24,
                  width: 8, height: 8, borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 10px ${color}`,
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 1.5rem 100px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            padding: '60px 40px', borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.05), rgba(139,92,246,0.05))',
            border: '1px solid #2A2D3D',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 300, height: 200,
              background: 'radial-gradient(circle, #00E5FF0A 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <h2 style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800,
              color: '#F1F2F7', letterSpacing: '-0.03em', marginBottom: 16,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Ready to make GEC better?
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '1rem', marginBottom: 32, lineHeight: 1.7 }}>
              Join your fellow students. Report problems. Track resolutions. Be heard.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{
                padding: '14px 36px', borderRadius: 10,
                background: '#00E5FF', color: '#090A0F',
                fontWeight: 700, fontSize: '1rem',
                textDecoration: 'none', display: 'inline-block',
              }}>
                Get Started Free
              </Link>
              <Link href="/feed" style={{
                padding: '14px 36px', borderRadius: 10,
                border: '1px solid #2A2D3D', color: '#9CA3AF',
                fontWeight: 600, fontSize: '1rem',
                textDecoration: 'none', display: 'inline-block',
              }}>
                Browse Feed
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #2A2D3D',
        padding: '32px 1.5rem',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="#00E5FF" />
            <span style={{
              background: 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
            }}>
              CampusPulse
            </span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: 0 }}>
            Built for Goa College of Engineering — Making campus life better, one report at a time.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['/map', '/feed', '/report'].map(href => (
              <Link key={href} href={href} style={{ color: '#6B7280', fontSize: '0.8rem', textDecoration: 'none' }}>
                {href.replace('/', '').charAt(0).toUpperCase() + href.slice(2)}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
