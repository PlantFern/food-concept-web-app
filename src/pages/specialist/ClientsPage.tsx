import { useEffect, useState } from 'react'
import { SpecialistBottomNav } from '@/components/specialist/SpecialistBottomNav'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import {
    activateRelation,
    cancelRelation,
    endRelation,
    fetchSpecialistClients,
    getMySpecialist,
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

function isPending(r: UserRelationDto): boolean {
    const c = String(r.relationStatusCode ?? '').toUpperCase()
    return c.includes('PENDING') || c.includes('INIT') || c.includes('WAIT')
}

export function ClientsPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<UserRelationDto[]>([])
    const [error, setError] = useState('')
    const [specialistId, setSpecialistId] = useState<number | null>(null)
    const [busyId, setBusyId] = useState<number | null>(null)

    async function reload() {
        setLoading(true)
        setError('')
        try {
            const me = await getMySpecialist()
            if (!me) {
                setError('Профиль специалиста не найден')
                setClients([])
                setSpecialistId(null)
                return
            }
            setSpecialistId(me.id)
            const list = await fetchSpecialistClients(me.id)
            setClients(list)
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось загрузить клиентов'))
            setClients([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void reload()
    }, [])

    async function runAction(
        rel: UserRelationDto,
        action: 'activate' | 'cancel' | 'end',
    ) {
        if (specialistId == null) return
        setBusyId(rel.id)
        try {
            if (action === 'activate') await activateRelation(specialistId, rel.id)
            else if (action === 'cancel') await cancelRelation(specialistId, rel.id)
            else await endRelation(specialistId, rel.id)
            showAlert(
                action === 'activate'
                    ? 'Связь активирована'
                    : action === 'cancel'
                      ? 'Заявка отклонена'
                      : 'Связь завершена',
                'success',
            )
            await reload()
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось выполнить действие'), 'danger')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="diary-shell">
            <div className="diary-content p-3 pb-5">
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <h2 className="page-title text-center p-2 bg-text-on-brand">Клиенты</h2>
                </div>

                {loading && <p className="text-muted mt-3">Загрузка…</p>}
                {error && <p className="text-danger mt-3">{error}</p>}

                {!loading && !error && clients.length === 0 && (
                    <p className="text-muted mt-3 mb-0">Клиентов пока нет</p>
                )}

                {!loading && clients.length > 0 && (
                    <ul className="list-group list-group-flush mt-3">
                        {clients.map((c) => (
                            <li
                                key={c.id}
                                className="list-group-item d-flex justify-content-between align-items-start gap-2"
                            >
                                <div>
                                    <div className="fw-semibold">Клиент #{c.diaryProfileId}</div>
                                    <div className="small text-muted">
                                        {c.relationType} · {statusLabel(c.relationStatusCode)}
                                    </div>
                                </div>
                                <div className="d-flex flex-wrap gap-1 justify-content-end">
                                    {isPending(c) && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success btn-sm"
                                                disabled={busyId === c.id}
                                                onClick={() => void runAction(c, 'activate')}
                                            >
                                                Принять
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                disabled={busyId === c.id}
                                                onClick={() => void runAction(c, 'cancel')}
                                            >
                                                Отклонить
                                            </button>
                                        </>
                                    )}
                                    {isActiveRelation(c) && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            disabled={busyId === c.id}
                                            onClick={() => void runAction(c, 'end')}
                                        >
                                            Завершить
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <SpecialistBottomNav />
        </div>
    )
}
