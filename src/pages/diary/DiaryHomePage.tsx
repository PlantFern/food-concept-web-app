import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    applyMealTemplate,
    fetchDayMeals,
    type DayMealsDto,
    type MealTemplateListItemDto,
} from '@/api/diary'
import { getDiaryProfileId } from '@/api/onboarding'
import {
    BottomNav,
    DateNav,
    PrimaryNutrientGauge,
    MacroBar,
    MealSection,
    SleepCard,
    WeightCard,
} from '@/components/diary'

function toIsoDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function nutrientColor(code: string): string {
    const c = code.toUpperCase()
    if (c.includes('PROTEIN') || c === 'PROTEIN') return '#3498db'
    if (c.includes('FAT') || c === 'FAT') return '#f39c12'
    if (c.includes('CARB') || c === 'CARBS' || c === 'CARBOHYDRATE') return '#2ecc71'
    return '#95a5a6'
}

function nutrientLabel(code: string): string {
    const c = code.toUpperCase()
    if (c.includes('PROTEIN')) return 'protein'
    if (c.includes('FAT')) return 'fat'
    if (c.includes('CARB')) return 'carbs'
    return code.toLowerCase()
}

function pickTemplatesForSection(
    templates: MealTemplateListItemDto[],
    mealTypeCode: string,
    sectionIndex: number,
    sectionsCount: number,
): MealTemplateListItemDto[] {
    if (!templates.length) return []

    const code = mealTypeCode.toUpperCase()
    const hourHints: Record<string, [number, number]> = {
        BREAKFAST: [5, 11],
        LUNCH: [11, 16],
        SNACK: [15, 18],
        DINNER: [17, 23],
    }

    const range = hourHints[code]
    if (range) {
        const matched = templates.filter((t) => {
            if (!t.scheduledTime) return false
            const h = Number(String(t.scheduledTime).slice(0, 2))
            return Number.isFinite(h) && h >= range[0] && h < range[1]
        })
        if (matched.length) return matched
    }

    if (sectionIndex === sectionsCount - 1) {
        return templates.filter((t) => !t.scheduledTime)
    }
    return []
}

export function DiaryHomePage() {
    const [date, setDate] = useState(() => new Date())
    const [day, setDay] = useState<DayMealsDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [applyingTemplateId, setApplyingTemplateId] = useState<number | null>(null)
    const [statsPage, setStatsPage] = useState(0)

    const iso = useMemo(() => toIsoDate(date), [date])
    const profileId = getDiaryProfileId()

    const load = useCallback(async () => {
        if (profileId == null) {
            setError('Нет профиля дневника. Пройдите онбординг.')
            setDay(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const data = await fetchDayMeals(iso, profileId)
            setDay(data)
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data
                          ?.message
                    : null
            setError(typeof msg === 'string' && msg ? msg : 'Не удалось загрузить день')
            setDay(null)
        } finally {
            setLoading(false)
        }
    }, [iso, profileId])

    useEffect(() => {
        void load()
    }, [load])

    function shiftDay(delta: number) {
        setDate((prev) => {
            const next = new Date(prev)
            next.setDate(prev.getDate() + delta)
            return next
        })
    }

    async function onApplyTemplate(templateId: number, mealTypeId: number) {
        setApplyingTemplateId(templateId)
        try {
            await applyMealTemplate(templateId, mealTypeId, iso)
            await load()
        } catch {
            setError('Не удалось отметить шаблон')
        } finally {
            setApplyingTemplateId(null)
        }
    }

    const primary = day?.targets.find(
        (t) =>
            t.nutrientId === day.primaryNutrient ||
            t.nutrientCode?.toUpperCase() === day.primaryNutrientCode?.toUpperCase(),
    )

    const secondary = (day?.targets ?? []).filter(
        (t) =>
            t.nutrientId !== day?.primaryNutrient &&
            t.nutrientCode?.toUpperCase() !== day?.primaryNutrientCode?.toUpperCase(),
    )

    const macroItems = secondary.slice(0, 3).map((t) => ({
        key: t.nutrientCode,
        label: nutrientLabel(t.nutrientCode),
        value: Math.max(t.factAmount ?? 0, 0),
        color: nutrientColor(t.nutrientCode),
    }))

    const primaryUnit =
        day?.primaryNutrientCode?.toLowerCase().includes('kcal') ||
        day?.primaryNutrientCode?.toLowerCase().includes('energy')
            ? 'kcal'
            : (day?.primaryNutrientCode ?? 'kcal')

    return (
        <div className="diary-shell">
            <header className="stats-header">
                <DateNav date={date} onPrev={() => shiftDay(-1)} onNext={() => shiftDay(1)} />

                <div className="stats-body">
                    <PrimaryNutrientGauge
                        current={primary?.factAmount ?? 0}
                        goal={primary?.targetAmount ?? 0}
                    />
                    {macroItems.length > 0 ? (
                        <MacroBar items={macroItems} />
                    ) : (
                        <p className="macro-bar-empty">Нет данных БЖУ</p>
                    )}
                </div>

                <div className="stats-dots" role="tablist" aria-label="Страницы статистики">
                    {[0, 1, 2, 3].map((i) => (
                        <button
                            key={i}
                            type="button"
                            role="tab"
                            aria-selected={statsPage === i}
                            className={`stats-dot ${statsPage === i ? 'is-active' : ''}`}
                            onClick={() => setStatsPage(i)}
                        />
                    ))}
                </div>
            </header>

            <div className="diary-content">
                {loading && <p className="meal-empty">Загрузка…</p>}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {!loading &&
                    day &&
                    day.sections.map((section, index) => (
                        <MealSection
                            key={section.mealId}
                            mealTypeCode={section.mealTypeCode}
                            mealTypeId={section.mealTypeId}
                            records={section.records ?? []}
                            totalPrimaryNutrient={section.totalPrimaryNutrient}
                            primaryUnit={primaryUnit}
                            templates={pickTemplatesForSection(
                                day.pendingTemplates ?? [],
                                section.mealTypeCode,
                                index,
                                day.sections.length,
                            )}
                            applyingTemplateId={applyingTemplateId}
                            onApplyTemplate={onApplyTemplate}
                        />
                    ))}

                {!loading && day && day.sections.length === 0 && (
                    <p className="meal-empty">За этот день приёмов пока нет</p>
                )}

                {!loading && day?.weightEnabled && (
                    <WeightCard weightKg={day.latestWeight?.weight ?? null} />
                )}

                {!loading && day?.sleepEnabled && (
                    <SleepCard
                        entries={(day.sleepForDay ?? []).map((s) => ({
                            id: s.id,
                            start: s.beganAt,
                            end: s.endedAt ?? '',
                        }))}
                    />
                )}
            </div>

            <BottomNav />
        </div>
    )
}
