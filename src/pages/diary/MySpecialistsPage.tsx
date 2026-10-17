import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { useAlert } from '@/components/ui/Alert'
import { getDiaryProfileId } from '@/api/onboarding'
import { getErrorMessage } from '@/lib/errors'
import {
    endRelationFromClient,
    fetchDiarySpecialistRelations,
    isActiveRelation,
    type UserRelationDto,
} from '@/api/specialist'

function statusLabel(code: string): string {
    const c = String(code ?? '').toUpperCase()
    if (c.includes('ACTIVE')) return 'Активна'
    if (c.includes('PENDING') || c.includes('INIT')) return 'Ожидает'
    if (c.includes('CANCEL')) return 'Отменена'
    if (c.includes('END') || c.includes('INACTIVE')) return 'Завершена'
    return code || '—'
}

export function MySpecialistsPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [relations, setRelations] = useState<UserRelationDto[]>([])
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState<number | null>(null)

    async function reload() {
        const profileId = getDiaryProfileId()
        if (profileId == null) {
            setError('Нет профиля дневника')
            setRelations([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError('')
        try {
            const list = await fetchDiarySpecialistRelations(profileId)
            setRelations(list)
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось загрузить связи'))
            setRelations([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void reload()
    }, [])

    async function onEnd(rel: UserRelationDto) {
        const profileId = getDiaryProfileId()
        if (profileId == null) return
        setBusyId(rel.id)
        try {
            await endRelationFromClient(profileId, rel.id)
            showAlert('Связь завершена', 'success')
            await reload()
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось завершить связь'), 'danger')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="diary-shell">
            <div className="diary-content p-3 pb-5">
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <Link to="/diary/settings" className="small text-decoration-none text-invert">
                        ← Назад
                    </Link>
                    <h2 className="page-title text-center p-2 bg-text-on-brand">Мои специалисты</h2>
                </div>

                {loading && <p className="text-muted mt-3">Загрузка…</p>}
                {error && <p className="text-danger mt-3">{error}</p>}

                {!loading && !error && relations.length === 0 && (
                    <p className="text-muted mt-3 mb-0">Связей со специалистами пока нет</p>
                )}

                {!loading && relations.length > 0 && (
                    <ul className="list-group list-group-flush mt-3">
                        {relations.map((r) => (
                            <li
                                key={r.id}
                                className="list-group-item d-flex justify-content-between align-items-start gap-2"
                            >
                                <div>
                                    <div className="fw-semibold">Специалист #{r.specialistId}</div>
                                    <div className="small text-muted">
                                        {r.relationType} · {statusLabel(r.relationStatusCode)}
                                    </div>
                                </div>
                                {isActiveRelation(r) && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        disabled={busyId === r.id}
                                        onClick={() => void onEnd(r)}
                                    >
                                        {busyId === r.id ? '…' : 'Завершить'}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
