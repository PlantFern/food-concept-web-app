import { http } from '@/api/http'

export type UserRelationDto = {
    id: number
    diaryProfileId: number
    specialistId: number
    relationType: string
    relationStatusCode: string
}

function statusCode(r: UserRelationDto): string {
    return String(r.relationStatusCode ?? '').toUpperCase()
}

function relationType(r: UserRelationDto): string {
    return String(r.relationType ?? '').toUpperCase()
}

export function isPendingRelation(r: UserRelationDto): boolean {
    const code = statusCode(r)
    return code === 'PENDING' || code.includes('PENDING')
}

export function isActiveRelation(r: UserRelationDto): boolean {
    const code = statusCode(r)
    return code === 'ACTIVE' || code.includes('ACTIVE')
}

/** Active relation of type SPECIALIST — client cannot edit goals/settings */
export function isSpecialistControlRelation(r: UserRelationDto): boolean {
    return isActiveRelation(r) && relationType(r) === 'SPECIALIST'
}

export async function hasActiveSpecialistControl(diaryProfileId: number): Promise<boolean> {
    try {
        const list = await fetchDiarySpecialistRelations(diaryProfileId)
        return list.some(isSpecialistControlRelation)
    } catch {
        return false
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
    relationType: string = 'SPECIALIST',
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
