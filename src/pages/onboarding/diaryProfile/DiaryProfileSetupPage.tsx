import { type SyntheticEvent, useState } from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {createDiaryOnly, saveOnboardingProfile} from '@/api/onboarding'
import {NavigateBackButton} from "@/components/ui/NavigateBackButton";

const GENDER_OPTIONS = [
    { id: 0, label: 'Укажите пол'},
    { id: 1, label: 'Мужской' },
    { id: 2, label: 'Женский' }
] as const

export function DiaryProfileSetupPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [height, setHeight] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [genderId, setGenderId] = useState(0)
    const [error, setError] = useState<string | null>(null)

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)

        const scenario = searchParams.get('scenario');

        let heightN: number|null = null;
        if(height !== "" && height !== null) {

            heightN = Number(height);
            if (!Number.isFinite(heightN) || heightN < 50 || heightN > 250) {
                setError('Рост от 50 до 250 см')
                return
            }
        }

        if(scenario === 'auto') {
            if (!birthDate) {
                setError('Укажите дату рождения');
                return;
            }
            if (genderId === 0){
                setError('Укажите пол');
                return;
            }
            if (height === null){
                setError('Укажите рост');
                return;
            }

            navigate('/onboarding/diary/goal-auto')
            return
        }

        saveOnboardingProfile({ height: heightN, birthDate, genderId })

        if( scenario === 'manual')
            navigate('/onboarding/diary/goal-manual')
        if(scenario === 'skip') {
            await createDiaryOnly({ height: heightN, birthDate, genderId})
            navigate('/diary', {replace: true})
        }
        return;
    }

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4
                            justify-content-start align-items-start
                            align-content-start
                            rounded-md-5
                            bg-brand
                            form-card
                            vh-100 overflow-y-auto">
                    <div className="d-flex w-100
                                    flex-column gap-2
                                    align-items-start justify-content-center
                                    align-content-stretch
                                    flex-grow-0">
                        <div className="text-start">
                            <NavigateBackButton label="Назад" className="btn-tertiary"/>
                        </div>
                    </div>
                    <div className="form-card-body
                                    d-flex flex-column gap-4
                                    bg-surface
                                    rounded-3">
                        <div className="d-flex
                                        flex-column
                                        align-items-center
                                        justify-content-center
                                        text-center">
                            <h3>Введите данные</h3>
                        </div>

                        {error && (
                            <div className="alert alert-danger auth-alert" role="alert">
                                {error}
                            </div>
                        )}
                        <form onSubmit={onSubmit}
                              className="d-flex gap-3 w-100 flex-column
                                        justify-content-between align-items-stretch
                                        align-content-stretch
                                        ">
                            <div className="">
                                <label className="form-label label" htmlFor="ob-height">
                                    Рост (см) { searchParams.get('scenario') !== 'auto' ? '*' : '' }
                                </label>
                                <input
                                    id="ob-height"
                                    type="number"
                                    min={50}
                                    max={250}
                                    className="form-control input"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    required={ searchParams.get('scenario') === 'auto' }
                                />
                            </div>
                            <div className="">
                                <label className="form-label label" htmlFor="ob-birth">
                                    Дата рождения { searchParams.get('scenario') !== 'auto' ? '*' : '' }
                                </label>
                                <input
                                    id="ob-birth"
                                    type="date"
                                    className="form-control input"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    required={ searchParams.get('scenario') === 'auto' }
                                />
                            </div>
                            <div className="">
                                <label className="form-label label" htmlFor="ob-gender">
                                    Пол { searchParams.get('scenario') !== 'auto' ? '*' : '' }
                                </label>
                                <select
                                    id="ob-gender"
                                    className="form-select input"
                                    value={genderId}
                                    onChange={(e) => setGenderId(Number(e.target.value))}
                                >
                                    {GENDER_OPTIONS.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button className="btn btn-primary w-100 text-center mt-2"
                                    type="submit">
                                Продолжить
                            </button>
                        </form>
                    </div>
                </div>
        </div>
    )
}