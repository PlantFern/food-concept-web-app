import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import {
    hasActiveSpecialistControl,
    initiateSpecialistRelation,
    searchSpecialists,
    type SpecialistSearchItemDto,
} from '@/api/specialist'
import { getDiaryProfileId } from '@/api/onboarding'
import { getMyUserProfile } from '@/api/profiles'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

export function SpecialistSearchPage() {
    const { showAlert } = useAlert()

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SpecialistSearchItemDto[]>([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [searched, setSearched] = useState(false)
    const [relationType, setRelationType] = useState<'SPECIALIST' | 'OBSERVER'>('SPECIALIST')
    const [hasSpecialistControl, setHasSpecialistControl] = useState(false)

    useEffect(() => {
        const profileId = getDiaryProfileId()
        if (profileId == null) return
        void hasActiveSpecialistControl(profileId).then((active) => {
            setHasSpecialistControl(active)
            if (active) setRelationType('OBSERVER')
        })
    }, [])

    async function onSearch(e?: React.FormEvent) {
        e?.preventDefault()
        setLoading(true)
        setSearched(true)

        try {
            const me = await getMyUserProfile()
            const list = await searchSpecialists(query.trim())

            const filtered = list.filter((s) => {
                if (me == null) return true
                return s.userId !== me.id
            })

            setResults(filtered)
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось выполнить поиск'), 'danger')
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    async function onInitiate(specialistId: number) {
        const profileId = getDiaryProfileId()

        if (profileId == null) {
            showAlert('Нет профиля дневника', 'warning')
            return
        }

        if (relationType === 'SPECIALIST' && hasSpecialistControl) {
            showAlert(
                'Уже есть активная связь типа «Специалист». Завершите её, прежде чем подключать другого.',
                'warning',
            )
            return
        }

        setBusyId(specialistId)

        try {
            await initiateSpecialistRelation(profileId, specialistId, relationType)
            showAlert(
                `Заявка отправлена. Тип связи: ${
                    relationType === 'SPECIALIST' ? 'Специалист' : 'Наблюдатель'
                }`,
                'success',
            )
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось отправить заявку'), 'danger')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/settings" className="btn-tertiary bg-text-on-brand text-decoration-none">
                    ← Назад
                </Link>
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">Поиск специалиста</h2>
            </div>

            <div className="diary-content p-3 pb-5">
                <form onSubmit={(e) => void onSearch(e)} className="mb-3">
                    <label htmlFor="q" className="form-label">
                        Email или логин
                    </label>
                    <div className="input-group">
                        <input
                            id="q"
                            className="form-control"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="например name@mail.com"
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? '…' : 'Найти'}
                        </button>
                    </div>
                </form>

                {hasSpecialistControl && (
                    <div className="alert alert-warning py-2 small" role="status">
                        У вас уже есть активная связь типа «Специалист». Можно отправить заявку только
                        как наблюдатель. Чтобы подключить другого специалиста — сначала завершите
                        текущую связь в «Мои специалисты».
                    </div>
                )}

                {searched && !loading && results.length === 0 && (
                    <p className="text-muted mb-0">Ничего не найдено</p>
                )}

                {results.map((s) => (
                    <div key={s.id} className="card mb-2 shadow-sm border-0">
                        <div className="card-body py-3">
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <div>
                                    <div className="fw-semibold">
                                        {s.login || s.email || `Специалист #${s.id}`}
                                    </div>
                                    <div className="small text-muted">
                                        {s.email ?? ''}
                                        {s.isActive === false ? ' · неактивен' : ''}
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex flex-wrap align-items-end gap-2">
                                <div className="flex-grow-1" style={{ minWidth: '10rem' }}>
                                    <label
                                        htmlFor={`relationType-${s.id}`}
                                        className="form-label small mb-1"
                                    >
                                        Тип связи
                                    </label>
                                    <select
                                        id={`relationType-${s.id}`}
                                        className="form-select form-select-sm"
                                        value={relationType}
                                        onChange={(e) =>
                                            setRelationType(e.target.value as 'SPECIALIST' | 'OBSERVER')
                                        }
                                    >
                                        <option
                                            value="SPECIALIST"
                                            disabled={hasSpecialistControl}
                                        >
                                            Специалист — дневник и цели
                                        </option>
                                        <option value="OBSERVER">
                                            Наблюдатель — только просмотр
                                        </option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    disabled={
                                        busyId === s.id ||
                                        s.isActive === false ||
                                        (relationType === 'SPECIALIST' && hasSpecialistControl)
                                    }
                                    onClick={() => void onInitiate(s.id)}
                                >
                                    {busyId === s.id ? '…' : 'Отправить заявку'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BottomNav />
        </div>
    )
}
