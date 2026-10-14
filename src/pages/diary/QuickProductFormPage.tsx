import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { addQuickProductRecord } from '@/api/food'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { getDiaryProfileId } from '@/api/onboarding.ts'

type QuickProductFormValues = {
    mealTypeId: string
    date: string
    eatenAt: string
    amount: string
    description: string
    gramWeight: string
    nutrientId: string
    nutrientAmount: string
}

function todayIso(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export function QuickProductFormPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [diaryProfileId, setDiaryProfileId] = useState<number>(-1)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<QuickProductFormValues>({
        mode: 'onTouched',
        defaultValues: {
            mealTypeId: searchParams.get('mealTypeId') ?? '1',
            date: searchParams.get('date') ?? todayIso(),
            eatenAt: searchParams.get('eatenAt') ?? '',
            amount: '1',
            description: '',
            gramWeight: '100',
            nutrientId: '1',
            nutrientAmount: '0',
        },
    })

    useEffect(() => {
        setLoading(true)
        setError('')
        const profileId = getDiaryProfileId()
        if (!profileId) {
            showAlert('Не удалось определить профиль дневника', 'warning')
            navigate(-1)
            return
        }
        setDiaryProfileId(profileId)
        setLoading(false)
    }, [navigate, showAlert])

    const onSubmit = async (formData: QuickProductFormValues) => {
        setError('')
        try {
            await addQuickProductRecord({
                mealId: null,
                mealTypeId: Number(formData.mealTypeId),
                date: formData.date,
                eatenAt: formData.eatenAt,
                amount: Number(formData.amount),
                description: formData.description.trim(),
                gramWeight: Number(formData.gramWeight),
                nutrients: [
                    {
                        nutrientId: Number(formData.nutrientId),
                        amount: Number(formData.nutrientAmount),
                    },
                ],
            })
            void diaryProfileId
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
                <h2 className="bg-text-on-brand mt-2 text-center">Быстрый продукт</h2>
            </div>

            {loading && <p className="no-content-placeholder">Загрузка…</p>}

            <div className="container">
                <div className="row">
                    {!loading && (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="form-card col-xl-3 col-lg-4 col-md-6 col-sm-8 col-10
                                            d-flex flex-column gap-3 mx-auto"
                        >
                            {error && <p className="text-danger small mb-0">{error}</p>}

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="description" className="label text-wrap align-self-center">
                                        Описание
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="description"
                                        type="text"
                                        {...register('description', {
                                            required: 'Укажите описание',
                                            validate: (v) => v.trim().length > 0 || 'Укажите описание',
                                        })}
                                    />
                                </div>
                                {errors.description && (
                                    <span className="input-error-text">{errors.description.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="mealTypeId" className="label text-wrap align-self-center">
                                        Приём пищи (id)
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="mealTypeId"
                                        type="number"
                                        {...register('mealTypeId', {
                                            required: 'Укажите тип приёма',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n) || n <= 0) return 'Id должен быть больше 0'
                                                return true
                                            },
                                        })}
                                    />
                                </div>
                                {errors.mealTypeId && (
                                    <span className="input-error-text">{errors.mealTypeId.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="date" className="label text-wrap align-self-center">
                                        Дата
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="date"
                                        type="date"
                                        {...register('date', { required: 'Укажите дату' })}
                                    />
                                </div>
                                {errors.date && (
                                    <span className="input-error-text">{errors.date.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="eatenAt" className="label text-wrap align-self-center">
                                        Время
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="eatenAt"
                                        type="time"
                                        {...register('eatenAt', { required: 'Укажите время' })}
                                    />
                                </div>
                                {errors.eatenAt && (
                                    <span className="input-error-text">{errors.eatenAt.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="amount" className="label text-wrap align-self-center">
                                        Количество
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="amount"
                                        type="number"
                                        step="any"
                                        {...register('amount', {
                                            required: 'Укажите количество',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n) || n <= 0) return 'Количество должно быть больше 0'
                                                return true
                                            },
                                        })}
                                    />
                                </div>
                                {errors.amount && (
                                    <span className="input-error-text">{errors.amount.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="gramWeight" className="label text-wrap align-self-center">
                                        Вес (г)
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="gramWeight"
                                        type="number"
                                        step="any"
                                        {...register('gramWeight', {
                                            required: 'Укажите вес',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n) || n <= 0) return 'Вес должен быть больше 0'
                                                return true
                                            },
                                        })}
                                    />
                                </div>
                                {errors.gramWeight && (
                                    <span className="input-error-text">{errors.gramWeight.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="nutrientId" className="label text-wrap align-self-center">
                                        Нутриент (id)
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="nutrientId"
                                        type="number"
                                        {...register('nutrientId', {
                                            required: 'Укажите нутриент',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n) || n <= 0) return 'Id должен быть больше 0'
                                                return true
                                            },
                                        })}
                                    />
                                </div>
                                {errors.nutrientId && (
                                    <span className="input-error-text">{errors.nutrientId.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="nutrientAmount" className="label text-wrap align-self-center">
                                        Кол-во нутриента
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="nutrientAmount"
                                        type="number"
                                        step="any"
                                        {...register('nutrientAmount', {
                                            required: 'Укажите количество нутриента',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n) || n < 0) return 'Значение некорректно'
                                                return true
                                            },
                                        })}
                                    />
                                </div>
                                {errors.nutrientAmount && (
                                    <span className="input-error-text">{errors.nutrientAmount.message}</span>
                                )}
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
