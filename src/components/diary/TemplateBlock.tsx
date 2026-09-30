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
        <div className="template-block">
            <div className="template-head">
                <p className="template-title">{title}</p>
                <div className="template-kcal">
                    {totalKcal != null && (
                        <>
                            <span>{Number(totalKcal).toFixed(0)}</span>
                            <span>kcal</span>
                        </>
                    )}
                    {itemCount != null && totalKcal == null && (
                        <span>{itemCount} поз.</span>
                    )}
                </div>
            </div>
            <button
                type="button"
                className="btn btn-primary template-apply"
                disabled={loading}
                onClick={onApply}
            >
                {loading ? '…' : 'Отметить'}
            </button>
        </div>
    )
}
