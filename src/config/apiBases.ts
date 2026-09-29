export type AppEnvironment = "development" | "production";

export interface ApiBaseEntry {

    env: AppEnvironment
    baseUrl: string
}

export const API_BASES: readonly ApiBaseEntry[] = [
    {
        env: 'development',
        baseUrl: 'http://localhost:8080/',
    }
] as const

export function getBaseUrlByEnv(env: AppEnvironment): string {

    const entry = API_BASES.find(entry => entry.env === env);
    if (!entry) {
        console.warn(`[apiBases] Unknown env "${env}", fallback to development`);
        return API_BASES[0].baseUrl;
    }
    return entry.baseUrl;
}

export function resolveApiBaseUrl(): string {
    // Explicit backend URL (preferred)
    const fromUrl = import.meta.env.VITE_API_BASE_URL?.trim()
    if (fromUrl) {
        return fromUrl.replace(/\/$/, '')
    }

    // Env name → lookup in API_BASES (not the string "development" as URL)
    const env = (import.meta.env.VITE_APP_ENV as AppEnvironment) || 'development'
    return getBaseUrlByEnv(env).replace(/\/$/, '')
}

export const API_BASE_URE = resolveApiBaseUrl();
