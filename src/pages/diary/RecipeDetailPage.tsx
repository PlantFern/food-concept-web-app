import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { DeferredImage } from '@/components/ui/DeferredImage'
import {
    fetchRecipeDetail,
    formatComponentAmount,
    type RecipeDetail,
} from '@/api/food/recipes'
import { photoPathToUrl } from '@/lib/photo'
import { addFoodRecord } from '@/api/food/foodRecords'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import mealStyles from '@/components/diary/MealSection/MealSection.module.css'
import styles from './ProductDetailPage.module.css'

function recipeInstructionLines(value: string): string[] {
    const raw = value.trim()
    if (!raw) return []
    try {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            const lines = parsed.map((step) => typeof step === 'string' ? step.trim() : '').filter(Boolean)
            if (lines.length) return lines
        }
        if (parsed && typeof parsed === 'object') {
            const candidate = (parsed as { steps?: unknown; instructions?: unknown }).steps
                ?? (parsed as { instructions?: unknown }).instructions
            if (Array.isArray(candidate)) {
                const lines = candidate.map((step) => typeof step === 'string' ? step.trim() : '').filter(Boolean)
                if (lines.length) return lines
            }
        }
    } catch {
        // recipeText is usually plain text; continue with line-based parsing
    }
    return raw.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

export function RecipeDetailPage() {
    const { recipeId } = useParams()
    const [searchParams] = useSearchParams()
    const { showAlert } = useAlert()
    const today = new Date()
    const localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-')
    const id = Number(recipeId)
    const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [mealTypeId, setMealTypeId] = useState(searchParams.get('mealTypeId') || '1')
    const [date, setDate] = useState(searchParams.get('date') || localDate)
    const [eatenAt, setEatenAt] = useState(String(today.getHours()).padStart(2, '0') + ':' + String(today.getMinutes()).padStart(2, '0'))
    const [servingId, setServingId] = useState('')
    const [amount, setAmount] = useState('1')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!Number.isFinite(id) || id <= 0) {
            setLoading(false)
            return
        }
        let cancelled = false
        ;(async () => {
            setLoading(true)
            const data = await fetchRecipeDetail(id)
            if (!cancelled) {
                setRecipe(data)
                setServingId(data?.servings?.[0] ? String(data.servings[0].id) : '')
                setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [id])

    const image = photoPathToUrl(recipe?.photoPath) ?? null
    const instructionLines = recipe?.recipeText ? recipeInstructionLines(recipe.recipeText) : []

    async function onAddToMeal(e: React.FormEvent) {
        e.preventDefault()
        if (!recipe || !servingId) {
            showAlert('У этого рецепта нет доступной порции для записи в дневник', 'warning')
            return
        }
        const quantity = Number(amount)
        if (!Number.isFinite(quantity) || quantity <= 0 || !date || !eatenAt) {
            showAlert('Проверьте дату, время и количество', 'warning')
            return
        }
        setSaving(true)
        try {
            await addFoodRecord({ mealTypeId: Number(mealTypeId), servingId: Number(servingId), amount: quantity, date, eatenAt })
            showAlert('Рецепт добавлен в приём пищи', 'success')
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось записать рецепт в дневник'), 'danger')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className={`diary-content ${styles.page}`}>
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <Link to="/diary/products?tab=recipes" className={styles.back}>
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


                        <section className={mealStyles.mealSection}>
                            <div className={mealStyles.mealSectionHead}><strong>Записать в приём пищи</strong></div>
                            <form className="p-3" onSubmit={(e) => void onAddToMeal(e)}>
                                <div className="row g-2">
                                    <div className="col-12">
                                        <label className="form-label small mb-1" htmlFor="recipe-serving">Порция рецепта</label>
                                        <select id="recipe-serving" className="form-select" value={servingId} onChange={(e) => setServingId(e.target.value)} required disabled={!recipe.servings?.length}>
                                            {(recipe.servings ?? []).map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.description || ([s.amount, s.servingUnit?.name || s.servingUnit?.code, s.gramWeight != null ? String(s.gramWeight) + ' г' : null].filter(Boolean).join(' · ')) || ('Порция #' + s.id)}
                                                </option>
                                            ))}
                                        </select>
                                        {!recipe.servings?.length && <div className="form-text">Backend не вернул порции для этого рецепта.</div>}
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small mb-1" htmlFor="recipe-meal-type">Приём пищи</label>
                                        <select id="recipe-meal-type" className="form-select" value={mealTypeId} onChange={(e) => setMealTypeId(e.target.value)}>
                                            <option value="1">Завтрак</option><option value="2">Обед</option><option value="3">Перекус</option><option value="4">Ужин</option><option value="5">Другое</option>
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small mb-1" htmlFor="recipe-amount">Количество порций</label>
                                        <input id="recipe-amount" type="number" min="0.1" step="0.1" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small mb-1" htmlFor="recipe-date">Дата</label>
                                        <input id="recipe-date" type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small mb-1" htmlFor="recipe-time">Время</label>
                                        <input id="recipe-time" type="time" className="form-control" value={eatenAt} onChange={(e) => setEatenAt(e.target.value)} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary w-100 mt-3" disabled={saving || !recipe.servings?.length}>
                                    {saving ? 'Записываем…' : 'Добавить в дневник'}
                                </button>
                            </form>
                        </section>
                        <section className={mealStyles.mealSection}>
                            <div className={mealStyles.mealSectionHead}>
                                <strong>Компоненты</strong>
                            </div>
                            {(recipe.components ?? []).length === 0 ? (
                                <p className={mealStyles.mealEmpty}>Нет компонентов</p>
                            ) : (
                                <ul className={mealStyles.foodList}>
                                    {recipe.components.map((c) => (
                                        <li key={c.componentId} className={mealStyles.foodRow}>
                                            <div className={mealStyles.foodThumb} />
                                            <div className={mealStyles.foodMeta}>
                                                <div className={mealStyles.foodName}>
                                                    {c.productDescription ||
                                                        `Продукт #${c.productServingId}`}
                                                </div>
                                                <div className={mealStyles.foodAmount}>
                                                    {formatComponentAmount(c)}
                                                </div>
                                            </div>
                                            <div className={mealStyles.foodKcal}>
                                                <span>
                                                    {c.nutrient != null
                                                        ? Math.round(c.nutrient)
                                                        : '—'}
                                                </span>
                                                <span>kcal</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {instructionLines.length > 0 && (
                            <section className={styles.nutrients}>
                                <h2 className={styles.formTitle}>Приготовление</h2>
                                {instructionLines.length > 1 ? (
                                    <ol className="mb-0 ps-4">
                                        {instructionLines.map((step, index) => (
                                            <li key={index} className="mb-2">{step}</li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{instructionLines[0]}</p>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
