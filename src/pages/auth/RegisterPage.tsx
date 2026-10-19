import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { registerRequest } from '@/api/auth'
import { getErrorMessage } from '@/lib/errors'
import { NavigateBackButton } from '@/components/ui/NavigateBackButton'

type RegisterFormValues = {
    email: string
    password: string
    password2: string
}

export function RegisterPage() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        mode: 'onTouched',
        defaultValues: { email: '', password: '', password2: '' },
    })

    const password = watch('password')

    const onSubmit = async (values: RegisterFormValues) => {
        setError(null)
        try {
            await registerRequest({ email: values.email.trim(), password: values.password })
            navigate('/login', { replace: true, state: { registered: true } })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось зарегистрироваться.'))
        }
    }

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4 justify-content-start align-items-start form-card bg-brand rounded-md-5 vh-100 overflow-y-auto">
                <div className="d-flex w-100 flex-column align-items-start flex-grow-0">
                    <NavigateBackButton label="Назад" className="btn-tertiary-invert" />
                </div>

                <div className="form-card-body d-flex flex-column gap-4 bg-page rounded-3">
                    <div className="d-flex flex-column align-items-center text-center">
                        <p className="fs-3 fw-medium mb-0">Создайте Аккаунт</p>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                        className="d-flex gap-3 w-100 flex-column align-items-stretch"
                    >
                        {error && (
                            <p className="text-danger small mb-0" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="w-100">
                            <label className="form-label label" htmlFor="reg-email">
                                Email
                            </label>
                            <input
                                id="reg-email"
                                type="email"
                                className="form-control input"
                                autoComplete="email"
                                placeholder="you@example.com"
                                {...register('email', {
                                    required: 'Укажите email',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Некорректный email',
                                    },
                                })}
                            />
                            {errors.email && (
                                <span className="input-error-text">{errors.email.message}</span>
                            )}
                        </div>

                        <div className="w-100">
                            <label className="form-label label" htmlFor="reg-password">
                                Пароль
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                className="form-control input"
                                autoComplete="new-password"
                                {...register('password', {
                                    required: 'Укажите пароль',
                                    minLength: {
                                        value: 6,
                                        message: 'Пароль не короче 6 символов',
                                    },
                                })}
                            />
                            {errors.password && (
                                <span className="input-error-text">{errors.password.message}</span>
                            )}
                        </div>

                        <div className="w-100">
                            <label className="form-label label" htmlFor="reg-password2">
                                Повторите пароль
                            </label>
                            <input
                                id="reg-password2"
                                type="password"
                                className="form-control input"
                                autoComplete="new-password"
                                {...register('password2', {
                                    required: 'Повторите пароль',
                                    validate: (v) => v === password || 'Пароли не совпадают',
                                })}
                            />
                            {errors.password2 && (
                                <span className="input-error-text">{errors.password2.message}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 shadow-sm mt-4"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Регистрация…' : 'Зарегистрироваться'}
                        </button>
                    </form>

                    <div className="text-center">
                        Уже есть аккаунт?{' '}
                        <Link className="btn-link btn-tertiary" to="/login">
                            Войти
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
