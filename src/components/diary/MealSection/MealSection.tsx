import { Link } from 'react-router-dom'
import { IoAdd, IoCreateOutline, IoTrashOutline } from 'react-icons/io5'
import type { MealFoodRecordItemDto, MealTemplateListItemDto } from '@/api/diaryProfile/diary.ts'
import { formatFoodAmount, mealTypeLabel } from '@/api/diaryProfile/diary.ts'
import type { DiaryCommentDto } from '@/api/diaryProfile/comments'
import { TemplateBlock } from '@/components/diary/TemplateBlock'
import { DeferredImage } from '@/components/ui/DeferredImage'
import { photoPathToUrl } from '@/lib/photo'
import styles from './MealSection.module.css'
import { Dropdown } from '@/components/ui/Dropdown'

type MealSectionProps = {
    mealTypeCode: string
    mealTypeId: number
    date?: string
    mealId?: number | null
    records: MealFoodRecordItemDto[]
    totalPrimaryNutrient?: number | null
    primaryUnit?: string
    mealPhotoPath?: string | null
    comments?: DiaryCommentDto[]
    templates?: MealTemplateListItemDto[]
    applyingTemplateId?: number | null
    onApplyTemplate?: (templateId: number, mealTypeId: number) => void
}

export function MealSection({
    mealTypeCode,
    mealTypeId,
    date,
    mealId,
    records,
    totalPrimaryNutrient,
    primaryUnit = 'kcal',
    mealPhotoPath,
    comments = [],
    templates = [],
    applyingTemplateId = null,
    onApplyTemplate,
}: MealSectionProps) {
    const q = new URLSearchParams()
    q.set('mealTypeId', String(mealTypeId))
    if (date) q.set('date', date)
    if (mealId != null && mealId > 0) q.set('mealId', String(mealId))
    const mealQs = q.toString()

    const mealPhotoUrl = photoPathToUrl(mealPhotoPath)
    const mealComments =
        mealId != null && mealId > 0
            ? comments.filter((c) => Number(c.commentableId) === Number(mealId))
            : []

    return (
        <section className={styles.mealSection}>
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
                            label: 'Создать продукт',
                            to: `/diary/products/create?${mealQs}`,
                        },
                        {
                            label: 'Создать рецепт',
                            to: `/diary/recipes/create?${mealQs}`,
                        },
                        {
                            label: 'Создать шаблон',
                            to: `/diary/templates/add?${mealQs}`,
                        },
                        {
                            label: 'Добавить комментарий',
                            to: `/diary/comments/add?commentableType=MEAL&${mealQs}`,
                        },
                        {
                            label: 'Добавить фото',
                            to: `/diary/meals/photo?${mealQs}`,
                        },
                    ]}
                />

                <div className="d-flex align-items-center gap-2">
                    {totalPrimaryNutrient != null && Number(totalPrimaryNutrient) > 0 && (
                        <span className={styles.mealSectionTotal}>
                            {Math.round(totalPrimaryNutrient)} {primaryUnit}
                        </span>
                    )}
                </div>
            </div>

            {mealPhotoUrl && (
                <div className={styles.mealPhotoWrap}>
                    <DeferredImage
                        src={mealPhotoUrl}
                        alt={`Фото: ${mealTypeLabel(mealTypeCode)}`}
                        className={styles.mealPhoto}
                    />
                </div>
            )}

            {records.length === 0 ? (
                <p className={styles.mealEmpty}>Пока пусто</p>
            ) : (
                <ul className={styles.foodList}>
                    {records.map((item) => (
                        <li key={item.recordId} className={styles.foodRow}>
                            <DeferredImage
                                src={photoPathToUrl(item.photoPath)}
                                alt={item.productDescription || 'Еда'}
                                className={styles.foodThumb}
                            />
                            <div className={styles.foodMeta}>
                                <div className={styles.foodName}>{item.productDescription}</div>
                                <div className={styles.foodAmount}>{formatFoodAmount(item)}</div>
                            </div>
                            <div className={styles.foodActions}>
                                <span className={styles.foodKcalInline}>
                                    {item.nutrient != null ? Math.round(item.nutrient) : '—'}
                                    {primaryUnit ? ` ${primaryUnit}` : ''}
                                </span>
                                <Link
                                    to={`/diary/food-records/${item.recordId}/edit`}
                                    className={styles.iconBtn}
                                    aria-label="Изменить"
                                    title="Изменить"
                                >
                                    <IoCreateOutline size={18} />
                                </Link>
                                <Link
                                    to={`/diary/food-records/${item.recordId}/edit?delete=1`}
                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                    aria-label="Удалить"
                                    title="Удалить"
                                >
                                    <IoTrashOutline size={18} />
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {mealComments.length > 0 && (
                <ul className={styles.commentList}>
                    {mealComments.map((c) => (
                        <li key={c.id} className={styles.commentRow}>
                            <span className={styles.commentBody}>{c.body}</span>
                            <Link
                                to={`/diary/comments/${c.id}/edit?commentableType=MEAL&mealId=${mealId}`}
                                className={styles.iconBtn}
                                aria-label="Изменить комментарий"
                                title="Изменить"
                            >
                                <IoCreateOutline size={16} />
                            </Link>
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
