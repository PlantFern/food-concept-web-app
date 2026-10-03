import { type SyntheticEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSpecialist } from '@/api/onboarding'
import { getErrorMessage, getErrorStatus } from '@/lib/errors'
import { FaPeopleGroup } from 'react-icons/fa6'
import { GiNotebook } from 'react-icons/gi'

export function ChooseRolePage() {
    const navigate = useNavigate()

    const options = [
        {
            id: 1,
            title: 'Дневник питания',
            description: 'Вы будете иметь возможность вести запись приемов пищи, сна и веса',
            icon: GiNotebook,
        },
        {
            id: 2,
            title: 'Специалист',
            description: 'Вы можете следить за питанием других пользователей',
            icon: FaPeopleGroup,
        },
    ]
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onChooseRole(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)

        if (selectedId == null) {
            setError('Выберите роль')
            return
        }

        setLoading(true)
        try {
            if (selectedId === 1) {
                navigate('/onboarding/scenario')
            } else {
                await createSpecialist()
                navigate('/specialist/clients', { replace: true })
            }
        } catch (err: unknown) {
            const status = getErrorStatus(err)
            if (status === 409) {
                setError('У вас уже есть профиль специалиста.')
                navigate('/specialist/clients', { replace: true })
                return
            }
            if (status === 403) {
                setError('Нет доступа. Войдите снова и повторите.')
                return
            }
            setError(getErrorMessage(err, 'Ошибка создания специалиста'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4 justify-content-start align-items-start rounded-md-5 vh-100 overflow-y-auto">
                <div className="form-card-body d-flex flex-column gap-4 bg-primary-color rounded-3">
                    <div className="d-flex flex-column align-items-center text-center">
                        <h3>Какую роль выберете?</h3>
                    </div>
                    <form
                        onSubmit={onChooseRole}
                        className="d-flex gap-3 w-100 flex-column align-items-stretch"
                    >
                        {error && (
                            <p className="text-danger small mb-0" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="d-flex gap-2 flex-column">
                            {options.map((option) => {
                                const IconComponent = option.icon
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={`d-flex rounded-4 choice-card text-start border-0 ${selectedId === option.id ? 'is-selected' : ''}`}
                                        onClick={() => setSelectedId(option.id)}
                                    >
                                        <div className="d-flex justify-content-center align-items-center p-2">
                                            <IconComponent size={60} />
                                        </div>
                                        <div className="p-3">
                                            <h4 className="pb-1">{option.title}</h4>
                                            <div>{option.description}</div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            className="btn btn-primary w-100 shadow-sm mt-4"
                            type="submit"
                            disabled={loading || selectedId == null}
                        >
                            {loading ? 'Загрузка...' : 'Выбрать'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
