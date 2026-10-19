import { http } from '@/api/http'
import type { DiaryProfileDto } from '@/api/diaryProfile/diary'
import type { GoalDto } from '@/api/diaryProfile/goals'
import type { SleepLogDto, WeightLogDto } from '@/api/diaryProfile/diary'
import type { DiaryCommentDto, CommentType } from '@/api/diaryProfile/comments'
import type { ProfileFeatureSettingsDto, ProfileFeatureSettingsPayload } from '@/api/diaryProfile/settings'

export async function getClientProfile(diaryProfileId: number): Promise<DiaryProfileDto> {
    const { data } = await http.get<DiaryProfileDto>(`/api/specialist/profile/${diaryProfileId}`)
    return data
}

export async function getClientLatestGoal(diaryProfileId: number): Promise<GoalDto | null> {
    try {
        const { data } = await http.get<GoalDto>(`/api/specialist/goal/diary-profile/${diaryProfileId}/latest`)
        return data
    } catch {
        return null
    }
}

export async function getClientActiveGoal(diaryProfileId: number): Promise<GoalDto | null> {
    try {
        const { data } = await http.get<GoalDto>(`/api/specialist/goal/diary-profile/${diaryProfileId}/active`)
        return data
    } catch {
        return null
    }
}

export async function createClientGoal(
    diaryProfileId: number,
    payload: {
        plannedWeight?: number | null
        startDate: string
        plannedEndDate?: string | null
        nutrientGoals: Array<{ nutrientId: number; amount: number }>
    },
): Promise<GoalDto> {
    const { data } = await http.post<GoalDto>(`/api/specialist/goal/${diaryProfileId}`, payload)
    return data
}

export async function updateClientGoal(
    goalId: number,
    payload: {
        plannedWeight?: number | null
        startDate: string
        plannedEndDate?: string | null
        nutrientGoals: Array<{ nutrientId: number; amount: number }>
    },
): Promise<GoalDto> {
    const { data } = await http.put<GoalDto>(`/api/specialist/goal/goals/${goalId}`, payload)
    return data
}

export async function deleteClientGoal(goalId: number): Promise<void> {
    await http.delete(`/api/specialist/goal/goals/${goalId}`)
}

export async function getClientSleepByDay(
    diaryProfileId: number,
    date: string,
): Promise<SleepLogDto[]> {
    const { data } = await http.get<SleepLogDto[]>(
        `/api/specialist/log/diary-profile/${diaryProfileId}/${date}`,
    )
    return Array.isArray(data) ? data : []
}

export async function getClientSleepByPeriod(
    diaryProfileId: number,
    startPeriod: string,
    endPeriod: string,
): Promise<SleepLogDto[]> {
    const { data } = await http.get<SleepLogDto[]>(
        `/api/specialist/log/diary-profile/${diaryProfileId}/for-a-period`,
        { params: { startPeriod, endPeriod } },
    )
    return Array.isArray(data) ? data : []
}

export async function getClientWeights(diaryProfileId: number): Promise<WeightLogDto[]> {
    const { data } = await http.get<WeightLogDto[]>(
        `/api/specialist/log/diary-profile/${diaryProfileId}/get-all`,
    )
    return Array.isArray(data) ? data : []
}

export async function getClientLatestWeight(diaryProfileId: number): Promise<WeightLogDto | null> {
    try {
        const { data } = await http.get<WeightLogDto>(
            `/api/specialist/log/diary-profile/${diaryProfileId}/get-latest`,
        )
        return data
    } catch {
        return null
    }
}

export async function getClientWeightByPeriod(
    diaryProfileId: number,
    startPeriod: string,
    endPeriod: string,
): Promise<WeightLogDto[]> {
    const { data } = await http.get<WeightLogDto[]>(
        `/api/specialist/log/diary-profile/${diaryProfileId}/get-by-period`,
        { params: { startPeriod, endPeriod } },
    )
    return Array.isArray(data) ? data : []
}

export async function getClientLatestSettings(diaryProfileId: number): Promise<ProfileFeatureSettingsDto | null> {
    try {
        const { data } = await http.get<ProfileFeatureSettingsDto>(`/api/specialist/profile-settings/diary-profile/${diaryProfileId}/latest`)
        return data
    } catch {
        return null
    }
}

export async function saveClientSettings(diaryProfileId: number, _current: ProfileFeatureSettingsDto | null, payload: ProfileFeatureSettingsPayload): Promise<ProfileFeatureSettingsDto> {
    // Always POST: versioned settings. Specialist is often not the author of the previous row.
    const { data } = await http.post<ProfileFeatureSettingsDto>(
        `/api/specialist/profile-settings/${diaryProfileId}`,
        payload,
    )
    return data
}

export async function createClientComment(diaryProfileId: number, payload: { commentableType: CommentType; commentableId: number; body: string }): Promise<DiaryCommentDto> {
    const { data } = await http.post<DiaryCommentDto>(`/api/specialist/comment/${diaryProfileId}`, null, { params: payload })
    return data
}

export async function getClientCommentsByType(
    diaryProfileId: number,
    commentType: string,
): Promise<DiaryCommentDto[]> {
    try {
        const { data } = await http.get<DiaryCommentDto[]>(
            `/api/specialist/comment/diary-profile/${diaryProfileId}/get-by-comment-type`,
            { params: { commentType } },
        )
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}
