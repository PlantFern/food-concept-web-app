import styles from './WeightCard.module.css'

type WeightCardProps = {
    weightKg: number | null
    onLog?: () => void
}

export function WeightCard({ weightKg, onLog }: WeightCardProps) {
    return (
        <section className={styles.infoCard}>
            <div className={styles.infoCardRow}>
                <h3 className={styles.infoCardTitle}>Вес</h3>
                <div className={styles.infoCardValue}>
                    {weightKg != null ? `${weightKg} кг` : '—'}
                </div>
            </div>
            <button type="button" className="btn btn-secondary w-100 mt-3" onClick={onLog}>
                Записать вес
            </button>
        </section>
    )
}
