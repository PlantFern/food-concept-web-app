import { IoAdd, IoEllipsisVertical } from 'react-icons/io5'
import type { MealFoodRecordItemDto, MealTemplateListItemDto } from '@/api/diary'
import { formatFoodAmount, mealTypeLabel } from '@/api/diary'
import { TemplateBlock } from '@/components/diary/TemplateBlock'
import styles from './MealSection.module.css'

type MealSectionProps = {
    mealTypeCode: string
    mealTypeId: number
    records: MealFoodRecordItemDto[]
    totalPrimaryNutrient?: number | null
    primaryUnit?: string
    templates?: MealTemplateListItemDto[]
    applyingTemplateId?: number | null
    onAdd?: () => void
    onApplyTemplate?: (templateId: number, mealTypeId: number) => void
}

export function MealSection({
    mealTypeCode,
    mealTypeId,
    records,
    totalPrimaryNutrient,
    primaryUnit = 'kcal',
    templates = [],
    applyingTemplateId = null,
    onAdd,
    onApplyTemplate,
}: MealSectionProps) {
    return (
        <section className={styles.mealSection}>
            <div className={styles.mealSectionHead}>
                <button type="button" className={styles.mealSectionTitle} onClick={onAdd}>
                    <IoAdd size={20} />
                    <span>{mealTypeLabel(mealTypeCode)}</span>
                </button>
                <div className="d-flex align-items-center gap-2">
                    {totalPrimaryNutrient != null && (
                        <span className={styles.mealSectionTotal}>
                            {Math.round(totalPrimaryNutrient)} {primaryUnit}
                        </span>
                    )}
                    <button type="button" className={styles.mealSectionMenu} aria-label="Меню">
                        <IoEllipsisVertical size={18} />
                    </button>
                </div>
            </div>

            {records.length === 0 ? (
                <p className={styles.mealEmpty}>Пока пусто</p>
            ) : (
                <ul className={styles.foodList}>
                    {records.map((item) => (
                        <li key={item.recordId} className={styles.foodRow}>
                            <div className={styles.foodThumb} />
                            <div className={styles.foodMeta}>
                                <div className={styles.foodName}>{item.productDescription}</div>
                                <div className={styles.foodAmount}>{formatFoodAmount(item)}</div>
                            </div>
                            <div className={styles.foodKcal}>
                                <span>{item.nutrient != null ? Math.round(item.nutrient) : '—'}</span>
                                <span>{primaryUnit}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {templates.length > 0 &&
                templates.map((t) => (
                    <TemplateBlock
                        key={t.id}
                        title={t.name}
                        totalKcal={t.totalKcal}
                        itemCount={t.itemCount}
                        loading={applyingTemplateId === t.id}
                        onApply={() => onApplyTemplate?.(t.id, mealTypeId)}
                    />
                ))}
        </section>
    )
}
