type WeightCardProps = {
    weightKg: number
    updatedAt: string
    onLog?: () => void
}

export function WeightCard({ weightKg, updatedAt, onLog }: WeightCardProps) {
    return (
        <section className="info-card">
            <div className="info-card-row">
                <div>
                    <h3 className="info-card-title">Вес</h3>
                    <p className="info-card-sub">Последнее обновление {updatedAt}</p>
                </div>
                <div className="info-card-value">{weightKg} кг</div>
            </div>
            <button type="button" className="btn btn-secondary w-100 mt-3" onClick={onLog}>
                Записать вес
            </button>
        </section>
    )
}
