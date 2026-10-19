import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi2'
import { BottomNav } from '@/components/diary'
import {
    getMealTemplate,
    createMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
    deleteTemplateRecord,
    type TemplateRecordItem,
} from '@/api/meals'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { getDiaryProfileId } from '@/api/onboarding.ts'
import { todayIso } from '@/lib/mealTime'

type TemplateFormValues = {
    name: string
    scheduledTime: string
    frequency: string
}

function toTimeInput(value?: string | null): string {
    if (!value) return ''
    if (value.length >= 5) return value.slice(0, 5)
    return value
}

export function MealTemplateFormPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [records, setRecords] = useState<TemplateRecordItem[]>([])
    const navigate = useNavigate()

    const { templateId } = useParams()
    const isEdit = Boolean(templateId)
    const id = Number(templateId)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TemplateFormValues>({
        mode: 'onTouched',
        defaultValues: {
            name: '',
            scheduledTime: '',
            frequency: '1',
        },
    })

    const loadDetail = useCallback(async () => {
        if (!isEdit || !Number.isFinite(id)) return
        const data = await getMealTemplate(id)
        reset({
            name: data.name ?? '',
            scheduledTime: toTimeInput(data.scheduledTime),
            frequency: data.frequency != null ? String(data.frequency) : '1',
        })
        setRecords(Array.isArray(data.records) ? data.records : [])
    }, [isEdit, id, reset])

    useEffect(() => {
        let cancelled = false

        if (!isEdit) {
            const profileId = getDiaryProfileId()
            if (!profileId) {
                showAlert('Не удалось определить профиль дневника', 'warning')
                navigate(-1)
                return
            }
            setLoading(false)
            return
        }

        ;(async () => {
            setLoading(true)
            setError('')
            try {
                await loadDetail()
            } catch (err: unknown) {
                if (!cancelled) {
                    showAlert(getErrorMessage(err, 'Не удалось загрузить шаблон'), 'danger')
                    navigate(-1)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [templateId, isEdit, loadDetail, navigate, showAlert])

    const onSubmit = async (formData: TemplateFormValues) => {
        setError('')
        const frequency = Number(formData.frequency)
        const startedAt = todayIso()

        try {
            if (isEdit) {
                await updateMealTemplate(
                    id,
                    formData.name.trim(),
                    formData.scheduledTime,
                    frequency,
                    startedAt,
                )
                showAlert('Шаблон обновлён', 'success')
                await loadDetail()
            } else {
                const newId = await createMealTemplate(
                    formData.name.trim(),
                    formData.scheduledTime,
                    frequency,
                    startedAt,
                )
                showAlert('Шаблон создан — добавьте продукты', 'success')
                navigate(`/diary/templates/${newId}/edit`, { replace: true })
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить шаблон'))
        }
    }

    const onDelete = async () => {
        if (!isEdit) return
        if (!window.confirm('Удалить шаблон?')) return
        setDeleting(true)
        setError('')
        try {
            await deleteMealTemplate(id)
            showAlert('Шаблон удалён', 'success')
            navigate('/diary/products?tab=templates', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось удалить'))
        } finally {
            setDeleting(false)
        }
    }

    const onDeleteRecord = async (recordId: number) => {
        if (!window.confirm('Убрать продукт из шаблона?')) return
        try {
            await deleteTemplateRecord(recordId)
            showAlert('Продукт убран', 'success')
            await loadDetail()
        } catch (err: unknown) {
            showAlert(getErrorMessage(err, 'Не удалось удалить'), 'danger')
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link
                    to="/diary/products?tab=templates"
                    className="btn-tertiary bg-text-on-brand d-inline-flex align-items-center gap-1"
                >
                    <HiChevronLeft size={18} /> Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">
                    {isEdit ? 'Шаблон' : 'Новый шаблон'}
                </h2>
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

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="name" className="label text-wrap align-self-center">
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
                                </div>
                                {errors.name && (
                                    <span className="input-error-text">{errors.name.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label
                                        htmlFor="scheduledTime"
                                        className="label text-wrap align-self-center"
                                    >
                                        Время
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="scheduledTime"
                                        type="time"
                                        {...register('scheduledTime', {
                                            required: 'Укажите время',
                                        })}
                                    />
                                </div>
                                {errors.scheduledTime && (
                                    <span className="input-error-text">
                                        {errors.scheduledTime.message}
                                    </span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label
                                        htmlFor="frequency"
                                        className="label text-wrap align-self-center"
                                    >
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
                                </div>
                                {errors.frequency && (
                                    <span className="input-error-text">{errors.frequency.message}</span>
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
                                    className="btn btn-danger w-100"
                                    onClick={() => void onDelete()}
                                >
                                    {deleting ? 'Удаление...' : 'Удалить'}
                                </button>
                            )}
                        </form>
                    )}
                </div>

                {isEdit && !loading && (
                    <div className="col-xl-4 col-lg-6 col-md-8 col-sm-10 col-12 mx-auto mt-4 mb-5">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">Продукты в шаблоне</h6>
                            <Link
                                to={`/diary/products?templateId=${id}`}
                                className="btn btn-sm btn-primary"
                            >
                                + Добавить продукт
                            </Link>
                        </div>
                        {records.length === 0 && (
                            <p className="text-muted small">
                                Пока пусто. Нажмите «Добавить продукт», выберите продукт и порцию —
                                они попадут в этот шаблон.
                            </p>
                        )}
                        <ul className="list-group list-group-flush rounded-3">
                            {records.map((r) => (
                                <li
                                    key={r.id}
                                    className="list-group-item d-flex justify-content-between align-items-center"
                                >
                                    <div>
                                        <div className="fw-semibold small">
                                            {r.productDescription ?? `Serving #${r.servingId}`}
                                        </div>
                                        <div className="text-muted small">
                                            × {r.amount ?? 1}
                                            {r.servingUnitCode ? ` ${r.servingUnitCode}` : ''}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        onClick={() => void onDeleteRecord(r.id)}
                                    >
                                        Убрать
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    )
}
