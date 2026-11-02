import { http } from '@/api/http.ts'
import { getDiaryProfileId } from '@/api/onboarding.ts'

export type DayNutrientStatDto = {
    nutrientId: number
    nutrientCode: string
    nutrientName?: string | null
    unit?: string | null
    unitCode?: string | null
    targetAmount: number | null
    factAmount: number | null
    remainingAmount: number | null
    percentOfTarget: number | null
}

export type MealFoodRecordItemDto = {
    recordId: number
    servingId: number
    productDescription: string
    amount: number | null
    servingAmount: number | null
    gramWeight: number | null
    servingUnitCode: string | null
    nutrient: number | null
    photoPath?: string | null
}

export type MealSectionDto = {
    mealId: number
    mealTypeId: number
    mealTypeCode: string
    generatedFromTemplateId: number | null
    records: MealFoodRecordItemDto[]
    totalPrimaryNutrient: number | null
    /** Photo of the whole meal (not product thumb) */
    photoPath?: string | null
}

export type MealTemplateListItemDto = {
    id: number
    name: string
    scheduledTime: string | null
    frequency: number | null
    itemCount: number | null
    totalKcal: number | null
}

export type SleepLogDto = {
    id: number
    diaryProfileId: number
    beganAt: string
    endedAt: string | null
}

export type WeightLogDto = {
    id: number
    diaryProfileId: number
    weight: number
}

export type DayMealsDto = {
    date: string
    primaryNutrient: number
    primaryNutrientCode: string
    primaryNutrientName?: string | null
    primaryNutrientUnit?: string | null
    targets: DayNutrientStatDto[]
    sections: MealSectionDto[]
    pendingTemplates: MealTemplateListItemDto[]
    sleepEnabled: boolean
    weightEnabled: boolean
    sleepForDay: SleepLogDto[]
    latestWeight: WeightLogDto | null
}

export function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) {
        throw new Error('Нет diaryProfileId — завершите онбординг')
    }
    return id
}

export async function fetchDayMeals(date: string, diaryProfileId?: number): Promise<DayMealsDto> {
    const id = diaryProfileId ?? requireProfileId()
    const { data } = await http.get<DayMealsDto>(`/api/diary-profile/${id}/meals/day`, {
        params: { date },
    })
    return data
}

export async function applyMealTemplate(
    templateId: number,
    mealTypeId: number,
    mealDate: string,
    diaryProfileId?: number,
): Promise<number> {
    const id = diaryProfileId ?? requireProfileId()
    const body = new URLSearchParams()
    body.set('mealTypeId', String(mealTypeId))
    body.set('mealDate', mealDate)

    const { data } = await http.post<number>(
        `/api/diary-profile/${id}/meals/from-template/${templateId}`,
        body,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    return data
}

export function formatFoodAmount(item: MealFoodRecordItemDto): string {
    const parts: string[] = []
    if (item.amount != null && item.amount !== 1) {
        parts.push(String(item.amount))
    }
    if (item.servingAmount != null) {
        parts.push(String(item.servingAmount))
    }
    if (item.gramWeight != null) {
        parts.push(`${item.gramWeight}г`)
    } else if (item.servingUnitCode) {
        parts.push(item.servingUnitCode)
    }
    return parts.length ? parts.join(' × ') : '—'
}

/** UI labels for meal_types.code — always Russian on the diary screen */
export function mealTypeLabel(code: string | null | undefined): string {
    if (!code) return 'Приём'
    const map: Record<string, string> = {
        BREAKFAST: 'Завтрак',
        LUNCH: 'Обед',
        DINNER: 'Ужин',
        SNACK: 'Перекус',
        BRUNCH: 'Бранч',
        MORNING_SNACK: 'Утренний перекус',
        AFTERNOON_SNACK: 'Дневной перекус',
        LATE_SNACK: 'Поздний перекус',
        OTHER: 'Другое',
        OTHERS: 'Другое',
    }
    return map[code.toUpperCase()] ?? code
}

export function nutrientDisplayName(stat: {
    nutrientName?: string | null
    nutrientCode?: string | null
}): string {
    if (stat.nutrientName && stat.nutrientName.trim()) return stat.nutrientName.trim()
    if (stat.nutrientCode && stat.nutrientCode.trim()) return stat.nutrientCode.trim()
    return 'Нутриент'
}

export function nutrientDisplayUnit(stat: {
    unit?: string | null
    unitCode?: string | null
}): string {
    if (stat.unit && stat.unit.trim()) return stat.unit.trim()
    if (stat.unitCode && stat.unitCode.trim()) return stat.unitCode.trim()
    return ''
}
