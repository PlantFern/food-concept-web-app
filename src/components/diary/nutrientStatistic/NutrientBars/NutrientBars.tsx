import styles from './NutrientBars.module.css'

export type NutrientBarsItem = {
    key: 'protein' | 'fat' | 'carbs'
    label: string
    current: number
    goal: number
    unit?: string
}

export type NutrientBarsProps = {
    items: NutrientBarsItem[]
}

export function NutrientBars({ items }: NutrientBarsProps) {
    return (
        <div className={styles.nutrientBars}>
            {items.map((item) => {
                const pct =
                    item.goal > 0
                        ? Math.min(100, Math.round((item.current / item.goal) * 100))
                        : 0
                return (
                    <div key={item.key} className={styles.nutrientRow}>
                        <span className={styles.nutrientName}>{item.label}</span>
                        <div className={styles.nutrientTrack} aria-hidden>
                            <div
                                className={`${styles.nutrientFill} ${styles[item.key]}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className={styles.nutrientValue}>
                            {Math.round(item.current)}
                            {item.unit ?? 'g'} / {Math.round(item.goal)}
                            {item.unit ?? 'g'}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
