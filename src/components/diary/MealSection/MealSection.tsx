import { IoAdd } from 'react-icons/io5'
import type { MealFoodRecordItemDto, MealTemplateListItemDto } from '@/api/diaryProfile/diary.ts'
import { formatFoodAmount, mealTypeLabel } from '@/api/diaryProfile/diary.ts'
import { TemplateBlock } from '@/components/diary/TemplateBlock'
import styles from './MealSection.module.css'
import {Dropdown} from "@/components/ui/Dropdown";

type MealSectionProps = {
    mealTypeCode: string
    mealTypeId: number
    records: MealFoodRecordItemDto[]
    totalPrimaryNutrient?: number | null
    primaryUnit?: string
    templates?: MealTemplateListItemDto[]
    applyingTemplateId?: number | null
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
    onApplyTemplate,
}: MealSectionProps) {
    return (
        <section className={`${styles.mealSection}`}>
            <div className={styles.mealSectionHead}>
                <Dropdown trigger={{
                                label: mealTypeLabel(mealTypeCode),
                                icon: <IoAdd size={20}/>}}
                            items={[
                                { label: "Добавить продукт", to: "/diary/products?tab=products" },
                                { label: "Добавить рецепт", to: "/diary/products?tab=recipes" },
                                { label: "Последнее", to: "/diary/products?tab=recent" },
                                { label: "Создать шаблон", to: "/diary/products?tab=templates" },
                            ]}/>

                <div className="d-flex align-items-center gap-2">
                    {totalPrimaryNutrient != null && (
                        <span className={styles.mealSectionTotal}>
                            {Math.round(totalPrimaryNutrient)} {primaryUnit}
                        </span>
                    )}
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
