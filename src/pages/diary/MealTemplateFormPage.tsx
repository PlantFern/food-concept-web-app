import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import {
    getMealTemplate,
    createMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
} from '@/api/meals'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { getDiaryProfileId } from '@/api/onboarding.ts'

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
    const navigate = useNavigate()

    const { templateId } = useParams()
    const isEdit = Boolean(templateId)

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
                const data = await getMealTemplate(Number(templateId))
                if (cancelled) return
                reset({
                    name: data.name ?? '',
                    scheduledTime: toTimeInput(data.scheduledTime),
                    frequency: data.frequency != null ? String(data.frequency) : '1',
                })
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
    }, [templateId, isEdit, reset, navigate, showAlert])

    const onSubmit = async (formData: TemplateFormValues) => {
        setError('')
        const frequency = Number(formData.frequency)
        const startedAt = Date.now()

        try {
            if (isEdit) {
                await updateMealTemplate(
                    Number(templateId),
                    formData.name.trim(),
                    formData.scheduledTime,
                    frequency,
                    startedAt,
                )
                showAlert('Шаблон обновлён', 'success')
            } else {
                await createMealTemplate(
                    formData.name.trim(),
                    formData.scheduledTime,
                    frequency,
                    startedAt,
                )
                showAlert('Шаблон создан', 'success')
            }
            navigate('/diary/products?tab=templates', { replace: true })
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
            await deleteMealTemplate(Number(templateId))
            showAlert('Шаблон удалён', 'success')
            navigate('/diary/products?tab=templates', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось удалить'))
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/products?tab=templates" className="btn-tertiary bg-text-on-brand">
                    ← Назад
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
                                    className="btn btn-outline-danger w-100"
                                    onClick={() => void onDelete()}
                                >
                                    {deleting ? 'Удаление...' : 'Удалить'}
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    )
}
