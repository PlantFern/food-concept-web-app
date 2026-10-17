import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { DeferredImage } from '@/components/ui/DeferredImage'
import {
    searchProductsPage,
    searchRecipes,
    type ProductListItem,
    type RecipeListItem,
} from '@/api/food'
import { fetchTemplates, type TemplateListItem } from '@/api/meals'
import { fetchRecentWeekFoods, type RecentDayFoodGroupDto } from '@/api/diaryProfile/recent'
import styles from './ProductDetailPage.module.css'

type TabKey = 'products' | 'recipes' | 'templates' | 'recent'

const PAGE_SIZE = 12

const TABS: { key: TabKey; label: string }[] = [
    { key: 'products', label: 'Продукты' },
    { key: 'recipes', label: 'Рецепты' },
    { key: 'templates', label: 'Шаблоны' },
    { key: 'recent', label: 'Недавнее' },
]

const thumbStyle: CSSProperties = {
    width: 45,
    height: 45,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
}

export function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const tab = (searchParams.get('tab') as TabKey) || 'products'
    const [query, setQuery] = useState('')
    const [showSearch, setShowSearch] = useState(false)

    const [products, setProducts] = useState<ProductListItem[]>([])
    const [recipes, setRecipes] = useState<RecipeListItem[]>([])
    const [templates, setTemplates] = useState<TemplateListItem[]>([])
    const [recent, setRecent] = useState<RecentDayFoodGroupDto[]>([])

    const [page, setPage] = useState(0)
    const [last, setLast] = useState(true)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const sentinelRef = useRef<HTMLDivElement | null>(null)

    const mealTypeId = searchParams.get('mealTypeId')
    const date = searchParams.get('date')

    function setTab(key: TabKey) {
        const next = new URLSearchParams(searchParams)
        next.set('tab', key)
        setSearchParams(next, { replace: true })
    }

    function productHref(productId: number): string {
        const q = new URLSearchParams()
        if (mealTypeId) q.set('mealTypeId', mealTypeId)
        if (date) q.set('date', date)
        const qs = q.toString()
        return qs ? `/diary/products/${productId}?${qs}` : `/diary/products/${productId}`
    }

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
        const timer = window.setTimeout(() => {
            void loadTab(tab, query)
        }, 300)
        return () => window.clearTimeout(timer)
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
            <style>{`
                .product-list-thumb,
                .product-list-thumb img {
                    width: 45px !important;
                    height: 45px !important;
                    border-radius: 8px;
                    object-fit: cover;
                    flex-shrink: 0;
                }
            `}</style>
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <h2 className="page-title text-center p-2 bg-text-on-brand mb-0">Каталог</h2>
            </div>

            <div className="diary-content container pb-5">
                <div className="d-flex gap-2 mb-3 flex-wrap">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary ms-auto"
                        onClick={() => setShowSearch((v) => !v)}
                    >
                        {showSearch ? 'Скрыть поиск' : 'Поиск'}
                    </button>
                </div>

                {showSearch && tab !== 'recent' && (
                    <input
                        className="form-control mb-3"
                        placeholder="Поиск…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                )}

                {tab === 'products' && (
                    <>
                        <div className="d-flex justify-content-end mb-2">
                            <Link to="/diary/products/create" className="btn btn-sm btn-primary">
                                + Продукт
                            </Link>
                        </div>
                        {products.length === 0 ? (
                            <p className="text-muted">{emptyHint}</p>
                        ) : (
                            <ul className="list-unstyled mb-0">
                                {products.map((p) => (
                                    <li key={p.id} className="border-bottom py-2">
                                        <Link
                                            to={productHref(p.id)}
                                            className="d-flex align-items-center gap-2 text-decoration-none text-body"
                                        >
                                            <DeferredImage
                                                src={p.imageUrl}
                                                alt={p.name}
                                                className="product-list-thumb"
                                                style={thumbStyle}
                                            />
                                            <span className="fw-semibold">{p.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div ref={sentinelRef} className="py-2 text-center small text-muted">
                            {loadingMore ? 'Загрузка…' : !last ? '…' : ''}
                        </div>
                    </>
                )}

                {tab === 'recipes' && (
                    <>
                        <div className="d-flex justify-content-end mb-2">
                            <Link to="/diary/recipes/create" className="btn btn-sm btn-primary">
                                + Рецепт
                            </Link>
                        </div>
                        {recipes.length === 0 ? (
                            <p className="text-muted">{emptyHint}</p>
                        ) : (
                            <ul className="list-unstyled mb-0">
                                {recipes.map((r) => (
                                    <li key={r.id} className="border-bottom py-2">
                                        <Link
                                            to={`/diary/recipes/${r.id}`}
                                            className="d-flex align-items-center gap-2 text-decoration-none text-body"
                                        >
                                            <DeferredImage
                                                src={r.imageUrl}
                                                alt={r.name}
                                                className="product-list-thumb"
                                                style={thumbStyle}
                                            />
                                            <span className="fw-semibold">{r.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {tab === 'templates' && (
                    <>
                        <div className="d-flex justify-content-end mb-2">
                            <Link to="/diary/templates/add" className="btn btn-sm btn-primary">
                                + Шаблон
                            </Link>
                        </div>
                        {templates.length === 0 ? (
                            <p className="text-muted">{emptyHint}</p>
                        ) : (
                            <ul className="list-unstyled mb-0">
                                {templates.map((t) => (
                                    <li key={t.id} className="border-bottom py-2">
                                        <Link
                                            to={`/diary/templates/${t.id}/edit`}
                                            className="text-decoration-none text-body fw-semibold"
                                        >
                                            {t.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {tab === 'recent' &&
                    (recent.length === 0 ? (
                        <p className="text-muted">{emptyHint}</p>
                    ) : (
                        recent.map((group) => (
                            <div key={group.date} className="mb-3">
                                <div className="small text-muted mb-1">{group.date}</div>
                                <ul className="list-unstyled mb-0">
                                    {group.items.map((item) => (
                                        <li key={item.recordId} className="border-bottom py-1 small">
                                            {item.name}
                                            {item.mealTypeCode ? ` · ${item.mealTypeCode}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ))}
            </div>
            <BottomNav />
        </div>
    )
}
