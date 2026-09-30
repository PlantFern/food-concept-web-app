export type TemplateItem = {
    id: string
    name: string
    amount: string
    kcal: number
}

type TemplateBlockProps = {
    title: string
    totalKcal: number
    items: TemplateItem[]
    onApply?: () => void
}

export function TemplateBlock({ title, totalKcal, items, onApply }: TemplateBlockProps) {
    return (
        <div className="template-block">
            <div className="template-head">
                <p className="template-title">{title}</p>
                <div className="template-kcal">
                    <span>{totalKcal.toFixed(2)}</span>
                    <span>kcal</span>
                </div>
            </div>
            <ul className="template-list">
                {items.map((item) => (
                    <li key={item.id} className="food-row">
                        <div className="food-thumb food-thumb-soft" />
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
            <button type="button" className="btn btn-primary template-apply" onClick={onApply}>
                Отметить
            </button>
        </div>
    )
}
