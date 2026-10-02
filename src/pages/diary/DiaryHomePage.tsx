import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    applyMealTemplate,
    fetchDayMeals,
    nutrientDisplayName,
    nutrientDisplayUnit,
    type DayMealsDto,
    type MealTemplateListItemDto,
} from '@/api/diary'
import { getDiaryProfileId } from '@/api/onboarding'
import { getErrorMessage } from '@/lib/errors'
import { useAlert } from '@/components/ui/Alert'
import {
    BottomNav,
    DateNav,
    PrimaryNutrientGauge,
    NutrientBar,
    MealSection,
    SleepCard,
    WeightCard,
} from '@/components/diary'

const DEFAULT_SECTIONS = [
    { mealId: -1, mealTypeCode: 'BREAKFAST', mealTypeId: 1, records: [] as never[] },
    { mealId: -2, mealTypeCode: 'LUNCH', mealTypeId: 2, records: [] as never[] },
    { mealId: -3, mealTypeCode: 'SNACK', mealTypeId: 3, records: [] as never[] },
    { mealId: -4, mealTypeCode: 'DINNER', mealTypeId: 4, records: [] as never[] },
]

const PALETTE = ['#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#e74c3c', '#1abc9c']

function toIsoDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
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
    const { showAlert } = useAlert()
    const [date, setDate] = useState(() => new Date())
    const [day, setDay] = useState<DayMealsDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [applyingTemplateId, setApplyingTemplateId] = useState<number | null>(null)
    const [statsPage, setStatsPage] = useState(0)

    const iso = useMemo(() => toIsoDate(date), [date])
    const profileId = getDiaryProfileId()

    const load = useCallback(async () => {
        if (profileId == null) {
            setDay(null)
            setLoading(false)
            showAlert('Нет профиля дневника. Пройдите онбординг.', 'warning')
            return
        }
        setLoading(true)
        try {
            const data = await fetchDayMeals(iso, profileId)
            setDay(data)
        } catch (err: unknown) {
            setDay(null)
            showAlert(getErrorMessage(err, 'Не удалось загрузить день'), 'danger')
        } finally {
            setLoading(false)
        }
    }, [iso, profileId, showAlert])

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
            showAlert('Не удалось отметить шаблон', 'danger')
        } finally {
            setApplyingTemplateId(null)
        }
    }

    const primary = day?.targets?.find(
        (t) =>
            t.nutrientId === day.primaryNutrient ||
            t.nutrientCode?.toUpperCase() === day.primaryNutrientCode?.toUpperCase(),
    )

    const primaryName =
        day?.primaryNutrientName?.trim() ||
        (primary ? nutrientDisplayName(primary) : day?.primaryNutrientCode) ||
        ''

    const primaryUnit =
        day?.primaryNutrientUnit?.trim() ||
        (primary ? nutrientDisplayUnit(primary) : '') ||
        ''

    const secondary = (day?.targets ?? []).filter(
        (t) =>
            t.nutrientId !== day?.primaryNutrient &&
            t.nutrientCode?.toUpperCase() !== day?.primaryNutrientCode?.toUpperCase(),
    )

    const secondaryItems = secondary.map((t, index) => ({
        key: String(t.nutrientId ?? t.nutrientCode ?? index),
        label: nutrientDisplayName(t),
        value: Math.max(t.factAmount ?? 0, 0),
        unit: nutrientDisplayUnit(t),
        color: PALETTE[index % PALETTE.length],
    }))

    const sections =
        day?.sections && day.sections.length > 0 ? day.sections : DEFAULT_SECTIONS

    return (
        <div className="diary-shell">
            <header className="stats-header">
                <DateNav date={date} onPrev={() => shiftDay(-1)} onNext={() => shiftDay(1)} />

                <div className="stats-body">
                    <PrimaryNutrientGauge
                        current={primary?.factAmount ?? 0}
                        goal={primary?.targetAmount ?? 0}
                        name={primaryName}
                        unit={primaryUnit}
                    />
                    {secondaryItems.length > 0 && <NutrientBar items={secondaryItems} />}
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

            <div className="diary-content mt-2">
                {loading && <p className="meal-empty">Загрузка…</p>}

                <div className='d-flex flex-column'>
                {!loading &&
                    sections.map((section, index) => (
                        <MealSection
                            key={section.mealId}
                            mealTypeCode={section.mealTypeCode}
                            mealTypeId={section.mealTypeId}
                            records={section.records ?? []}
                            totalPrimaryNutrient={
                                'totalPrimaryNutrient' in section
                                    ? section.totalPrimaryNutrient
                                    : null
                            }
                            primaryUnit={primaryUnit}
                            templates={pickTemplatesForSection(
                                day?.pendingTemplates ?? [],
                                section.mealTypeCode,
                                index,
                                sections.length,
                            )}
                            applyingTemplateId={applyingTemplateId}
                            onApplyTemplate={onApplyTemplate}
                        />
                    ))}
                </div>

                <div className='border-top pt-2'>
                    <h3 className='mb-3'>Логи</h3>
                    {!loading && <WeightCard weightKg={day?.latestWeight?.weight ?? null} />}

                    {!loading && (
                        <SleepCard
                            entries={(day?.sleepForDay ?? []).map((s) => ({
                                id: s.id,
                                start: s.beganAt,
                                end: s.endedAt ?? '',
                            }))}
                        />
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
