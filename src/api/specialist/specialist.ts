import { http } from '@/api/http'

export type SpecialistDto = {
    id: number
    userId: number
    isActive?: boolean | null
    isApproved?: boolean | null
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
