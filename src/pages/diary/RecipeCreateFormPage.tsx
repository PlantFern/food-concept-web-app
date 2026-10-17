import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav } from '@/components/diary'
import { http } from '@/api/http'
import { useAlert } from '@/components/ui/Alert'
import { getErrorMessage } from '@/lib/errors'

type FormValues = {
    name: string
    description: string
    recipe: string
}

export function RecipeCreateFormPage() {
    const { showAlert } = useAlert()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { isSubmitting, errors },
    } = useForm<FormValues>({
        defaultValues: { name: '', description: '', recipe: '' },
    })

    const onSubmit = async (form: FormValues) => {
        setError('')
        try {
            const { data: recipeId } = await http.post<number>('/api/food/recipes', {
                name: form.name.trim(),
                description: form.description.trim() || null,
                recipe: form.recipe.trim() || null,
                photoPathId: null,
                components: [],
            })
            showAlert('Рецепт создан', 'success')
            const q = searchParams.toString()
            navigate(`/diary/recipes/${recipeId}${q ? `?${q}` : ''}`, { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось создать рецепт'))
        }
    }

    return (
        <div className="diary-shell">
            <div className="bg-brand text-invert p-2 rounded-bottom-4">
                <Link to="/diary/products?tab=recipes" className="btn-tertiary bg-text-on-brand">
                    ← Назад
                </Link>
                <h2 className="bg-text-on-brand mt-2 text-center">Новый рецепт</h2>
            </div>

            <div className="container pb-5">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="form-card col-xl-4 col-lg-6 col-md-8 col-12 mx-auto d-flex flex-column gap-3"
                >
                    {error && <p className="text-danger small mb-0">{error}</p>}

                    <div>
                        <label className="label" htmlFor="name">
                            Название
                        </label>
                        <input
                            id="name"
                            className="input rounded-3 w-100"
                            {...register('name', {
                                required: 'Укажите название',
                                validate: (v) => v.trim().length > 0 || 'Укажите название',
                            })}
                        />
                        {errors.name && (
                            <span className="input-error-text">{errors.name.message}</span>
                        )}
                    </div>

                    <div>
                        <label className="label" htmlFor="description">
                            Краткое описание
                        </label>
                        <input
                            id="description"
                            className="input rounded-3 w-100"
                            {...register('description')}
                        />
                    </div>

                    <div>
                        <label className="label" htmlFor="recipe">
                            Приготовление
                        </label>
                        <textarea
                            id="recipe"
                            className="input rounded-3 w-100"
                            rows={5}
                            {...register('recipe')}
                        />
                    </div>

                    <p className="small text-muted mb-0">
                        Компоненты можно добавить позже на странице рецепта.
                    </p>

                    <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                        {isSubmitting ? 'Создание…' : 'Создать рецепт'}
                    </button>
                </form>
            </div>
            <BottomNav />
        </div>
    )
}
