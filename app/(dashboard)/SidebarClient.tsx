'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SidebarClient({ profile }: any) {
    const [communityOpen, setCommunityOpen] = useState(false)
    const [mseOpen, setMseOpen] = useState(false)
    const pathname = usePathname()

    const isActive = (href: string) => pathname === href

    return (
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full">
            <div className="px-5 py-4 border-b border-gray-200">
                <p className="text-base font-medium text-gray-900">
                    <span className="text-amber-600">Malawi</span> Investor
                </p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {profile?.membership_tier || 'free'} member
                </p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {[
                    { href: '/news', label: 'Daily News', icon: '📊' },
                    { href: '/learn', label: 'Learn', icon: '📚' },
                    { href: '/simulator', label: 'Inv. Simulator', icon: '📈' },
                    { href: '/mentorship', label: 'Mentorship', icon: '🎯' },
                ].map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(item.href) ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'}`}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </Link>
                ))}

                {/* Community expandable */}
                <div>
                    <button
                        onClick={() => setCommunityOpen(!communityOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${pathname.startsWith('/community') ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span>💬</span>
                            Community
                        </div>
                        <span className={`text-xs transition-transform ${communityOpen ? 'rotate-180' : ''}`}>▾</span>
                    </button>
                    {communityOpen && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                            {[
                                { href: '/community', label: 'Discussion Forum' },
                                { href: '/community/qa', label: 'Q&A with Mentors' },
                                { href: '/community/success', label: 'Success Stories' },
                            ].map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${isActive(item.href) ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:bg-amber-50 hover:text-amber-700'}`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* MSE expandable */}
                <div>
                    <button
                        onClick={() => setMseOpen(!mseOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${pathname.startsWith('/mse') ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span>🏦</span>
                            MSE
                        </div>
                        <span className={`text-xs transition-transform ${mseOpen ? 'rotate-180' : ''}`}>▾</span>
                    </button>
                    {mseOpen && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                            {[
                                { href: '/mse', label: 'MSE Tracker' },
                                { href: '/mse/watchlist', label: 'Watchlist' },
                                { href: '/mse/rankings', label: 'Rankings' },
                                { href: '/mse/compare', label: 'Compare' },
                            ].map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${isActive(item.href) ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:bg-amber-50 hover:text-amber-700'}`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
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
    )
}