import styles from './TemplateBlock.module.css'

type TemplateBlockProps = {
    title: string
    totalKcal?: number | null
    itemCount?: number | null
    loading?: boolean
    onApply?: () => void
}

export function TemplateBlock({
    title,
    totalKcal,
    itemCount,
    loading,
    onApply,
}: TemplateBlockProps) {
    return (
        <div className={styles.templateBlock}>
            <div className={styles.templateHead}>
                <p className={styles.templateTitle}>{title}</p>
                <div className={styles.templateKcal}>
                    {totalKcal != null && (
                        <>
                            <span>{Number(totalKcal).toFixed(0)}</span>
                            <span>kcal</span>
                        </>
                    )}
                    {itemCount != null && totalKcal == null && <span>{itemCount} поз.</span>}
                </div>
            </div>
            <button
                type="button"
                className={`btn btn-primary ${styles.templateApply}`}
                disabled={loading}
                onClick={onApply}
            >
                {loading ? '…' : 'Отметить'}
            </button>
        </div>
    )
}
