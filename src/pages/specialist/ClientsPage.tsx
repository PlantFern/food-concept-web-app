import { useCallback, useEffect, useState } from 'react'
import { SpecialistBottomNav } from '@/components/specialist/SpecialistBottomNav'
import {
    activateRelation,
    cancelRelation,
    endRelation,
    fetchSpecialistClients,
    getMySpecialist,
    isActiveRelation,
    isPendingRelation,
    type UserRelationDto,
} from '@/api/specialist'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

type Tab = 'pending' | 'active'

export function ClientsPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [relations, setRelations] = useState<UserRelationDto[]>([])
    const [specialistId, setSpecialistId] = useState<number | null>(null)
    const [error, setError] = useState('')
    const [tab, setTab] = useState<Tab>('pending')

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        const me = await getMySpecialist()
        if (!me) {
            setError('Профиль специалиста не найден')
            setRelations([])
            setSpecialistId(null)
            setLoading(false)
            return
        }
        setSpecialistId(me.id)
        const list = await fetchSpecialistClients(me.id)
        setRelations(list)
        setLoading(false)
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const pending = relations.filter(isPendingRelation)
    const active = relations.filter(isActiveRelation)
    const visible = tab === 'pending' ? pending : active

    async function runAction(
        relationId: number,
        action: 'activate' | 'cancel' | 'end',
    ) {
        if (specialistId == null) return
        setBusyId(relationId)
        try {
            if (action === 'activate') await activateRelation(specialistId, relationId)
            if (action === 'cancel') await cancelRelation(specialistId, relationId)
            if (action === 'end') await endRelation(specialistId, relationId)
            showAlert(
                action === 'activate'
                    ? 'Связь принята'
                    : action === 'cancel'
                      ? 'Связь отклонена'
                      : 'Связь завершена',
                'success',
            )
            await load()
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось выполнить действие'), 'danger')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">Связи</h2>
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
                        {tab === 'pending'
                            ? 'Нет заявок на связь'
                            : 'Нет действующих связей'}
                    </p>
                )}

                {!loading &&
                    visible.map((r) => (
                        <div key={r.id} className="card mb-2 shadow-sm">
                            <div className="card-body">
                                <div className="fw-semibold">Профиль #{r.diaryProfileId}</div>
                                <div className="small text-muted mb-2">
                                    Тип: {r.relationType} · Статус: {r.relationStatusCode}
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {isPendingRelation(r) && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                disabled={busyId === r.id}
                                                onClick={() => void runAction(r.id, 'activate')}
                                            >
                                                Принять
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                disabled={busyId === r.id}
                                                onClick={() => void runAction(r.id, 'cancel')}
                                            >
                                                Отклонить
                                            </button>
                                        </>
                                    )}
                                    {isActiveRelation(r) && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            disabled={busyId === r.id}
                                            onClick={() => {
                                                if (window.confirm('Завершить связь с клиентом?')) {
                                                    void runAction(r.id, 'end')
                                                }
                                            }}
                                        >
                                            Завершить
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
            <SpecialistBottomNav />
        </div>
    )
}
