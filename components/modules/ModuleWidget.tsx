import { widgetRegistry } from './widgetRegistry'

export function ModuleWidget({ widgetType }: { widgetType: string | null }) {
    if (!widgetType) return null
    const widget = widgetRegistry[widgetType]
    if (!widget || widget.gatesCompletion) return null
    return <>{widget.render({ onCorrect: () => { } })}</>
}