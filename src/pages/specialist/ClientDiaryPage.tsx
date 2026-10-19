import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi2'
import { SpecialistBottomNav } from '@/components/specialist/SpecialistBottomNav'
import { DateNav } from '@/components/diary'
import {
    getClientActiveGoal,
    getClientLatestWeight,
    getClientSleepByDay,
} from '@/api/specialist'
import { fetchDayMeals, type DayMealsDto } from '@/api/diaryProfile/diary'
import { getClientProfile } from '@/api/specialist/client'
import type { DiaryProfileDto } from '@/api/diaryProfile/diary'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { http } from '@/api/http'

function toIsoDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function parseIsoDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function ClientDiaryPage() {
    const { diaryProfileId: idParam } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const { showAlert } = useAlert()

    const diaryProfileId = Number(idParam)
    const dateParam = searchParams.get('date') || toIsoDate(new Date())
    const dateObj = parseIsoDate(dateParam)

    const [loading, setLoading] = useState(true)
    const [day, setDay] = useState<DayMealsDto | null>(null)
    const [clientProfile, setClientProfile] = useState<DiaryProfileDto | null>(null)
    const [sleepCount, setSleepCount] = useState(0)
    const [weight, setWeight] = useState<number | null>(null)
    const [hasGoal, setHasGoal] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!Number.isFinite(diaryProfileId) || diaryProfileId <= 0) {
            setError('Некорректный профиль')
            setLoading(false)
            return
        }
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError('')
            try {
                // Load the client's diary profile through the specialist-specific endpoint.
                const profile = await getClientProfile(diaryProfileId)
                if (cancelled) return
                setClientProfile(profile)

                let meals: DayMealsDto | null = null
                try {
                    const { data } = await http.get<DayMealsDto>(
                        `/api/specialist/meals/diary-profile/${diaryProfileId}/day`,
                        { params: { date: dateParam } },
                    )
                    meals = data
                } catch {
                    meals = await fetchDayMeals(dateParam, diaryProfileId)
                }
                if (cancelled) return
                setDay(meals)

                const [sleep, latestWeight, goal] = await Promise.all([
                    getClientSleepByDay(diaryProfileId, dateParam).catch(() => []),
                    getClientLatestWeight(diaryProfileId).catch(() => null),
                    getClientActiveGoal(diaryProfileId).catch(() => null),
                ])
                if (cancelled) return
                setSleepCount(Array.isArray(sleep) ? sleep.length : 0)
                setWeight(latestWeight?.weight ?? null)
                setHasGoal(goal != null)
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(getErrorMessage(err, 'Не удалось загрузить дневник клиента'))
                    setDay(null)
                    setClientProfile(null)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [diaryProfileId, dateParam])

    function shiftDay(delta: number) {
        const d = new Date(dateParam + 'T12:00:00')
        d.setDate(d.getDate() + delta)
        setSearchParams({ date: toIsoDate(d) })
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link
                    to="/specialist/clients"
                    className="btn-tertiary bg-text-on-brand text-decoration-none d-inline-flex align-items-center gap-1"
                >
                    <HiChevronLeft size={18} /> Клиенты
                </Link>
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">
                    Дневник клиента #{clientProfile?.id ?? diaryProfileId}
                </h2>
                <DateNav
                    date={dateObj}
                    onPrev={() => shiftDay(-1)}
                    onNext={() => shiftDay(1)}
                />
            </div>

            <div className="diary-content p-3 pb-5">
                {loading && <p className="text-muted">Загрузка…</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && day && (
                    <>
                        <div className="card mb-3 shadow-sm">
                            <div className="card-body py-2">
                                <div className="small text-muted">Сводка дня</div>
                                <div>
                                    Сон: {sleepCount > 0 ? `${sleepCount} запис.` : 'нет'} · Вес:{' '}
                                    {weight != null ? `${weight} кг` : '—'} · Цель: {hasGoal ? 'есть' : 'нет'}
                                </div>
                            </div>
                        </div>

                        <h6 className="mb-2">Приёмы пищи</h6>
                        {(day.sections ?? []).map((section) => (
                            <div key={section.mealId} className="card mb-2 shadow-sm">
                                <div className="card-body py-2 px-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-semibold">{section.mealTypeCode}</span>
                                        <Link
                                            to={`/diary/comments/add?commentableType=MEAL&commentableId=${section.mealId}&diaryProfileId=${diaryProfileId}`}
                                            className="btn btn-sm btn-secondary"
                                        >
                                            Коммент.
                                        </Link>
                                    </div>
                                    <ul className="list-unstyled small mb-0 mt-1">
                                        {(section.records ?? []).map((r) => (
                                            <li key={r.recordId}>
                                                {r.productDescription}
                                                {r.amount != null ? ` × ${r.amount}` : ''}
                                            </li>
                                        ))}
                                        {(section.records ?? []).length === 0 && (
                                            <li className="text-muted">Пусто</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ))}

                        <div className="mt-3 d-flex flex-wrap gap-2">
                            <Link
                                to={`/specialist/clients/${diaryProfileId}/goals`}
                                className="btn btn-sm btn-secondary"
                            >
                                Цели клиента
                            </Link>
                            <Link
                                to={`/diary/comments/add?diaryProfileId=${diaryProfileId}`}
                                className="btn btn-sm btn-secondary"
                            >
                                Добавить комментарий
                            </Link>
                        </div>
                    </>
                )}
            </div>
            <SpecialistBottomNav />
        </div>
    )
}
