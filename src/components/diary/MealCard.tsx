export type MealItem = {
    name: string
    kcal: number
}

type MealCardProps = {
    title: string
    totalKcal: number
    items: MealItem[]
}

export function MealCard({ title, totalKcal, items }: MealCardProps) {
    return (
        <article className="meal-card">
            <div className="meal-card-top">
                <span className="meal-name">{title}</span>
                <span className="meal-kcal">{totalKcal} kcal</span>
            </div>
            <ul className="meal-items">
                {items.map((item) => (
                    <li key={item.name}>
                        <span>{item.name}</span>
                        <span>{item.kcal} kcal</span>
                    </li>
                ))}
            </ul>
        </article>
    )
}
