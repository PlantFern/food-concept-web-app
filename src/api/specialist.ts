import { http } from '@/api/http'

export type SpecialistDto = {
    id: number
    userId: number
    isActive?: boolean | null
}

export type UserRelationDto = {
    id: number
    diaryProfileId: number
    specialistId: number
    relationType: string
    relationStatusCode: string
}

export async function getMySpecialist(): Promise<SpecialistDto | null> {
    try {
        const { data } = await http.get<SpecialistDto>('/api/specialist/my-profile')
        return data
    } catch {
        return null
    }
}

export async function fetchSpecialistClients(specialistId: number): Promise<UserRelationDto[]> {
    try {
        const { data } = await http.get<UserRelationDto[]>(
            `/api/specialist/${specialistId}/relations`,
        )
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export function isActiveRelation(r: UserRelationDto): boolean {
    const code = String(r.relationStatusCode ?? '').toUpperCase()
    return code === 'ACTIVE' || code.includes('ACTIVE')
}
