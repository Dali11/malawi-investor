'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleReset() {
        if (!password || !confirm) { setError('Fill in both fields'); return }
        if (password !== confirm) { setError('Passwords do not match'); return }
        if (password.length < 8) { setError('At least 8 characters required'); return }
        setLoading(true); setError('')
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)
        if (error) { setError(error.message) }
        else { setDone(true); setTimeout(() => router.push('/news'), 2000) }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8">
                <Link href="/" className="text-xl font-medium text-gray-900 no-underline block mb-6">
                    <span className="text-amber-600">Malawi</span> Investor
                </Link>

                {done ? (
                    <div className="text-center">
                        <div className="text-3xl mb-3">✅</div>
                        <p className="text-sm text-gray-600">Password updated. Redirecting…</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Set new password</h2>
                        <p className="text-sm text-gray-500 mb-5">Choose a strong password for your account.</p>

                        {error && (
                            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">New password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                                    placeholder="At least 8 characters"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Confirm password</label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                                    placeholder="Repeat new password"
                                />
                            </div>
                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Saving…' : 'Update password'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}