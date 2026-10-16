import { IoAdd } from 'react-icons/io5'
import type { MealFoodRecordItemDto, MealTemplateListItemDto } from '@/api/diaryProfile/diary.ts'
import { formatFoodAmount, mealTypeLabel } from '@/api/diaryProfile/diary.ts'
import { TemplateBlock } from '@/components/diary/TemplateBlock'
import styles from './MealSection.module.css'
import { Dropdown } from '@/components/ui/Dropdown'

type MealSectionProps = {
    mealTypeCode: string
    mealTypeId: number
    date?: string
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
    date,
    records,
    totalPrimaryNutrient,
    primaryUnit = 'kcal',
    templates = [],
    applyingTemplateId = null,
    onApplyTemplate,
}: MealSectionProps) {
    const q = new URLSearchParams()
    q.set('mealTypeId', String(mealTypeId))
    if (date) q.set('date', date)
    const mealQs = q.toString()

    return (
        <section className={`${styles.mealSection}`}>
            <div className={styles.mealSectionHead}>
                <Dropdown
                    trigger={{
                        label: mealTypeLabel(mealTypeCode),
                        icon: <IoAdd size={20} />,
                    }}
                    items={[
                        {
                            label: 'Добавить продукт',
                            to: `/diary/products?tab=products&${mealQs}`,
                        },
                        {
                            label: 'Добавить рецепт',
                            to: `/diary/products?tab=recipes&${mealQs}`,
                        },
                        {
                            label: 'Быстрая запись нутриентов',
                            to: `/diary/food-records/quick?${mealQs}`,
                        },
                        {
                            label: 'Создать шаблон',
                            to: `/diary/templates/add?${mealQs}`,
                        },
                        {
                            label: 'Создать продукт',
                            to: `/diary/products?tab=products&create=1&${mealQs}`,
                        },
                        {
                            label: 'Комментарий к приёму',
                            to: `/diary/comments/add?commentableType=MEAL&${mealQs}`,
                        },
                    ]}
                />

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
                            <Dropdown
                                trigger={{
                                    label: `${item.nutrient != null ? Math.round(item.nutrient) : '—'} ${primaryUnit}`,
                                }}
                                items={[
                                    {
                                        label: 'Изменить',
                                        to: `/diary/food-records/${item.recordId}/edit`,
                                    },
                                    {
                                        label: 'Удалить',
                                        to: `/diary/food-records/${item.recordId}/edit?delete=1`,
                                    },
                                ]}
                            />
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
