import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'

export type GoalNutrientDto = {
    id?: number
    nutrientId: number
    amount: number
}

export type GoalDto = {
    id: number
    diaryProfileId: number
    plannedWeight?: number | null
    startDate?: string | null
    actualEndDate?: string | null
    plannedEndDate?: string | null
    createdById?: number | null
    nutrientSet?: GoalNutrientDto[] | null
}

export type GoalPayload = {
    plannedWeight: number | null
    startDate: string
    plannedEndDate: string | null
    nutrientGoals: Array<{ nutrientId: number; amount: number }>
}

function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) throw new Error('Нет diaryProfileId')
    return id
}

export async function fetchActiveGoal(): Promise<GoalDto | null> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return null
    try {
        const { data } = await http.get<GoalDto>(
            `/api/diary-profile/goal/diary-profile/${profileId}/active`,
        )
        return data
    } catch {
        return null
    }
}

export async function createGoal(payload: GoalPayload): Promise<GoalDto> {
    const profileId = requireProfileId()
    const { data } = await http.post<GoalDto>(
        `/api/diary-profile/goal/${profileId}`,
        payload,
    )
    return data
}

export async function updateGoal(goalId: number, payload: GoalPayload): Promise<GoalDto> {
    const { data } = await http.put<GoalDto>(
        `/api/diary-profile/goal/goals/${goalId}`,
        payload,
    )
    return data
}

export async function completeGoal(goalId: number): Promise<void> {
    await http.delete(`/api/diary-profile/goal/goals/${goalId}`)
}
