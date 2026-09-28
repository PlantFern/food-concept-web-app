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
        console.warn(`[apiBases] Unknown env "${env}, fallback to development": ${env}`);
        return API_BASES[0].baseUrl;
    }
    return entry.baseUrl;
}

export function resolveApiBaseUrl(): string {

    const override = import.meta.env.VITE_APP_ENV?.trim();

    if (override)
        return override.replace(/\/$/, '')

    const env = (import.meta.env.VITE_APP_ENV as AppEnvironment) || 'development';
    return getBaseUrlByEnv(env);
}

export const API_BASE_URE = resolveApiBaseUrl();