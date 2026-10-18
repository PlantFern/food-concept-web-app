import { type SyntheticEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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

    const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    const [mealTypeId, setMealTypeId] = useState(
        mealTypeLocked ? lockedMealType! : 1,
    )
    const [servingId, setServingId] = useState<number | ''>('')
    const [amount, setAmount] = useState('1')
    const [date, setDate] = useState(searchParams.get('date') || todayIso())
    const [eatenAt, setEatenAt] = useState(() =>
        defaultEatenAtForMealType(mealTypeLocked ? lockedMealType! : 1),
    )

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
                setServingId(data.servings[0].id)
            }
            setLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [id])

    useEffect(() => {
        setEatenAt(defaultEatenAtForMealType(mealTypeId))
    }, [mealTypeId])

    const image = photoPathToUrl(recipe?.photoPath) ?? null

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
            const time = clampEatenAtToMealType(eatenAt, mealTypeId)
            await addFoodRecord({
                mealId: null,
                mealTypeId,
                servingId: Number(servingId),
                amount: amountNum,
                date,
                eatenAt: time,
            })
            showAlert('Рецепт добавлен в дневник', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setFormError(getErrorMessage(err, 'Не удалось добавить запись'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="diary-shell">
            <div className={`diary-content ${styles.page}`}>
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <Link to="/diary/products" className={styles.back}>
                        ← Рецепты
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

                        <form className={styles.form} onSubmit={onSubmit}>
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

                            <label className={styles.label}>
                                Порция
                                <select
                                    className="form-select"
                                    value={servingId}
                                    onChange={(e) =>
                                        setServingId(e.target.value ? Number(e.target.value) : '')
                                    }
                                    required
                                    disabled={!recipe.servings?.length}
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
                                        type="time"
                                        className="form-control"
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

                            <button
                                type="submit"
                                className={`btn btn-success w-100 ${styles.submit}`}
                                disabled={saving || !recipe.servings?.length}
                            >
                                {saving ? 'Сохранение…' : 'Добавить в дневник'}
                            </button>
                        </form>
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
