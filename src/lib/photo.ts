import { API_BASE_URE } from '@/config/apiBases'

/**
 * Builds a full URL for a photo path or file id.
 * Accepts absolute URLs, /api/... paths, bare paths, or numeric file ids.
 */
export function photoUrl(path?: string | null): string | null {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/api/')) return `${API_BASE_URE}${path}`
    if (path.startsWith('/')) return `${API_BASE_URE}${path}`
    if (/^\d+$/.test(path)) return `${API_BASE_URE}/api/files/${path}`
    return `${API_BASE_URE}/api/files/${path}`
}

/** Alias used by pages */
export const photoPathToUrl = photoUrl
