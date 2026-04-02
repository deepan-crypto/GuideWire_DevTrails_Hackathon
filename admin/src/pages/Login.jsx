import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { Shield, Eye, EyeOff, AlertCircle, ChevronRight, Zap } from 'lucide-react'

const ROLE_CARDS = [
  {
    role: 'super_admin',
    color: 'from-purple-600 to-purple-800',
    border: 'border-purple-500/40',
    accent: 'text-purple-300',
    bg: 'bg-purple-500/10',
    emoji: '🛡️',
    email: 'admin@riskwire.in',
    password: 'admin123',
  },
  {
    role: 'claims_manager',
    color: 'from-blue-600 to-blue-800',
    border: 'border-blue-500/40',
    accent: 'text-blue-300',
    bg: 'bg-blue-500/10',
    emoji: '📋',
    email: 'claims@riskwire.in',
    password: 'claims123',
  },
  {
    role: 'policy_admin',
    color: 'from-green-600 to-green-800',
    border: 'border-green-500/40',
    accent: 'text-green-300',
    bg: 'bg-green-500/10',
    emoji: '📄',
    email: 'policy@riskwire.in',
    password: 'policy123',
  },
  {
    role: 'billing_admin',
    color: 'from-amber-600 to-amber-800',
    border: 'border-amber-500/40',
    accent: 'text-amber-300',
    bg: 'bg-amber-500/10',
    emoji: '💰',
    email: 'billing@riskwire.in',
    password: 'billing123',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)

  const handleRoleCard = (card) => {
    setSelectedRole(card.role)
    setEmail(card.email)
    setPassword(card.password)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // simulate auth delay
    const ok = login(email.trim(), password)
    if (!ok) {
      setError('Invalid credentials. Use one of the demo cards above.')
      setLoading(false)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,82,155,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,82,155,0.07)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      {/* Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[520px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <path d="M12 14h16v2H14v8h10v-4h-6v-2h8v8H12V14z" fill="white" />
                <circle cx="30" cy="14" r="3" fill="#4FC3F7" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-[18px] leading-tight tracking-tight">Guidewire</div>
              <div className="text-blue-400 text-[10px] uppercase tracking-widest">InsuranceSuite</div>
            </div>
          </div>
          <h1 className="text-white text-[24px] font-bold tracking-tight">Sign in to RiskWire</h1>
          <p className="text-blue-400/70 text-[13px] mt-1">Parametric Micro-Insurance Operations</p>
        </div>

        {/* Role cards */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/60 mb-3 text-center">
            Quick Access — Select a demo role
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_CARDS.map(card => {
              const role = ROLES[card.role]
              const isSelected = selectedRole === card.role
              return (
                <button
                  key={card.role}
                  type="button"
                  onClick={() => handleRoleCard(card)}
                  className={`relative text-left p-3 rounded-xl border transition-all duration-200 ${card.border} ${card.bg}
                    ${isSelected
                      ? 'ring-2 ring-white/30 scale-[1.02] shadow-lg'
                      : 'hover:scale-[1.01] hover:brightness-110'
                    }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  )}
                  <div className="text-[20px] mb-1">{card.emoji}</div>
                  <div className={`text-[12px] font-bold ${card.accent}`}>{role.label}</div>
                  <div className="text-[10px] text-white/40 leading-tight mt-0.5">{role.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-blue-300/80 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="Enter your email"
              className="w-full bg-white/8 border border-white/15 rounded-lg px-3.5 py-2.5 text-white text-[13px] placeholder:text-white/25
                focus:outline-none focus:border-blue-400/60 focus:bg-white/12 transition-all"
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-blue-300/80 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter your password"
                className="w-full bg-white/8 border border-white/15 rounded-lg px-3.5 py-2.5 text-white text-[13px] placeholder:text-white/25
                  focus:outline-none focus:border-blue-400/60 focus:bg-white/12 transition-all pr-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-[11.5px] text-red-300">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
              text-white font-semibold text-[14px] py-2.5 rounded-xl transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
              shadow-lg shadow-blue-900/40 hover:shadow-blue-800/50"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Authenticating...
              </>
            ) : (
              <>
                Sign In <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-[10.5px] text-blue-400/40">
          <Zap size={11} className="inline mr-1" />
          Secured by RiskWire IAM · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
