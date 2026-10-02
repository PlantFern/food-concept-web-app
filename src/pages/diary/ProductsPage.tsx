import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { DeferredImage } from '@/components/ui/DeferredImage'
import {
    fetchRecentWeekFoods,
    fetchTemplates,
    searchProducts,
    searchRecipes,
    type ProductListItem,
    type RecipeListItem,
    type RecentDayGroup,
    type TemplateListItem,
} from '@/api/products'

type TabKey = 'products' | 'recipes' | 'templates' | 'recent'

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
    const [recipes, setRecipes] = useState<RecipeListItem[]>([])
    const [templates, setTemplates] = useState<TemplateListItem[]>([])
    const [recent, setRecent] = useState<RecentDayGroup[]>([])
    const [loading, setLoading] = useState(false)

    const showSearch = tab === 'products' || tab === 'recipes'

    const loadTab = useCallback(async (key: TabKey, q: string) => {
        setLoading(true)
        try {
            if (key === 'products') {
                setProducts(await searchProducts(q.trim()))
            } else if (key === 'recipes') {
                setRecipes(await searchRecipes(q.trim()))
            } else if (key === 'templates') {
                setTemplates(await fetchTemplates())
            } else {
                setRecent(await fetchRecentWeekFoods())
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadTab(tab, query)
    }, [tab, loadTab])

    useEffect(() => {
        if (!showSearch) return
        const t = window.setTimeout(() => {
            void loadTab(tab, query)
        }, 300)
        return () => window.clearTimeout(t)
    }, [query, showSearch, tab, loadTab])

    const emptyHint = useMemo(() => {
        if (loading) return 'Загрузка…'
        if (tab === 'products') return 'Продукты не найдены'
        if (tab === 'recipes') return 'Рецепты не найдены'
        if (tab === 'templates') return 'Шаблонов пока нет'
        return 'За последние 7 дней записей нет'
    }, [loading, tab])

    return (
        <div className="diary-shell">
            <div className="diary-content p-3 pb-5">
                <h1 className="h5 mb-3">Продукты</h1>

                <ul className="nav nav-tabs mb-3" role="tablist">
                    {(
                        [
                            ['products', 'Продукты'],
                            ['recipes', 'Рецепты'],
                            ['templates', 'Шаблоны'],
                            ['recent', '7 дней'],
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

                {tab === 'products' && (
                    <ul className="list-group list-group-flush">
                        {products.length === 0 && (
                            <li className="list-group-item text-muted">{emptyHint}</li>
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
                )}

                {tab === 'recipes' && (
                    <ul className="list-group list-group-flush">
                        {recipes.length === 0 && (
                            <li className="list-group-item text-muted">{emptyHint}</li>
                        )}
                        {recipes.map((r) => (
                            <li
                                key={r.id}
                                className="list-group-item d-flex align-items-center gap-2"
                            >
                                <DeferredImage src={r.imageUrl} alt={r.name} />
                                <div>
                                    <div className="fw-semibold">{r.name}</div>
                                    {r.description && (
                                        <div className="small text-muted">{r.description}</div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {tab === 'templates' && (
                    <ul className="list-group list-group-flush">
                        {templates.length === 0 && (
                            <li className="list-group-item text-muted">{emptyHint}</li>
                        )}
                        {templates.map((t) => (
                            <li key={t.id} className="list-group-item">
                                <div className="fw-semibold">{t.name}</div>
                                {t.scheduledTime && (
                                    <div className="small text-muted">{t.scheduledTime}</div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {tab === 'recent' && (
                    <div>
                        {recent.length === 0 && (
                            <p className="text-muted mb-0">{emptyHint}</p>
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
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
