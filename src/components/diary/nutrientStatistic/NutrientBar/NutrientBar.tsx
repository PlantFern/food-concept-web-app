import styles from './NutrientBar.module.css'

export type NutrientBarItem = {
    key: string
    label: string
    value: number
    color: string
}

export type NutrientBarProps = {
    items: NutrientBarItem[]
}

export function NutrientBar({ items }: NutrientBarProps) {
    const total = items.reduce((s, i) => s + Math.max(i.value, 0), 0)
    const hasData = total > 0

    return (
        <div className={styles.nutrientBar}>
            <div className={styles.nutrientBarLegend}>
                {items.map((item) => (
                    <div key={item.key} className={styles.nutrientBarLegendRow}>
                        <span className={styles.nutrientBarAmount}>
                            {Math.round(item.value)}g
                        </span>
                        <span className={styles.nutrientBarLabel}>
                            <span
                                className={styles.nutrientBarDot}
                                style={{ background: item.color }}
                            />
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            <div
                className={styles.nutrientBarTrack}
                role="img"
                aria-label="Соотношение нутриентов"
            >
                {hasData ? (
                    items.map((item) => {
                        const pct = (Math.max(item.value, 0) / total) * 100
                        if (pct <= 0) return null
                        return (
                            <div
                                key={item.key}
                                className={styles.nutrientBarSeg}
                                style={{
                                    width: `${pct}%`,
                                    background: item.color,
                                }}
                                title={`${item.label}: ${Math.round(item.value)}g`}
                            />
                        )
                    })
                ) : (
                    <div
                        className={`${styles.nutrientBarSeg} ${styles.nutrientBarSegEmpty}`}
                        style={{ width: '100%' }}
                    />
                )}
            </div>
        </div>
    )
}
