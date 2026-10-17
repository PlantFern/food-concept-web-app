import { API_BASE_URE } from '@/config/apiBases'

/**
 * Builds a browser-usable URL for a photo value from the API.
 *
 * Supported:
 * - absolute http(s) URLs — returned as-is (seed/CDN photos)
 * - protocol-relative //cdn... — upgraded to https:
 * - /api/files/... or other /api/... paths — prefixed with API base
 * - pure numeric id — /api/files/{id}
 * - bare filename / relative path — /api/files/{path}
 */
export function photoUrl(path?: string | null): string | null {
    if (!path) return null
    const v = path.trim()
    if (!v) return null

    if (v.startsWith('http://') || v.startsWith('https://')) return v
    // protocol-relative CDN URLs
    if (v.startsWith('//')) return `https:${v}`

    if (v.startsWith('/api/')) return `${API_BASE_URE}${v}`
    if (v.startsWith('/')) return `${API_BASE_URE}${v}`
    if (/^\d+$/.test(v)) return `${API_BASE_URE}/api/files/${v}`
    return `${API_BASE_URE}/api/files/${v}`
}

/** Alias used by pages */
export const photoPathToUrl = photoUrl
