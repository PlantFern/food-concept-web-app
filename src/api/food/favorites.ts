import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'

function requireProfileId(): number {
    const id = getDiaryProfileId()
    if (id == null) throw new Error('Нет diaryProfileId')
    return id
}

export async function addFavoriteProduct(productId: number, diaryProfileId?: number): Promise<void> {
    const id = diaryProfileId ?? requireProfileId()
    await http.post(`/api/food/diary-profile/${id}/favorites/products/${productId}`)
}

export async function removeFavoriteProduct(productId: number, diaryProfileId?: number): Promise<void> {
    const id = diaryProfileId ?? requireProfileId()
    await http.delete(`/api/food/diary-profile/${id}/favorites/products/${productId}`)
}

export async function isProductFavorite(productId: number, diaryProfileId?: number): Promise<boolean> {
    const id = diaryProfileId ?? requireProfileId()
    const { data } = await http.get<boolean>(`/api/food/diary-profile/${id}/favorites/products/${productId}`)
    return Boolean(data)
}

export async function listFavoriteProducts(diaryProfileId?: number): Promise<number[]> {
    const id = diaryProfileId ?? requireProfileId()
    const { data } = await http.get<number[]>(`/api/food/diary-profile/${id}/favorites/products`)
    return Array.isArray(data) ? data : []
}

export async function addFavoriteRecipe(recipeId: number, diaryProfileId?: number): Promise<void> {
    const id = diaryProfileId ?? requireProfileId()
    await http.post(`/api/food/diary-profile/${id}/favorites/recipes/${recipeId}`)
}

export async function removeFavoriteRecipe(recipeId: number, diaryProfileId?: number): Promise<void> {
    const id = diaryProfileId ?? requireProfileId()
    await http.delete(`/api/food/diary-profile/${id}/favorites/recipes/${recipeId}`)
}

export async function isRecipeFavorite(recipeId: number, diaryProfileId?: number): Promise<boolean> {
    const id = diaryProfileId ?? requireProfileId()
    const { data } = await http.get<boolean>(`/api/food/diary-profile/${id}/favorites/recipes/${recipeId}`)
    return Boolean(data)
}

export async function listFavoriteRecipes(diaryProfileId?: number): Promise<number[]> {
    const id = diaryProfileId ?? requireProfileId()
    const { data } = await http.get<number[]>(`/api/food/diary-profile/${id}/favorites/recipes`)
    return Array.isArray(data) ? data : []
}
