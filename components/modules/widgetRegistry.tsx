import DividendCalculator from './DivedendCalculator'
import TickerModuleSection from './TickerModuleSection'

type WidgetEntry = {
    gatesCompletion: boolean
    render: (props: { onCorrect: () => void }) => React.ReactNode
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
}