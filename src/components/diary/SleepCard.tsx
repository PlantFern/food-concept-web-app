export type SleepEntry = {
    id: number
    start: string
    end: string
}

type SleepCardProps = {
    entries: SleepEntry[]
    onAdd?: () => void
}

function formatTime(iso: string | null | undefined): string {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso.slice(11, 16) || '—'
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function SleepCard({ entries, onAdd }: SleepCardProps) {
    return (
        <section className="info-card">
            <h3 className="info-card-title">Сон</h3>
            {entries.length === 0 ? (
                <p className="meal-empty">Нет записей за день</p>
            ) : (
                <ul className="sleep-list">
                    {entries.map((e) => (
                        <li key={e.id} className="sleep-row">
                            <span>{formatTime(e.start)}</span>
                            <span className="sleep-dash">—</span>
                            <span>{formatTime(e.end)}</span>
                        </li>
                    ))}
                </ul>
            )}
            <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onAdd}>
                Добавить время
            </button>
        </section>
    )
}
