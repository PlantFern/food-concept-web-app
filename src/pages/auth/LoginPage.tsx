import { type SyntheticEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginRequest } from '@/api/auth'

import {NavigateBackButton} from "@/components/ui/NavigateBackButton";


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
            navigate('/diary', { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка входа')
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
                                    flex-column column-gap-2
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
                        <p className="fs-3 fw-medium">С возвращением!</p>
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
                        <div className="">
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

                        <div className="">
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
                        <Link className="btn-link btn-tertiary w-100" to="/register">
                            Зарегистрироваться
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}