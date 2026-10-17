import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { addQuickProductRecord } from '@/api/food'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { getDiaryProfileId } from '@/api/onboarding.ts'
import { CORE_GOAL_NUTRIENT_IDS, NUTRIENT_BY_ID, unitLabel } from '@/data/nutrients'

const MEAL_TYPES = [
    { id: 1, label: 'Завтрак' },
    { id: 2, label: 'Обед' },
    { id: 3, label: 'Перекус' },
    { id: 4, label: 'Ужин' },
    { id: 5, label: 'Другое' },
]

type QuickProductFormValues = {
    mealTypeId: string
    date: string
    eatenAt: string
    amount: string
    description: string
    gramWeight: string
    energy: string
    protein: string
    fat: string
    carbs: string
}

function todayIso(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function nowTime(): string {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function QuickProductFormPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<QuickProductFormValues>({
        mode: 'onTouched',
        defaultValues: {
            mealTypeId: searchParams.get('mealTypeId') ?? '1',
            date: searchParams.get('date') ?? todayIso(),
            eatenAt: searchParams.get('eatenAt') ?? nowTime(),
            amount: '1',
            description: '',
            gramWeight: '100',
            energy: '',
            protein: '',
            fat: '',
            carbs: '',
        },
    })

    useEffect(() => {
        setLoading(true)
        const profileId = getDiaryProfileId()
        if (!profileId) {
            showAlert('Не удалось определить профиль дневника', 'warning')
            navigate(-1)
            return
        }
        setLoading(false)
    }, [navigate, showAlert])

    const onSubmit = async (formData: QuickProductFormValues) => {
        setError('')
        const nutrients: Record<string, number> = {}
        const pairs: Array<[string, string]> = [
            ['1', formData.energy],
            ['2', formData.protein],
            ['3', formData.fat],
            ['4', formData.carbs],
        ]
        for (const [id, raw] of pairs) {
            if (raw.trim() === '') continue
            const n = Number(raw)
            if (!Number.isFinite(n) || n < 0) {
                setError('Нутриенты — неотрицательные числа')
                return
            }
            nutrients[id] = n
        }
        if (Object.keys(nutrients).length === 0) {
            setError('Укажите хотя бы один нутриент (ккал / Б / Ж / У)')
            return
        }

        try {
            const mealIdRaw = searchParams.get('mealId')
            const mealId =
                mealIdRaw && Number(mealIdRaw) > 0 ? Number(mealIdRaw) : null

            await addQuickProductRecord({
                mealId,
                mealTypeId: Number(formData.mealTypeId),
                date: formData.date,
                eatenAt: formData.eatenAt,
                amount: Number(formData.amount),
                description: formData.description.trim(),
                gramWeight: Number(formData.gramWeight),
                nutrients,
            })
            showAlert('Запись добавлена', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить'))
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Быстрая запись</h2>
            </div>

            {loading && <p className="no-content-placeholder">Загрузка…</p>}

            <div className="container pb-5">
                <div className="row">
                    {!loading && (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="form-card col-xl-4 col-lg-6 col-md-8 col-sm-10 col-12
                                            d-flex flex-column gap-3 mx-auto"
                        >
                            {error && <p className="text-danger small mb-0">{error}</p>}

                            <div className="d-flex flex-column gap-1">
                                <label htmlFor="description" className="label">
                                    Описание
                                </label>
                                <input
                                    className="input rounded-3"
                                    id="description"
                                    type="text"
                                    placeholder="Например: салат рыбный"
                                    {...register('description', {
                                        required: 'Укажите описание',
                                        validate: (v) => v.trim().length > 0 || 'Укажите описание',
                                    })}
                                />
                                {errors.description && (
                                    <span className="input-error-text">{errors.description.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <label htmlFor="mealTypeId" className="label">
                                    Приём пищи
                                </label>
                                <select
                                    className="input rounded-3"
                                    id="mealTypeId"
                                    {...register('mealTypeId', { required: 'Укажите приём' })}
                                >
                                    {MEAL_TYPES.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="row g-2">
                                <div className="col-6">
                                    <label htmlFor="date" className="label">
                                        Дата
                                    </label>
                                    <input
                                        className="input rounded-3 w-100"
                                        id="date"
                                        type="date"
                                        {...register('date', { required: 'Укажите дату' })}
                                    />
                                </div>
                                <div className="col-6">
                                    <label htmlFor="eatenAt" className="label">
                                        Время
                                    </label>
                                    <input
                                        className="input rounded-3 w-100"
                                        id="eatenAt"
                                        type="time"
                                        {...register('eatenAt', { required: 'Укажите время' })}
                                    />
                                </div>
                            </div>

                            <div className="row g-2">
                                <div className="col-6">
                                    <label htmlFor="amount" className="label">
                                        Порций
                                    </label>
                                    <input
                                        className="input rounded-3 w-100"
                                        id="amount"
                                        type="number"
                                        step="any"
                                        {...register('amount', {
                                            required: 'Укажите количество',
                                            validate: (v) => Number(v) > 0 || 'Должно быть > 0',
                                        })}
                                    />
                                </div>
                                <div className="col-6">
                                    <label htmlFor="gramWeight" className="label">
                                        Вес порции (г)
                                    </label>
                                    <input
                                        className="input rounded-3 w-100"
                                        id="gramWeight"
                                        type="number"
                                        step="any"
                                        {...register('gramWeight', {
                                            required: 'Укажите вес',
                                            validate: (v) => Number(v) > 0 || 'Должно быть > 0',
                                        })}
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="label mb-2">Нутриенты (на указанный вес)</p>
                                <div className="d-flex flex-column gap-2">
                                    {CORE_GOAL_NUTRIENT_IDS.map((id) => {
                                        const def = NUTRIENT_BY_ID[id]
                                        const field =
                                            id === 1
                                                ? 'energy'
                                                : id === 2
                                                  ? 'protein'
                                                  : id === 3
                                                    ? 'fat'
                                                    : 'carbs'
                                        return (
                                            <div
                                                key={id}
                                                className="d-flex gap-2 align-items-center justify-content-between"
                                            >
                                                <label className="small mb-0" htmlFor={field}>
                                                    {def.name} ({unitLabel(def.unit)})
                                                </label>
                                                <input
                                                    className="input rounded-3"
                                                    style={{ maxWidth: 120 }}
                                                    id={field}
                                                    type="number"
                                                    step="any"
                                                    min={0}
                                                    placeholder="—"
                                                    {...register(field)}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary w-100 mt-2"
                            >
                                {isSubmitting ? 'Сохранение...' : 'Создать'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
