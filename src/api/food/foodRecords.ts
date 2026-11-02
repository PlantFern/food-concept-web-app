import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'

function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) throw new Error('Нет diaryProfileId')
    return id
}

export type AddFoodRecordPayload = {
    mealId?: number | null
    mealTypeId: number
    servingId: number
    amount: number
    date: string
    eatenAt: string
}

export type QuickProductPayload = {
    mealId?: number | null
    mealTypeId: number
    date: string
    eatenAt: string
    amount: number
    description: string
    gramWeight: number
    /** Backend expects Map<Long, Float> — object keyed by nutrientId */
    nutrients: Record<string, number>
}

export type FoodRecordDto = {
    id: number
    mealId: number
    mealTypeId?: number | null
    mealDate?: string | null
    servingId: number
    productDescription?: string | null
    servingAmount?: number | null
    gramWeight?: number | null
    servingUnitCode?: string | null
    amount: number | null
    eatenAt: string | null
}

export async function addFoodRecord(payload: AddFoodRecordPayload): Promise<number> {
    const profileId = requireProfileId()
    const { data } = await http.post<number>(`/api/diary-profile/${profileId}/food-records/`, {
        mealId: payload.mealId ?? null,
        mealTypeId: payload.mealTypeId,
        servingId: payload.servingId,
        amount: payload.amount,
        date: payload.date,
        eatenAt: payload.eatenAt,
    })
    return data
}

export async function addQuickProductRecord(payload: QuickProductPayload): Promise<number> {
    const profileId = requireProfileId()
    const { data } = await http.post<number>(
        `/api/diary-profile/${profileId}/food-records/quick-product`,
        {
            mealId: payload.mealId ?? null,
            mealTypeId: payload.mealTypeId,
            date: payload.date,
            eatenAt: payload.eatenAt,
            amount: payload.amount,
            description: payload.description,
            gramWeight: payload.gramWeight,
            nutrients: payload.nutrients,
        },
    )
    return data
}

export async function getFoodRecord(recordId: number): Promise<FoodRecordDto> {
    const profileId = requireProfileId()
    const { data } = await http.get<FoodRecordDto>(
        `/api/diary-profile/${profileId}/food-records/${recordId}`,
    )
    return data
}

export async function updateFoodRecord(
    recordId: number,
    amount?: number,
    eatenAt?: string,
): Promise<void> {
    const profileId = requireProfileId()
    await http.put(`/api/diary-profile/${profileId}/food-records/${recordId}`, null, {
        params: { amount, eatenAt },
    })
}

export async function deleteFoodRecord(recordId: number): Promise<void> {
    const profileId = requireProfileId()
    await http.delete(`/api/diary-profile/${profileId}/food-records/${recordId}`)
}

export async function uploadMealPhoto(mealId: number, file: File): Promise<string> {
    const profileId = requireProfileId()
    const form = new FormData()
    form.append('file', file)
    const { data } = await http.patch<string>(
        `/api/diary-profile/${profileId}/meals/${mealId}/photo`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
}
