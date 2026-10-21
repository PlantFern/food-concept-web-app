import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { http } from '@/api/http'
import { uploadFile } from '@/api/files'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'
import { CORE_GOAL_NUTRIENT_IDS, NUTRIENT_BY_ID, unitLabel } from '@/data/nutrients'

type FormValues = {
    description: string
    barcode: string
    gramWeight: string
    energy: string
    protein: string
    fat: string
    carbs: string
}

async function optionalUpload(
    file: File | null,
    folder: string,
): Promise<number | null> {
    if (!file) return null
    const res = await uploadFile(file, folder)
    return res.id
}

export function ProductCreateFormPage() {
    const { showAlert } = useAlert()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState('')
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [frontFile, setFrontFile] = useState<File | null>(null)
    const [compositionFile, setCompositionFile] = useState<File | null>(null)
    const [nutritionFile, setNutritionFile] = useState<File | null>(null)
    const [barcodePhotoFile, setBarcodePhotoFile] = useState<File | null>(null)

    const {
        register,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<FormValues>({
        defaultValues: {
            description: '',
            barcode: '',
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
        if (nutrients.length === 0) {
            setError('Укажите хотя бы один нутриент')
            return
        }

        const barcode = form.barcode.trim()
        if (!barcode) {
            setError('Укажите штрихкод')
            return
        }

        try {
            const [
                photoPathId,
                frontPhotoPathId,
                productCompositionPhotoPathId,
                productNutritionPhotoPathId,
                barcodePhotoPathId,
            ] = await Promise.all([
                optionalUpload(photoFile, 'FOOD_PRODUCTS'),
                optionalUpload(frontFile, 'FOOD_PRODUCT_REQUEST'),
                optionalUpload(compositionFile, 'FOOD_PRODUCT_REQUEST'),
                optionalUpload(nutritionFile, 'FOOD_PRODUCT_REQUEST'),
                optionalUpload(barcodePhotoFile, 'FOOD_PRODUCT_REQUEST'),
            ])

            const { data: productId } = await http.post<number>('/api/food/products/barcode', {
                description: form.description.trim(),
                categoryId: null,
                photoPathId,
                barcode,
                gramWeight: Number(form.gramWeight),
                nutrients,
                frontPhotoPathId,
                productCompositionPhotoPathId,
                productNutritionPhotoPathId,
                barcodePhotoPathId,
            })

            showAlert('Продукт создан', 'success')
            const q = new URLSearchParams(searchParams)
            navigate(`/diary/products/${productId}?${q.toString()}`, { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось создать продукт'))
        }
    }

    return (
        <div className="diary-shell col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
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
                        <label className="label" htmlFor="barcode">
                            Штрихкод
                        </label>
                        <input
                            id="barcode"
                            className="input rounded-3 w-100"
                            placeholder="Например 4601234567890"
                            {...register('barcode', {
                                required: 'Укажите штрихкод',
                                validate: (v) => v.trim().length > 0 || 'Укажите штрихкод',
                            })}
                        />
                        {errors.barcode && (
                            <span className="input-error-text">{errors.barcode.message}</span>
                        )}
                        <p className="small text-muted mb-0 mt-1">
                            Должен быть уникальным. Порции 1 г и 100 г создаются автоматически.
                        </p>
                    </div>

                    <div>
                        <label className="label" htmlFor="gramWeight">
                            Базовый вес порции (г)
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

                    <div>
                        <p className="label mb-2">Фото (необязательно)</p>
                        <label className="small d-block mb-2">
                            Основное фото продукта
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control form-control-sm mt-1"
                                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                        <label className="small d-block mb-2">
                            Фото упаковки (спереди)
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control form-control-sm mt-1"
                                onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                        <label className="small d-block mb-2">
                            Фото состава
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control form-control-sm mt-1"
                                onChange={(e) => setCompositionFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                        <label className="small d-block mb-2">
                            Фото нутриентов на упаковке
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control form-control-sm mt-1"
                                onChange={(e) => setNutritionFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                        <label className="small d-block mb-0">
                            Фото штрихкода
                            <input
                                type="file"
                                accept="image/*"
                                className="form-control form-control-sm mt-1"
                                onChange={(e) => setBarcodePhotoFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
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
