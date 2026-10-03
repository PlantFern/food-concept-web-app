import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'

export type ProfileFeatureSettingsDto = {
    id: number
    diaryProfileId: number
    showSleep: boolean | null
    showSleepLogs: boolean | null
    showWeight: boolean | null
    showWeightLogs: boolean | null
    showAllergensWarning: boolean | null
    createdById?: number | null
    createdAt?: string | null
    expiredAt?: string | null
    hiddenNutrientIds: number[] | null
}

export type ProfileFeatureSettingsPayload = {
    showSleep: boolean
    showSleepLogs: boolean
    showWeight: boolean
    showWeightLogs: boolean
    showAllergensWarning: boolean
    hiddenNutrients: number[]
}

function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) throw new Error('Нет diaryProfileId')
    return id
}

export async function fetchLatestSettings(): Promise<ProfileFeatureSettingsDto | null> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return null
    try {
        const { data } = await http.get<ProfileFeatureSettingsDto>(
            `/api/diary-profile/feature-settings/diary-profile/${profileId}/latest`,
        )
        return data
    } catch {
        return null
    }
}

export async function createSettings(
    payload: ProfileFeatureSettingsPayload,
): Promise<ProfileFeatureSettingsDto> {
    const profileId = requireProfileId()
    const { data } = await http.post<ProfileFeatureSettingsDto>(
        `/api/diary-profile/feature-settings/${profileId}`,
        payload,
    )
    return data
}

export async function updateSettings(
    settingsId: number,
    payload: ProfileFeatureSettingsPayload,
): Promise<ProfileFeatureSettingsDto> {
    const { data } = await http.put<ProfileFeatureSettingsDto>(
        `/api/diary-profile/feature-settings/settings/${settingsId}`,
        payload,
    )
    return data
}

export async function saveSettings(
    current: ProfileFeatureSettingsDto | null,
    payload: ProfileFeatureSettingsPayload,
): Promise<ProfileFeatureSettingsDto> {
    if (current?.id) {
        return updateSettings(current.id, payload)
    }
    return createSettings(payload)
}
