import { http } from '@/api/http'

export type SpecialistDto = {
    id: number
    userId: number
    isActive?: boolean | null
    isApproved?: boolean | null
}

export type SpecialistSearchItemDto = {
    id: number
    userId: number
    isActive?: boolean | null
    email?: string | null
    login?: string | null
}

export async function getMySpecialist(): Promise<SpecialistDto | null> {
    try {
        const { data } = await http.get<SpecialistDto>('/api/specialist/my-profile')
        return data
    } catch {
        return null
    }
}

export async function getSpecialistById(id: number): Promise<SpecialistDto> {
    const { data } = await http.get<SpecialistDto>(`/api/specialist/${id}`)
    return data
}

export async function searchSpecialists(query: string): Promise<SpecialistSearchItemDto[]> {
    const { data } = await http.get<SpecialistSearchItemDto[]>('/api/specialists/search', {
        params: { query },
    })
    return Array.isArray(data) ? data : []
}

export async function listSpecialists(): Promise<SpecialistDto[]> {
    const { data } = await http.get<SpecialistDto[]>('/api/specialists')
    return Array.isArray(data) ? data : []
}
