import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const redirectTo = searchParams.get('redirect') || '/analysis'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Password recovery — send to reset page
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/account/reset-password`)
            }
            return NextResponse.redirect(`${origin}${redirectTo}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}