import { useEffect, useState } from 'react'
import { SpecialistBottomNav } from '@/components/specialist/SpecialistBottomNav'
import {
    fetchSpecialistClients,
    getMySpecialist,
    isActiveRelation,
    type UserRelationDto,
} from '@/api/specialist'

export function ClientsPage() {
    const [loading, setLoading] = useState(true)
    const [clients, setClients] = useState<UserRelationDto[]>([])
    const [error, setError] = useState('')

    useEffect(() => {

        let cancelled = false;
        (async () => {
            setLoading(true)
            setError('')
            const me = await getMySpecialist()
            if (cancelled) return
            if (!me) {
                setError('Профиль специалиста не найден')
                setClients([])
                setLoading(false)
                return
            }
            const list = await fetchSpecialistClients(me.id)
            if (cancelled) return
            setClients(list.filter(isActiveRelation))
            setLoading(false)
        })()

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="diary-shell">
            <div className="diary-content p-3 pb-5">
                <div className='bg-brand text-invert p-2 rounded-bottom-4'>
                    <h2 className="page-title text-center p-2 bg-text-on-brand">Клиенты</h2>
                </div>

                {loading && <p className="text-muted">Загрузка…</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && clients.length === 0 && (
                    <p className="text-muted mb-0">Активных клиентов пока нет</p>
                )}

                {!loading && clients.length > 0 && (
                    <ul className="list-group list-group-flush">
                        {clients.map((c) => (
                            <li key={c.id} className="list-group-item">
                                <div className="fw-semibold">Клиент #{c.diaryProfileId}</div>
                                <div className="small text-muted">
                                    {c.relationType} · {c.relationStatusCode}
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
