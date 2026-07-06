import DividendCalculator from './DivedendCalculator'
import TickerModuleSection from './TickerModuleSection'
import OwnershipGrid from './OwnershipGrid'
import MatchingDemo from './MatchingDemo'
import type { LearnLang } from '@/lib/i18n/learn-dict'

type WidgetEntry = {
    gatesCompletion: boolean
    render: (props: { onCorrect: () => void; lang?: LearnLang }) => React.ReactNode
}

export const widgetRegistry: Record<string, WidgetEntry> = {
    dividend_calculator: {
        gatesCompletion: false,
        render: () => <DividendCalculator />,
    },
    ticker_demo: {
        gatesCompletion: true,
        render: ({ onCorrect }) => <TickerModuleSection onCorrect={onCorrect} />,
    },
    ownership_grid: {
        gatesCompletion: false,
        render: ({ lang }) => <OwnershipGrid variant="dilution" lang={lang} />,
    },
    ownership_grid_rights: {
        gatesCompletion: false,
        render: ({ lang }) => <OwnershipGrid variant="rights" lang={lang} />,
    },
    matching_demo: {
        gatesCompletion: false,
        render: ({ lang }) => <MatchingDemo lang={lang} />,
    },
}