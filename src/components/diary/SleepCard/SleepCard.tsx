import styles from './SleepCard.module.css'

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
        <section className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Сон</h3>
            {entries.length === 0 ? (
                <p className={styles.mealEmpty}>Нет записей за день</p>
            ) : (
                <ul className={styles.sleepList}>
                    {entries.map((e) => (
                        <li key={e.id} className={styles.sleepRow}>
                            <span>{formatTime(e.start)}</span>
                            <span className={styles.sleepDash}>—</span>
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
