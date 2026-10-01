import {type SyntheticEvent, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { createSpecialist } from '@/api/onboarding'
import {FaPeopleGroup} from "react-icons/fa6";
import {GiNotebook} from "react-icons/gi";

export function ChooseRolePage() {
    const navigate = useNavigate()

    const options = [
        {
            id: 1,
            title: "Дневник питания",
            description: "Вы будете иметь возможность вести запись приемов пищи, сна и веса",
            icon: GiNotebook
        },
        {
            id: 2,
            title: "Специалист",
            description: "Вы можете следить за питанием других пользователей",
            icon: FaPeopleGroup
        }
    ]
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleCardClick = (id: number) => {
        setSelectedId(id)
    }

    async function chooseRole(e: SyntheticEvent) {

        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if(selectedId == 1)
                navigate('/onboarding/scenario')
            else {
                await createSpecialist()
                navigate('/specialist', {replace: true})
            }
        } catch (err: unknown) {
            const status =
                err && typeof err === 'object' && 'response' in err
                    ? (err as any).response?.status
                    : null
            if (status === 403) {
                setError(
                    'У вас уже есть профиль специалиста.'
                )
            } else {
                setError(err instanceof Error ? err.message : 'Ошибка создания специалиста')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4
                            justify-content-start align-items-start
                            align-content-start
                            rounded-md-5
                            vh-100 overflow-y-auto">
                <div className="form-card-body
                                d-flex flex-column gap-4
                                bg-primary-color
                                rounded-3">
                    <div className="d-flex
                                    flex-column
                                    align-items-center
                                    justify-content-center
                                    text-center">
                        <h3>Какую роль выберете?</h3>
                    </div>
                    <form onSubmit={chooseRole}
                            className="d-flex gap-3 w-100 flex-column
                                        justify-content-between align-items-stretch
                                        align-content-stretch
                                        ">
                        {error && (
                            <div className="alert alert-danger auth-alert" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="d-flex gap-2 flex-column
                                        justify-content-center align-items-stretch">
                            {options.map((option) => {

                                const IconComponent = option.icon
                            return (
                                <div key={option.id}
                                     className={`d-flex
                                                rounded-4 
                                                choice-card ${selectedId === option.id ? 'is-selected' : ''}`}
                                     onClick={() => handleCardClick(option.id)}>
                                    <div className="d-flex
                                                    justify-content-center align-items-center
                                                    p-2"
                                    >
                                        <IconComponent size={60}/>
                                    </div>
                                    <div className="p-3">
                                        <h4 className="pb-1">
                                            {option.title}
                                        </h4>
                                        <div>
                                            {option.description}
                                        </div>
                                    </div>
                                </div>
                            )
                            })}
                        </div>

                        <button className="btn btn-primary w-100 shadow-sm mt-4"
                        type="submit"
                        disabled={loading}>
                            {loading ? 'Загрузка...' : 'Выбрать'}
                        </button>
                    </form>
            </div>
        </div>
        </div>
    )
}