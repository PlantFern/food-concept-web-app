import { type SyntheticEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { DeferredImage } from '@/components/ui/DeferredImage'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import {
    addFoodRecord,
    fetchProductDetail,
    type FoodServingDto,
    type ProductDetail,
} from '@/api/food'
import { addTemplateRecord } from '@/api/meals'
import { photoPathToUrl } from '@/lib/photo'
import {
    MEAL_TYPES,
    clampEatenAtToMealType,
    defaultEatenAtForMealType,
    todayIso,
} from '@/lib/mealTime'
import styles from './ProductDetailPage.module.css'

function servingLabel(s: FoodServingDto): string {
    const unit = s.servingUnit?.code || s.servingUnit?.name || ''
    const parts = [
        s.description,
        s.amount != null ? String(s.amount) : null,
        unit,
        s.gramWeight != null ? `${s.gramWeight} г` : null,
    ].filter(Boolean)
    return parts.join(' · ') || `Serving #${s.id}`
}

export function ProductDetailPage() {
    const { productId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { showAlert } = useAlert()

    const templateIdParam = searchParams.get('templateId')
    const templateId = templateIdParam ? Number(templateIdParam) : null
    const isTemplateMode = templateId != null && Number.isFinite(templateId) && templateId > 0

    const mealTypeFromQuery = searchParams.get('mealTypeId')
    const lockedMealType =
        mealTypeFromQuery != null && mealTypeFromQuery !== ''
            ? Number(mealTypeFromQuery)
            : null

    const [product, setProduct] = useState<ProductDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    const [mealTypeId, setMealTypeId] = useState(
        lockedMealType && Number.isFinite(lockedMealType) ? lockedMealType : 1,
    )
    const [servingId, setServingId] = useState<number | ''>('')
    const [amount, setAmount] = useState('1')
    const [date, setDate] = useState(searchParams.get('date') || todayIso())
    const [eatenAt, setEatenAt] = useState(() =>
        defaultEatenAtForMealType(
            lockedMealType && Number.isFinite(lockedMealType) ? lockedMealType : 1,
        ),
    )

    const id = Number(productId)
    const mealTypeLocked = isTemplateMode || (lockedMealType != null && Number.isFinite(lockedMealType))

    useEffect(() => {
        if (!Number.isFinite(id) || id <= 0) {
            setLoading(false)
            return
        }
        let cancelled = false
        ;(async () => {
            setLoading(true)
            const data = await fetchProductDetail(id)
            if (cancelled) return
            setProduct(data)
            if (data?.servings?.length) {
                setServingId(data.servings[0].id)
            }
            setLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [id])

    // When meal type changes (and not locked from template), recompute default time
    useEffect(() => {
        if (isTemplateMode) return
        setEatenAt(defaultEatenAtForMealType(mealTypeId))
    }, [mealTypeId, isTemplateMode])

    const image = photoPathToUrl(product?.photoPath) ?? null

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setFormError('')

        const amountNum = Number(amount)
        if (!servingId || !Number.isFinite(amountNum) || amountNum <= 0) {
            setFormError('Выберите порцию и укажите количество больше 0')
            return
        }

        setSaving(true)
        try {
            if (isTemplateMode && templateId != null) {
                await addTemplateRecord(templateId, Number(servingId), amountNum)
                showAlert('Продукт добавлен в шаблон', 'success')
                navigate(`/diary/templates/${templateId}/edit`, { replace: true })
            } else {
                const time = clampEatenAtToMealType(eatenAt, mealTypeId)
                await addFoodRecord({
                    mealId: null,
                    mealTypeId,
                    servingId: Number(servingId),
                    amount: amountNum,
                    date,
                    eatenAt: time,
                })
                showAlert('Запись добавлена в дневник', 'success')
                navigate('/diary', { replace: true })
            }
        } catch (err: unknown) {
            setFormError(
                getErrorMessage(
                    err,
                    isTemplateMode ? 'Не удалось добавить в шаблон' : 'Не удалось добавить запись',
                ),
            )
        } finally {
            setSaving(false)
        }
    }

    const backTo = isTemplateMode
        ? `/diary/templates/${templateId}/edit`
        : '/diary/products'

    return (
        <div className="diary-shell">
            <div className={`diary-content ${styles.page}`}>
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <Link to={backTo} className={styles.back}>
                        ← {isTemplateMode ? 'К шаблону' : 'Продукты'}
                    </Link>
                </div>

                {loading && <p className="text-muted mt-3">Загрузка…</p>}

                {!loading && !product && (
                    <p className="text-muted mt-3">Продукт не найден</p>
                )}

                {!loading && product && (
                    <>
                        <div className={styles.hero}>
                            <DeferredImage
                                src={image}
                                alt={product.productDescription}
                                className={styles.heroImage}
                            />
                            <div>
                                <h1 className={styles.title}>{product.productDescription}</h1>
                                {product.categoryCode && (
                                    <div className={styles.meta}>{product.categoryCode}</div>
                                )}
                            </div>
                        </div>

                        <form className={styles.form} onSubmit={onSubmit}>
                            <h2 className={styles.formTitle}>
                                {isTemplateMode
                                    ? 'Добавить в шаблон'
                                    : 'Добавить в приём пищи'}
                            </h2>

                            {formError && <p className={styles.error}>{formError}</p>}

                            {!isTemplateMode && (
                                <>
                                    <label className={styles.label}>
                                        Тип приёма
                                        <select
                                            className="form-select"
                                            value={mealTypeId}
                                            disabled={mealTypeLocked}
                                            onChange={(e) => setMealTypeId(Number(e.target.value))}
                                        >
                                            {MEAL_TYPES.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    {mealTypeLocked && (
                                        <p className={styles.lockedHint}>
                                            Тип приёма задан контекстом (секция дневника)
                                        </p>
                                    )}
                                </>
                            )}

                            <label className={styles.label}>
                                Порция
                                <select
                                    className="form-select"
                                    value={servingId}
                                    onChange={(e) =>
                                        setServingId(
                                            e.target.value ? Number(e.target.value) : '',
                                        )
                                    }
                                    required
                                >
                                    <option value="" disabled>
                                        Выберите порцию
                                    </option>
                                    {(product.servings ?? []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {servingLabel(s)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className={styles.label}>
                                Количество порций
                                <input
                                    type="number"
                                    className="form-control"
                                    min={0.01}
                                    step="any"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </label>

                            {!isTemplateMode && (
                                <div className={styles.row2}>
                                    <label className={styles.label}>
                                        Дата
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label className={styles.label}>
                                        Время
                                        <input
                                            type="time"	ortoise className="form-control"
                                            value={eatenAt}
                                            onChange={(e) =>
                                                setEatenAt(
                                                    clampEatenAtToMealType(
                                                        e.target.value,
                                                        mealTypeId,
                                                    ),
                                                )
                                            }
                                            required
                                        />
                                    </label>
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`btn btn-success w-100 ${styles.submit}`}
                                disabled={saving}
                            >
                                {saving
                                    ? 'Сохранение…'
                                    : isTemplateMode
                                      ? 'Добавить в шаблон'
                                      : 'Добавить в дневник'}
                            </button>
                        </form>
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
