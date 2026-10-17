import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { DeferredImage } from '@/components/ui/DeferredImage'
import {
    fetchRecipeDetail,
    formatComponentAmount,
    type RecipeDetail,
} from '@/api/food/recipes'
import { photoPathToUrl } from '@/lib/photo'
import mealStyles from '@/components/diary/MealSection/MealSection.module.css'
import styles from './ProductDetailPage.module.css'

export function RecipeDetailPage() {
    const { recipeId } = useParams()
    const id = Number(recipeId)
    const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
    const [loading, setLoading] = useState(true)

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
                setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [id])

    const image = useMemo(
        () => photoPathToUrl(recipe?.photoPath) ?? null,
        [recipe?.photoPath],
    )

    return (
        <div className="diary-shell">
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

                        {recipe.recipeText && (
                            <section className={styles.nutrients}>
                                <h2 className={styles.formTitle}>Приготовление</h2>
                                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                    {recipe.recipeText}
                                </p>
                            </section>
                        )}
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
