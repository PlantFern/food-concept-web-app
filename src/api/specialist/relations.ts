import { http } from '@/api/http'

export type UserRelationDto = {
    id: number
    diaryProfileId: number
    specialistId: number
    relationType: string
    relationStatusCode: string
}

export function isActiveRelation(r: UserRelationDto): boolean {
    const code = String(r.relationStatusCode ?? '').toUpperCase()
    return code === 'ACTIVE' || code.includes('ACTIVE')
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

export async function getRelationById(
    specialistId: number,
    userRelationId: number,
): Promise<UserRelationDto> {
    const { data } = await http.get<UserRelationDto>(
        `/api/specialist/${specialistId}/relations/${userRelationId}`,
    )
    return data
}

export async function activateRelation(
    specialistId: number,
    userRelationId: number,
): Promise<void> {
    await http.post(`/api/specialist/${specialistId}/relations/${userRelationId}/activate`)
}

export async function cancelRelation(
    specialistId: number,
    userRelationId: number,
): Promise<void> {
    await http.post(`/api/specialist/${specialistId}/relations/${userRelationId}/cancel`)
}

export async function endRelation(
    specialistId: number,
    userRelationId: number,
): Promise<void> {
    await http.post(`/api/specialist/${specialistId}/relations/${userRelationId}/end`)
}

export async function fetchDiarySpecialistRelations(
    diaryProfileId: number,
): Promise<UserRelationDto[]> {
    const { data } = await http.get<UserRelationDto[]>(
        `/api/diary-profile/${diaryProfileId}/specialists`,
    )
    return Array.isArray(data) ? data : []
}

export async function initiateSpecialistRelation(
    diaryProfileId: number,
    specialistId: number,
    relationType: string,
): Promise<void> {
    await http.put(
        `/api/diary-profile/${diaryProfileId}/specialists/spacialist/${specialistId}/initiate`,
        null,
        { params: { relationType } },
    )
}

export async function endRelationFromClient(
    diaryProfileId: number,
    userRelationId: number,
): Promise<void> {
    await http.post(`/api/diary-profile/${diaryProfileId}/specialists/end/${userRelationId}`)
}
