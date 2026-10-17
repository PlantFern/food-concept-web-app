import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { IoTrashOutline } from 'react-icons/io5'
import { BottomNav } from '@/components/diary'
import { http } from '@/api/http'
import { uploadFile } from '@/api/files'
import {
    searchProducts,
    fetchProductDetail,
    type ProductListItem,
    type FoodServingDto,
} from '@/api/food'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

type FormValues = {
    name: string
    description: string
    recipe: string
}

type DraftComponent = {
    key: string
    productId: number
    productName: string
    productServingId: number
    servingLabel: string
    amount: number
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

export function RecipeCreateFormPage() {
    const { showAlert } = useAlert()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState('')
    const [photoFile, setPhotoFile] = useState<File | null>(null)

    const [productQuery, setProductQuery] = useState('')
    const [productResults, setProductResults] = useState<ProductListItem[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
    const [servings, setServings] = useState<FoodServingDto[]>([])
    const [selectedServingId, setSelectedServingId] = useState<number | ''>('')
    const [componentAmount, setComponentAmount] = useState('1')
    const [components, setComponents] = useState<DraftComponent[]>([])

    const {
        register,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<FormValues>({
        defaultValues: { name: '', description: '', recipe: '' },
    })

    async function onSearchProducts() {
        setSearching(true)
        setError('')
        try {
            const items = await searchProducts(productQuery.trim())
            setProductResults(items)
            if (!items.length) setError('Продукты не найдены')
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось найти продукты'))
        } finally {
            setSearching(false)
        }
    }

    async function onPickProduct(p: ProductListItem) {
        setSelectedProductId(p.id)
        setError('')
        const detail = await fetchProductDetail(p.id)
        const list = detail?.servings ?? []
        setServings(list)
        setSelectedServingId(list[0]?.id ?? '')
    }

    function onAddComponent() {
        if (selectedProductId == null || !selectedServingId) {
            setError('Выберите продукт и порцию')
            return
        }
        const amount = Number(componentAmount)
        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Количество компонента должно быть больше 0')
            return
        }
        const product = productResults.find((x) => x.id === selectedProductId)
        const serving = servings.find((s) => s.id === Number(selectedServingId))
        if (!serving) {
            setError('Порция не найдена')
            return
        }
        setComponents((prev) => [
            ...prev,
            {
                key: `${selectedProductId}-${selectedServingId}-${Date.now()}`,
                productId: selectedProductId,
                productName: product?.name ?? `Продукт #${selectedProductId}`,
                productServingId: Number(selectedServingId),
                servingLabel: servingLabel(serving),
                amount,
            },
        ])
        setComponentAmount('1')
        setError('')
    }

    function onRemoveComponent(key: string) {
        setComponents((prev) => prev.filter((c) => c.key !== key))
    }

    const onSubmit = async (form: FormValues) => {
        setError('')
        try {
            let photoPathId: number | null = null
            if (photoFile) {
                const uploaded = await uploadFile(photoFile, 'FOOD_RECIPES')
                photoPathId = uploaded.id
            }

            const { data: recipeId } = await http.post<number>('/api/food/recipes', {
                name: form.name.trim(),
                description: form.description.trim() || null,
                recipe: form.recipe.trim() || null,
                photoPathId,
                totalWeightGrams: null,
                components: components.map((c) => ({
                    productServingId: c.productServingId,
                    amount: c.amount,
                })),
            })
            showAlert('Рецепт создан', 'success')
            const q = searchParams.toString()
            navigate(`/diary/recipes/${recipeId}${q ? `?${q}` : ''}`, { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось создать рецепт'))
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/products?tab=recipes" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Новый рецепт</h2>
            </div>

            <div className="container pb-5">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="form-card col-xl-5 col-lg-7 col-md-9 col-12 mx-auto d-flex flex-column gap-3"
                >
                    {error && <p className="text-danger small mb-0">{error}</p>}

                    <div>
                        <label className="label" htmlFor="name">
                            Название
                        </label>
                        <input
                            id="name"
                            className="input rounded-3 w-100"
                            {...register('name', {
                                required: 'Укажите название',
                                validate: (v) => v.trim().length > 0 || 'Укажите название',
                            })}
                        />
                        {errors.name && (
                            <span className="input-error-text">{errors.name.message}</span>
                        )}
                    </div>

                    <div>
                        <label className="label" htmlFor="description">
                            Краткое описание
                        </label>
                        <input
                            id="description"
                            className="input rounded-3 w-100"
                            {...register('description')}
                        />
                    </div>

                    <div>
                        <label className="label" htmlFor="recipe">
                            Приготовление
                        </label>
                        <textarea
                            id="recipe"
                            className="input rounded-3 w-100"
                            rows={5}
                            {...register('recipe')}
                        />
                    </div>

                    <div>
                        <label className="label" htmlFor="photo">
                            Фото (необязательно)
                        </label>
                        <input
                            id="photo"
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <div className="border rounded-3 p-3 d-flex flex-column gap-2">
                        <p className="label mb-0">Компоненты</p>

                        <div className="d-flex gap-2">
                            <input
                                className="input rounded-3 flex-grow-1"
                                placeholder="Поиск продукта…"
                                value={productQuery}
                                onChange={(e) => setProductQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        void onSearchProducts()
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                disabled={searching}
                                onClick={() => void onSearchProducts()}
                            >
                                {searching ? '…' : 'Найти'}
                            </button>
                        </div>

                        {productResults.length > 0 && (
                            <ul className="list-group list-group-flush">
                                {productResults.slice(0, 8).map((p) => (
                                    <li key={p.id} className="list-group-item px-0 py-1">
                                        <button
                                            type="button"
                                            className={`btn btn-sm w-100 text-start ${
                                                selectedProductId === p.id
                                                    ? 'btn-primary'
                                                    : 'btn-outline-secondary'
                                            }`}
                                            onClick={() => void onPickProduct(p)}
                                        >
                                            {p.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {selectedProductId != null && servings.length > 0 && (
                            <div className="d-flex flex-column gap-2">
                                <label className="small mb-0">
                                    Порция
                                    <select
                                        className="form-select form-select-sm mt-1"
                                        value={selectedServingId}
                                        onChange={(e) =>
                                            setSelectedServingId(
                                                e.target.value ? Number(e.target.value) : '',
                                            )
                                        }
                                    >
                                        {servings.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {servingLabel(s)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="small mb-0">
                                    Количество
                                    <input
                                        type="number"
                                        min={0.01}
                                        step="any"
                                        className="form-control form-control-sm mt-1"
                                        value={componentAmount}
                                        onChange={(e) => setComponentAmount(e.target.value)}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={onAddComponent}
                                >
                                    + Добавить компонент
                                </button>
                            </div>
                        )}

                        {components.length === 0 ? (
                            <p className="small text-muted mb-0">
                                Компоненты можно добавить сейчас или позже на странице рецепта.
                            </p>
                        ) : (
                            <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                                {components.map((c) => (
                                    <li
                                        key={c.key}
                                        className="d-flex justify-content-between align-items-center border rounded-2 px-2 py-1"
                                    >
                                        <div className="small">
                                            <div className="fw-semibold">{c.productName}</div>
                                            <div className="text-muted">
                                                {c.amount} × {c.servingLabel}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            aria-label="Удалить компонент"
                                            onClick={() => onRemoveComponent(c.key)}
                                        >
                                            <IoTrashOutline size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                        {isSubmitting ? 'Создание…' : 'Создать рецепт'}
                    </button>
                </form>
            </div>
            <BottomNav />
        </div>
    )
}
