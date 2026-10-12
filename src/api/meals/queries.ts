import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'
import type { DayMealsDto } from '@/api/diaryProfile/diary'

function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) throw new Error('Нет diaryProfileId')
    return id
}

export type RecentDayGroup = {
    date: string
    items: Array<{ id: number; name: string; mealTypeCode?: string | null }>
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

export async function fetchRecentWeekFoods(diaryProfileId?: number): Promise<RecentDayGroup[]> {
    const profileId = diaryProfileId ?? getDiaryProfileId()
    if (profileId == null) return []
    try {
        const { data } = await http.get<Array<Record<string, unknown>>>(
            `/api/diary-profile/${profileId}/meals/recent-week`,
        )
        if (!Array.isArray(data)) return []
        return data.map((g) => ({
            date: String(g.date ?? ''),
            items: Array.isArray(g.items)
                ? g.items.map((it) => {
                      const row = it as Record<string, unknown>
                      return {
                          id: Number(row.id),
                          name: String(row.name ?? ''),
                          mealTypeCode: (row.mealTypeCode as string) ?? null,
                      }
                  })
                : [],
        }))
    } catch {
        return []
    }
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

export async function getMealById(mealId: number): Promise<{ id: number }> {
    const profileId = requireProfileId()
    const { data } = await http.get(`/api/diary-profile/${profileId}/meals/${mealId}`)
    return data
}
