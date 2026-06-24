// import { NextRequest, NextResponse } from 'next/server'
// import { getCompositeHistory, getCounterHistory, RangeKey } from './chart'


// const VALID_RANGES: RangeKey[] = ['30D', '3M', '1Y']

// export async function GET(request: NextRequest) {
//     const searchParams = request.nextUrl.searchParams
//     const symbol = searchParams.get('symbol')
//     const rangeParam = searchParams.get('range') ?? '30D'

//     if (!VALID_RANGES.includes(rangeParam as RangeKey)) {
//         return NextResponse.json({ error: 'Invalid range' }, { status: 400 })
//     }
//     const range = rangeParam as RangeKey

//     try {
//         const points = symbol
//             ? await getCounterHistory(symbol, range)
//             : await getCompositeHistory(range)

//         return NextResponse.json({ points, isComposite: !symbol })
//     } catch (err) {
//         console.error('Chart data fetch failed:', err)
//         return NextResponse.json({ error: 'Failed to load chart data' }, { status: 500 })
//     }
// }