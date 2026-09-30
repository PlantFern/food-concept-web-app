import { IoAdd, IoEllipsisVertical } from 'react-icons/io5'

export type FoodRow = {
    id: string
    name: string
    amount: string
    kcal: number
    imageUrl?: string | null
}

type MealSectionProps = {
    title: string
    items: FoodRow[]
    note?: string | null
    onAdd?: () => void
}

export function MealSection({ title, items, note, onAdd }: MealSectionProps) {
    return (
        <section className="meal-section">
            <div className="meal-section-head">
                <button type="button" className="meal-section-title" onClick={onAdd}>
                    <IoAdd size={20} />
                    <span>{title}</span>
                </button>
                <button type="button" className="meal-section-menu" aria-label="Меню">
                    <IoEllipsisVertical size={18} />
                </button>
            </div>

            <ul className="food-list">
                {items.map((item) => (
                    <li key={item.id} className="food-row">
                        <div className="food-thumb">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" />
                            ) : null}
                        </div>
                        <div className="food-meta">
                            <div className="food-name">{item.name}</div>
                            <div className="food-amount">{item.amount}</div>
                        </div>
                        <div className="food-kcal">
                            <span>{item.kcal}</span>
                            <span>kcal</span>
                        </div>
                    </li>
                ))}
            </ul>

            {note ? (
                <div className="meal-note">
                    <div className="meal-note-label">Note</div>
                    <p>{note}</p>
                </div>
            ) : null}
        </section>
    )
}
