import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { IoTrashOutline } from 'react-icons/io5'
import { BottomNav } from '@/components/diary'
import {
    getFoodRecord,
    updateFoodRecord,
    deleteFoodRecord,
    type FoodRecordDto,
} from '@/api/food'
import { mealTypeLabel } from '@/api/diaryProfile/diary'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

type FoodRecordFormValues = {
    amount: string
    eatenAt: string
}

const MEAL_TYPE_BY_ID: Record<number, string> = {
    1: 'BREAKFAST',
    2: 'LUNCH',
    3: 'SNACK',
    4: 'DINNER',
    5: 'OTHERS',
}

/** datetime-local value from ISO or HH:mm */
function toTimeInput(value?: string | null): string {
    if (!value) return ''
    if (value.length >= 16 && value.includes('T')) return value.slice(11, 16)
    if (value.length >= 5 && value.includes(':')) return value.slice(0, 5)
    return value
}

function servingLabel(r: FoodRecordDto): string {
    const parts: string[] = []
    if (r.servingAmount != null) parts.push(String(r.servingAmount))
    if (r.servingUnitCode) parts.push(r.servingUnitCode)
    if (r.gramWeight != null) parts.push(`(${r.gramWeight} г)`)
    return parts.length ? parts.join(' ') : 'Порция'
}

export function FoodRecordFormPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [record, setRecord] = useState<FoodRecordDto | null>(null)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const { recordId } = useParams()
    const id = Number(recordId)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FoodRecordFormValues>({
        mode: 'onTouched',
        defaultValues: {
            amount: '',
            eatenAt: '',
        },
    })

    useEffect(() => {
        let cancelled = false
        if (!Number.isFinite(id) || id <= 0) {
            showAlert('Некорректный id записи', 'warning')
            navigate(-1)
            return
        }

        if (searchParams.get('delete') === '1') {
            ;(async () => {
                if (!window.confirm('Удалить запись из дневника?')) {
                    navigate(`/diary/food-records/${id}/edit`, { replace: true })
                    return
                }
                try {
                    await deleteFoodRecord(id)
                    showAlert('Запись удалена', 'success')
                    navigate('/diary', { replace: true })
                } catch (err: unknown) {
                    showAlert(getErrorMessage(err, 'Не удалось удалить'), 'danger')
                    navigate(`/diary/food-records/${id}/edit`, { replace: true })
                }
            })()
            return
        }

        ;(async () => {
            setLoading(true)
            setError('')
            try {
                const data = await getFoodRecord(id)
                if (cancelled) return
                setRecord(data)
                reset({
                    amount: data.amount != null ? String(data.amount) : '',
                    eatenAt: toTimeInput(data.eatenAt),
                })
            } catch (err: unknown) {
                if (!cancelled) {
                    showAlert(getErrorMessage(err, 'Не удалось загрузить запись'), 'danger')
                    navigate(-1)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [id, reset, navigate, showAlert, searchParams])

    const onSubmit = async (formData: FoodRecordFormValues) => {
        setError('')
        const amount = formData.amount.trim() === '' ? undefined : Number(formData.amount)
        const eatenAt = formData.eatenAt.trim() || undefined

        if (amount != null && (!Number.isFinite(amount) || amount <= 0)) {
            setError('Количество должно быть больше 0')
            return
        }

        try {
            await updateFoodRecord(id, amount, eatenAt)
            showAlert('Запись обновлена', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить'))
        }
    }

    const onDelete = async () => {
        if (!window.confirm('Удалить запись из дневника?')) return
        setDeleting(true)
        setError('')
        try {
            await deleteFoodRecord(id)
            showAlert('Запись удалена', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось удалить'))
        } finally {
            setDeleting(false)
        }
    }

    const mealTypeCode =
        record?.mealTypeId != null ? MEAL_TYPE_BY_ID[record.mealTypeId] : null

    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Запись еды</h2>
            </div>

            {loading && <p className="no-content-placeholder">Загрузка…</p>}

            <div className="container">
                <div className="row">
                    {!loading && (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="form-card col-xl-4 col-lg-6 col-md-8 col-sm-10 col-12
                                            d-flex flex-column gap-3 mx-auto"
                        >
                            {error && <p className="text-danger small mb-0">{error}</p>}

                            {/* Same info block as when adding product to a meal */}
                            <div className="border rounded-3 p-3 bg-light">
                                <div className="fw-semibold">
                                    {record?.productDescription?.trim() ||
                                        `Продукт #${record?.servingId ?? '—'}`}
                                </div>
                                <div className="small text-muted mt-1">
                                    Порция: {record ? servingLabel(record) : '—'}
                                </div>
                                {(mealTypeCode || record?.mealDate) && (
                                    <div className="small text-muted mt-1">
                                        {[mealTypeLabel(mealTypeCode), record?.mealDate]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="amount" className="label text-wrap align-self-center">
                                        Количество порций
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="amount"
                                        type="number"
                                        min={0.01}
                                        step="any"
                                        {...register('amount', {
                                            required: 'Укажите количество',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n) || n <= 0) {
                                                    return 'Количество должно быть больше 0'
                                                }
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
                                    <label htmlFor="eatenAt" className="label text-wrap align-self-center">
                                        Время
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="eatenAt"
                                        type="time"
                                        {...register('eatenAt')}
                                    />
                                </div>
                                {errors.eatenAt && (
                                    <span className="input-error-text">{errors.eatenAt.message}</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || deleting}
                                className="btn btn-primary w-100 mt-2"
                            >
                                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                            </button>

                            <button
                                type="button"
                                disabled={isSubmitting || deleting}
                                className="btn btn-outline-danger w-100 d-inline-flex align-items-center justify-content-center gap-2"
                                onClick={() => void onDelete()}
                                aria-label="Удалить"
                                title="Удалить"
                            >
                                <IoTrashOutline size={18} />
                                {deleting ? 'Удаление...' : null}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
