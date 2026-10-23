import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { IoChevronDown, IoTrashOutline } from 'react-icons/io5';
import { BottomNav } from '@/components/diary';
import { NavigateBackButton } from '@/components/ui/NavigateBackButton';
import {
    getMealTemplate,
    createMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
    addTemplateRecord,
    deleteTemplateRecord,
    formatTemplateAmount,
    type TemplateFoodRecordItem,
} from '@/api/meals';
import {
    searchProductsPage,
    fetchProductDetail,
    type ProductListItem,
    type FoodServingDto,
} from '@/api/food';
import { useAlert } from '@/components/ui/Alert';
import { getErrorMessage } from '@/lib/errors';
import { getDiaryProfileId } from '@/api/onboarding.ts';
import styles from './RecipeCreateFormPage.module.css';


type TemplateFormValues = {
    name: string
    scheduledTime: string
    frequency: string
};

type DraftItem = {
    key: string
    /** existing backend record id when editing */
    recordId?: number
    productName: string
    servingId: number
    servingLabel: string
    amount: number
};

const PAGE_SIZE = 20;

function toTimeInput(value?: string | null): string {

    if (!value) 
        return '';
    if (value.length >= 5) 
        return value.slice(0, 5);

    return value;
}

function todayIso(): string {

    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function servingLabel(s: FoodServingDto): string {

    const unit = s.servingUnit?.code || s.servingUnit?.name || '';
    const parts = [
        s.description,
        s.amount != null ? String(s.amount) : null,
        unit,
        s.gramWeight != null 
            ? `${s.gramWeight} г` 
            : null,
    ].filter(Boolean);

    return parts.join(' · ') || `Serving #${s.id}`;
}


export function MealTemplateFormPage() {

    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const { templateId } = useParams();
    const isEdit = Boolean(templateId);
    const id = Number(templateId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [items, setItems] = useState<DraftItem[]>([]);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [productQuery, setProductQuery] = useState('');
    const [productResults, setProductResults] = useState<ProductListItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searching, setSearching] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
    const [servings, setServings] = useState<FoodServingDto[]>([]);
    const [selectedServingId, setSelectedServingId] = useState<number | ''>('');
    const [componentAmount, setComponentAmount] = useState('1');

    const listRef = useRef<HTMLUListElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TemplateFormValues>({
        mode: 'onTouched',
        defaultValues: { name: '', scheduledTime: '', frequency: '1' },
    });

    const loadProducts = useCallback(
        async (query: string, pageNum: number, append: boolean) => {

            if (append) 
                setLoadingMore(true);

            else 
                setSearching(true);

            try {

                const res = await searchProductsPage(query, pageNum, PAGE_SIZE);
                setProductResults((prev) => (append ? [...prev, ...res.items] : res.items));
                setPage(res.page);
                setHasMore(!res.last);
            } finally {

                setSearching(false);
                setLoadingMore(false);
            }
        },
        [],
    );

    useEffect(() => {

        if (!dropdownOpen) 
            return;

        const t = window.setTimeout(() => {
            void loadProducts(productQuery.trim(), 0, false);
        }, 250);

        return () => window.clearTimeout(t);
    }, [productQuery, dropdownOpen, loadProducts]);

    useEffect(() => {

        if (!dropdownOpen) 
            return;

        const onDoc = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        }

        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [dropdownOpen]);

    useEffect(() => {
        let cancelled = false;

        if (!isEdit) {

            const profileId = getDiaryProfileId();
            if (!profileId) {
                showAlert('Не удалось определить профиль дневника', 'warning');
                navigate(-1);
                return;
            }
            setItems([]);
            setLoading(false);
            return;
        }

        ;(async () => {

            setLoading(true);
            setError('');
            try {

                const data = await getMealTemplate(id);

                if (cancelled) 
                    return;

                reset({
                    name: data.name ?? '',
                    scheduledTime: toTimeInput(data.scheduledTime),
                    frequency: data.frequency != null 
                        ? String(data.frequency) 
                        : '1',
                });

                const records = (data.records ?? []) as TemplateFoodRecordItem[];

                setItems(
                    records.map((r) => ({
                        key: `rec-${r.id}`,
                        recordId: r.id,
                        productName: r.productDescription || `Serving #${r.servingId}`,
                        servingId: r.servingId,
                        servingLabel: formatTemplateAmount(r),
                        amount: r.amount ?? r.servingAmount ?? 1,
                    })),
                );
            } catch (err: unknown) {

                if (!cancelled) {
                    showAlert(getErrorMessage(err, 'Не удалось загрузить шаблон'), 'danger');
                    navigate(-1);
                }
            } finally {
                if (!cancelled) 
                    setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        }
    }, [templateId, isEdit, id, reset, navigate, showAlert]);

    function onListScroll() {

        const el = listRef.current;

        if (!el || !hasMore || loadingMore || searching) 
            return;

        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
            void loadProducts(productQuery.trim(), page + 1, true);
        }
    }

    async function onPickProduct(p: ProductListItem) {

        setSelectedProduct(p);
        setDropdownOpen(false);
        setError('');

        const detail = await fetchProductDetail(p.id);

        const list = detail?.servings ?? [];

        setServings(list);
        setSelectedServingId(list[0]?.id ?? '');
    }

    function onAddItem() {

        if (selectedProduct == null || !selectedServingId) {
            setError('Выберите продукт и порцию');
            return;
        }

        const amount = Number(componentAmount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Количество должно быть больше 0');
            return;
        }

        const serving = servings.find((s) => s.id === Number(selectedServingId));

        if (!serving) {
            setError('Порция не найдена');
            return;
        }

        setItems((prev) => [
            ...prev,
            {
                key: `new-${selectedProduct.id}-${selectedServingId}-${Date.now()}`,
                productName: selectedProduct.name,
                servingId: Number(selectedServingId),
                servingLabel: servingLabel(serving),
                amount,
            },
        ]);
        setComponentAmount('1');
        setError('');
    }

    async function onRemoveItem(item: DraftItem) {
        if (item.recordId != null) {

            if (!window.confirm('Убрать продукт из шаблона?')) 
                return;

            try {
                await deleteTemplateRecord(item.recordId);
                showAlert('Продукт убран', 'success');
            } catch (err: unknown) {
                showAlert(getErrorMessage(err, 'Не удалось удалить'), 'danger');
                return;
            }
        }
        setItems((prev) => prev.filter((x) => x.key !== item.key));
    }

    const onSubmit = async (formData: TemplateFormValues) => {
        setError('');
        const frequency = Number(formData.frequency);
        const startedAt = todayIso();

        try {
            if (isEdit) {

                await updateMealTemplate(
                    id,
                    formData.name.trim(),
                    formData.scheduledTime,
                    frequency,
                    startedAt,
                );
                
                for (const item of items) {
                    if (item.recordId != null) continue;
                    await addTemplateRecord(id, item.servingId, item.amount);
                }

                showAlert('Шаблон сохранён', 'success');
                navigate('/diary/products?tab=templates', { replace: true });
            } else {

                const newId = await createMealTemplate(
                    formData.name.trim(),
                    formData.scheduledTime,
                    frequency,
                    startedAt,
                );

                for (const item of items) {
                    await addTemplateRecord(newId, item.servingId, item.amount);
                }

                showAlert(
                    items.length
                        ? 'Шаблон создан с продуктами'
                        : 'Шаблон создан',
                    'success',
                )

                navigate(`/diary/templates/${newId}/edit`, { replace: true });
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить шаблон'));
        }
    }


    const onDelete = async () => {

        if (!isEdit) 
            return;

        if (!window.confirm('Удалить шаблон?')) 
            return;

        setDeleting(true);
        setError('');

        try {

            await deleteMealTemplate(id);
            showAlert('Шаблон удалён', 'success');
            navigate('/diary/products?tab=templates', { replace: true });
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось удалить'));
        } finally {
            setDeleting(false);
        }
    }

    
    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className='d-flex gap-3
                            justify-content-start align-items-center
                            bg-brand text-invert 
                            p-4 
                            rounded-bottom-4'>
                <NavigateBackButton label="Назад" className="btn-tertiary-invert" />

                <p className="page-title text-center p-2 bg-text-on-brand">Настройки</p>
            </div>

            <div className="diary-content p-3" style={{ paddingBottom: '7.5rem' }}>

                {loading && <p className="no-content-placeholder">Загрузка…</p>}
                
                {!loading && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="surface-card surface-card-column w-100"
                    >
                        {error && <p className="text-danger small mb-0">{error}</p>}

                        <div className="d-flex flex-column gap-1">
                            <label htmlFor="name" className="label">
                                Название
                            </label>
                            <input
                                className="input rounded-3"
                                id="name"
                                type="text"
                                {...register('name', {
                                    required: 'Укажите название',
                                    validate: (v) =>
                                        v.trim().length > 0 || 'Укажите название',
                                })}
                            />
                            {errors.name && (
                                <span className="input-error-text">{errors.name.message}</span>
                            )}
                        </div>

                        <div className="d-flex flex-column gap-1">
                            <label htmlFor="scheduledTime" className="label">
                                Время
                            </label>
                            <input
                                className="input rounded-3"
                                id="scheduledTime"
                                type="time"
                                {...register('scheduledTime', { required: 'Укажите время' })}
                            />
                            {errors.scheduledTime && (
                                <span className="input-error-text">
                                    {errors.scheduledTime.message}
                                </span>
                            )}
                        </div>

                        <div className="d-flex flex-column gap-1">
                            <label htmlFor="frequency" className="label">
                                Частота (дней)
                            </label>
                            <input
                                className="input rounded-3"
                                id="frequency"
                                type="number"
                                min={1}
                                step={1}
                                {...register('frequency', {
                                    required: 'Укажите частоту',
                                    validate: (value) => {
                                        const n = Number(value)
                                        if (!Number.isFinite(n) || n < 1) {
                                            return 'Частота — целое число ≥ 1'
                                        }
                                        return true
                                    },
                                })}
                            />
                            {errors.frequency && (
                                <span className="input-error-text">{errors.frequency.message}</span>
                            )}
                        </div>

                        <div className={styles.componentsBlock}>
                            <strong className="d-block mb-2">Продукты в шаблоне</strong>

                            <div className={styles.dropdown} ref={dropdownRef}>
                                <button
                                    type="button"
                                    className={styles.dropdownTrigger}
                                    onClick={() => setDropdownOpen((o) => !o)}
                                    aria-expanded={dropdownOpen}
                                >
                                    <span className={styles.triggerLabel}>
                                        {selectedProduct?.name ?? 'Выберите продукт'}
                                    </span>
                                    <IoChevronDown size={16} />
                                </button>

                                {dropdownOpen && (
                                    <div className={styles.dropdownPanel}>
                                        <input
                                            className={styles.searchInput}
                                            type="search"
                                            placeholder="Поиск…"
                                            value={productQuery}
                                            onChange={(e) => setProductQuery(e.target.value)}
                                            autoFocus
                                        />
                                        <ul
                                            className={styles.dropdownList}
                                            ref={listRef}
                                            onScroll={onListScroll}
                                        >
                                            {searching && productResults.length === 0 && (
                                                <li className={styles.listHint}>Поиск…</li>
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
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {selectedProduct != null && servings.length > 0 && (
                                <div className={styles.servingRow}>
                                    <div className="flex-grow-1">
                                        <label className="small mb-1 d-block" htmlFor="tpl-serving">
                                            Порция
                                        </label>
                                        <select
                                            id="tpl-serving"
                                            className="form-select form-select-sm"
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
                                    </div>
                                    <div style={{ width: 88 }}>
                                        <label className="small mb-1 d-block" htmlFor="tpl-amount">
                                            Кол-во
                                        </label>
                                        <input
                                            id="tpl-amount"
                                            type="number"
                                            className="form-control form-control-sm"
                                            min={0.01}
                                            step="any"
                                            value={componentAmount}
                                            onChange={(e) => setComponentAmount(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={onAddItem}
                                    >
                                        +
                                    </button>
                                </div>
                            )}

                            {items.length === 0 ? (
                                <p className="text-muted small mt-2 mb-0">Пока пусто — добавьте продукты выше</p>
                            ) : (
                                <ul className={styles.componentList}>
                                    {items.map((item) => (
                                        <li key={item.key} className={styles.componentItem}>
                                            <div>
                                                <div className="fw-semibold small">{item.productName}</div>
                                                <div className="text-muted small">
                                                    {item.servingLabel} × {item.amount}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => void onRemoveItem(item)}
                                                aria-label="Удалить"
                                            >
                                                <IoTrashOutline size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || deleting}
                            className="btn btn-primary w-100 mt-2"
                        >
                            {isSubmitting
                                ? 'Сохранение...'
                                : isEdit
                                ? 'Сохранить'
                                : 'Создать'}
                        </button>

                        {isEdit && (
                            <button
                                type="button"
                                disabled={isSubmitting || deleting}
                                className="btn btn-outline-danger w-100 d-inline-flex align-items-center justify-content-center gap-2"
                                onClick={() => void onDelete()}
                            >
                                <IoTrashOutline size={18} />
                                {deleting ? 'Удаление...' : 'Удалить шаблон'}
                            </button>
                        )}
                    </form>
                )}
            </div>

            <BottomNav />
        </div>
    )
}
