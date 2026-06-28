'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Lock, CheckCircle } from 'lucide-react'

export default function EditProfilePage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [initials, setInitials] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) { router.push('/login'); return }
            const name = user.user_metadata?.full_name ?? ''
            setFullName(name)
            setEmail(user.email ?? '')
            setInitials(
                name.trim().split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                || (user.email?.[0] ?? '?').toUpperCase()
            )
        })
    }, [])

    async function handleSave() {
        if (!fullName.trim()) { setError('Name cannot be empty'); return }
        if (!currentPassword) { setError('Enter your current password to save changes'); return }
        setLoading(true); setError('')

        // Re-authenticate with current password first
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: currentPassword,
        })
        if (authError) {
            setError('Incorrect password. Please try again.')
            setLoading(false)
            return
        }

        // Now update the profile
        const { error: updateError } = await supabase.auth.updateUser({
            data: { full_name: fullName.trim() }
        })
        setLoading(false)
        if (updateError) { setError(updateError.message) }
        else {
            setSuccess(true)
            setCurrentPassword('')
            setTimeout(() => router.push('/account'), 1500)
        }
    }

    return (
        <div className="min-h-screen bg-(--color-background-tertiary) flex items-start justify-center py-12 px-4">
            <div className="w-full max-w-md">

                {/* Back link */}
                <Link
                    href="/account"
                    className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-(--color-text-info) no-underline hover:underline"
                >
                    <ArrowLeft size={13} /> Back to account
                </Link>

                {/* Card */}
                <div className="rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card) overflow-hidden">

                    {/* Header strip */}
                    <div className="bg-(--color-background-warning) px-6 py-5 flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/30 text-[18px] font-bold text-(--color-text-warning)">
                            {initials || '?'}
                        </div>
                        <div>
                            <p className="text-[16px] font-bold text-(--color-text-warning)">
                                {fullName || 'Your profile'}
                            </p>
                            <p className="text-[12px] text-(--color-text-warning) opacity-70">{email}</p>
                        </div>
                    </div>

                    <div className="px-6 py-6 space-y-5">

                        {/* Success */}
                        {success && (
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-[13px] text-green-700">
                                <CheckCircle size={15} />
                                Profile updated! Redirecting…
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Full name */}
                        <div>
                            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-(--color-text-secondary)">
                                <User size={12} />
                                Full name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-3 py-2.5 text-[14px] text-(--color-text-primary) outline-none focus:border-[#ef9f27] transition-colors"
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Email — read only */}
                        <div>
                            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-(--color-text-secondary)">
                                <Mail size={12} />
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-secondary) px-3 py-2.5 text-[14px] text-(--color-text-tertiary) outline-none cursor-not-allowed"
                            />
                            <p className="mt-1 text-[11px] text-(--color-text-tertiary)">
                                Email cannot be changed here. Contact support if needed.
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t-[0.5px] border-(--color-border-tertiary)" />

                        {/* Current password confirmation */}
                        <div>
                            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-(--color-text-secondary)">
                                <Lock size={12} />
                                Confirm with your current password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                className="w-full rounded-(--border-radius-md) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) px-3 py-2.5 text-[14px] text-(--color-text-primary) outline-none focus:border-[#ef9f27] transition-colors"
                                placeholder="Enter current password to save"
                            />
                            <p className="mt-1 text-[11px] text-(--color-text-tertiary)">
                                Required to confirm any changes to your profile.
                            </p>
                        </div>

                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            disabled={loading || success}
                            className="w-full rounded-(--border-radius-md) bg-[#ef9f27] py-2.5 text-[14px] font-bold text-[#412402] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? 'Verifying & saving…' : 'Save changes'}
                        </button>

                        {/* Change password link */}
                        <p className="text-center text-[12px] text-(--color-text-tertiary)">
                            Want to change your password?{' '}
                            <Link href="/account/change-password" className="text-(--color-text-info) no-underline hover:underline">
                                Do it here →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}