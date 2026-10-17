import { type SyntheticEvent, useEffect, useMemo, useState } from 'react'
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
    type ProductNutrientItem,
} from '@/api/food'
import { addTemplateRecord } from '@/api/meals'
import { photoPathToUrl } from '@/lib/photo'
import { NUTRIENT_BY_ID } from '@/data/nutrients'
import styles from './ProductDetailPage.module.css'

const MEAL_TYPES = [
    { id: 1, code: 'BREAKFAST', label: 'Завтрак' },
    { id: 2, code: 'LUNCH', label: 'Обед' },
    { id: 3, code: 'SNACK', label: 'Перекус' },
    { id: 4, code: 'DINNER', label: 'Ужин' },
    { id: 5, code: 'OTHERS', label: 'Другое' },
]

function todayIso(): string {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

function nowTime(): string {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

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

function formatNutrientAmount(amount: number | null | undefined): string {
    if (amount == null || !Number.isFinite(amount)) return '—'
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(1)
}

function dedupeNutrients(list: ProductNutrientItem[]): ProductNutrientItem[] {
    const byId = new Map<number, ProductNutrientItem>()
    for (const n of list) {
        if (n.nutrientId == null) continue
        const prev = byId.get(n.nutrientId)
        if (!prev || (prev.amountPer100g == null && n.amountPer100g != null)) {
            byId.set(n.nutrientId, n)
        }
    }
    return [...byId.values()]
}

export function ProductDetailPage() {
    const { productId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { showAlert } = useAlert()

    const templateIdRaw = searchParams.get('templateId')
    const templateId =
        templateIdRaw != null && Number.isFinite(Number(templateIdRaw)) && Number(templateIdRaw) > 0
            ? Number(templateIdRaw)
            : null
    const isTemplateMode = templateId != null

    const [product, setProduct] = useState<ProductDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    const [mealTypeId, setMealTypeId] = useState(Number(searchParams.get('mealTypeId') || 1))
    const [servingId, setServingId] = useState<number | ''>('')
    const [amount, setAmount] = useState('1')
    const [date, setDate] = useState(searchParams.get('date') || todayIso())
    const [eatenAt, setEatenAt] = useState(nowTime())

    const id = Number(productId)

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

    const image = useMemo(
        () => photoPathToUrl(product?.photoPath) ?? null,
        [product?.photoPath],
    )

    const nutrients = useMemo(
        () => dedupeNutrients(product?.nutrients ?? []),
        [product?.nutrients],
    )

    const backTo = isTemplateMode
        ? `/diary/templates/${templateId}/edit`
        : '/diary/products'

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
                await addFoodRecord({
                    mealId: null,
                    mealTypeId,
                    servingId: Number(servingId),
                    amount: amountNum,
                    date,
                    eatenAt,
                })
                showAlert('Запись добавлена в дневник', 'success')
                navigate('/diary', { replace: true })
            }
        } catch (err: unknown) {
            setFormError(
                getErrorMessage(
                    err,
                    isTemplateMode
                        ? 'Не удалось добавить в шаблон'
                        : 'Не удалось добавить запись',
                ),
            )
        } finally {
            setSaving(false)
        }
    }

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
                                <label className={styles.label}>
                                    Тип приёма
                                    <select
                                        className="form-select"
                                        value={mealTypeId}
                                        onChange={(e) => setMealTypeId(Number(e.target.value))}
                                    >
                                        {MEAL_TYPES.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
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
                                            type="time"
                                            className="form-control"
                                            value={eatenAt}
                                            onChange={(e) => setEatenAt(e.target.value)}
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

                        <section className={styles.nutrients}>
                            <h2 className={styles.formTitle}>Нутриенты (на 100 г)</h2>
                            {nutrients.length === 0 ? (
                                <p className={styles.meta}>Нет данных о нутриентах</p>
                            ) : (
                                <ul className={styles.nutrientList}>
                                    {nutrients.map((n) => {
                                        const def = NUTRIENT_BY_ID[n.nutrientId]
                                        const label =
                                            def?.name ??
                                            n.nutrientCode ??
                                            `Nutrient #${n.nutrientId}`
                                        return (
                                            <li key={n.nutrientId} className={styles.nutrientRow}>
                                                <span className={styles.nutrientName}>{label}</span>
                                                <span className={styles.nutrientValue}>
                                                    {formatNutrientAmount(n.amountPer100g)}
                                                    {n.unitCode ? ` ${n.unitCode}` : ''}
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </section>
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
