import { API_BASE_URE } from '@/config/apiBases'

export function photoPathToUrl(path?: string | null): string | null {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/api/')) return `${API_BASE_URE}${path}`
    if (path.startsWith('/')) return path
    return `${API_BASE_URE}/api/files/${path}`
}
