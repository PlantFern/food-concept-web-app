import { useEffect, useState } from 'react'
import {
    applyMealTemplate,
    fetchDayMeals,
    nutrientDisplayName,
    nutrientDisplayUnit,
    type DayMealsDto,
    type MealSectionDto,
    type MealTemplateListItemDto,
} from '@/api/diaryProfile/diary'
import { fetchCommentsByType, type DiaryCommentDto } from '@/api/diaryProfile/comments'
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

const CANONICAL_ORDER = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER', 'OTHERS'] as const

const DEFAULT_SECTIONS: MealSectionDto[] = CANONICAL_ORDER.map((code, i) => ({
    mealId: -(i + 1),
    mealTypeCode: code,
    mealTypeId: i + 1,
    generatedFromTemplateId: null,
    records: [],
    totalPrimaryNutrient: null,
    photoPath: null,
}))

const PALETTE = ['#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#e74c3c', '#1abc9c']

function toIsoDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function normalizeSectionCode(code: string | null | undefined): string {
    const c = (code ?? '').toUpperCase()
    if (CANONICAL_ORDER.includes(c as (typeof CANONICAL_ORDER)[number])) return c
    if (c.includes('SNACK') || c === 'BRUNCH') return 'SNACK'
    if (c === 'OTHER' || c === 'OTHERS') return 'OTHERS'
    return 'OTHERS'
}

/** Keep exactly 5 cards: breakfast → others. Merge extras into snack/others. */
function normalizeSections(raw: MealSectionDto[] | null | undefined): MealSectionDto[] {
    if (!raw?.length) return DEFAULT_SECTIONS

    const byCode = new Map<string, MealSectionDto>()
    for (const code of CANONICAL_ORDER) {
        const found = raw.find((s) => (s.mealTypeCode ?? '').toUpperCase() === code)
        byCode.set(
            code,
            found
                ? { ...found, mealTypeCode: code }
                : {
                      mealId: -(CANONICAL_ORDER.indexOf(code) + 1),
                      mealTypeCode: code,
                      mealTypeId: CANONICAL_ORDER.indexOf(code) + 1,
                      generatedFromTemplateId: null,
                      records: [],
                      totalPrimaryNutrient: null,
                      photoPath: null,
                  },
        )
    }

    for (const s of raw) {
        const code = normalizeSectionCode(s.mealTypeCode)
        if (CANONICAL_ORDER.includes((s.mealTypeCode ?? '').toUpperCase() as (typeof CANONICAL_ORDER)[number])) {
            continue
        }
        const target = byCode.get(code)!
        const mergedRecords = [...(target.records ?? []), ...(s.records ?? [])]
        byCode.set(code, {
            ...target,
            mealId: target.mealId > 0 ? target.mealId : s.mealId,
            records: mergedRecords,
            photoPath: target.photoPath || s.photoPath || null,
            totalPrimaryNutrient:
                (target.totalPrimaryNutrient ?? 0) + (s.totalPrimaryNutrient ?? 0) || null,
        })
    }

    return CANONICAL_ORDER.map((code) => byCode.get(code)!)
}

function pickTemplatesForSection(
    templates: MealTemplateListItemDto[],
    mealTypeCode: string,
): MealTemplateListItemDto[] {
    if (!templates.length) return []

    const code = mealTypeCode.toUpperCase()
    const hourHints: Record<string, [number, number]> = {
        BREAKFAST: [5, 11],
        LUNCH: [11, 16],
        SNACK: [9, 18],
        DINNER: [17, 23],
    }

    const range = hourHints[code]
    if (range) {
        const matched = templates.filter((template) => {
            if (!template.scheduledTime) return false
            const hour = Number(String(template.scheduledTime).slice(0, 2))
            return Number.isFinite(hour) && hour >= range[0] && hour < range[1]
        })
        if (matched.length) return matched
    }

    if (code === 'OTHERS' || code === 'OTHER') {
        return templates.filter((t) => !t.scheduledTime)
    }
    return []
}

export function DiaryHomePage() {
    const { showAlert } = useAlert()
    const [date, setDate] = useState(() => new Date())
    const [day, setDay] = useState<DayMealsDto | null>(null)
    const [mealComments, setMealComments] = useState<DiaryCommentDto[]>([])
    const [loading, setLoading] = useState(true)
    const [applyingTemplateId, setApplyingTemplateId] = useState<number | null>(null)

    const iso = toIsoDate(date)
    const profileId = getDiaryProfileId()

    async function load() {
        if (profileId == null) {
            setDay(null)
            setMealComments([])
            setLoading(false)
            showAlert('Нет профиля дневника. Пройдите онбординг.', 'warning')
            return
        }
        setLoading(true)

        try {
            const [data, comments] = await Promise.all([
                fetchDayMeals(iso, profileId),
                fetchCommentsByType(profileId, 'MEAL'),
            ])
            setDay(data)
            setMealComments(comments)
        } catch (err: unknown) {
            setDay(null)
            setMealComments([])
            showAlert(getErrorMessage(err, 'Не удалось загрузить день'), 'danger')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iso, profileId])

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
            showAlert('Шаблон отмечен', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось отметить шаблон'), 'danger')
        } finally {
            setApplyingTemplateId(null)
        }
    }

    const primary = day?.targets?.find(
        (target) =>
            target.nutrientId === day.primaryNutrient ||
            target.nutrientCode?.toUpperCase() === day.primaryNutrientCode?.toUpperCase(),
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
        (target) =>
            target.nutrientId !== day?.primaryNutrient &&
            target.nutrientCode?.toUpperCase() !== day?.primaryNutrientCode?.toUpperCase(),
    )

    const secondaryItems = secondary.map((target, index) => ({
        key: String(target.nutrientId ?? target.nutrientCode ?? index),
        label: nutrientDisplayName(target),
        value: Math.max(target.factAmount ?? 0, 0),
        unit: nutrientDisplayUnit(target),
        color: PALETTE[index % PALETTE.length],
    }))

    const sections = normalizeSections(day?.sections)

    const showWeight = day?.weightEnabled !== false
    const showSleep = day?.sleepEnabled !== false

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
            </header>

            <div className="diary-content container mt-2">
                {loading && <p className="meal-empty">Загрузка…</p>}

                <div>
                    <h4 className="mb-3">Приёмы пищи</h4>
                    <div className="row g-2">
                        {!loading &&
                            sections.map((section) => (
                                <div className="col-lg-6 col-md-10 col-12" key={section.mealTypeCode}>
                                    <MealSection
                                        mealTypeCode={section.mealTypeCode}
                                        mealTypeId={section.mealTypeId}
                                        mealId={section.mealId}
                                        date={iso}
                                        records={section.records ?? []}
                                        totalPrimaryNutrient={section.totalPrimaryNutrient}
                                        mealPhotoPath={section.photoPath}
                                        comments={mealComments}
                                        primaryUnit={primaryUnit}
                                        templates={pickTemplatesForSection(
                                            day?.pendingTemplates ?? [],
                                            section.mealTypeCode,
                                        )}
                                        applyingTemplateId={applyingTemplateId}
                                        onApplyTemplate={onApplyTemplate}
                                    />
                                </div>
                            ))}
                    </div>
                </div>

                {!loading && (showWeight || showSleep) && (
                    <div className="border-top pt-2">
                        <h4 className="mb-3">Логи</h4>

                        <div className="row g-2">
                            {showWeight && (
                                <div className="col-lg-6 col-md-10 col-12">
                                    <WeightCard weightKg={day?.latestWeight?.weight ?? null} />
                                </div>
                            )}

                            {showSleep && (
                                <div className="col-lg-6 col-md-10 col-12">
                                    <SleepCard
                                        entries={(day?.sleepForDay ?? []).map((s) => ({
                                            id: s.id,
                                            start: s.beganAt,
                                            end: s.endedAt ?? '',
                                        }))}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    )
}
