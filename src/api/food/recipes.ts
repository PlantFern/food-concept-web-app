import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'
import { photoUrl } from '@/lib/photo'

export type RecipeListItem = {
    id: number
    name: string
    imageUrl?: string | null
    description?: string | null
}

export type RecipeComponentItem = {
    componentId: number
    productServingId: number
    amount?: number | null
    productDescription?: string | null
    servingUnitCode?: string | null
    gramWeight?: number | null
    nutrient?: number | null
}

export type RecipeServing = {
    id: number
    itemType?: string | null
    itemId?: number | null
    amount?: number | null
    gramWeight?: number | null
    servingUnit?: { id?: number; code?: string; name?: string } | null
    description?: string | null
}

export type RecipeDetail = {
    recipeId: number
    recipeName: string
    recipeDescription?: string | null
    recipeText?: string | null
    photoPath?: string | null
    totalWeightGrams?: number | null
    isFavorite?: boolean | null
    components: RecipeComponentItem[]
    servings?: RecipeServing[] | null
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
                name: String(r.name ?? r.recipeName ?? ''),
                description: (r.description as string) ?? (r.recipeDescription as string) ?? null,
                imageUrl: photoUrl((r.photoPath as string) ?? null),
            }
        })
    } catch {
        return []
    }
}

export async function fetchRecipeDetail(recipeId: number): Promise<RecipeDetail | null> {
    const profileId = getDiaryProfileId()
    if (profileId == null) return null
    try {
        const { data } = await http.get<RecipeDetail>(
            `/api/food/recipes/diary-profile/${profileId}/recipes/${recipeId}`,
        )
        return {
            ...data,
            components: Array.isArray(data.components) ? data.components : [],
        }
    } catch {
        return null
    }
}

export function formatComponentAmount(item: RecipeComponentItem): string {
    const parts: string[] = []
    if (item.amount != null && item.amount !== 1) parts.push(String(item.amount))
    if (item.gramWeight != null) parts.push(`${item.gramWeight}г`)
    else if (item.servingUnitCode) parts.push(item.servingUnitCode)
    return parts.length ? parts.join(' × ') : '—'
}
