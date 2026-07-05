import { widgetRegistry } from './widgetRegistry'
import type { LearnLang } from '@/lib/i18n/learn-dict'

export function ModuleWidget({ widgetType, lang = 'en' }: { widgetType: string | null; lang?: LearnLang }) {
    if (!widgetType) return null
    const widget = widgetRegistry[widgetType]
    if (!widget || widget.gatesCompletion) return null
    return <>{widget.render({ onCorrect: () => { }, lang })}</>
}