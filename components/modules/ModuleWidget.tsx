import DividendCalculator from "./DivedendCalculator"


export const moduleWidgets: Record<string, React.ComponentType> = {
    dividend_calculator: DividendCalculator,
}

export function ModuleWidget({ widgetType }: { widgetType: string | null }) {
    if (!widgetType) return null
    const Widget = moduleWidgets[widgetType]
    if (!Widget) return null
    return <Widget />
}