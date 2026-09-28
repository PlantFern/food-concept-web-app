import { type SyntheticEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerRequest } from '@/api/auth'
import {NavigateBackButton} from "@/components/ui/NavigateBackButton";


export function RegisterPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError('Пароль не короче 6 символов')
            return
        }
        if (password !== password2) {
            setError('Пароли не совпадают')
            return
        }

        setLoading(true)
        try {
            await registerRequest({ email: email.trim(), password })
            navigate('/login', { replace: true, state: { registered: true } })
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ?
                    (err as any).response?.data?.message ||
                    (err as any).message
                    : null
            setError(
                typeof msg === 'string' && msg
                    ? msg
                    : 'Не удалось зарегистрироваться.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4
                            justify-content-start align-items-start
                            align-content-start
                            form-card
                            bg-secondary-color
                            rounded-md-5
                            vh-100 overflow-y-auto">
                <div className="d-flex w-100
                                    flex-column gap-2
                                    align-items-start justify-content-center
                                    align-content-stretch
                                    flex-grow-0">
                    <div className="text-start">
                        <NavigateBackButton label="Назад" className="btn-tertiary-invert"/>
                    </div>
                </div>

                <div className="form-card-body
                                d-flex flex-column gap-4
                                bg-primary-color
                                rounded-3">
                    <div className="d-flex
                                    flex-column
                                    align-items-center
                                    justify-content-center
                                    text-center">
                        <p className="fs-3 fw-medium">Создайте Аккаунт</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger auth-alert" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} noValidate
                            className="d-flex gap-3 w-100 flex-column
                                        justify-content-between align-items-stretch
                                        align-content-stretch
                                        ">
                        <div className="w-100">
                            <label className="form-label label" htmlFor="reg-email">
                                Email
                            </label>
                            <input
                                id="reg-email"
                                type="email"
                                className="form-control input"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
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
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 shadow-sm mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Регистрация…' : 'Зарегистрироваться'}
                        </button>
                    </form>

                        <div className="text-center">
                            Уже есть аккаунт?{' '}
                            <Link className="btn-link btn-tertiary w-100" to="/login">
                                Войти
                            </Link>
                        </div>
                </div>
            </div>
        </div>
    )
}