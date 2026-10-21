import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi2'
import { BottomNav } from '@/components/diary'
import { uploadMealPhoto } from '@/api/food'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

type PhotoFormValues = {
    fileList: FileList
}

export function MealPhotoFormPage() {
    const { showAlert } = useAlert()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const mealId = Number(searchParams.get('mealId') ?? 0)
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PhotoFormValues>({ mode: 'onTouched' })

    const onSubmit = async (data: PhotoFormValues) => {
        setError('')
        if (!Number.isFinite(mealId) || mealId <= 0) {
            setError('Сначала добавьте продукт в приём — тогда появится mealId')
            return
        }
        const file = data.fileList?.[0]
        if (!file) {
            setError('Выберите файл')
            return
        }
        try {
            await uploadMealPhoto(mealId, file)
            showAlert('Фото приёма загружено', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось загрузить фото'))
        }
    }

    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link
                    to="/diary"
                    className="btn-tertiary bg-text-on-brand d-inline-flex align-items-center gap-1"
                >
                    <HiChevronLeft size={18} />
                    Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Фото приёма</h2>
            </div>

            <div className="container py-3">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="form-card mx-auto d-flex flex-column gap-3"
                >
                    {error && <p className="text-danger small mb-0">{error}</p>}

                    {(!Number.isFinite(mealId) || mealId <= 0) && (
                        <p className="text-muted small">
                            Приём ещё пустой. Добавьте хотя бы один продукт, затем снова откройте
                            «Добавить фото».
                        </p>
                    )}

                    <label className="label">
                        Файл
                        <input
                            type="file"
                            accept="image/*"
                            className="form-control mt-1"
                            {...register('fileList', {
                                required: 'Выберите изображение',
                                validate: (files) =>
                                    (files && files.length > 0) || 'Выберите изображение',
                            })}
                        />
                    </label>
                    {errors.fileList && (
                        <span className="input-error-text">{errors.fileList.message}</span>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isSubmitting || mealId <= 0}
                    >
                        {isSubmitting ? 'Загрузка…' : 'Загрузить'}
                    </button>
                </form>
            </div>
            <BottomNav />
        </div>
    )
}
