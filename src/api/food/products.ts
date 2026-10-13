import { http } from '@/api/http'
import { getDiaryProfileId } from '@/api/onboarding'
import { photoUrl } from '@/lib/photo'

export type ProductListItem = {
    id: number
    name: string
    brand?: string | null
    imageUrl?: string | null
    categoryCode?: string | null
    isFavorite?: boolean | null
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

export type ProductPage = {
    items: ProductListItem[]
    page: number
    size: number
    totalPages: number
    totalElements: number
    last: boolean
}

function mapProduct(raw: unknown): ProductListItem {
    const r = raw as Record<string, unknown>
    return {
        id: Number(r.productId),
        name: String(r.productDescription ?? r.name ?? ''),
        brand: (r.dataSourceCode as string) ?? null,
        imageUrl: photoUrl((r.photoPath as string) ?? null),
        categoryCode: (r.categoryCode as string) ?? null,
        isFavorite: (r.isFavorite as boolean) ?? null,
    }
}

export async function searchProductsPage(
    query: string,
    page = 0,
    size = 12,
): Promise<ProductPage> {
    const profileId = getDiaryProfileId()
    if (profileId == null) {
        return { items: [], page: 0, size, totalPages: 0, totalElements: 0, last: true }
    }
    try {
        const { data } = await http.get<Record<string, unknown>>(
            `/api/food/products/diary-profile/${profileId}`,
            { params: { query: query || undefined, page, size } },
        )
        const content = Array.isArray(data)
            ? data
            : Array.isArray(data.content)
              ? data.content
              : []
        return {
            items: content.map(mapProduct),
            page: Number(data.number ?? page),
            size: Number(data.size ?? size),
            totalPages: Number(data.totalPages ?? 1),
            totalElements: Number(data.totalElements ?? content.length),
            last: Boolean(data.last ?? true),
        }
    } catch {
        return { items: [], page: 0, size, totalPages: 0, totalElements: 0, last: true }
    }
}

export async function searchProducts(query: string): Promise<ProductListItem[]> {
    const page = await searchProductsPage(query, 0, 40)
    return page.items
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

export async function uploadProductPhoto(productId: number, file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await http.patch<string>(
        `/api/food/products/${productId}/photo`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
}
