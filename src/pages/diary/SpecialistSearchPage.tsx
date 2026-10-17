import { useState } from 'react'
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

export function SpecialistSearchPage() {
    const { showAlert } = useAlert()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SpecialistSearchItemDto[]>([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [searched, setSearched] = useState(false)

    async function onSearch(e?: React.FormEvent) {
        e?.preventDefault()
        setLoading(true)
        setSearched(true)
        try {
            const list = await searchSpecialists(query.trim())
            setResults(list)
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
        setBusyId(specialistId)
        try {
            await initiateSpecialistRelation(profileId, specialistId, 'SPECIALIST')
            showAlert('Заявка отправлена специалисту', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось отправить заявку'), 'danger')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/settings" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Поиск специалиста</h2>
            </div>

            <div className="diary-content p-3 pb-5">
                <form onSubmit={(e) => void onSearch(e)} className="mb-3">
                    <label htmlFor="q" className="form-label">
                        Email или логин
                    </label>
                    <div className="d-flex gap-2">
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

                {searched && !loading && results.length === 0 && (
                    <p className="text-muted">Ничего не найдено</p>
                )}

                {results.map((s) => (
                    <div key={s.id} className="card mb-2 shadow-sm">
                        <div className="card-body d-flex justify-content-between align-items-center gap-2">
                            <div>
                                <div className="fw-semibold">
                                    {s.login || s.email || `Специалист #${s.id}`}
                                </div>
                                <div className="small text-muted">
                                    {s.email ?? ''}
                                    {s.isActive === false ? ' · неактивен' : ''}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={busyId === s.id || s.isActive === false}
                                onClick={() => void onInitiate(s.id)}
                            >
                                Связаться
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <BottomNav />
        </div>
    )
}
