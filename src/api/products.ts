import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'

export type ProductListItem = {
    id: number
    name: string
    brand?: string | null
    imageUrl?: string | null
}

export type RecipeListItem = {
    id: number
    name: string
    imageUrl?: string | null
}

export type TemplateListItem = {
    id: number
    name: string
    scheduledTime?: string | null
}

export type RecentDayGroup = {
    date: string
    items: Array<{ id: number; name: string; mealTypeCode?: string | null }>
}

export async function searchProducts(query: string): Promise<ProductListItem[]> {
    try {
        const { data } = await http.get<ProductListItem[]>('/api/food/products', {
            params: { q: query || undefined },
        })
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export async function searchRecipes(query: string): Promise<RecipeListItem[]> {
    try {
        const { data } = await http.get<RecipeListItem[]>('/api/food/recipes', {
            params: { q: query || undefined },
        })
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export async function fetchTemplates(): Promise<TemplateListItem[]> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return []
    try {
        const { data } = await http.get<TemplateListItem[]>(
            `/api/diary-profile/${profileId}/meal-templates`,
        )
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export async function fetchRecentWeekFoods(): Promise<RecentDayGroup[]> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return []
    try {
        const { data } = await http.get<RecentDayGroup[]>(
            `/api/diary-profile/${profileId}/meals/recent-week`,
        )
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}
