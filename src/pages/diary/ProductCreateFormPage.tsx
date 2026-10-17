import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { http } from '@/api/http'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { CORE_GOAL_NUTRIENT_IDS, NUTRIENT_BY_ID, unitLabel } from '@/data/nutrients'

type FormValues = {
    description: string
    gramWeight: string
    energy: string
    protein: string
    fat: string
    carbs: string
}

export function ProductCreateFormPage() {
    const { showAlert } = useAlert()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<FormValues>({
        defaultValues: {
            description: '',
            gramWeight: '100',
            energy: '',
            protein: '',
            fat: '',
            carbs: '',
        },
    })

    const onSubmit = async (form: FormValues) => {
        setError('')
        const nutrients: Array<{ nutrientId: number; amount: number }> = []
        const pairs: Array<[number, string]> = [
            [1, form.energy],
            [2, form.protein],
            [3, form.fat],
            [4, form.carbs],
        ]
        for (const [id, raw] of pairs) {
            if (!raw.trim()) continue
            const n = Number(raw)
            if (!Number.isFinite(n) || n < 0) {
                setError('Нутриенты — неотрицательные числа')
                return
            }
            nutrients.push({ nutrientId: id, amount: n })
        }

        try {
            const barcode = `USR${Date.now()}`
            const { data: productId } = await http.post<number>('/api/food/products/barcode', {
                description: form.description.trim(),
                categoryId: null,
                photoPathId: null,
                barcode,
                gramWeight: Number(form.gramWeight),
                nutrients,
                frontPhotoPathId: null,
                productCompositionPhotoPathId: null,
                productNutritionPhotoPathId: null,
                barcodePhotoPathId: null,
            })

            showAlert('Продукт создан', 'success')
            const q = new URLSearchParams(searchParams)
            navigate(`/diary/products/${productId}?${q.toString()}`, { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось создать продукт'))
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/products?tab=products" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Новый продукт</h2>
            </div>

            <div className="container pb-5">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="form-card col-xl-4 col-lg-6 col-md-8 col-12 mx-auto d-flex flex-column gap-3"
                >
                    {error && <p className="text-danger small mb-0">{error}</p>}

                    <div>
                        <label className="label" htmlFor="description">
                            Название
                        </label>
                        <input
                            id="description"
                            className="input rounded-3 w-100"
                            {...register('description', {
                                required: 'Укажите название',
                                validate: (v) => v.trim().length > 0 || 'Укажите название',
                            })}
                        />
                        {errors.description && (
                            <span className="input-error-text">{errors.description.message}</span>
                        )}
                    </div>

                    <div>
                        <label className="label" htmlFor="gramWeight">
                            Вес порции (г)
                        </label>
                        <input
                            id="gramWeight"
                            type="number"
                            className="input rounded-3 w-100"
                            {...register('gramWeight', {
                                required: true,
                                validate: (v) => Number(v) > 0 || '> 0',
                            })}
                        />
                    </div>

                    <div>
                        <p className="label mb-2">Нутриенты на 100 г</p>
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
                                    className="d-flex justify-content-between align-items-center gap-2 mb-2"
                                >
                                    <label className="small mb-0" htmlFor={field}>
                                        {def.name} ({unitLabel(def.unit)})
                                    </label>
                                    <input
                                        id={field}
                                        type="number"
                                        step="any"
                                        min={0}
                                        className="input rounded-3"
                                        style={{ maxWidth: 120 }}
                                        {...register(field)}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                        {isSubmitting ? 'Создание…' : 'Создать продукт'}
                    </button>
                </form>
            </div>
            <BottomNav />
        </div>
    )
}
