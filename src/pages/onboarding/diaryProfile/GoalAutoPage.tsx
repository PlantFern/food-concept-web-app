import { type SyntheticEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    createDiaryWithCalculatedGoal,
    readOnboardingProfile,
    type ActivityLevel,
    type GoalType,
} from '@/api/onboarding'
import { getErrorMessage } from '@/lib/errors'
import { NavigateBackButton } from '@/components/ui/NavigateBackButton'

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
            navigate('/onboarding/profile-setup', { replace: true })
            return
        }

        const w = Number(weight)
        const pw = Number(plannedWeight)
        if (!Number.isFinite(w) || w <= 0) {
            setError('Укажите текущий вес')
            return
        }
        if (!Number.isFinite(pw) || pw <= 0) {
            setError('Укажите целевой вес')
            return
        }
        if (profile.height == null) {
            setError('Вы не указали рост')
            return
        }
        if (profile.birthDate == null) {
            setError('Вы не указали дату рождения')
            return
        }
        if (profile.genderId == null) {
            setError('Вы не указали пол')
            return
        }

        setLoading(true)
        try {
            await createDiaryWithCalculatedGoal({
                height: profile.height,
                birthDate: profile.birthDate,
                genderId: profile.genderId,
                weight: w,
                plannedWeight: pw,
                activityLevel,
                goalType,
            })
            navigate('/diary', { replace: true })
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Не удалось создать профиль с расчётной целью'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="col-lg-4 col-md-8 col-sm-10 col-12 m-auto">
            <div className="d-flex flex-column gap-4 justify-content-start align-items-start form-card bg-brand rounded-md-5 vh-100 overflow-y-auto">
                <div className="d-flex w-100 flex-column align-items-start flex-grow-0">
                    <NavigateBackButton label="Назад" className="btn-tertiary" />
                </div>
                <div className="form-card-body d-flex flex-column gap-4 bg-surface rounded-3">
                    <div className="d-flex flex-column align-items-center text-center">
                        <h1 className="h3 mb-0">Введите данные</h1>
                    </div>
                    <form
                        onSubmit={onSubmit}
                        className="d-flex gap-3 w-100 flex-column align-items-stretch"
                    >
                        {error && (
                            <p className="text-danger small mb-0" role="alert">
                                {error}
                            </p>
                        )}
                        <div>
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
                        <div>
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
                        <div>
                            <label className="form-label label" htmlFor="auto-activity">
                                Активность
                            </label>
                            <select
                                id="auto-activity"
                                className="form-select input"
                                value={activityLevel}
                                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                            >
                                {ACTIVITY_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
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
