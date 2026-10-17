import { API_BASE_FD } from '@/config/apiBases';

export function photoPathToUrl(value: string | number | null | undefined): string | null {
    if (value == null) return null;

    const raw = String(value).trim();
    if (!raw) return null;

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
    }

    if (raw.startsWith('//')) {
        return `https:${raw}`;
    }

    if (raw.startsWith('/api/')) {
        return `${API_BASE_FD}${raw}`;
    }

    if (/^\d+$/.test(raw)) {
        return `${API_BASE_FD}/api/files/${raw}`;
    }

    const path = raw.startsWith('/') ? raw.slice(1) : raw;
    return `${API_BASE_FD}/api/files/${path}`;
}

export const resolvePhotoUrl = photoPathToUrl;
