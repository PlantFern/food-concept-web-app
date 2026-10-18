import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'

function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) throw new Error('Нет diaryProfileId')
    return id
}

export type TemplateListItem = {
    id: number
    name: string
    scheduledTime?: string | null
    frequency?: number | null
    itemCount?: number | null
    totalKcal?: number | null
}

export type TemplateRecordItem = {
    id: number
    servingId: number
    productDescription?: string | null
    amount?: number | null
    servingAmount?: number | null
    gramWeight?: number | null
    servingUnitCode?: string | null
    nutrient?: number | null
    photoPath?: string | null
}

/** Alias used by template form pages */
export type TemplateFoodRecordItem = TemplateRecordItem

export type MealTemplateDetail = {
    id: number
    diaryProfileId?: number
    name: string
    scheduledTime?: string | null
    frequency?: number | null
    startedAt?: string | null
    records?: TemplateRecordItem[] | null
}

export async function fetchTemplates(diaryProfileId?: number): Promise<TemplateListItem[]> {
    const profileId = diaryProfileId ?? getDiaryProfileId()
    if (profileId == null) return []
    try {
        const { data } = await http.get<TemplateListItem[]>(
            `/api/diary-profile/${profileId}/meal-templates`,
        )
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export async function getMealTemplate(templateId: number): Promise<MealTemplateDetail> {
    const profileId = requireProfileId()
    const { data } = await http.get<MealTemplateDetail>(
        `/api/diary-profile/${profileId}/meal-templates/${templateId}`,
    )
    return data
}

export async function createMealTemplate(
    name: string,
    scheduledTime: string,
    frequency: number,
    startedAt: string,
    diaryProfileId?: number,
): Promise<number> {
    const profileId = diaryProfileId ?? requireProfileId()
    const { data } = await http.post<number>(
        `/api/diary-profile/${profileId}/meal-templates`,
        null,
        { params: { name, scheduledTime, frequency, startedAt } },
    )
    return data
}

export async function updateMealTemplate(
    templateId: number,
    name: string,
    scheduledTime: string,
    frequency: number,
    startedAt: string,
    diaryProfileId?: number,
): Promise<void> {
    const profileId = diaryProfileId ?? requireProfileId()
    await http.put(`/api/diary-profile/${profileId}/meal-templates/${templateId}`, null, {
        params: { name, scheduledTime, frequency, startedAt },
    })
}

export async function deleteMealTemplate(
    templateId: number,
    diaryProfileId?: number,
): Promise<void> {
    const profileId = diaryProfileId ?? requireProfileId()
    await http.delete(`/api/diary-profile/${profileId}/meal-templates/${templateId}`)
}

export async function addTemplateRecord(
    templateId: number,
    servingId: number,
    amount: number,
    diaryProfileId?: number,
): Promise<number> {
    const profileId = diaryProfileId ?? requireProfileId()
    const { data } = await http.post<number>(
        `/api/diary-profile/${profileId}/meal-templates/${templateId}/records`,
        null,
        { params: { servingId, amount } },
    )
    return data
}

export async function updateTemplateRecord(
    templateRecordId: number,
    amount: number,
    diaryProfileId?: number,
): Promise<void> {
    const profileId = diaryProfileId ?? requireProfileId()
    await http.put(
        `/api/diary-profile/${profileId}/meal-templates/records/${templateRecordId}`,
        null,
        { params: { amount } },
    )
}

export async function deleteTemplateRecord(
    templateRecordId: number,
    diaryProfileId?: number,
): Promise<void> {
    const profileId = diaryProfileId ?? requireProfileId()
    await http.delete(
        `/api/diary-profile/${profileId}/meal-templates/records/${templateRecordId}`,
    )
}

/** Human-readable amount for a template line item */
export function formatTemplateAmount(item: TemplateRecordItem): string {
    if (item.amount != null && item.servingUnitCode) {
        return `${item.amount} ${item.servingUnitCode}`
    }
    if (item.servingAmount != null && item.servingUnitCode) {
        return `${item.servingAmount} ${item.servingUnitCode}`
    }
    if (item.gramWeight != null) {
        return `${item.gramWeight} г`
    }
    if (item.amount != null) {
        return String(item.amount)
    }
    return '—'
}
