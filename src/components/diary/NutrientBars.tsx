export type NutrientBarItem = {
    key: 'protein' | 'fat' | 'carbs'
    label: string
    current: number
    goal: number
    unit?: string
}

type NutrientBarsProps = {
    items: NutrientBarItem[]
}

export function NutrientBars({ items }: NutrientBarsProps) {
    return (
        <div className="nutrient-bars">
            {items.map((item) => {
                const pct =
                    item.goal > 0
                        ? Math.min(100, Math.round((item.current / item.goal) * 100))
                        : 0
                return (
                    <div key={item.key} className="nutrient-row">
                        <span className="nutrient-name">{item.label}</span>
                        <div className="nutrient-track" aria-hidden>
                            <div
                                className={`nutrient-fill ${item.key}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="nutrient-value">
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
