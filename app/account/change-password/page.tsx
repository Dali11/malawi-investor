'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordPage() {
    const [email, setEmail] = useState('')
    const [current, setCurrent] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            setEmail(user.email ?? '')
        })
    }, [])

    const strength =
        password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
            : password.length >= 8 ? 2
                : password.length > 0 ? 1 : 0

    const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength]
    const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500'][strength]

    async function handleChange() {
        if (!current) { setError('Enter your current password'); return }
        if (!password) { setError('Enter a new password'); return }
        if (password !== confirm) { setError('Passwords do not match'); return }
        if (password.length < 8) { setError('At least 8 characters required'); return }
        if (password === current) { setError('New password must be different from current'); return }

        setLoading(true); setError('')

        // Re-authenticate first
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current })
        if (authError) {
            setError('Current password is incorrect')
            setLoading(false)
            return
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({ password })
        setLoading(false)
        if (updateError) { setError(updateError.message) }
        else {
            setSuccess(true)
            setTimeout(() => router.push('/account'), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-(--color-background-tertiary) flex items-start justify-center py-12 px-4">
            <div className="w-full max-w-md">

                <Link
                    href="/account"
                    className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-(--color-text-info) no-underline hover:underline"
                >
                    <ArrowLeft size={13} /> Back to account
                </Link>

                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card) overflow-hidden">

                    {/* Header */}
                    <div className="border-b-[0.5px] border-(--color-border-tertiary) px-6 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-background-warning)">
                                <Lock size={15} className="text-(--color-text-warning)" />
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-(--color-text-primary)">Change password</p>
                                <p className="text-[12px] text-(--color-text-tertiary)">Choose a strong, unique password</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6 space-y-5">

                        {success && (
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-[13px] text-green-700">
                                <CheckCircle size={15} />
                                Password updated! Redirecting…
                            </div>
                        )}

                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Current password */}
                        <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-(--color-text-secondary)">
                                Current password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={current}
                                    onChange={e => setCurrent(e.target.value)}
                                    className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-3 py-2.5 pr-10 text-[14px] text-(--color-text-primary) outline-none focus:border-[#ef9f27] transition-colors"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary) hover:text-(--color-text-secondary)"
                                >
                                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="border-t-[0.5px] border-(--color-border-tertiary)" />

                        {/* New password */}
                        <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-(--color-text-secondary)">
                                New password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-3 py-2.5 pr-10 text-[14px] text-(--color-text-primary) outline-none focus:border-[#ef9f27] transition-colors"
                                    placeholder="At least 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary) hover:text-(--color-text-secondary)"
                                >
                                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>

                            {/* Strength bar */}
                            {strength > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-(--color-background-secondary)'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-(--color-text-tertiary)">{strengthLabel} password</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm */}
                        <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-(--color-text-secondary)">
                                Confirm new password
                            </label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleChange()}
                                className={`w-full rounded-(--border-radius-md) border-[0.5px] bg-(--color-background-primary) px-3 py-2.5 text-[14px] text-(--color-text-primary) outline-none transition-colors ${confirm && confirm !== password
                                        ? 'border-red-300 focus:border-red-400'
                                        : confirm && confirm === password
                                            ? 'border-green-300 focus:border-green-400'
                                            : 'border-(--color-border-tertiary) focus:border-[#ef9f27]'
                                    }`}
                                placeholder="Repeat new password"
                            />
                            {confirm && confirm !== password && (
                                <p className="mt-1 text-[11px] text-red-500">Passwords don't match</p>
                            )}
                            {confirm && confirm === password && (
                                <p className="mt-1 text-[11px] text-green-600">✓ Passwords match</p>
                            )}
                        </div>

                        <button
                            onClick={handleChange}
                            disabled={loading || success || strength === 0}
                            className="w-full rounded-(--border-radius-md) bg-[#ef9f27] py-2.5 text-[14px] font-bold text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? 'Verifying & updating…' : 'Update password'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}