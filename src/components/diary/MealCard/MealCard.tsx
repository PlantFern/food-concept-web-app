import styles from './MealCard.module.css'

export type MealItem = {
    name: string
    amount: number
    unit?: string
}

type MealCardProps = {
    title: string
    totalAmount: number
    unit?: string
    items: MealItem[]
}

export function MealCard({ title, totalAmount, unit = '', items }: MealCardProps) {
    const unitSuffix = unit ? ` ${unit}` : ''

    return (
        <article className={styles.mealCard}>
            <div className={styles.mealCardTop}>
                <span className={styles.mealName}>{title}</span>
                <span className={styles.mealTotal}>
                    {totalAmount}
                    {unitSuffix}
                </span>
            </div>
            <ul className={styles.mealItems}>
                {items.map((item) => (
                    <li key={item.name}>
                        <span>{item.name}</span>
                        <span>
                            {item.amount}
                            {item.unit ? ` ${item.unit}` : unitSuffix}
                        </span>
                    </li>
                ))}
            </ul>
        </article>
    )
}
