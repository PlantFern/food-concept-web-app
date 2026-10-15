import styles from './SleepCard.module.css'
import {Link} from "react-router-dom";
import {IoEllipsisVertical} from "react-icons/io5";

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

export function SleepCard({ entries}: SleepCardProps) {
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
                            <button type="button" className={styles.mealSectionMenu} aria-label="Меню">
                                <IoEllipsisVertical size={18} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className='d-flex justify-content-end align-items-end align-items-end'>
                <Link className="btn btn-secondary mt-2" to="/diary/sleep-log/add">
                    Добавить запись
                </Link>
            </div>
        </section>
    )
}
