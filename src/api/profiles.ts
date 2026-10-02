import { type DiaryProfileDto, persistProfileId } from '@/api/onboarding'
import { http } from '@/api/http'

export type SpecialistDto = {
    id: number
    userId: number
    isActive?: boolean | null
}

export type UserProfileDto = {
    id: number
    email: string
    login?: string | null
}

export async function getMyProfile(): Promise<DiaryProfileDto> {
    const { data } = await http.get<DiaryProfileDto>('/api/diary-profile/my-profile')
    persistProfileId(data)
    return data
}

export async function getMySpecialistProfile(): Promise<SpecialistDto> {
    const { data } = await http.get<SpecialistDto>('/api/specialist/my-profile')
    return data
}

export async function getMyUserProfile(): Promise<UserProfileDto | null> {
    try {
        const { data } = await http.get<UserProfileDto>('/api/users/my-profile')
        return data
    } catch {
        return null
    }
}

export async function checkDiaryProfileExists(): Promise<boolean> {
    try {
        await getMyProfile()
        return true
    } catch {
        return false
    }
}

export async function checkSpecialistExists(): Promise<boolean> {
    try {
        await getMySpecialistProfile()
        return true
    } catch {
        return false
    }
}
