export type SleepEntry = {
    id: string
    start: string
    end: string
}

type SleepCardProps = {
    entries: SleepEntry[]
    onAdd?: () => void
}

export function SleepCard({ entries, onAdd }: SleepCardProps) {
    return (
        <section className="info-card">
            <h3 className="info-card-title">Сон</h3>
            <ul className="sleep-list">
                {entries.map((e) => (
                    <li key={e.id} className="sleep-row">
                        <span>{e.start}</span>
                        <span className="sleep-dash">—</span>
                        <span>{e.end}</span>
                    </li>
                ))}
            </ul>
            <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onAdd}>
                Добавить время
            </button>
        </section>
    )
}
