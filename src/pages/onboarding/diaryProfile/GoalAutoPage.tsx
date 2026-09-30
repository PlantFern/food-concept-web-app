import { type SyntheticEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    createDiaryWithCalculatedGoal,
    readOnboardingProfile,
    type ActivityLevel, type GoalType
} from '@/api/onboarding'
import {NavigateBackButton} from "@/components/ui/NavigateBackButton";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
    { value: 'SEDENTARY', label: 'Сидячий' },
    { value: 'LIGHT', label: 'Лёгкая активность' },
    { value: 'MODERATE', label: 'Умеренная' },
    { value: 'HIGH', label: 'Высокая' },
    { value: 'VERY_HIGH', label: 'Очень высокая' },
]

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = [
    { value: 'LOSE_WEIGHT', label: 'Снижение веса' },
    { value: 'MAINTAIN', label: 'Поддержание' },
    { value: 'GAIN_WEIGHT', label: 'Набор' },
]

export function GoalAutoPage() {
    const navigate = useNavigate()
    const profile = useMemo(() => readOnboardingProfile(), [])

    const [weight, setWeight] = useState('')
    const [plannedWeight, setPlannedWeight] = useState('')
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('LIGHT')
    const [goalType, setGoalType] = useState<GoalType>('MAINTAIN')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: SyntheticEvent) {
        e.preventDefault()
        setError(null)

        if (!profile) {
            setError('Нет данных профиля')
            navigate('/onboarding/diary/profile', { replace: true })
            return
        }

        const w: number = Number(weight)
        const pw = Number(plannedWeight)
        if (!Number.isFinite(w) || w <= 0) {
            setError('Укажите текущий вес')
            return
        }
        if (!Number.isFinite(pw) || pw <= 0) {
            setError('Укажите целевой вес')
            return
        }

        setLoading(true)
        try {
            let storedOnboardingProfile =  readOnboardingProfile();

            if(!storedOnboardingProfile){
                setError('Данные профиля не найдены');
                return;
            }

            if(storedOnboardingProfile.height === null) {
                setError('Вы не указали рост');
                return
            }
            if(storedOnboardingProfile.birthDate === null) {
                setError('Вы не указали дату рождения');
                return;
            }
            if(storedOnboardingProfile.genderId === null) {
                setError('Вы не указали пол');
                return;
            }


            await createDiaryWithCalculatedGoal({
                height: storedOnboardingProfile.height,
                birthDate: storedOnboardingProfile.birthDate,
                genderId: storedOnboardingProfile.genderId,
                weight: w,
                plannedWeight: pw,
                activityLevel,
                goalType,
            })
            navigate('/diary', { replace: true })
        } catch {
            setError('Не удалось создать профиль с расчётной целью')
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
                        <h1>Введите данные</h1>
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
                            <label className="form-label label" htmlFor="auto-weight">
                                Текущий вес (кг)
                            </label>
                            <input
                                id="auto-weight"
                                type="number"
                                min={30}
                                max={300}
                                step={0.1}
                                className="form-control input"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                required
                            />
                        </div>
                        <div className="">
                            <label className="form-label label" htmlFor="auto-planned">
                                Целевой вес (кг)
                            </label>
                            <input
                                id="auto-planned"
                                type="number"
                                min={30}
                                max={300}
                                step={0.1}
                                className="form-control input"
                                value={plannedWeight}
                                onChange={(e) => setPlannedWeight(e.target.value)}
                                required
                            />
                        </div>
                        <div className="">
                            <label className="form-label label" htmlFor="auto-activity">
                                Активность
                            </label>
                            <select
                                id="auto-activity"
                                className="form-select input"
                                value={activityLevel}
                                onChange={(e) =>
                                    setActivityLevel(e.target.value as ActivityLevel)
                                }
                            >
                                {ACTIVITY_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="">
                            <label className="form-label label" htmlFor="auto-goal-type">
                                Задача
                            </label>
                            <select
                                id="auto-goal-type"
                                className="form-select input"
                                value={goalType}
                                onChange={(e) => setGoalType(e.target.value as GoalType)}
                            >
                                {GOAL_TYPE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100 text-center mt-4"
                            disabled={loading || !profile}
                        >
                            {loading ? 'Создание…' : 'Создать профиль и цель'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
