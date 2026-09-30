import { IoAdd, IoEllipsisVertical } from 'react-icons/io5'
import type { MealFoodRecordItemDto, MealTemplateListItemDto } from '@/api/diary'
import { formatFoodAmount, mealTypeLabel } from '@/api/diary'
import { TemplateBlock } from '@/components/diary/TemplateBlock'

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
        <section className="meal-section">
            <div className="meal-section-head">
                <button type="button" className="meal-section-title" onClick={onAdd}>
                    <IoAdd size={20} />
                    <span>{mealTypeLabel(mealTypeCode)}</span>
                </button>
                <div className="d-flex align-items-center gap-2">
                    {totalPrimaryNutrient != null && (
                        <span className="meal-section-total">
                            {Math.round(totalPrimaryNutrient)} {primaryUnit}
                        </span>
                    )}
                    <button type="button" className="meal-section-menu" aria-label="Меню">
                        <IoEllipsisVertical size={18} />
                    </button>
                </div>
            </div>

            {records.length === 0 ? (
                <p className="meal-empty">Пока пусто</p>
            ) : (
                <ul className="food-list">
                    {records.map((item) => (
                        <li key={item.recordId} className="food-row">
                            <div className="food-thumb" />
                            <div className="food-meta">
                                <div className="food-name">{item.productDescription}</div>
                                <div className="food-amount">{formatFoodAmount(item)}</div>
                            </div>
                            <div className="food-kcal">
                                <span>{item.nutrient != null ? Math.round(item.nutrient) : '—'}</span>
                                <span>{primaryUnit}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {templates.map((t) => (
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
