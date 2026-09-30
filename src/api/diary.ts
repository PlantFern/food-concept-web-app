import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'

export type DayNutrientStatDto = {
    nutrientId: number
    nutrientCode: string
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
}

export type MealSectionDto = {
    mealId: number
    mealTypeId: number
    mealTypeCode: string
    generatedFromTemplateId: number | null
    records: MealFoodRecordItemDto[]
    totalPrimaryNutrient: number | null
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
    targets: DayNutrientStatDto[]
    sections: MealSectionDto[]
    pendingTemplates: MealTemplateListItemDto[]
    sleepEnabled: boolean
    weightEnabled: boolean
    sleepForDay: SleepLogDto[]
    latestWeight: WeightLogDto | null
}

function requireProfileId(): number {
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

export function mealTypeLabel(code: string | null | undefined): string {
    if (!code) return 'Приём'
    const map: Record<string, string> = {
        BREAKFAST: 'Завтрак',
        LUNCH: 'Обед',
        DINNER: 'Ужин',
        SNACK: 'Перекус',
        BRUNCH: 'Бранч',
    }
    return map[code.toUpperCase()] ?? code
}
