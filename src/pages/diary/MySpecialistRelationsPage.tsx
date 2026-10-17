import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import {
    endRelationFromClient,
    fetchDiarySpecialistRelations,
    isActiveRelation,
    isPendingRelation,
    type UserRelationDto,
} from '@/api/specialist'
import { getDiaryProfileId } from '@/api/onboarding'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

type Tab = 'pending' | 'active'

export function MySpecialistRelationsPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [relations, setRelations] = useState<UserRelationDto[]>([])
    const [error, setError] = useState('')
    const [tab, setTab] = useState<Tab>('pending')

    async function load() {
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
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const pending = relations.filter(isPendingRelation)
    const active = relations.filter(isActiveRelation)
    const visible = tab === 'pending' ? pending : active

    async function onEnd(relationId: number) {
        const profileId = getDiaryProfileId()
        if (profileId == null) return
        if (!window.confirm('Завершить связь со специалистом?')) return
        setBusyId(relationId)
        try {
            await endRelationFromClient(profileId, relationId)
            showAlert('Связь завершена', 'success')
            await load()
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось завершить'), 'danger')
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
                <h2 className="bg-text-on-brand mt-2 text-center">Мои специалисты</h2>
            </div>

            <div className="diary-content p-3 pb-5">
                <div className="d-flex gap-2 mb-3">
                    <button
                        type="button"
                        className={`btn flex-fill ${tab === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setTab('pending')}
                    >
                        Ожидают ({pending.length})
                    </button>
                    <button
                        type="button"
                        className={`btn flex-fill ${tab === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setTab('active')}
                    >
                        Действующие ({active.length})
                    </button>
                </div>

                {loading && <p className="text-muted">Загрузка…</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && visible.length === 0 && (
                    <p className="text-muted mb-0">
                        {tab === 'pending' ? 'Нет ожидающих заявок' : 'Нет действующих связей'}
                    </p>
                )}

                {!loading &&
                    visible.map((r) => (
                        <div key={r.id} className="card mb-2 shadow-sm">
                            <div className="card-body">
                                <div className="fw-semibold">Специалист #{r.specialistId}</div>
                                <div className="small text-muted mb-2">
                                    Тип: {r.relationType} · Статус: {r.relationStatusCode}
                                </div>
                                {isActiveRelation(r) && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        disabled={busyId === r.id}
                                        onClick={() => void onEnd(r.id)}
                                    >
                                        Завершить
                                    </button>
                                )}
                                {isPendingRelation(r) && (
                                    <span className="small text-muted">Ожидает ответа специалиста</span>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
            <BottomNav />
        </div>
    )
}
