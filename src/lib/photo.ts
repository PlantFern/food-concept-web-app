import { API_BASE_URL } from "@/config/apiBases";

export function photoPathToUrl(value: string | number | null | undefined): string | null {
    if (value == null) return null;

    const raw = String(value).trim();
    if (!raw) return null;

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw;
    }

    if (raw.startsWith("//")) {
        return `https:${raw}`;
    }

    if (raw.startsWith("/api/")) {
        return `${API_BASE_URL}${raw}`;
    }

    if (/^\d+$/.test(raw)) {
        return `${API_BASE_URL}/api/files/${raw}`;
    }

    const path = raw.startsWith("/") ? raw.slice(1) : raw;
    return `${API_BASE_URL}/api/files/${path}`;
}

export const resolvePhotoUrl = photoPathToUrl;
/** Backward-compatible alias used by the food API modules. */
export const photoUrl = photoPathToUrl;
