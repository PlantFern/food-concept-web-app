import { type DiaryProfileDto, persistProfileId } from '@/api/onboarding'
import { http } from '@/api/http'

export async function getMyProfile(): Promise<DiaryProfileDto> {
    const { data } = await http.get<DiaryProfileDto>('/api/diary-profile/my-profile')
    persistProfileId(data)
    return data
}
