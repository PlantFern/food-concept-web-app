import styles from './DayStrip.module.css'

export type DayItem = {
    id: string
    label: string
    dateLabel: string
}

export type DayStripProps = {
    days: DayItem[]
    activeId: string
    onSelect: (id: string) => void
}

export function DayStrip({ days, activeId, onSelect }: DayStripProps) {
    const active = days.find((d) => d.id === activeId)

    return (
        <>
            <div className={styles.dayStrip} role="tablist" aria-label="Дни недели">
                {days.map((day) => (
                    <button
                        key={day.id}
                        type="button"
                        role="tab"
                        aria-selected={day.id === activeId}
                        className={`${styles.dayChip} ${day.id === activeId ? styles.isActive : ''}`}
                        onClick={() => onSelect(day.id)}
                    >
                        {day.label}
                    </button>
                ))}
            </div>
            {active && <div className={styles.statsDate}>{active.dateLabel}</div>}
        </>
    )
}
