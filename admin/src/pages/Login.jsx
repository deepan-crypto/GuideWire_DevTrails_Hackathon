import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const OKTA_USERS = [
    {
        id: 1,
        name: 'Super Admin',
        email: 'superAdmin@riskwire.in',
        role: 'Super Admin',
        initials: 'SK',
        color: '#7C3AED',
        permissions: ['Read', 'Write', 'Delete', 'Admin'],
    },
    {
        id: 2,
        name: 'Claims Manager',
        email: 'claimsmanager@riskwire.in',
        role: 'Claims Manager',
        initials: 'DE',
        color: '#00529B',
        permissions: ['Read', 'Write'],
    },
    {
        id: 3,
        name: 'Policy Analyst',
        email: 'policyanalyst@riskwire.in',
        role: 'Policy Analyst',
        initials: 'PM',
        color: '#059669',
        permissions: ['Read'],
    },
    {
        id: 4,
        name: 'Billing Specialist',
        email: 'billing@riskwire.in',
        role: 'Billing Specialist',
        initials: 'BS',
        color: '#D97706',
        permissions: ['Read', 'Write'],
    },
]

function GuidewireLogo() {
    return (
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#00529B" />
            <path d="M12 14h16v2H14v8h10v-4h-6v-2h8v8H12V14z" fill="white" />
            <circle cx="30" cy="14" r="3" fill="#4FC3F7" />
        </svg>
    )
}

function OktaLogo() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#007DC1" />
            <circle cx="12" cy="12" r="5.5" fill="white" />
        </svg>
    )
}

export default function Login({ onLogin }) {
    const [selectedUser, setSelectedUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('select') // 'select' | 'confirm'
    const navigate = useNavigate()

    const handleSelect = (user) => {
        setSelectedUser(user)
        setStep('confirm')
    }

    const handleSignIn = () => {
        if (!selectedUser) return
        setLoading(true)
        // Simulate Okta SSO token exchange delay
        setTimeout(() => {
            onLogin(selectedUser)
            navigate('/policy-center', { replace: true })
        }, 1400)
    }

    return (
        <div className="min-h-screen bg-[#F0F4FA] flex items-center justify-center p-4">
            <div className="w-full max-w-[420px]">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#00529B] px-8 py-7 text-center">
                        <div className="flex items-center justify-center gap-3 mb-1">
                            <GuidewireLogo />
                            <div className="text-left">
                                <div className="text-white font-bold text-[20px] leading-tight tracking-tight">Guidewire</div>
                                <div className="text-blue-200 text-[10px] tracking-widest uppercase">InsuranceSuite Cloud</div>
                            </div>
                        </div>
                        <p className="text-blue-100 text-[12px] mt-3 opacity-80">RiskWire · Micro-Insurance Platform</p>
                    </div>

                    <div className="px-8 py-7">
                        {/* Okta badge */}
                        <div className="flex items-center justify-center gap-2 mb-6 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                            <OktaLogo />
                            <span className="text-[12px] text-[#007DC1] font-semibold">Powered by Okta Identity</span>
                            <span className="ml-auto text-[10px] text-gray-400 font-mono">SSO v2.0</span>
                        </div>

                        {step === 'select' && (
                            <>
                                <h2 className="text-[15px] font-bold text-gray-800 mb-1">Sign in with Okta</h2>
                                <p className="text-[11.5px] text-gray-400 mb-5">Select your identity to continue</p>

                                <div className="space-y-2.5">
                                    {OKTA_USERS.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleSelect(user)}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150 group text-left"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                                                style={{ backgroundColor: user.color }}
                                            >
                                                {user.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] font-semibold text-gray-800 group-hover:text-[#00529B] transition-colors truncate">
                                                    {user.name}
                                                </div>
                                                <div className="text-[10.5px] text-gray-400 truncate">{user.email}</div>
                                            </div>
                                            <span
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                                                style={{ backgroundColor: user.color + '18', color: user.color }}
                                            >
                                                {user.role}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {step === 'confirm' && selectedUser && (
                            <>
                                <button
                                    onClick={() => setStep('select')}
                                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#00529B] mb-5 transition-colors"
                                >
                                    ← Change user
                                </button>

                                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div
                                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[18px] font-bold shrink-0"
                                        style={{ backgroundColor: selectedUser.color }}
                                    >
                                        {selectedUser.initials}
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-bold text-gray-800">{selectedUser.name}</div>
                                        <div className="text-[11.5px] text-gray-400">{selectedUser.email}</div>
                                        <div className="flex gap-1 mt-1.5 flex-wrap">
                                            {selectedUser.permissions.map(p => (
                                                <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#00529B]">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSignIn}
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-bold text-[14px] text-white transition-all disabled:opacity-70"
                                    style={{ backgroundColor: selectedUser.color }}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Authenticating via Okta…
                                        </span>
                                    ) : (
                                        `Sign in as ${selectedUser.name.split(' ')[0]}`
                                    )}
                                </button>
                            </>
                        )}

                        <p className="text-center text-[10px] text-gray-300 mt-6">
                            Secured by Okta · Guidewire Cloud Platform · 2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
