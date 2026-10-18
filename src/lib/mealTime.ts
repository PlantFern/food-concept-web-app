/** Hour ranges [startHour inclusive, endHour exclusive] matching DiaryHomePage. */
export const MEAL_TYPE_HOUR_WINDOWS: Record<string, [number, number]> = {
    BREAKFAST: [5, 11],
    LUNCH: [11, 16],
    SNACK: [15, 18],
    DINNER: [17, 23],
}

export const MEAL_TYPES = [
    { id: 1, code: 'BREAKFAST', label: 'Завтрак' },
    { id: 2, code: 'LUNCH', label: 'Обед' },
    { id: 3, code: 'SNACK', label: 'Перекус' },
    { id: 4, code: 'DINNER', label: 'Ужин' },
    { id: 5, code: 'OTHER', label: 'Другое' },
] as const

export type MealTypeCode = (typeof MEAL_TYPES)[number]['code']

export function mealTypeCodeById(id: number): string {
    return MEAL_TYPES.find((t) => t.id === id)?.code ?? 'OTHER'
}

export function todayIso(): string {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

export function nowTime(): string {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function pad2(n: number): string {
    return String(n).padStart(2, '0')
}

function minutesOf(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
}

function fromMinutes(total: number): string {
    const h = Math.floor(total / 60) % 24
    const m = total % 60
    return `${pad2(h)}:${pad2(m)}`
}

/**
 * Default eatenAt for a meal type.
 * - OTHER (or unknown): current time
 * - known type: if now is inside [start, end) keep now;
 *   if before window → start; if after → end - 1 minute
 */
export function defaultEatenAtForMealType(
    mealTypeIdOrCode: number | string,
    now: Date = new Date(),
): string {
    const code =
        typeof mealTypeIdOrCode === 'number'
            ? mealTypeCodeById(mealTypeIdOrCode)
            : String(mealTypeIdOrCode).toUpperCase()

    const current = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`

    if (code === 'OTHER' || !(code in MEAL_TYPE_HOUR_WINDOWS)) {
        return current
    }

    const [startH, endH] = MEAL_TYPE_HOUR_WINDOWS[code]
    const startMin = startH * 60
    const endMin = endH * 60 // exclusive
    const nowMin = now.getHours() * 60 + now.getMinutes()

    if (nowMin >= startMin && nowMin < endMin) {
        return current
    }
    if (nowMin < startMin) {
        return fromMinutes(startMin)
    }
    // after window → last allowed minute
    return fromMinutes(Math.max(startMin, endMin - 1))
}

/** Clamp a user-picked time into the meal type window (OTHER = no clamp). */
export function clampEatenAtToMealType(
    eatenAt: string,
    mealTypeIdOrCode: number | string,
): string {
    const code =
        typeof mealTypeIdOrCode === 'number'
            ? mealTypeCodeById(mealTypeIdOrCode)
            : String(mealTypeIdOrCode).toUpperCase()

    if (code === 'OTHER' || !(code in MEAL_TYPE_HOUR_WINDOWS)) {
        return eatenAt.length >= 5 ? eatenAt.slice(0, 5) : eatenAt
    }

    const [startH, endH] = MEAL_TYPE_HOUR_WINDOWS[code]
    const startMin = startH * 60
    const endMin = endH * 60
    const t = minutesOf(eatenAt.length >= 5 ? eatenAt.slice(0, 5) : eatenAt)

    if (t < startMin) return fromMinutes(startMin)
    if (t >= endMin) return fromMinutes(Math.max(startMin, endMin - 1))
    return fromMinutes(t)
}
