import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="min-h-screen flex bg-gray-50">
            <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full">
                <div className="px-5 py-4 border-b border-gray-200">
                    <p className="text-base font-medium text-gray-900">
                        <span className="text-amber-600">BBN</span> Academy
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {profile?.membership_tier || 'free'} member
                    </p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {[
                        { href: '/analysis', label: 'Daily Analysis', icon: '📊' },
                        { href: '/learn', label: 'Learn', icon: '📚' },
                        { href: '/simulator', label: 'Inv. Simulator', icon: '📈' },
                        { href: '/mentorship', label: 'Mentorship', icon: '🎯' },
                        { href: '/community', label: 'Community', icon: '💬' },
                        { href: '/mse', label: 'MSE Tracker', icon: '🏦' },
                        { href: '/mse/watchlist', label: 'Watchlist', icon: '⭐' },
                    ].map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-gray-200 space-y-0.5">
                    <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <span>👤</span>
                        {profile?.full_name || 'Profile'}
                    </Link>
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <span>🚪</span>
                            Sign out
                        </button>
                    </form>
                </div>
            </aside>

            <main className="ml-56 flex-1 p-6">
                {children}
            </main>
        </div>
    )
}