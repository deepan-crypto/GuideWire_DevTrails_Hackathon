import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'

// ── The exact Guidewire "G" SVG logo ──────────────────────────────────────────
function GuidewireLogo() {
  return (
    <div className="flex items-center justify-center gap-3 mb-0">
      {/* Teal square G icon */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="4" fill="none"/>
        {/* The stylised G path matching Guidewire brand */}
        <path
          d="M5 6 H22 V12 H11 V24 H22 V19 H16 V13 H28 V30 H5 V6Z"
          fill="#006B8F"
        />
      </svg>
      {/* GUIDEWIRE wordmark */}
      <span style={{
        fontFamily: "'Open Sans', 'Arial', sans-serif",
        fontSize: '22px',
        fontWeight: '700',
        color: '#1A1A2E',
        letterSpacing: '2px',
        textTransform: 'uppercase',
      }}>
        GUIDEWIRE
      </span>
    </div>
  )
}

// Okta FastPass logo (teal circle checkmark)
function OktaFastPassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#00297A"/>
      <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const DEMO_ROLES = [
  { role: 'super_admin',    label: 'Super Admin',     desc: 'Full access to all modules',       email: 'admin@riskwire.in',   password: 'admin123' },
  { role: 'claims_manager', label: 'Claims Manager',  desc: 'Claims & Policy read access',      email: 'claims@riskwire.in',  password: 'claims123' },
  { role: 'policy_admin',   label: 'Policy Admin',    desc: 'Policy management & analytics',    email: 'policy@riskwire.in',  password: 'policy123' },
  { role: 'billing_admin',  label: 'Billing Admin',   desc: 'Billing & financial overview',     email: 'billing@riskwire.in', password: 'billing123' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState('username') // 'username' | 'password'
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)

  const handleRoleClick = (r) => {
    setSelectedRole(r.role)
    setUsername(r.email)
    setPassword(r.password)
    setError('')
    setStep('username')
  }

  const handleNext = async (e) => {
    e.preventDefault()
    setError('')

    if (step === 'username') {
      if (!username.trim()) { setError('Please enter your username.'); return }
      setStep('password')
      return
    }

    // Sign in
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const ok = login(username.trim(), password)
    if (!ok) {
      setError('Unable to sign in. Check your credentials.')
      setLoading(false)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #D4DCE8 0%, #E8ECF2 40%, #D9E0EA 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Top Okta banner */}
      <div style={{
        width: '100%',
        background: '#F0F2F5',
        borderBottom: '1px solid #D0D5DD',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '18px 0 14px',
      }}>
        {/* Okta grid icon */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'white',
          border: '2px solid #3B7DDD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {[0,1,2].map(row => [0,1,2].map(col => (
              <circle
                key={`${row}-${col}`}
                cx={4 + col * 7}
                cy={4 + row * 7}
                r="2"
                fill="#3B7DDD"
              />
            )))}
          </svg>
        </div>
        <p style={{ margin: 0, color: '#444', fontSize: 13 }}>
          Sign in with your account to access Okta Dashboard
        </p>
      </div>

      {/* Main white card */}
      <div style={{
        marginTop: 32,
        width: '100%',
        maxWidth: 440,
        background: 'white',
        borderRadius: 10,
        boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}>
        {/* Logo header area */}
        <div style={{
          padding: '28px 40px 20px',
          borderBottom: '1px solid #E8E8E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <GuidewireLogo />
        </div>

        {/* Form body */}
        <div style={{ padding: '28px 40px 32px' }}>
          <h1 style={{
            margin: '0 0 24px',
            fontSize: 26,
            fontWeight: '400',
            color: '#1d1d1d',
            letterSpacing: '-0.3px',
          }}>
            Sign In
          </h1>

          {/* Demo role selector — compact inline chips */}
          <div style={{ marginBottom: 20 }}>
            <p style={{
              margin: '0 0 8px',
              fontSize: 10,
              fontWeight: '700',
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}>
              Quick Access — Select a demo role
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {DEMO_ROLES.map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleClick(r)}
                  style={{
                    background: selectedRole === r.role ? '#EEF3FB' : '#F7F9FC',
                    border: selectedRole === r.role ? '1.5px solid #3B7DDD' : '1.5px solid #E0E4EC',
                    borderRadius: 6,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: '700', color: selectedRole === r.role ? '#3B7DDD' : '#333' }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleNext}>
            {/* FastPass button */}
            <button
              type="button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '10px 0',
                border: '1px solid #D0D5DD',
                borderRadius: 4,
                background: 'white',
                cursor: 'pointer',
                fontSize: 14,
                color: '#1d1d1d',
                fontWeight: '500',
                marginBottom: 16,
              }}
            >
              <OktaFastPassIcon />
              Sign in with Okta FastPass
            </button>

            {/* OR divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
              color: '#999', fontSize: 12,
            }}>
              <div style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
              OR
              <div style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
            </div>

            {/* Username field */}
            <div style={{ marginBottom: step === 'password' ? 16 : 0 }}>
              <label style={{
                display: 'block', marginBottom: 4,
                fontSize: 13, fontWeight: '600', color: '#444',
              }}>
                Username
              </label>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>
                Example: username@guidewire.com
              </p>
              <input
                type="email"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); setSelectedRole(null) }}
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #C8CDD6',
                  borderRadius: 4,
                  fontSize: 14,
                  color: '#1d1d1d',
                  background: '#FAFAFA',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = '#3B7DDD')}
                onBlur={e => (e.target.style.borderColor = '#C8CDD6')}
              />
            </div>

            {/* Password field — shown in step 2 */}
            {step === 'password' && (
              <div style={{ marginBottom: 0 }}>
                <label style={{
                  display: 'block', marginBottom: 6,
                  fontSize: 13, fontWeight: '600', color: '#444',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    autoComplete="current-password"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      border: '1px solid #C8CDD6',
                      borderRadius: 4,
                      fontSize: 14,
                      color: '#1d1d1d',
                      background: '#FAFAFA',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#3B7DDD')}
                    onBlur={e => (e.target.style.borderColor = '#C8CDD6')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#888', padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p style={{
                margin: '10px 0 0',
                fontSize: 12.5,
                color: '#D4353E',
                background: '#FFF0F0',
                border: '1px solid #F5C6C8',
                borderRadius: 4,
                padding: '8px 12px',
              }}>
                {error}
              </p>
            )}

            {/* Keep me signed in */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '18px 0 16px',
              fontSize: 13, color: '#554BE8', cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={e => setKeepSignedIn(e.target.checked)}
                style={{ width: 15, height: 15, cursor: 'pointer' }}
              />
              Keep me signed in
            </label>

            {/* Next / Sign In button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 0',
                background: loading ? '#6B9FE8' : '#3B7DDD',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                fontSize: 15,
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" strokeOpacity="0.3"/>
                    <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                step === 'username' ? 'Next' : 'Sign In'
              )}
            </button>

            {/* Help */}
            {step === 'username' && (
              <div style={{ marginTop: 16 }}>
                <a
                  href="#"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: '#3B7DDD', fontSize: 13, textDecoration: 'none',
                  }}
                >
                  Help <ExternalLink size={12} />
                </a>
              </div>
            )}

            {step === 'password' && (
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('username')}
                  style={{ background: 'none', border: 'none', color: '#3B7DDD', fontSize: 13, cursor: 'pointer', padding: 0 }}
                >
                  ← Back
                </button>
                <a href="#" style={{ color: '#3B7DDD', fontSize: 13, textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Footer — Powered by Okta / Privacy Policy */}
      <footer style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        padding: '10px 24px',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(4px)',
        borderTop: '1px solid #DDE0E6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: '#666',
      }}>
        <span>
          Powered by{' '}
          <a href="https://okta.com" style={{ color: '#3B7DDD', textDecoration: 'underline' }} target="_blank" rel="noreferrer">
            Okta
          </a>
        </span>
        <a href="#" style={{ color: '#3B7DDD', textDecoration: 'underline' }}>Privacy Policy</a>
      </footer>
    </div>
  )
}
