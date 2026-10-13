import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'
import { photoUrl } from '@/lib/photo'

export type RecipeListItem = {
    id: number
    name: string
    imageUrl?: string | null
    description?: string | null
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
