'use client'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const [showReset, setShowReset] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    async function handleLogin() {
        if (!email || !password) { setError('Please fill in all fields'); return }
        setLoading(true); setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message === 'Invalid login credentials'
                ? 'Wrong email or password'
                : error.message)
            setLoading(false)
        } else {
            router.push(searchParams.get('redirect') || '/analysis')
            router.refresh()
        }
    }

    async function handleReset() {
        if (!email) { setError('Enter your email above first'); return }
        setLoading(true); setError('')
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/callback?type=recovery`,
        })
        setLoading(false)
        if (error) { setError(error.message) } else { setResetSent(true) }
    }

    async function handleGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/callback${searchParams.get('redirect')
                    ? `?redirect=${searchParams.get('redirect')}` : ''}`,
            },
        })
    }

    if (resetSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <div className="text-3xl mb-3">📬</div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
                    <p className="text-sm text-gray-500">
                        We sent a password reset link to <span className="font-medium text-gray-800">{email}</span>
                    </p>
                    <button
                        onClick={() => { setResetSent(false); setShowReset(false) }}
                        className="mt-5 text-sm text-amber-600 hover:underline"
                    >
                        Back to sign in
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8">
                <div className="mb-6">
                    <Link href="/" className="text-xl font-medium text-gray-900 no-underline">
                        <span className="text-amber-600">Malawi</span> Investor
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {/* Google OAuth */}
                <button
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-xs text-gray-400">or</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm text-gray-600">Password</label>
                            <button
                                type="button"
                                onClick={() => setShowReset(true)}
                                className="text-xs text-amber-600 hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Inline reset */}
                    {showReset && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm">
                            <p className="text-amber-800 mb-2 text-xs">We'll send a reset link to the email above.</p>
                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
                            >
                                {loading ? 'Sending…' : 'Send reset link →'}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </div>

                <p className="text-sm text-gray-500 text-center mt-4">
                    No account?{' '}
                    <Link
                        href={`/signup${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}
                        className="text-amber-600 hover:underline"
                    >
                        Create one free
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    )
}