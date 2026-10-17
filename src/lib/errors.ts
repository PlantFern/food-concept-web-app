export function getErrorStatus(err: unknown): number | null {
    if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number } }).response
        return response?.status ?? null
    }
    return null
}

export function getErrorMessage(err: unknown, fallback = 'Произошла ошибка'): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const data = (err as { response?: { data?: unknown } }).response?.data as
            | {
                  message?: string
                  detail?: string
                  title?: string
                  errors?: Array<{ defaultMessage?: string; field?: string; message?: string }>
              }
            | string
            | undefined

        if (typeof data === 'string' && data.trim()) return data

        if (data && typeof data === 'object') {
            if (Array.isArray(data.errors) && data.errors.length > 0) {
                return data.errors
                    .map((e) => e.defaultMessage || e.message || e.field)
                    .filter(Boolean)
                    .join('; ')
            }
            if (typeof data.message === 'string' && data.message && data.message !== 'Validation failed') {
                return data.message
            }
            if (typeof data.detail === 'string' && data.detail) return data.detail
            if (typeof data.message === 'string' && data.message) return data.message
            if (typeof data.title === 'string' && data.title) return data.title
        }
    }
    if (err instanceof Error && err.message) return err.message
    return fallback
}
