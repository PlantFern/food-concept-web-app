import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi2'
import { BottomNav } from '@/components/diary'
import { DeferredImage } from '@/components/ui/DeferredImage'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { addFoodRecord, type FoodServingDto } from '@/api/food'
import { fetchRecipeDetail, type RecipeDetail } from '@/api/food/recipes'
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

type RecipeFormValues = {
    mealTypeId: number
    servingId: string
    amount: string
    date: string
    eatenAt: string
}

export function RecipeDetailPage() {
    const { recipeId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { showAlert } = useAlert()

    const mealTypeFromQuery = searchParams.get('mealTypeId')
    const lockedMealType =
        mealTypeFromQuery != null && mealTypeFromQuery !== ''
            ? Number(mealTypeFromQuery)
            : null
    const mealTypeLocked = lockedMealType != null && Number.isFinite(lockedMealType)
    const defaultMealType = mealTypeLocked ? lockedMealType! : 1

    const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [formError, setFormError] = useState('')

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RecipeFormValues>({
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
    const id = Number(recipeId)

    useEffect(() => {
        if (!Number.isFinite(id) || id <= 0) {
            setLoading(false)
            return
        }
        let cancelled = false
        ;(async () => {
            setLoading(true)
            const data = await fetchRecipeDetail(id)
            if (cancelled) return
            setRecipe(data)
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
        setValue('eatenAt', defaultEatenAtForMealType(Number(mealTypeId)))
    }, [mealTypeId, setValue])

    const image = photoPathToUrl(recipe?.photoPath) ?? null

    const onSubmit = async (values: RecipeFormValues) => {
        setFormError('')
        const amountNum = Number(values.amount)
        const servingNum = Number(values.servingId)

        if (!servingNum || !Number.isFinite(amountNum) || amountNum <= 0) {
            setFormError('Выберите порцию и укажите количество больше 0')
            return
        }

        try {
            const time = clampEatenAtToMealType(values.eatenAt, Number(values.mealTypeId))
            await addFoodRecord({
                mealId: null,
                mealTypeId: Number(values.mealTypeId),
                servingId: servingNum,
                amount: amountNum,
                date: values.date,
                eatenAt: time,
            })
            showAlert('Рецепт добавлен в дневник', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setFormError(getErrorMessage(err, 'Не удалось добавить запись'))
        }
    }

    return (
        <div className="diary-shell">
            <div className={`diary-content ${styles.page}`}>
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <Link
                        to="/diary/products"
                        className={`${styles.back} d-inline-flex align-items-center gap-1`}
                    >
                        <HiChevronLeft size={18} /> Рецепты
                    </Link>
                </div>

                {loading && <p className="text-muted mt-3">Загрузка…</p>}

                {!loading && !recipe && (
                    <p className="text-muted mt-3">Рецепт не найден</p>
                )}

                {!loading && recipe && (
                    <>
                        <div className={styles.hero}>
                            <DeferredImage
                                src={image}
                                alt={recipe.recipeName}
                                className={styles.heroImage}
                            />
                            <div>
                                <h1 className={styles.title}>{recipe.recipeName}</h1>
                                {recipe.recipeDescription && (
                                    <div className={styles.meta}>{recipe.recipeDescription}</div>
                                )}
                                {recipe.totalWeightGrams != null && (
                                    <div className={styles.meta}>
                                        Вес: {recipe.totalWeightGrams} г
                                    </div>
                                )}
                            </div>
                        </div>

                        {(recipe.components?.length ?? 0) > 0 && (
                            <div className="mb-3">
                                <h2 className="h6 mb-2">Состав</h2>
                                <ul className="list-group list-group-flush rounded-3">
                                    {recipe.components.map((c) => (
                                        <li key={c.componentId} className="list-group-item small">
                                            <span className="fw-semibold">
                                                {c.productDescription ??
                                                    `Компонент #${c.componentId}`}
                                            </span>
                                            {c.amount != null && (
                                                <span className="text-muted ms-2">
                                                    × {c.amount}
                                                    {c.servingUnitCode
                                                        ? ` ${c.servingUnitCode}`
                                                        : ''}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {recipe.recipeText && (
                            <div className="mb-3">
                                <h2 className="h6 mb-2">Приготовление</h2>
                                <p
                                    className="small text-muted mb-0"
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {recipe.recipeText}
                                </p>
                            </div>
                        )}

                        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                            <h2 className={styles.formTitle}>Добавить в приём пищи</h2>

                            {formError && <p className={styles.error}>{formError}</p>}

                            {(recipe.servings?.length ?? 0) === 0 && (
                                <p className={styles.error}>
                                    У рецепта нет порций — добавление в дневник недоступно
                                </p>
                            )}

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

                            <label className={styles.label}>
                                Порция
                                <select
                                    className="input rounded-3 w-100"
                                    disabled={!recipe.servings?.length}
                                    {...register('servingId', {
                                        required: 'Выберите порцию',
                                    })}
                                >
                                    <option value="" disabled>
                                        Выберите порцию
                                    </option>
                                    {(recipe.servings ?? []).map((s) => (
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
                            {errors.date && (
                                <span className="input-error-text">{errors.date.message}</span>
                            )}
                            {errors.eatenAt && (
                                <span className="input-error-text">{errors.eatenAt.message}</span>
                            )}

                            <button
                                type="submit"
                                className={`btn btn-primary w-100 ${styles.submit}`}
                                disabled={isSubmitting || !recipe.servings?.length}
                            >
                                {isSubmitting ? 'Сохранение…' : 'Добавить в дневник'}
                            </button>
                        </form>
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
