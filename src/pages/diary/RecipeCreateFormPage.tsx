import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { IoChevronDown, IoTrashOutline } from 'react-icons/io5'
import { BottomNav } from '@/components/diary'
import { http } from '@/api/http'
import { uploadFile } from '@/api/files'
import {
    searchProductsPage,
    fetchProductDetail,
    type ProductListItem,
    type FoodServingDto,
} from '@/api/food'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import styles from './RecipeCreateFormPage.module.css'

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

const PAGE_SIZE = 20

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

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [productQuery, setProductQuery] = useState('')
    const [productResults, setProductResults] = useState<ProductListItem[]>([])
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [searching, setSearching] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)

    const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null)
    const [servings, setServings] = useState<FoodServingDto[]>([])
    const [selectedServingId, setSelectedServingId] = useState<number | ''>('')
    const [componentAmount, setComponentAmount] = useState('1')
    const [components, setComponents] = useState<DraftComponent[]>([])

    const listRef = useRef<HTMLUListElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const {
        register,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<FormValues>({
        defaultValues: { name: '', description: '', recipe: '' },
    })

    const loadProducts = useCallback(
        async (query: string, pageNum: number, append: boolean) => {
            if (append) setLoadingMore(true)
            else setSearching(true)
            try {
                const res = await searchProductsPage(query, pageNum, PAGE_SIZE)
                setProductResults((prev) => (append ? [...prev, ...res.items] : res.items))
                setPage(res.page)
                setHasMore(!res.last && res.items.length > 0)
            } catch (err: unknown) {
                if (!append) {
                    setError(getErrorMessage(err, 'Не удалось загрузить продукты'))
                    setProductResults([])
                    setHasMore(false)
                }
            } finally {
                setSearching(false)
                setLoadingMore(false)
            }
        },
        [],
    )

    // Initial load + debounced search when query changes
    useEffect(() => {
        if (!dropdownOpen) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            void loadProducts(productQuery.trim(), 0, false)
        }, 300)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [productQuery, dropdownOpen, loadProducts])

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return
        function onOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', onOutside)
        return () => document.removeEventListener('mousedown', onOutside)
    }, [dropdownOpen])

    function onListScroll() {
        const el = listRef.current
        if (!el || loadingMore || searching || !hasMore) return
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
        if (nearBottom) {
            void loadProducts(productQuery.trim(), page + 1, true)
        }
    }

    async function onPickProduct(p: ProductListItem) {
        setSelectedProduct(p)
        setDropdownOpen(false)
        setError('')
        const detail = await fetchProductDetail(p.id)
        const list = detail?.servings ?? []
        setServings(list)
        setSelectedServingId(list[0]?.id ?? '')
    }

    function onAddComponent() {
        if (selectedProduct == null || !selectedServingId) {
            setError('Выберите продукт и порцию')
            return
        }
        const amount = Number(componentAmount)
        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Количество компонента должно быть больше 0')
            return
        }
        const serving = servings.find((s) => s.id === Number(selectedServingId))
        if (!serving) {
            setError('Порция не найдена')
            return
        }
        setComponents((prev) => [
            ...prev,
            {
                key: `${selectedProduct.id}-${selectedServingId}-${Date.now()}`,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
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

                    <div className={styles.componentsBlock}>
                        <p className="label mb-2">Компоненты</p>

                        {/* Product search dropdown with infinite scroll */}
                        <div className={styles.dropdown} ref={dropdownRef}>
                            <button
                                type="button"
                                className={styles.dropdownTrigger}
                                onClick={() => setDropdownOpen((o) => !o)}
                                aria-haspopup="listbox"
                                aria-expanded={dropdownOpen}
                            >
                                <span className={styles.triggerLabel}>
                                    {selectedProduct?.name ?? 'Выберите продукт'}
                                </span>
                                <IoChevronDown size={18} />
                            </button>

                            {dropdownOpen && (
                                <div className={styles.dropdownPanel}>
                                    <input
                                        className={styles.searchInput}
                                        placeholder="Поиск…"
                                        value={productQuery}
                                        onChange={(e) => setProductQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <ul
                                        ref={listRef}
                                        className={styles.dropdownList}
                                        role="listbox"
                                        onScroll={onListScroll}
                                    >
                                        {searching && productResults.length === 0 && (
                                            <li className={styles.listHint}>Загрузка…</li>
                                        )}
                                        {!searching && productResults.length === 0 && (
                                            <li className={styles.listHint}>Ничего не найдено</li>
                                        )}
                                        {productResults.map((p) => (
                                            <li key={p.id} className={styles.listItem}>
                                                <button
                                                    type="button"
                                                    className={`${styles.listBtn} ${
                                                        selectedProduct?.id === p.id
                                                            ? styles.listBtnActive
                                                            : ''
                                                    }`}
                                                    onClick={() => void onPickProduct(p)}
                                                >
                                                    {p.name}
                                                </button>
                                            </li>
                                        ))}
                                        {loadingMore && (
                                            <li className={styles.listHint}>Ещё…</li>
                                        )}
                                        {!hasMore && productResults.length > 0 && (
                                            <li className={styles.listHint}>Все загружено</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {selectedProduct != null && servings.length > 0 && (
                            <div className={styles.servingRow}>
                                <label className="small mb-0 flex-grow-1">
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
                                <label className="small mb-0" style={{ width: 90 }}>
                                    Кол-во
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
                                    className="btn btn-sm btn-outline-primary align-self-end"
                                    onClick={onAddComponent}
                                >
                                    +
                                </button>
                            </div>
                        )}

                        {components.length === 0 ? (
                            <p className="small text-muted mb-0 mt-2">
                                Компоненты можно добавить сейчас или позже на странице рецепта.
                            </p>
                        ) : (
                            <ul className={styles.componentList}>
                                {components.map((c) => (
                                    <li key={c.key} className={styles.componentItem}>
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
