import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi2'
import { BottomNav } from '@/components/diary'
import {
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
    type CommentType,
} from '@/api/diaryProfile'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { getDiaryProfileId } from '@/api/onboarding.ts'

type CommentFormValues = {
    body: string
    commentableType: string
    commentableId: string
}

const COMMENT_TYPES: CommentType[] = ['MEAL', 'SLEEP_LOG', 'WEIGHT_LOG']

export function CommentFormPage() {
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const { commentId } = useParams()
    const isEdit = Boolean(commentId)

    const [diaryProfileId, setDiaryProfileId] = useState<number>(-1)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CommentFormValues>({
        mode: 'onTouched',
        defaultValues: {
            body: '',
            commentableType: searchParams.get('commentableType') ?? 'MEAL',
            commentableId: searchParams.get('commentableId') ?? '',
        },
    })

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError('')

        if (!isEdit) {
            const profileId = getDiaryProfileId()
            if (!profileId) {
                showAlert('Не удалось определить профиль дневника', 'warning')
                navigate(-1)
                return
            }
            setDiaryProfileId(profileId)
            setLoading(false)
            return
        }

        ;(async () => {
            try {
                const data = await getCommentById(Number(commentId))
                if (cancelled) return
                if (!data) {
                    showAlert('Не удалось найти комментарий', 'danger')
                    navigate(-1)
                    return
                }
                reset({
                    body: data.body ?? '',
                    commentableType: String(data.commentableType ?? 'MEAL'),
                    commentableId: String(data.commentableId ?? ''),
                })
            } catch (err: unknown) {
                if (!cancelled) {
                    showAlert(getErrorMessage(err, 'Не удалось загрузить комментарий'), 'danger')
                    navigate(-1)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [commentId, isEdit, reset, navigate, showAlert])

    const onSubmit = async (formData: CommentFormValues) => {
        setError('')
        const payload = {
            commentableType: formData.commentableType,
            commentableId: Number(formData.commentableId),
            body: formData.body.trim(),
        }
        try {
            if (isEdit) {
                await updateComment(Number(commentId), payload)
                showAlert('Данные обновлены', 'success')
            } else {
                await createComment(diaryProfileId, payload)
                showAlert('Комментарий добавлен', 'success')
            }
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось сохранить'))
        }
    }

    const onDelete = async () => {
        if (!isEdit) return
        if (!window.confirm('Удалить комментарий?')) return
        setDeleting(true)
        setError('')
        try {
            await deleteComment(Number(commentId))
            showAlert('Комментарий удалён', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось удалить'))
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link
                    to="/diary"
                    className="btn-tertiary bg-text-on-brand d-inline-flex align-items-center gap-1"
                >
                    <HiChevronLeft size={18} /> Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Комментарий</h2>
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
                                    <label htmlFor="commentableType" className="label text-wrap align-self-center">
                                        Тип
                                    </label>
                                    <select
                                        className="input rounded-3"
                                        id="commentableType"
                                        {...register('commentableType', {
                                            required: 'Укажите тип',
                                        })}
                                    >
                                        {COMMENT_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.commentableType && (
                                    <span className="input-error-text">{errors.commentableType.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="commentableId" className="label text-wrap align-self-center">
                                        Id объекта
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="commentableId"
                                        type="number"
                                        {...register('commentableId', {
                                            required: 'Укажите id объекта',
                                            validate: (value) => {
                                                const n = Number(value)
                                                if (!Number.isFinite(n) || n <= 0) {
                                                    return 'Id должен быть больше 0'
                                                }
                                                return true
                                            },
                                        })}
                                    />
                                </div>
                                {errors.commentableId && (
                                    <span className="input-error-text">{errors.commentableId.message}</span>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-1">
                                <div className="d-flex gap-2 justify-content-between align-items-center w-100">
                                    <label htmlFor="body" className="label text-wrap align-self-center">
                                        Текст
                                    </label>
                                    <input
                                        className="input rounded-3"
                                        id="body"
                                        type="text"
                                        {...register('body', {
                                            required: 'Укажите текст',
                                            validate: (v) => v.trim().length > 0 || 'Укажите текст',
                                        })}
                                    />
                                </div>
                                {errors.body && (
                                    <span className="input-error-text">{errors.body.message}</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || deleting}
                                className="btn btn-primary w-100 mt-2"
                            >
                                {isSubmitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
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
            </div>

            <BottomNav />
        </div>
    )
}
