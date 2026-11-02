import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NavigateBackButton } from '@/components/ui/NavigateBackButton';
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
            <div className='d-flex gap-3
                            justify-content-start align-items-center
                            bg-brand text-invert 
                            p-4 
                            rounded-bottom-4'>
                <NavigateBackButton label="Назад" className="btn-tertiary-invert" />

                <p className="page-title text-center p-2 bg-text-on-brand">Комментарий</p>
            </div>

            <div className="diary-content p-3" style={{ paddingBottom: '7.5rem' }}>
                <div className='surface-card surface-card-column w-100'>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="form-layout mx-auto"
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
            </div>
            <BottomNav />
        </div>
    )
}
