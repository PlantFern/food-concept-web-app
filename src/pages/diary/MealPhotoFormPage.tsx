import { useState, type SyntheticEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { uploadMealPhoto } from '@/api/food'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

export function MealPhotoFormPage() {
    const { showAlert } = useAlert()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const mealId = Number(searchParams.get('mealId') ?? 0)

    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError('')
        if (!Number.isFinite(mealId) || mealId <= 0) {
            setError('Сначала добавьте продукт в приём — тогда появится mealId')
            return
        }
        if (!file) {
            setError('Выберите файл')
            return
        }
        setSaving(true)
        try {
            await uploadMealPhoto(mealId, file)
            showAlert('Фото приёма загружено', 'success')
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось загрузить фото'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Фото приёма</h2>
            </div>

            <div className="container py-3">
                <form
                    onSubmit={onSubmit}
                    className="form-card col-xl-4 col-lg-6 col-md-8 col-12 mx-auto d-flex flex-column gap-3"
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
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    </label>

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={saving || mealId <= 0}
                    >
                        {saving ? 'Загрузка…' : 'Загрузить'}
                    </button>
                </form>
            </div>
            <BottomNav />
        </div>
    )
}
