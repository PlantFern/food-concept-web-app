import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BottomNav } from '@/components/diary';
import { DeferredImage } from '@/components/ui/DeferredImage';
import {
    searchProductsPage,
    searchRecipes,
    type ProductListItem,
    type RecipeListItem,
} from '@/api/food';
import {
    fetchTemplates,
    fetchRecentWeekFoods,
    type TemplateListItem,
    type RecentDayGroup,
} from '@/api/meals';

type TabKey = 'products' | 'recipes' | 'templates' | 'recent';

const PAGE_SIZE = 12;

const TABS: { key: TabKey; label: string }[] = [
    { key: 'products', label: 'Продукты' },
    { key: 'recipes', label: 'Рецепты' },
    { key: 'templates', label: 'Шаблоны' },
    { key: 'recent', label: 'Недавнее' },
];

const thumbStyle: CSSProperties = {
    width: 45,
    height: 45,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
}

export function ProductsPage() {

    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (searchParams.get('tab') as TabKey) || 'products';
    const [query, setQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const [products, setProducts] = useState<ProductListItem[]>([]);
    const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
    const [templates, setTemplates] = useState<TemplateListItem[]>([]);
    const [recent, setRecent] = useState<RecentDayGroup[]>([]);

    const [page, setPage] = useState(0);
    const [last, setLast] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const mealTypeId = searchParams.get('mealTypeId');
    const date = searchParams.get('date');
    const templateId = searchParams.get('templateId');
    const isTemplatePick = Boolean(templateId);


    function setTab(key: TabKey) {

        const next = new URLSearchParams(searchParams);
        next.set('tab', key);
        setSearchParams(next, { replace: true });
    }

    function productHref(productId: number): string {

        const query = new URLSearchParams();

        if (templateId) 
            query.set('templateId', templateId);
        if (mealTypeId) 
            query.set('mealTypeId', mealTypeId);
        if (date) 
            query.set('date', date);

        const qs = query.toString();

        return qs ? `/diary/products/${productId}?${qs}` : `/diary/products/${productId}`;
    }

    function recipeHref(recipeId: number): string {

        const q = new URLSearchParams();

        if (templateId) 
            q.set('templateId', templateId);
        if (mealTypeId) 
            q.set('mealTypeId', mealTypeId);
        if (date) 
            q.set('date', date);

        const qs = q.toString();
        return qs ? `/diary/recipes/${recipeId}?${qs}` : `/diary/recipes/${recipeId}`;
    }

    async function loadProducts(q: string, pageNum: number, append: boolean) {

        if (append) 
            setLoadingMore(true);
        else 
            setLoading(true);

        try {
            const res = await searchProductsPage(q.trim(), pageNum, PAGE_SIZE);

            setProducts((prev) => (append ? [...prev, ...res.items] : res.items));
            setPage(res.page);
            setLast(res.last);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    async function loadTab(key: TabKey, q: string) {

        if (key === 'products') {
            await loadProducts(q, 0, false);
            return;
        }

        setLoading(true);

        try {
            if (key === 'recipes') {
                setRecipes(await searchRecipes(q.trim()));
            } else if (key === 'templates') {
                setTemplates(await fetchTemplates());
            } else {
                setRecent(await fetchRecentWeekFoods());
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadTab(tab, query);
    }, [tab])

    useEffect(() => {
        if (tab !== 'products' && tab !== 'recipes') 
            return;

        const t = window.setTimeout(() => {
            void loadTab(tab, query);
        }, 300);

        return () => window.clearTimeout(t);
    }, [query, tab]);

    useEffect(() => {

        if (tab !== 'products' || last || loading || loadingMore) 
            return;

        const el = sentinelRef.current;
        if (!el) return;

        const obs = new IntersectionObserver(
            (entries) => {

                if (entries.some((e) => e.isIntersecting)) {
                    void loadProducts(query, page + 1, true);
                }
            },
            { rootMargin: '120px' },
        );

        obs.observe(el);
        return () => obs.disconnect();
    }, [tab, last, loading, loadingMore, page, query]);

    let emptyHint = 'За последние 7 дней записей нет';

    if (loading) 
        emptyHint = 'Загрузка…';
    else if (tab === 'products') 
        emptyHint = 'Продукты не найдены';
    else if (tab === 'recipes') 
        emptyHint = 'Рецепты не найдены';
    else if (tab === 'templates') 
        emptyHint = 'Шаблонов пока нет';


    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="bg-brand text-invert 
                            p-4 pt-2 mb-2 
                            rounded-bottom-4">
                <h2 className="page-title text-center p-2 bg-text-on-brand">
                    {isTemplatePick ? 'Выбор продукта для шаблона' : 'Продукты'}
                </h2>

                {isTemplatePick && (
                    <div className="mb-2 text-center">
                        <Link
                            to={`/diary/templates/${templateId}/edit`}
                            className="btn-tertiary-inverted"
                        >
                            ← Назад к шаблону
                        </Link>
                    </div>
                )}

                {!isTemplatePick && (
                    <div className="tab-container">
                        <ul className="tab-container tab-nav nav nav-pills mb-3" role="tablist">
                            {TABS.map(({ key, label }) => (
                                <li className="" key={key}>
                                    <button
                                        type="button"
                                        role="tab"
                                        className={`btn btn-secondary-inverted`}
                                        disabled = {tab === key}
                                        aria-selected={tab === key}
                                        onClick={() => setTab(key)}
                                    >
                                        {label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {(tab === 'products' || tab === 'recipes' || isTemplatePick) && (
                    <div className="mb-2 d-flex gap-2">
                        {showSearch ? (
                            <input
                                type="search"
                                className="form-control"
                                placeholder={
                                    tab === 'recipes' && !isTemplatePick
                                        ? 'Поиск рецептов…'
                                        : 'Поиск продуктов…'
                                }
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                        ) : (
                            <button
                                type="button"
                                className="btn btn-secondary-inverted"
                                onClick={() => setShowSearch(true)}
                            >
                                Поиск
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="diary-content p-3">
                {(tab === 'products' || isTemplatePick) && (
                    <>
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
                                                style={thumbStyle}
                                            />
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
                        {!last && <div ref={sentinelRef} style={{ height: 24 }} />}
                        {loadingMore && (
                            <p className="text-muted small text-center mt-2 mb-0">Ещё…</p>
                        )}
                    </>
                )}

                {!isTemplatePick && tab === 'recipes' && (
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
                                            to={recipeHref(r.id)}
                                            className="d-flex align-items-center gap-2 text-decoration-none text-body"
                                        >
                                            <DeferredImage
                                                src={r.imageUrl}
                                                alt={r.name}
                                                style={thumbStyle}
                                            />
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
                    </>
                )}

                {!isTemplatePick && tab === 'templates' && (
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

                {!isTemplatePick &&
                    tab === 'recent' &&
                    (recent.length === 0 ? (
                        <p className="text-muted">{emptyHint}</p>
                    ) : (
                        recent.map((group) => (
                            <div key={group.date} className="mb-3">
                                <div className="small text-muted mb-1">{group.date}</div>
                                <ul className="list-unstyled mb-0">
                                    {group.items.map((item) => (
                                        <li key={item.id} className="border-bottom py-1 small">
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
