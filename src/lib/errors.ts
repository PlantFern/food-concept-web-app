export function getErrorStatus(err: unknown): number | null {
    if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number } }).response
        return response?.status ?? null
    }
    return null
}

export function getErrorMessage(err: unknown, fallback = 'Произошла ошибка'): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const data = (err as { response?: { data?: { message?: string } } }).response?.data
        if (typeof data?.message === 'string' && data.message) return data.message
    }
    if (err instanceof Error && err.message) return err.message
    return fallback
}
