import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'
import { API_BASE_URE } from '@/config/apiBases'

export type ProductListItem = {
    id: number
    name: string
    brand?: string | null
    imageUrl?: string | null
    categoryCode?: string | null
    isFavorite?: boolean | null
}

export type RecipeListItem = {
    id: number
    name: string
    imageUrl?: string | null
    description?: string | null
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

export type FoodServingDto = {
    id: number
    itemType?: string | null
    itemId?: number | null
    amount: number | null
    gramWeight: number | null
    servingUnit?: { id?: number; code?: string; name?: string } | null
    description?: string | null
}

export type ProductDetail = {
    productId: number
    productCode?: string | null
    productDescription: string
    photoPath?: string | null
    categoryCode?: string | null
    isFavorite?: boolean | null
    servings: FoodServingDto[]
}

export type AddFoodRecordPayload = {
    mealId?: number | null
    mealTypeId: number
    servingId: number
    amount: number
    date: string
    eatenAt: string
}

function photoUrl(path?: string | null): string | null {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
        if (path.startsWith('/api/')) return `${API_BASE_URE}${path}`
        return path
    }
    return `${API_BASE_URE}/api/files/${path}`
}

function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) throw new Error('Нет diaryProfileId')
    return id
}

export async function searchProducts(query: string): Promise<ProductListItem[]> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return []
    try {
        const { data } = await http.get<{ content?: unknown[] } | unknown[]>(
            `/api/food/products/diary-profile/${profileId}`,
            {
                params: {
                    query: query || undefined,
                    size: 40,
                },
            },
        )
        const rows = Array.isArray(data) ? data : (data as { content?: unknown[] }).content ?? []
        return rows.map((raw) => {
            const r = raw as Record<string, unknown>
            return {
                id: Number(r.productId),
                name: String(r.productDescription ?? r.name ?? ''),
                brand: (r.dataSourceCode as string) ?? null,
                imageUrl: photoUrl((r.photoPath as string) ?? null),
                categoryCode: (r.categoryCode as string) ?? null,
                isFavorite: (r.isFavorite as boolean) ?? null,
            }
        })
    } catch {
        return []
    }
}

export async function searchRecipes(query: string): Promise<RecipeListItem[]> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return []
    try {
        const { data } = await http.get<unknown[]>(
            `/api/food/recipes/diary-profile/${profileId}`,
            { params: { query: query || undefined } },
        )
        const rows = Array.isArray(data) ? data : []
        return rows.map((raw) => {
            const r = raw as Record<string, unknown>
            return {
                id: Number(r.recipeId),
                name: String(r.name ?? ''),
                description: (r.description as string) ?? null,
                imageUrl: photoUrl((r.photoPath as string) ?? null),
            }
        })
    } catch {
        return []
    }
}

export async function fetchProductDetail(productId: number): Promise<ProductDetail | null> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return null
    try {
        const { data } = await http.get<ProductDetail>(
            `/api/food/products/diary-profile/${profileId}/products/${productId}`,
        )
        return data
    } catch {
        return null
    }
}

export async function addFoodRecord(payload: AddFoodRecordPayload): Promise<number> {
    const profileId = requireProfileId()
    const { data } = await http.post<number>(
        `/api/diary-profile/${profileId}/food-records/`,
        {
            mealId: payload.mealId ?? null,
            mealTypeId: payload.mealTypeId,
            servingId: payload.servingId,
            amount: payload.amount,
            date: payload.date,
            eatenAt: payload.eatenAt,
        },
    )
    return data
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
