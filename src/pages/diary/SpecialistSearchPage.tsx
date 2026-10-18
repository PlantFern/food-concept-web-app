import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import {
    initiateSpecialistRelation,
    searchSpecialists,
    type SpecialistSearchItemDto,
} from '@/api/specialist'
import { getDiaryProfileId } from '@/api/onboarding'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

const RELATION_TYPES = [
    { value: 'SPECIALIST', label: 'Специалист (может ставить цели и настройки)' },
    { value: 'OBSERVER', label: 'Наблюдатель (только просмотр)' },
] as const

function SpecialistCard({
    item,
    busyId,
    onInitiate,
}: {
    item: SpecialistSearchItemDto
    busyId: number | null
    onInitiate: (specialistId: number, relationType: string) => void
}) {
    const [relationType, setRelationType] = useState<string>('SPECIALIST')

    return (
        <div className="card mb-2 shadow-sm">
            <div className="card-body py-2 px-3">
                <div className="fw-semibold">
                    {item.login || item.email || `Специалист #${item.id}`}
                </div>
                <div className="small text-muted mb-2">
                    ID: {item.id}
                    {item.email ? ` · ${item.email}` : ''}
                    {item.isActive === false ? ' · неактивен' : ''}
                </div>

                <div className="mb-2">
                    <label className="form-label small mb-1">Тип связи</label>
                    <select
                        className="form-select form-select-sm"
                        value={relationType}
                        onChange={(e) => setRelationType(e.target.value)}
                        disabled={busyId === item.id}
                    >
                        {RELATION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === item.id || item.isActive === false}
                    onClick={() => onInitiate(item.id, relationType)}
                >
                    {busyId === item.id ? 'Отправка…' : 'Отправить заявку'}
                </button>
            </div>
        </div>
    )
}

export function SpecialistSearchPage() {
    const { showAlert } = useAlert()
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [items, setItems] = useState<SpecialistSearchItemDto[]>([])
    const [error, setError] = useState('')

    async function load(q: string) {
        setLoading(true)
        setError('')
        try {
            const list = await searchSpecialists(q)
            setItems(list)
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось найти специалистов'))
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load('')
    }, [])

    async function onInitiate(specialistId: number, relationType: string) {
        const profileId = getDiaryProfileId()
        if (profileId == null) {
            showAlert('Нет профиля дневника', 'danger')
            return
        }
        setBusyId(specialistId)
        try {
            await initiateSpecialistRelation(profileId, specialistId, relationType)
            showAlert('Заявка отправлена', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось отправить заявку'), 'danger')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link
                    to="/diary/settings/specialists"
                    className="btn-tertiary bg-text-on-brand text-decoration-none"
                >
                    ← Мои специалисты
                </Link>
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">
                    Поиск специалистов
                </h2>
            </div>

            <div className="diary-content p-3 pb-5">
                <form
                    className="mb-3 d-flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault()
                        void load(query.trim())
                    }}
                >
                    <input
                        type="search"
                        className="form-control form-control-sm"
                        placeholder="Логин или email…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                        Найти
                    </button>
                </form>

                {loading && <p className="text-muted">Загрузка…</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && items.length === 0 && (
                    <p className="text-muted small">Специалисты не найдены</p>
                )}

                {!loading &&
                    items.map((item) => (
                        <SpecialistCard
                            key={item.id}
                            item={item}
                            busyId={busyId}
                            onInitiate={(id, type) => void onInitiate(id, type)}
                        />
                    ))}
            </div>
            <BottomNav />
        </div>
    )
}
