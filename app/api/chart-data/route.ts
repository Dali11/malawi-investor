import { NextRequest, NextResponse } from 'next/server'
import { getCounterHistory, getCompositeHistory, getIndexHistory, type RangeKey } from '@/lib/chart-data'

const VALID_RANGES: RangeKey[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', '10Y', 'MAX']

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const index = searchParams.get('index')
    const rangeParam = searchParams.get('range') ?? '1M'

    if (!VALID_RANGES.includes(rangeParam as RangeKey)) {
        return NextResponse.json({ error: 'Invalid range' }, { status: 400 })
    }
    const range = rangeParam as RangeKey

    try {
        const isMdsiOrMfsi = index && ['MDSI', 'MFSI'].includes(index.toUpperCase())

        const points = index
            ? await getIndexHistory(index, range)
            : symbol
                ? await getCounterHistory(symbol, range)
                : await getCompositeHistory(range)

        return NextResponse.json({
            points,
            isComposite: !symbol && !index,
            isSynthetic: Boolean(isMdsiOrMfsi),
        })
    } catch (err) {
        console.error('Chart data fetch failed:', err)
        return NextResponse.json({ error: 'Failed to load chart data' }, { status: 500 })
    }
}