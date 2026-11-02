import { type SyntheticEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createDiaryOnly, saveOnboardingProfile } from '@/api/onboarding'
import { NavigateBackButton } from '@/components/ui/NavigateBackButton'

const GENDER_OPTIONS = [
    { id: 0, label: 'Укажите пол' },
    { id: 1, label: 'Мужской' },
    { id: 2, label: 'Женский' },
] as const

type GenderId = 0|1|2;

export function DiaryProfileSetupPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [height, setHeight] = useState('')
    const [birthDate, setBirthDate] = useState('')
    const [genderId, setGenderId] = useState<GenderId>(0)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    function isGenderId(value: number): value is GenderId {

        return value === 0 || value === 1 || value === 2
    }

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)

        const scenario = searchParams.get('scenario')

        let heightN: number | null = null
        if (height !== '' && height != null) {
            heightN = Number(height)
            if (!Number.isFinite(heightN) || heightN < 50 || heightN > 250) {
                setError('Рост от 50 до 250 см')
                return
            }
        }
        const gender: 1|2|null = genderId == 0
            ? null
            : genderId;

        const birth = birthDate || null

        if (scenario === 'auto') {
            if (heightN == null) {
                setError('Укажите рост')
                return
            }
            if (!birth) {
                setError('Укажите дату рождения')
                return
            }
            if (gender == null) {
                setError('Укажите пол')
                return
            }

            saveOnboardingProfile({
                height: heightN,
                birthDate: birth,
                genderId: gender,
            })

            navigate('/onboarding/diary/goal-auto')
            return
        }

        saveOnboardingProfile({
            height: heightN,
            birthDate: birth,
            genderId: gender,
        })

        if (scenario === 'manual') {
            navigate('/onboarding/diary/goal-manual')
            return
        }

        if (scenario === 'skip') {
            setLoading(true)
            try {
                await createDiaryOnly({
                    height: heightN,
                    birthDate: birth,
                    genderId: gender,
                })
                navigate('/diary', { replace: true })
            } catch {
                setError('Не удалось создать профиль')
            } finally {
                setLoading(false)
            }
        }
    }

    return (
<div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4 
                            justify-content-start align-items-start 
                            bg-brand p-2
                            vh-100
                            overflow-y-auto">
                <div className="d-flex w-100 flex-column align-items-start flex-grow-0">
                    <NavigateBackButton label="Назад" className="btn-tertiary-invert" />
                </div>
                
                 <div className="surface-card surface-card-column w-100">
                    <div className="d-flex flex-column align-items-center text-center">
                        <h3>Введите данные</h3>
                    </div>

                    {error && (
                        <div className="alert alert-danger auth-alert" role="alert">
                            {error}
                        </div>
                    )}
                    <form
                        onSubmit={onSubmit}
                        className="form-layout mx-auto"
                    >
                        <div>
                            <label className="form-label label" htmlFor="ob-height">
                                Рост (см){searchParams.get('scenario') === 'auto' ? '' : ' *'}
                            </label>
                            <input
                                id="ob-height"
                                type="number"
                                min={50}
                                max={250}
                                className="form-control input"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                required={searchParams.get('scenario') === 'auto'}
                            />
                        </div>
                        <div>
                            <label className="form-label label" htmlFor="ob-birth">
                                Дата рождения
                                {searchParams.get('scenario') === 'auto' ? '' : ' *'}
                            </label>
                            <input
                                id="ob-birth"
                                type="date"
                                className="form-control input"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                required={searchParams.get('scenario') === 'auto'}
                            />
                        </div>
                        <div>
                            <label className="form-label label" htmlFor="ob-gender">
                                Пол{searchParams.get('scenario') === 'auto' ? '' : ' *'}
                            </label>
                            <select
                                id="ob-gender"
                                className="form-select input"
                                value={genderId}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    if (isGenderId(value))
                                        setGenderId(value);
                                }}
                            >
                                {GENDER_OPTIONS.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="btn btn-primary w-100 text-center mt-2"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Создание…' : 'Продолжить'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
