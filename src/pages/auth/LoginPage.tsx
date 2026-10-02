import { type SyntheticEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginRequest } from '@/api/auth'
import { getMyProfile } from '@/api/profiles'
import { getErrorMessage, getErrorStatus } from '@/lib/errors'
import { NavigateBackButton } from '@/components/ui/NavigateBackButton'

export function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await loginRequest({ email: email.trim(), password })

            try {
                await getMyProfile()
                navigate('/diary', { replace: true })
            } catch (profileErr: unknown) {
                const status = getErrorStatus(profileErr)
                if (status === 404 || status === 403) {
                    navigate('/onboarding/role', { replace: true })
                    return
                }
                throw profileErr
            }
        } catch (err: unknown) {
            const status = getErrorStatus(err)
            if (status === 401) {
                setError('Неверный email или пароль')
            } else {
                setError(getErrorMessage(err, 'Ошибка входа'))
            }
        } finally {
            setLoading(false)
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
                        <p className="fs-3 fw-medium mb-0">С возвращением!</p>
                    </div>

                    <form
                        onSubmit={onSubmit}
                        noValidate
                        className="d-flex gap-3 w-100 flex-column align-items-stretch"
                    >
                        {error && (
                            <p className="text-danger small mb-0" role="alert">
                                {error}
                            </p>
                        )}

                        <div>
                            <label className="form-label label" htmlFor="login-email">
                                Email
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                className="form-control input"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="form-label label" htmlFor="login-password">
                                Пароль
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                className="form-control input"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 shadow-sm mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Вход…' : 'Войти'}
                        </button>
                    </form>

                    <div className="text-center">
                        Нет аккаунта?{' '}
                        <Link className="btn-link btn-tertiary" to="/register">
                            Зарегистрироваться
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
