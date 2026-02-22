import React, { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Camera, Globe, Users, ArrowRight, Compass } from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: <Globe size={22} />,
    title: 'Explore Destinations',
    description: 'Discover stunning travel stories from around the world.',
  },
  {
    icon: <Camera size={22} />,
    title: 'Share Your Journey',
    description: 'Post photos with captions and pin your travel locations.',
  },
  {
    icon: <Users size={22} />,
    title: 'Connect with Travelers',
    description: 'Like, comment, and follow fellow adventurers.',
  },
]

const SAMPLE_DESTINATIONS = [
  { name: 'Santorini', country: 'Greece', imgId: 1045 },
  { name: 'Kyoto', country: 'Japan', imgId: 1025 },
  { name: 'Reykjavik', country: 'Iceland', imgId: 1055 },
  { name: 'Marrakech', country: 'Morocco', imgId: 1065 },
]

export default function AuthChoice() {
  const navigate = useNavigate()
  const heroRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) navigate('/feed', { replace: true })
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--neutral-0)',
        overflowX: 'hidden',
      }}
    >
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px 80px',
          overflow: 'hidden',
          background:
            'linear-gradient(160deg, #1a0f0a 0%, #2d1a10 40%, #3d2518 100%)',
        }}
      >
        {/* Background texture dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(229,90,28,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none',
          }}
        />

        {/* Glow orb */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '500px',
            background:
              'radial-gradient(circle, rgba(229,90,28,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Logo mark */}
        <div
          className="animate-fade-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 40,
            animationDelay: '0ms',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: 'var(--brand-500)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(229,90,28,0.5)',
            }}
          >
            <Compass size={24} color="white" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 26,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            Wandr
          </span>
        </div>

        {/* Hero headline */}
        <h1
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(36px, 9vw, 72px)',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 700,
            marginBottom: 20,
            animationDelay: '80ms',
          }}
        >
          Every journey
          <br />
          <em style={{ fontStyle: 'italic', color: 'var(--brand-300)' }}>
            tells a story.
          </em>
        </h1>

        <p
          className="animate-fade-up"
          style={{
            fontSize: 'var(--text-lg)',
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'center',
            maxWidth: 420,
            lineHeight: 1.6,
            marginBottom: 44,
            animationDelay: '160ms',
          }}
        >
          Share your travels, discover hidden gems, and connect with explorers
          worldwide.
        </p>

        {/* CTA buttons */}
        <div
          className="animate-fade-up"
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
            animationDelay: '240ms',
          }}
        >
          <Link to="/signup">
            <button
              className="btn btn-primary btn-lg"
              style={{
                background: 'var(--brand-500)',
                boxShadow: '0 4px 24px rgba(229,90,28,0.45)',
                fontSize: 'var(--text-md)',
              }}
            >
              Start Exploring
              <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/signin">
            <button
              className="btn btn-lg"
              style={{
                background: 'rgba(255,255,255,0.10)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.20)',
                backdropFilter: 'blur(8px)',
                fontSize: 'var(--text-md)',
              }}
            >
              Sign In
            </button>
          </Link>
        </div>

        {/* Scroll hint */}
        <div
          className="animate-fade-up"
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.35)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            animationDelay: '400ms',
          }}
        >
          <span>Scroll to explore</span>
          <div
            style={{
              width: 1,
              height: 40,
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)',
            }}
          />
        </div>
      </section>

      {/* ── Destination strip ── */}
      <section
        style={{
          background: 'var(--neutral-50)',
          padding: '64px 24px',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 32,
          }}
        >
          Popular Destinations
        </p>

        <div
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'none',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {SAMPLE_DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              style={{
                position: 'relative',
                width: 200,
                height: 260,
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: 'var(--shadow-lg)',
                transition:
                  'transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
              }}
            >
              <img
                src={`https://picsum.photos/id/${dest.imgId}/400/520`}
                alt={dest.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  color: 'white',
                }}
              >
                <div
                  style={{
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-md)',
                  }}
                >
                  {dest.name}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    opacity: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <MapPin size={10} />
                  {dest.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '64px 24px', background: 'var(--neutral-0)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p
            style={{
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--brand-500)',
              marginBottom: 12,
            }}
          >
            Why Wandr
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(26px, 5vw, 40px)',
              fontWeight: 700,
              textAlign: 'center',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 48,
            }}
          >
            Travel, share, inspire.
          </h2>

          <div
            className="stagger-children"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="animate-fade-up"
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--neutral-50)',
                  alignItems: 'flex-start',
                  transition:
                    'box-shadow var(--duration-base), transform var(--duration-base)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--brand-50)',
                    color: 'var(--brand-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--brand-100)',
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 'var(--weight-semibold)',
                      fontSize: 'var(--text-md)',
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        style={{
          background:
            'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)',
          padding: '64px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px, 5vw, 42px)',
            color: 'white',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Ready to wander?
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 32,
            fontSize: 'var(--text-md)',
          }}
        >
          Join thousands of travelers sharing their adventures.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/signup">
            <button
              className="btn btn-lg"
              style={{
                background: 'white',
                color: 'var(--brand-700)',
                fontWeight: 'var(--weight-bold)',
              }}
            >
              Create Free Account
              <ArrowRight size={18} />
            </button>
          </Link>
          <Link to="/signin">
            <button
              className="btn btn-lg"
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              Already a member? Sign in
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: 'var(--neutral-900)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--neutral-500)',
          fontSize: 'var(--text-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Compass size={16} color="var(--brand-400)" />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--neutral-300)',
              fontWeight: 600,
            }}
          >
            Wandr
          </span>
        </div>
        <p>
          © {new Date().getFullYear()} Wandr Travel Blog. Made with passion for
          exploration.
        </p>
      </footer>
    </div>
  )
}
