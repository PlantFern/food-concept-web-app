import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { DeferredImage } from '@/components/ui/DeferredImage'
import {
    searchProductsPage,
    searchRecipes,
    type ProductListItem,
    type RecipeListItem,
} from '@/api/food'
import {
    fetchRecentWeekFoods,
    fetchTemplates,
    type RecentDayGroup,
    type TemplateListItem,
} from '@/api/meals'
import { ImFileEmpty } from 'react-icons/im'
import { FaPlus } from 'react-icons/fa6'

type TabKey = 'products' | 'recipes' | 'templates' | 'recent'

const PAGE_SIZE = 12

function formatDayLabel(iso: string): string {
    const d = new Date(iso + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    })
}

export function ProductsPage() {
    const [tab, setTab] = useState<TabKey>('products')
    const [query, setQuery] = useState('')
    const [products, setProducts] = useState<ProductListItem[]>([])
    const [page, setPage] = useState(0)
    const [last, setLast] = useState(true)
    const [recipes, setRecipes] = useState<RecipeListItem[]>([])
    const [templates, setTemplates] = useState<TemplateListItem[]>([])
    const [recent, setRecent] = useState<RecentDayGroup[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const sentinelRef = useRef<HTMLDivElement | null>(null)

    const showSearch = tab === 'products' || tab === 'recipes'

    async function loadProducts(q: string, pageNum: number, append: boolean) {
        if (append) setLoadingMore(true)
        else setLoading(true)
        try {
            const res = await searchProductsPage(q.trim(), pageNum, PAGE_SIZE)
            setProducts((prev) => (append ? [...prev, ...res.items] : res.items))
            setPage(res.page)
            setLast(res.last)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    async function loadTab(key: TabKey, q: string) {
        if (key === 'products') {
            await loadProducts(q, 0, false)
            return
        }
        setLoading(true)
        try {
            if (key === 'recipes') {
                setRecipes(await searchRecipes(q.trim()))
            } else if (key === 'templates') {
                setTemplates(await fetchTemplates())
            } else {
                setRecent(await fetchRecentWeekFoods())
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadTab(tab, query)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab])

    useEffect(() => {
        if (!showSearch) return
        const t = window.setTimeout(() => {
            void loadTab(tab, query)
        }, 300)
        return () => window.clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, showSearch, tab])

    useEffect(() => {
        if (tab !== 'products' || last || loading || loadingMore) return
        const el = sentinelRef.current
        if (!el) return

        const obs = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    void loadProducts(query, page + 1, true)
                }
            },
            { rootMargin: '120px' },
        )
        obs.observe(el)
        return () => obs.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, last, loading, loadingMore, page, query])

    let emptyHint = 'За последние 7 дней записей нет'
    if (loading) emptyHint = 'Загрузка…'
    else if (tab === 'products') emptyHint = 'Продукты не найдены'
    else if (tab === 'recipes') emptyHint = 'Рецепты не найдены'
    else if (tab === 'templates') emptyHint = 'Шаблонов пока нет'

    return (
        <div className="diary-shell">
            <div>
                <div className="bg-brand text-invert p-2 rounded-bottom-4">
                    <h2 className="page-title text-center p-2 bg-text-on-brand">Продукты</h2>

                    <div className="tab-container">
                        <ul className="tab-nav nav nav-pills mb-3" role="tablist">
                            {(
                                [
                                    ['products', 'Продукты'],
                                    ['recipes', 'Рецепты'],
                                    ['templates', 'Шаблоны'],
                                    ['recent', 'За неделю'],
                                ] as const
                            ).map(([key, label]) => (
                                <li className="nav-item" key={key}>
                                    <button
                                        type="button"
                                        role="tab"
                                        className={`nav-link ${tab === key ? 'active' : ''}`}
                                        aria-selected={tab === key}
                                        onClick={() => setTab(key)}
                                    >
                                        {label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {showSearch && (
                        <div className="mb-3">
                            <input
                                type="search"
                                className="form-control"
                                placeholder={
                                    tab === 'products'
                                        ? 'Поиск продуктов…'
                                        : 'Поиск рецептов…'
                                }
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="diary-content">
                    {tab === 'products' && (
                        <>
                            <ul className="list-group list-group-flush rounded-4">
                                {products.length === 0 && (
                                    <div className="no-content-placeholder">
                                        <div>{emptyHint}</div>
                                        <ImFileEmpty size={24} />
                                    </div>
                                )}
                                {products.map((p) => (
                                    <li key={p.id} className="list-group-item p-0">
                                        <Link
                                            to={`/diary/products/${p.id}`}
                                            className="d-flex align-items-center gap-2 text-decoration-none text-reset p-3"
                                        >
                                            <DeferredImage src={p.imageUrl} alt={p.name} />
                                            <div>
                                                <div className="fw-semibold">{p.name}</div>
                                                {p.categoryCode && (
                                                    <div className="small text-muted">{p.categoryCode}</div>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {!last && <div ref={sentinelRef} style={{ height: 24 }} />}
                            {loadingMore && (
                                <p className="text-muted small text-center mt-2 mb-0">Ещё…</p>
                            )}
                        </>
                    )}

                    {tab === 'recipes' && (
                        <ul className="list-group list-group-flush">
                            {recipes.length === 0 && (
                                <div className="no-content-placeholder">
                                    <div>{emptyHint}</div>
                                    <ImFileEmpty size={24} />
                                </div>
                            )}
                            {recipes.map((r) => (
                                <li key={r.id} className="list-group-item p-0">
                                    <Link
                                        to={`/diary/recipes/${r.id}`}
                                        className="d-flex align-items-center gap-2 text-decoration-none text-reset p-3"
                                    >
                                        <DeferredImage src={r.imageUrl} alt={r.name} />
                                        <div>
                                            <div className="fw-semibold">{r.name}</div>
                                            {r.description && (
                                                <div className="small text-muted">{r.description}</div>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {tab === 'templates' && (
                        <>
                            <div className="d-flex justify-content-end mb-2 px-2">
                                <Link to="/diary/templates/add" className="btn btn-primary btn-sm">
                                    Добавить шаблон
                                    <FaPlus className="ms-2 mb-1" />
                                </Link>
                            </div>
                            <ul className="list-group list-group-flush">
                                {templates.length === 0 && (
                                    <div className="no-content-placeholder">
                                        <div>{emptyHint}</div>
                                        <Link to="/diary/templates/add" className="btn btn-primary">
                                            Добавить шаблон
                                            <FaPlus className="ms-3 mb-1" />
                                        </Link>
                                    </div>
                                )}
                                {templates.map((t) => (
                                    <li key={t.id} className="list-group-item p-0">
                                        <Link
                                            to={`/diary/templates/${t.id}/edit`}
                                            className="d-block text-decoration-none text-reset p-3"
                                        >
                                            <div className="fw-semibold">{t.name}</div>
                                            {t.scheduledTime && (
                                                <div className="small text-muted">{t.scheduledTime}</div>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {tab === 'recent' && (
                        <div>
                            {recent.length === 0 && (
                                <div className="no-content-placeholder">
                                    <div>{emptyHint}</div>
                                    <ImFileEmpty size={24} />
                                </div>
                            )}
                            {recent.map((day) => (
                                <div key={day.date} className="mb-3">
                                    <div className="small text-muted mb-1">
                                        {formatDayLabel(day.date)}
                                    </div>
                                    <ul className="list-group list-group-flush">
                                        {day.items.map((item) => (
                                            <li key={`${day.date}-${item.id}`} className="list-group-item">
                                                {item.name}
                                                {item.mealTypeCode && (
                                                    <span className="small text-muted ms-2">
                                                        {item.mealTypeCode}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <BottomNav />
        </div>
    )
}
