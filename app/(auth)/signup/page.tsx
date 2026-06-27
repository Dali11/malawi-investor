'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    async function handleSignup() {
        setError('')
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${window.location.origin}/callback${searchParams.get('redirect')
                        ? `?redirect=${searchParams.get('redirect')}`
                        : ''
                    }`,
            }
        })
        if (error) {
            setError(error.message || 'Something went wrong. Please try again.')
            setLoading(false)
        } else if (data.session) {
            const redirectTo = searchParams.get('redirect') || '/analysis'
            router.push(redirectTo)
        } else {
            setLoading(false)
            setAwaitingConfirmation(true)
        }
    }

    if (awaitingConfirmation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <h1 className="text-xl font-medium text-gray-900">
                        <span className="text-amber-600">BBN</span> Investment Academy
                    </h1>
                    <p className="text-sm text-gray-600 mt-4">
                        Check <span className="font-medium">{email}</span> for a confirmation link to activate your account.
                    </p>
                </div>
            </div>
        )
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8">
                <div className="mb-6">
                    <h1 className="text-xl font-medium text-gray-900">
                        <span className="text-amber-600">BBN</span> Investment Academy
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Create your free account</p>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Full name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                            placeholder="Your full name"
                        />
                    </div>
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
                        <label className="text-sm text-gray-600 block mb-1">Password</label>
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
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSignup()}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                            placeholder="Repeat your password"
                        />
                    </div>
                    <button
                        onClick={handleSignup}
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </div>

                <p className="text-sm text-gray-500 text-center mt-4">
                    Already have an account?{' '}
                    <Link
                        href={`/login${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}
                        className="text-amber-600 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}