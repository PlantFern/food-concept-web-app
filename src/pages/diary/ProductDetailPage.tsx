import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi2'
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

type ProductFormValues = {
    mealTypeId: number
    servingId: string
    amount: string
    date: string
    eatenAt: string
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
    const [formError, setFormError] = useState('')

    const defaultMealType =
        lockedMealType && Number.isFinite(lockedMealType) ? lockedMealType : 1

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormValues>({
        mode: 'onTouched',
        defaultValues: {
            mealTypeId: defaultMealType,
            servingId: '',
            amount: '1',
            date: searchParams.get('date') || todayIso(),
            eatenAt: defaultEatenAtForMealType(defaultMealType),
        },
    })

    const mealTypeId = watch('mealTypeId')
    const id = Number(productId)
    const mealTypeLocked =
        isTemplateMode || (lockedMealType != null && Number.isFinite(lockedMealType))

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
                setValue('servingId', String(data.servings[0].id))
            }
            setLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [id, setValue])

    useEffect(() => {
        if (isTemplateMode) return
        setValue('eatenAt', defaultEatenAtForMealType(Number(mealTypeId)))
    }, [mealTypeId, isTemplateMode, setValue])

    const image = photoPathToUrl(product?.photoPath) ?? null

    const onSubmit = async (values: ProductFormValues) => {
        setFormError('')
        const amountNum = Number(values.amount)
        const servingNum = Number(values.servingId)

        if (!servingNum || !Number.isFinite(amountNum) || amountNum <= 0) {
            setFormError('Выберите порцию и укажите количество больше 0')
            return
        }

        try {
            if (isTemplateMode && templateId != null) {
                await addTemplateRecord(templateId, servingNum, amountNum)
                showAlert('Продукт добавлен в шаблон', 'success')
                navigate(`/diary/templates/${templateId}/edit`, { replace: true })
            } else {
                const time = clampEatenAtToMealType(values.eatenAt, Number(values.mealTypeId))
                await addFoodRecord({
                    mealId: null,
                    mealTypeId: Number(values.mealTypeId),
                    servingId: servingNum,
                    amount: amountNum,
                    date: values.date,
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
        }
    }

    const backTo = isTemplateMode
        ? `/diary/templates/${templateId}/edit`
        : '/diary/products'

    return (
        <div className="diary-shell">
            <div className={`diary-content ${styles.page}`}>
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <Link to={backTo} className={`${styles.back} d-inline-flex align-items-center gap-1`}>
                        <HiChevronLeft size={18} />{' '}
                        {isTemplateMode ? 'К шаблону' : 'Продукты'}
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

                        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
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
                                            className="input rounded-3 w-100"
                                            disabled={mealTypeLocked}
                                            {...register('mealTypeId', {
                                                valueAsNumber: true,
                                                required: 'Выберите тип приёма',
                                            })}
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
                                    {errors.mealTypeId && (
                                        <span className="input-error-text">{errors.mealTypeId.message}</span>
                                    )}
                                </>
                            )}

                            <label className={styles.label}>
                                Порция
                                <select
                                    className="input rounded-3 w-100"
                                    {...register('servingId', {
                                        required: 'Выберите порцию',
                                    })}
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
                            {errors.servingId && (
                                <span className="input-error-text">{errors.servingId.message}</span>
                            )}

                            <label className={styles.label}>
                                Количество порций
                                <input
                                    type="number"
                                    className="input rounded-3 w-100"
                                    min={0.01}
                                    step="any"
                                    {...register('amount', {
                                        required: 'Укажите количество',
                                        validate: (v) => {
                                            const n = Number(v)
                                            if (!Number.isFinite(n) || n <= 0) {
                                                return 'Количество должно быть больше 0'
                                            }
                                            return true
                                        },
                                    })}
                                />
                            </label>
                            {errors.amount && (
                                <span className="input-error-text">{errors.amount.message}</span>
                            )}

                            {!isTemplateMode && (
                                <div className={styles.row2}>
                                    <label className={styles.label}>
                                        Дата
                                        <input
                                            type="date"
                                            className="input rounded-3 w-100"
                                            {...register('date', { required: 'Укажите дату' })}
                                        />
                                    </label>
                                    <label className={styles.label}>
                                        Время
                                        <input
                                            type="time"
                                            className="input rounded-3 w-100"
                                            {...register('eatenAt', {
                                                required: 'Укажите время',
                                                onChange: (e) => {
                                                    setValue(
                                                        'eatenAt',
                                                        clampEatenAtToMealType(
                                                            e.target.value,
                                                            Number(mealTypeId),
                                                        ),
                                                    )
                                                },
                                            })}
                                        />
                                    </label>
                                </div>
                            )}
                            {errors.date && (
                                <span className="input-error-text">{errors.date.message}</span>
                            )}
                            {errors.eatenAt && (
                                <span className="input-error-text">{errors.eatenAt.message}</span>
                            )}

                            <button
                                type="submit"
                                className={`btn btn-primary w-100 ${styles.submit}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
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
