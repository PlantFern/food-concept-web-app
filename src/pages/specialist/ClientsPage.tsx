import { useEffect, useState } from 'react'
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

function RelationCard({
    r,
    busyId,
    onActivate,
    onCancel,
    onEnd,
}: {
    r: UserRelationDto
    busyId: number | null
    onActivate: (id: number) => void
    onCancel: (id: number) => void
    onEnd: (id: number) => void
}) {
    return (
        <div className="card mb-2 shadow-sm">
            <div className="card-body py-2 px-3">
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
                                onClick={() => onActivate(r.id)}
                            >
                                Принять
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                disabled={busyId === r.id}
                                onClick={() => onCancel(r.id)}
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
                                if (window.confirm('Завершить связь с клиентом?')) onEnd(r.id)
                            }}
                        >
                            Завершить
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export function ClientsPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [relations, setRelations] = useState<UserRelationDto[]>([])
    const [specialistId, setSpecialistId] = useState<number | null>(null)
    const [error, setError] = useState('')

    async function load() {
        setLoading(true)
        setError('')
        try {
            const me = await getMySpecialist()
            if (!me) {
                setError('Профиль специалиста не найден')
                setRelations([])
                setSpecialistId(null)
                return
            }
            setSpecialistId(me.id)
            const list = await fetchSpecialistClients(me.id)
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
    const other = relations.filter((r) => !isPendingRelation(r) && !isActiveRelation(r))

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
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">Клиенты</h2>
            </div>

            <div className="diary-content p-3 pb-5">
                {loading && <p className="text-muted">Загрузка…</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && (
                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <h6 className="mb-2">Ожидают ({pending.length})</h6>
                            {pending.length === 0 && (
                                <p className="text-muted small mb-0">Нет заявок на связь</p>
                            )}
                            {pending.map((r) => (
                                <RelationCard
                                    key={r.id}
                                    r={r}
                                    busyId={busyId}
                                    onActivate={(id) => void runAction(id, 'activate')}
                                    onCancel={(id) => void runAction(id, 'cancel')}
                                    onEnd={(id) => void runAction(id, 'end')}
                                />
                            ))}
                        </div>
                        <div className="col-12 col-md-6">
                            <h6 className="mb-2">Действующие ({active.length})</h6>
                            {active.length === 0 && (
                                <p className="text-muted small mb-0">Нет действующих связей</p>
                            )}
                            {active.map((r) => (
                                <RelationCard
                                    key={r.id}
                                    r={r}
                                    busyId={busyId}
                                    onActivate={(id) => void runAction(id, 'activate')}
                                    onCancel={(id) => void runAction(id, 'cancel')}
                                    onEnd={(id) => void runAction(id, 'end')}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && other.length > 0 && (
                    <div className="mt-3">
                        <h6 className="mb-2">Прочие ({other.length})</h6>
                        {other.map((r) => (
                            <div key={r.id} className="card mb-2 shadow-sm">
                                <div className="card-body py-2 px-3">
                                    <div className="fw-semibold">Профиль #{r.diaryProfileId}</div>
                                    <div className="small text-muted">
                                        Тип: {r.relationType} · Статус: {String(r.relationStatusCode)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <SpecialistBottomNav />
        </div>
    )
}
